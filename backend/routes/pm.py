from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from models import db, User, Project, ProjectTeam, Task, TaskActivity, Meeting, MeetingRequest, MeetingShare, MeetingRequestShare, Notification, Attendance, LeaveRequest, DailyWorkLog
from middleware.auth import login_required

pm_bp = Blueprint('pm', __name__, url_prefix='/api/pm')


def _pm_project_ids(user):
    """Return IDs of projects where user is the PM."""
    return {p.id for p in Project.query.filter_by(pm_id=user.id).all()}


def _require_pm(user):
    if user.role not in ('admin', 'project_manager'):
        return False
    return True


# Real stage taxonomy (ProjectStageTemplate) has no "At Risk" stage — the
# closest equivalents are "Escalated" / "On Hold". "Delayed" does exist.
TERMINAL_STAGES = ('Closed', 'Cancelled')
AT_RISK_STAGES = ('Escalated', 'On Hold')


def _team_today_status(pids, target_date):
    """Attendance + work-log status for everyone on the PM's project teams,
    for a single date. Scoped-down version of what HR sees company-wide."""
    user_ids = {t.user_id for t in ProjectTeam.query.filter(ProjectTeam.project_id.in_(pids)).all()}
    if not user_ids:
        return []
    users = {u.id: u for u in User.query.filter(User.id.in_(user_ids)).all()}

    att_by_user = {}
    for rec in Attendance.query.filter(
        Attendance.date == target_date, Attendance.user_id.in_(user_ids),
    ).order_by(Attendance.clock_in.asc()).all():
        prev = att_by_user.get(rec.user_id)
        if prev is None or (rec.clock_out and (not prev.clock_out or rec.clock_out > prev.clock_out)):
            att_by_user[rec.user_id] = rec

    leave_by_user = {}
    for lv in LeaveRequest.query.filter(
        LeaveRequest.status == 'Approved',
        LeaveRequest.from_date <= target_date, LeaveRequest.to_date >= target_date,
        LeaveRequest.user_id.in_(user_ids),
    ).all():
        leave_by_user[lv.user_id] = lv

    logged_ids = {
        row[0] for row in db.session.query(DailyWorkLog.user_id).filter(
            DailyWorkLog.date == target_date, DailyWorkLog.user_id.in_(user_ids),
        ).all()
    }

    is_today = target_date == date.today()
    out = []
    for uid, u in users.items():
        rec = att_by_user.get(uid)
        leave = leave_by_user.get(uid)
        if rec and rec.clock_in:
            status = 'Working' if is_today and not rec.clock_out else 'Present'
        elif leave:
            status = 'On Leave'
        elif is_today or target_date < date.today():
            status = 'Absent'
        else:
            status = 'Upcoming'
        out.append({
            'user_id': uid,
            'name': u.full_name,
            'designation': u.designation,
            'status': status,
            'clock_in': rec.clock_in.strftime('%Y-%m-%dT%H:%M:%SZ') if rec and rec.clock_in else None,
            'clock_out': rec.clock_out.strftime('%Y-%m-%dT%H:%M:%SZ') if rec and rec.clock_out else None,
            'leave_type': leave.leave_type if leave else None,
            'work_log_submitted': uid in logged_ids,
        })
    out.sort(key=lambda m: m['name'] or '')
    return out


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
    active_projects = [p for p in projects if p.stage not in TERMINAL_STAGES]
    completed_projects = [p for p in projects if p.stage == 'Closed']

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

    # Pending approvals – tasks an employee has sent up for PM sign-off.
    # Must match the status string the approval queue itself filters on.
    pending_approvals = [t for t in all_tasks if t.status == 'SENT FOR APPROVAL']

    # Deadline risk — computed straight from target_date rather than relying
    # on someone remembering to flip a project's stage to "Escalated"/"Delayed".
    deadline_risk = []
    for p in active_projects:
        if p.target_date:
            days_left = (p.target_date - today).days
            if days_left <= 7:
                deadline_risk.append({
                    'project_id': p.id, 'title': p.title, 'stage': p.stage,
                    'target_date': p.target_date.isoformat(), 'days_left': days_left,
                })
    deadline_risk.sort(key=lambda x: x['days_left'])

    # Today's team activity — who's present/on-leave/absent and who hasn't
    # filed today's work log yet, scoped to this PM's own project team.
    team_status = _team_today_status(pids, date.today()) if pids else []
    missing_log = [m for m in team_status if m['status'] in ('Present', 'Working') and not m['work_log_submitted']]
    absent_today = [m for m in team_status if m['status'] == 'Absent']

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
            'on_track': len([p for p in active_projects if p.stage not in AT_RISK_STAGES and p.stage != 'Delayed']),
            'at_risk': len([p for p in active_projects if p.stage in AT_RISK_STAGES]),
            'delayed': len([p for p in active_projects if p.stage == 'Delayed']),
        },
        'overdue_tasks': [t.to_dict() for t in overdue_tasks[:10]],
        'pending_approvals': [t.to_dict() for t in pending_approvals[:10]],
        'upcoming_meetings': [
            {**m.to_dict(), '_type': 'meeting'} for m in upcoming_meetings
        ] + [{**m.to_dict(), '_type': 'request'} for m in upcoming_mr],
        'deadline_risk': deadline_risk[:10],
        'team_today': {
            'present': len([m for m in team_status if m['status'] in ('Present', 'Working')]),
            'on_leave': len([m for m in team_status if m['status'] == 'On Leave']),
            'absent': len(absent_today),
            'total': len(team_status),
            'missing_work_log': missing_log,
            'absent_today': absent_today,
        },
        'notifications': [],
    })


