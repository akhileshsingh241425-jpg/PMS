from datetime import datetime, date
from flask import Blueprint, request, jsonify
from models import db, User, Project, ProjectTeam, Task, Meeting, MeetingRequest, MeetingShare, MeetingRequestShare
from middleware.auth import login_required

pm_bp = Blueprint('pm', __name__, url_prefix='/api/pm')


def _pm_project_ids(user):
    """Return IDs of projects where user is the PM."""
    return {p.id for p in Project.query.filter_by(pm_id=user.id).all()}


def _require_pm(user):
    if user.role not in ('admin', 'project_manager'):
        return False
    return True


# ─── DASHBOARD ───
@pm_bp.route('/dashboard', methods=['GET'])
@login_required
def pm_dashboard(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    projects = Project.query.filter(Project.id.in_(pids)).all() if pids else []
    today = date.today()
    today_start = datetime(today.year, today.month, today.day)

    # Project health
    total_projects = len(projects)
    active_projects = [p for p in projects if p.stage not in ('Completed', 'Archived', 'Cancelled')]
    completed_projects = [p for p in projects if p.stage == 'Completed']

    # Tasks across all PM's projects
    all_tasks = Task.query.filter(Task.project_id.in_(pids)).all() if pids else []
    overdue_tasks = [t for t in all_tasks if t.due_date and t.due_date < today and t.status != 'Completed']

    # Meetings across PM's projects
    upcoming_meetings = Meeting.query.filter(
        Meeting.project_id.in_(pids), Meeting.meeting_date >= today_start
    ).order_by(Meeting.meeting_date.asc()).limit(5).all() if pids else []
    upcoming_mr = MeetingRequest.query.filter(
        MeetingRequest.project_id.in_(pids), MeetingRequest.preferred_date >= today_start
    ).order_by(MeetingRequest.preferred_date.asc()).limit(5).all() if pids else []

    # Team members across PM's projects
    team_members = set()
    for p in projects:
        for t in p.team:
            team_members.add(t.user_id)

    # Pending approvals – tasks with status changes awaiting PM action
    pending_approvals = [t for t in all_tasks if t.status == 'Pending']

    return jsonify({
        'stats': {
            'active_projects': len(active_projects),
            'completed_projects': len(completed_projects),
            'total_tasks': len(all_tasks),
            'overdue_tasks': len(overdue_tasks),
            'team_members': len(team_members),
            'upcoming_meetings': len(upcoming_meetings) + len(upcoming_mr),
        },
        'project_health': {
            'on_track': len([p for p in active_projects if p.stage not in ('At Risk', 'Delayed')]),
            'at_risk': len([p for p in active_projects if p.stage == 'At Risk']),
            'delayed': len([p for p in active_projects if p.stage == 'Delayed']),
        },
        'overdue_tasks': [t.to_dict() for t in overdue_tasks[:10]],
        'pending_approvals': [t.to_dict() for t in pending_approvals[:10]],
        'upcoming_meetings': [
            {**m.to_dict(), '_type': 'meeting'} for m in upcoming_meetings
        ] + [{**m.to_dict(), '_type': 'request'} for m in upcoming_mr],
        'notifications': [],
    })


# ─── PROJECTS ───
@pm_bp.route('/projects', methods=['GET'])
@login_required
def pm_projects(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    projects = Project.query.filter(Project.id.in_(pids)).order_by(Project.target_date.asc().nullslast()).all() if pids else []
    return jsonify({'projects': [p.to_dict() for p in projects]})


# ─── TASKS ───
@pm_bp.route('/tasks', methods=['GET'])
@login_required
def pm_tasks(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    if not pids:
        return jsonify({'tasks': []})
    query = Task.query.filter(Task.project_id.in_(pids))
    if st := request.args.get('status'):
        if st == 'overdue':
            today = date.today()
            query = query.filter(Task.due_date < today, Task.status != 'Completed')
        else:
            query = query.filter_by(status=st)
    if pi := request.args.get('project_id'):
        if int(pi) in pids:
            query = query.filter_by(project_id=int(pi))
        else:
            return jsonify({'error': 'Access denied'}), 403
    if at := request.args.get('assigned_to'):
        query = query.filter_by(assigned_to=int(at))
    if pr := request.args.get('priority'):
        query = query.filter_by(priority=pr)
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@pm_bp.route('/tasks', methods=['POST'])
@login_required
def pm_create_task(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    if not data or not data.get('title') or not data.get('project_id'):
        return jsonify({'error': 'Title and project are required'}), 400

    pid = int(data['project_id'])
    pids = _pm_project_ids(current_user)
    if pid not in pids:
        return jsonify({'error': 'Project not found or access denied'}), 403

    # Validate assignee belongs to project team
    assignee_id = data.get('assigned_to')
    if assignee_id:
        assignee_id = int(assignee_id)
        team_ids = {t.user_id for t in ProjectTeam.query.filter_by(project_id=pid).all()}
        team_ids.add(current_user.id)
        if assignee_id not in team_ids:
            return jsonify({'error': 'Assignee is not a member of this project'}), 400

    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        project_id=pid,
        assigned_to=assignee_id,
        priority=data.get('priority', 'Normal'),
        due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
        status='Open',
        created_by=current_user.id,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201


@pm_bp.route('/tasks/<int:tid>', methods=['PUT'])
@login_required
def pm_update_task(current_user, tid):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    task = Task.query.get_or_404(tid)
    pids = _pm_project_ids(current_user)
    if task.project_id not in pids:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    if data.get('title') is not None:
        task.title = data['title']
    if data.get('description') is not None:
        task.description = data['description']
    if data.get('status'):
        task.status = data['status']
        if data['status'] == 'Completed' and not task.completed_at:
            task.completed_at = datetime.utcnow()
    if data.get('priority'):
        task.priority = data['priority']
    if data.get('due_date'):
        task.due_date = datetime.fromisoformat(data['due_date']) if isinstance(data['due_date'], str) else data['due_date']
    if data.get('assigned_to') is not None:
        assignee_id = int(data['assigned_to'])
        team_ids = {t.user_id for t in ProjectTeam.query.filter_by(project_id=task.project_id).all()}
        team_ids.add(current_user.id)
        if assignee_id not in team_ids:
            return jsonify({'error': 'Assignee is not a member of this project'}), 400
        task.assigned_to = assignee_id
    db.session.commit()
    return jsonify({'task': task.to_dict()})


# ─── TEAM ───
@pm_bp.route('/team', methods=['GET'])
@login_required
def pm_team(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    if not pids:
        return jsonify({'team': []})

    # Get all team members across PM's projects
    team_records = ProjectTeam.query.filter(ProjectTeam.project_id.in_(pids)).all()
    user_task_counts = {}
    seen_users = {}
    for tr in team_records:
        uid = tr.user_id
        if uid not in seen_users:
            user_obj = User.query.get(uid)
            if user_obj:
                task_count = Task.query.filter_by(assigned_to=uid).filter(
                    Task.project_id.in_(pids), Task.status != 'Completed'
                ).count()
                seen_users[uid] = {
                    'id': uid,
                    'full_name': user_obj.full_name,
                    'designation': user_obj.designation,
                    'role': user_obj.role,
                    'role_in_project': tr.role_in_project,
                    'project_id': tr.project_id,
                    'active_tasks': task_count,
                }

    return jsonify({'team': list(seen_users.values())})


# ─── MEETINGS ───
@pm_bp.route('/meetings', methods=['GET'])
@login_required
def pm_meetings(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    if not pids:
        return jsonify({'meetings': [], 'meeting_requests': []})
    meetings = Meeting.query.filter(Meeting.project_id.in_(pids)).order_by(Meeting.meeting_date.desc()).all()
    meeting_requests = MeetingRequest.query.filter(MeetingRequest.project_id.in_(pids)).order_by(MeetingRequest.created_at.desc()).all()
    return jsonify({
        'meetings': [m.to_dict() for m in meetings],
        'meeting_requests': [m.to_dict() for m in meeting_requests],
    })


# ─── REPORTS ───
@pm_bp.route('/reports', methods=['GET'])
@login_required
def pm_reports(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    if not pids:
        return jsonify({'projects': []})

    projects = Project.query.filter(Project.id.in_(pids)).all()
    report_data = []
    for p in projects:
        tasks = Task.query.filter_by(project_id=p.id).all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == 'Completed')
        overdue = sum(1 for t in tasks if t.due_date and t.due_date < date.today() and t.status != 'Completed')
        team_count = len(p.team)
        report_data.append({
            'project_id': p.id,
            'project_title': p.title,
            'stage': p.stage,
            'total_tasks': total,
            'completed_tasks': completed,
            'completion_pct': round((completed / total * 100), 1) if total > 0 else 0,
            'overdue_tasks': overdue,
            'team_count': team_count,
            'target_date': p.target_date.isoformat() if p.target_date else None,
        })

    return jsonify({'projects': report_data})