# ─── PROJECTS ───
@pm_bp.route('/projects', methods=['GET'])
@login_required
def pm_projects(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    # nullslast() emits literal "NULLS LAST", which MySQL's parser rejects —
    # (Project.target_date.is_(None), Project.target_date.asc()) is the
    # portable equivalent: non-null rows (0) sort before null rows (1).
    projects = Project.query.filter(Project.id.in_(pids)).order_by(
        Project.target_date.is_(None), Project.target_date.asc()
    ).all() if pids else []
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

    # One row per project membership (not deduped by user) so the frontend
    # can add/remove a specific person from a specific project.
    team_records = ProjectTeam.query.filter(ProjectTeam.project_id.in_(pids)).all()
    task_counts = dict(
        db.session.query(Task.assigned_to, db.func.count(Task.id))
        .filter(Task.project_id.in_(pids), Task.assigned_to.isnot(None), Task.status != 'Completed')
        .group_by(Task.assigned_to).all()
    )
    projects_by_id = {p.id: p for p in Project.query.filter(Project.id.in_(pids)).all()}

    team = []
    for tr in team_records:
        if not tr.user:
            continue
        proj = projects_by_id.get(tr.project_id)
        team.append({
            'team_id': tr.id,
            'id': tr.user_id,
            'full_name': tr.user.full_name,
            'designation': tr.user.designation,
            'role': tr.user.role,
            'role_in_project': tr.role_in_project,
            'project_id': tr.project_id,
            'project_title': proj.title if proj else None,
            'active_tasks': task_counts.get(tr.user_id, 0),
        })
    return jsonify({'team': team})


@pm_bp.route('/employees', methods=['GET'])
@login_required
def pm_employees(current_user):
    """Candidate employees a PM can add to one of their projects' teams."""
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    users = User.query.filter(User.role != 'client', User.is_active.is_(True)).order_by(User.first_name).all()
    return jsonify({'employees': [
        {'id': u.id, 'full_name': u.full_name, 'designation': u.designation, 'department': u.department}
        for u in users
    ]})


@pm_bp.route('/team/today-status', methods=['GET'])
@login_required
def pm_team_today_status(current_user):
    """Who on my project teams is present/on-leave/absent, and who hasn't
    filed today's work log — the "is my team actually working" view."""
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    if not pids:
        return jsonify({'date': date.today().isoformat(), 'members': []})

    target = request.args.get('date')
    try:
        target_date = date.fromisoformat(target) if target else date.today()
    except ValueError:
        return jsonify({'error': 'Invalid date'}), 400

    members = _team_today_status(pids, target_date)
    return jsonify({'date': target_date.isoformat(), 'members': members})


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


# ─── APPROVAL QUEUE ──────────────────────────────────────────

@pm_bp.route('/approvals', methods=['GET'])
@login_required
def pm_approvals(current_user):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    pids = _pm_project_ids(current_user)
    if not pids:
        return jsonify({'approvals': [], 'stats': {}})

    # Task has no updated_at column — created_at is the only real timestamp.
    tasks = Task.query.filter(
        Task.project_id.in_(pids),
        Task.status == 'SENT FOR APPROVAL'
    ).order_by(Task.created_at.desc()).all()

    # Group by project for stats
    by_project = {}
    for t in tasks:
        pname = t.project.title if t.project else 'Unknown'
        by_project.setdefault(pname, []).append(t)

    return jsonify({
        'approvals': [t.to_dict() for t in tasks],
        'stats': {
            'total': len(tasks),
            'by_project': [{'project': k, 'count': len(v)} for k, v in sorted(by_project.items(), key=lambda x: -len(x[1]))],
        },
    })


@pm_bp.route('/approvals/<int:tid>/approve', methods=['POST'])
@login_required
def pm_approve_task(current_user, tid):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    task = Task.query.get_or_404(tid)
    pids = _pm_project_ids(current_user)
    if task.project_id not in pids:
        return jsonify({'error': 'Access denied'}), 403
    if task.status != 'SENT FOR APPROVAL':
        return jsonify({'error': 'Task is not in SENT FOR APPROVAL status'}), 400

    old_status = task.status
    task.status = 'APPROVED'
    task.completed_at = datetime.utcnow()
    db.session.flush()

    act = TaskActivity(task_id=tid, user_id=current_user.id, action='status_change',
                       old_value=old_status, new_value='APPROVED',
                       description='Approved by PM')
    db.session.add(act)

    if task.assigned_to:
        n = Notification(
            user_id=task.assigned_to,
            title='Task Approved',
            message=f'Your task "{task.title}" has been approved by {current_user.full_name}',
            module_type='task', module_id=tid,
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({'task': task.to_dict()})


@pm_bp.route('/approvals/<int:tid>/rework', methods=['POST'])
@login_required
def pm_rework_task(current_user, tid):
    if not _require_pm(current_user):
        return jsonify({'error': 'Access denied'}), 403
    task = Task.query.get_or_404(tid)
    pids = _pm_project_ids(current_user)
    if task.project_id not in pids:
        return jsonify({'error': 'Access denied'}), 403
    if task.status != 'SENT FOR APPROVAL':
        return jsonify({'error': 'Task is not in SENT FOR APPROVAL status'}), 400

    data = request.get_json() or {}
    if not data.get('remarks'):
        return jsonify({'error': 'Remarks are required for rework'}), 400

    old_status = task.status
    task.status = 'REWORK'
    db.session.flush()

    act = TaskActivity(task_id=tid, user_id=current_user.id, action='status_change',
                       old_value=old_status, new_value='REWORK',
                       description=f'Returned for rework: {data["remarks"]}')
    db.session.add(act)

    if task.assigned_to:
        n = Notification(
            user_id=task.assigned_to,
            title='Task Returned for Rework',
            message=f'{current_user.full_name} returned "{task.title}" for rework. Remarks: {data["remarks"]}',
            module_type='task', module_id=tid,
        )
        db.session.add(n)

    db.session.commit()
    return jsonify({'task': task.to_dict(), 'remarks': data['remarks']})
