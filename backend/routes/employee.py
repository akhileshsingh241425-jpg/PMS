import os
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from models import db, User, Project, ProjectTeam, ProjectDocument, Task, TaskChecklistItem, TaskComment, Meeting, MeetingDocument, MeetingShare, MeetingRequestShare, MeetingRequest, Notification
from middleware.auth import login_required
from utils import validate_file, safe_filename

employee_bp = Blueprint('employee', __name__, url_prefix='/api/employee')


def _my_project_ids(user):
    ids = {t.project_id for t in ProjectTeam.query.filter_by(user_id=user.id).all()}
    if user.role == 'admin':
        ids.update(p.id for p in Project.query.all())
    else:
        ids.update(p.id for p in Project.query.filter(db.or_(Project.pm_id == user.id, Project.created_by == user.id)).all())
    # Include projects from meeting shares
    shared_mids = [s.meeting_id for s in MeetingShare.query.filter_by(user_id=user.id).all()]
    if shared_mids:
        shared_meetings = Meeting.query.filter(Meeting.id.in_(shared_mids)).all()
        ids.update(m.project_id for m in shared_meetings if m.project_id)
    # Include projects from meeting request shares
    shared_mr_ids = [s.meeting_request_id for s in MeetingRequestShare.query.filter_by(user_id=user.id).all()]
    if shared_mr_ids:
        shared_mrs = MeetingRequest.query.filter(MeetingRequest.id.in_(shared_mr_ids)).all()
        ids.update(m.project_id for m in shared_mrs if m.project_id)
    return ids


# DASHBOARD
@employee_bp.route('/dashboard', methods=['GET'])
@login_required
def dashboard(current_user):
    pids = _my_project_ids(current_user)
    projects = Project.query.filter(Project.id.in_(pids)).all() if pids else []
    tasks = Task.query.filter_by(assigned_to=current_user.id).all()
    today = date.today()
    today_start = datetime(today.year, today.month, today.day)
    tomorrow = datetime(today.year, today.month, today.day, 23, 59, 59)
    upcoming_meetings = Meeting.query.filter(Meeting.project_id.in_(pids), Meeting.meeting_date >= today_start).order_by(Meeting.meeting_date.asc()).limit(5).all() if pids else []
    upcoming_mr = MeetingRequest.query.filter(MeetingRequest.project_id.in_(pids), MeetingRequest.preferred_date >= today_start).order_by(MeetingRequest.preferred_date.asc()).limit(5).all() if pids else []
    all_upcoming = sorted(upcoming_meetings + upcoming_mr, key=lambda x: x.meeting_date or x.preferred_date or x.created_at, reverse=False)[:5]
    today_tasks = [t for t in tasks if t.due_date and t.due_date >= today and (not t.completed_at or t.completed_at.date() != today)]
    overdue_tasks = [t for t in tasks if t.due_date and t.due_date < today and t.status != 'Completed']
    recent_notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(5).all()
    return jsonify({
        'project_counts': {
            'total': len(projects),
            'active': sum(1 for p in projects if p.stage not in ('Closed', 'Cancelled', 'Delayed')),
            'completed': sum(1 for p in projects if p.stage == 'Closed'),
        },
        'task_counts': {
            'total': len(tasks),
            'pending': sum(1 for t in tasks if t.status in ('Open', 'Pending')),
            'in_progress': sum(1 for t in tasks if t.status == 'In Progress'),
            'completed': sum(1 for t in tasks if t.status == 'Completed'),
            'overdue': len(overdue_tasks),
        },
        'upcoming_meetings': [{**m.to_dict(), '_type': 'meeting'} for m in upcoming_meetings] + [{**m.to_dict(), '_type': 'request'} for m in upcoming_mr],
        'today_tasks': [t.to_dict() for t in today_tasks],
        'overdue_tasks': [t.to_dict() for t in overdue_tasks],
        'notifications': [n.to_dict() for n in recent_notifs],
    })


# PROJECTS
@employee_bp.route('/projects', methods=['GET'])
@login_required
def my_projects(current_user):
    pids = _my_project_ids(current_user)
    projects = Project.query.filter(Project.id.in_(pids)).order_by(Project.updated_at.desc()).all() if pids else []
    return jsonify({'projects': [p.to_dict() for p in projects]})


@employee_bp.route('/projects/<int:pid>', methods=['GET'])
@login_required
def project_detail(current_user, pid):
    pids = _my_project_ids(current_user)
    if pid not in pids:
        return jsonify({'error': 'Access denied'}), 403
    project = Project.query.get_or_404(pid)
    tasks = Task.query.filter_by(project_id=pid).order_by(Task.created_at.desc()).all()
    team = ProjectTeam.query.filter_by(project_id=pid).all()
    docs = ProjectDocument.query.filter_by(project_id=pid).order_by(ProjectDocument.uploaded_at.desc()).all()
    meetings = Meeting.query.filter_by(project_id=pid).order_by(Meeting.meeting_date.desc()).all()
    meeting_requests = MeetingRequest.query.filter_by(project_id=pid).order_by(MeetingRequest.created_at.desc()).all()
    return jsonify({
        'project': project.to_dict(),
        'tasks': [t.to_dict() for t in tasks],
        'team': [t.to_dict() for t in team],
        'documents': [d.to_dict() for d in docs],
        'meetings': [m.to_dict() for m in meetings],
        'meeting_requests': [m.to_dict() for m in meeting_requests],
    })


# TASKS
@employee_bp.route('/tasks', methods=['GET'])
@login_required
def my_tasks(current_user):
    query = Task.query.filter_by(assigned_to=current_user.id)
    if st := request.args.get('status'):
        if st == 'overdue':
            today = date.today()
            query = query.filter(Task.due_date < today, Task.status != 'Completed')
        else:
            query = query.filter_by(status=st)
    if pi := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pi))
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]})


@employee_bp.route('/tasks/<int:tid>', methods=['GET'])
@login_required
def task_detail(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({
        'task': task.to_dict(),
        'checklist': [i.to_dict() for i in TaskChecklistItem.query.filter_by(task_id=tid).order_by(TaskChecklistItem.created_at.asc()).all()],
        'comments': [c.to_dict() for c in TaskComment.query.filter_by(task_id=tid).order_by(TaskComment.created_at.asc()).all()],
    })


@employee_bp.route('/tasks/<int:tid>/status', methods=['PUT'])
@login_required
def update_task_status(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    new_status = data.get('status', task.status)
    old_status = task.status
    task.status = new_status
    if new_status == 'Completed' and old_status != 'Completed':
        task.completed_at = datetime.utcnow()
    if 'actual_hours' in data:
        task.actual_hours = float(data['actual_hours']) if data['actual_hours'] else None
    db.session.commit()
    return jsonify({'task': task.to_dict()})


@employee_bp.route('/tasks/<int:tid>/checklist', methods=['POST'])
@login_required
def add_checklist(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    item = TaskChecklistItem(task_id=tid, text=data['text'])
    db.session.add(item)
    db.session.commit()
    return jsonify({'item': item.to_dict()}), 201


@employee_bp.route('/checklist/<int:cid>', methods=['PUT'])
@login_required
def update_checklist(current_user, cid):
    item = TaskChecklistItem.query.get_or_404(cid)
    task = Task.query.get(item.task_id)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    if 'is_completed' in data:
        item.is_completed = data['is_completed']
        item.completed_by = current_user.id if data['is_completed'] else None
    if 'text' in data:
        item.text = data['text']
    db.session.commit()
    return jsonify({'item': item.to_dict()})


@employee_bp.route('/tasks/<int:tid>/comments', methods=['POST'])
@login_required
def add_comment(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    c = TaskComment(task_id=tid, text=data['text'], created_by=current_user.id)
    db.session.add(c)
    db.session.commit()
    return jsonify({'comment': c.to_dict()}), 201


# MEETINGS
@employee_bp.route('/meetings', methods=['GET'])
@login_required
def my_meetings(current_user):
    pids = _my_project_ids(current_user)
    meetings = Meeting.query.filter(Meeting.project_id.in_(pids)).order_by(Meeting.meeting_date.desc()).all() if pids else []
    # Also include meeting requests shared with user
    shared_mr_ids = [s.meeting_request_id for s in MeetingRequestShare.query.filter_by(user_id=current_user.id).all()]
    meeting_requests = []
    if shared_mr_ids:
        meeting_requests = MeetingRequest.query.filter(MeetingRequest.id.in_(shared_mr_ids)).order_by(MeetingRequest.preferred_date.desc()).all()
    return jsonify({
        'meetings': [m.to_dict() for m in meetings],
        'meeting_requests': [mr.to_dict() for mr in meeting_requests],
    })


@employee_bp.route('/meetings/<int:mid>', methods=['GET'])
@login_required
def meeting_detail(current_user, mid):
    m = Meeting.query.get_or_404(mid)
    pids = _my_project_ids(current_user)
    if m.project_id not in pids:
        return jsonify({'error': 'Access denied'}), 403
    docs = MeetingDocument.query.filter_by(meeting_id=mid).all()
    return jsonify({
        'meeting': m.to_dict(),
        'documents': [d.to_dict() for d in docs],
    })


# DOCUMENTS
@employee_bp.route('/documents', methods=['GET'])
@login_required
def my_documents(current_user):
    pids = _my_project_ids(current_user)
    # Project documents
    project_docs = ProjectDocument.query.filter(ProjectDocument.project_id.in_(pids)).order_by(ProjectDocument.uploaded_at.desc()).all() if pids else []
    # Meeting documents (shared meetings)
    meetings = Meeting.query.filter(Meeting.project_id.in_(pids)).all() if pids else []
    mid_map = {}
    for d in project_docs:
        mid_map.setdefault('project', []).append(d.to_dict())
    meeting_docs = MeetingDocument.query.filter(MeetingDocument.meeting_id.in_([m.id for m in meetings])).all() if meetings else []
    for d in meeting_docs:
        mid_map.setdefault('meeting', []).append(d.to_dict())
    return jsonify({
        'documents': mid_map.get('project', []) + mid_map.get('meeting', []),
        'project_docs': mid_map.get('project', []),
        'meeting_docs': mid_map.get('meeting', []),
    })


# UPLOAD DOCUMENT (for project)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'employee')
os.makedirs(UPLOAD_DIR, exist_ok=True)


@employee_bp.route('/documents/upload', methods=['POST'])
@login_required
def upload_document(current_user):
    pid = request.form.get('project_id')
    if not pid:
        return jsonify({'error': 'project_id required'}), 400
    pids = _my_project_ids(current_user)
    if int(pid) not in pids:
        return jsonify({'error': 'Access denied'}), 403
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    fname = safe_filename(f'emp_{current_user.id}', file.filename)
    path = os.path.join(UPLOAD_DIR, fname)
    file.save(path)
    doc = ProjectDocument(
        project_id=int(pid),
        file_name=file.filename, file_path=path, file_type=ext,
        category=request.form.get('category', 'Employee Upload'),
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


# NOTIFICATIONS
@employee_bp.route('/notifications', methods=['GET'])
@login_required
def my_notifications(current_user):
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    return jsonify({'notifications': [n.to_dict() for n in notifs]})


@employee_bp.route('/notifications/<int:nid>/read', methods=['PUT'])
@login_required
def mark_notification_read(current_user, nid):
    n = Notification.query.get_or_404(nid)
    if n.user_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    n.is_read = True
    db.session.commit()
    return jsonify({'notification': n.to_dict()})


@employee_bp.route('/notifications/read-all', methods=['PUT'])
@login_required
def mark_all_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All marked read'})


# CALENDAR
@employee_bp.route('/calendar', methods=['GET'])
@login_required
def calendar(current_user):
    pids = _my_project_ids(current_user)
    events = []
    if pids:
        meetings = Meeting.query.filter(Meeting.project_id.in_(pids), Meeting.meeting_date.isnot(None)).all()
        for m in meetings:
            events.append({
                'id': f'm_{m.id}', 'type': 'meeting', 'title': m.title,
                'date': m.meeting_date.isoformat() if m.meeting_date else None,
                'project_id': m.project_id,
            })
    tasks = Task.query.filter_by(assigned_to=current_user.id).filter(Task.due_date.isnot(None)).all()
    for t in tasks:
        if t.due_date:
            events.append({
                'id': f't_{t.id}', 'type': 'task', 'title': t.title,
                'date': t.due_date.isoformat(),
                'status': t.status, 'project_id': t.project_id,
            })
    events.sort(key=lambda e: e.get('date', ''))
    return jsonify({'events': events})


# PERFORMANCE
@employee_bp.route('/performance', methods=['GET'])
@login_required
def performance(current_user):
    tasks = Task.query.filter_by(assigned_to=current_user.id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == 'Completed')
    completed_on_time = sum(1 for t in tasks if t.status == 'Completed' and t.due_date and t.completed_at and t.completed_at.date() <= t.due_date)
    overdue_completed = sum(1 for t in tasks if t.status == 'Completed' and t.due_date and t.completed_at and t.completed_at.date() > t.due_date)
    pending_overdue = sum(1 for t in tasks if t.status != 'Completed' and t.due_date and t.due_date < date.today())
    quality_score = round((completed_on_time / completed * 100) if completed else 0)
    return jsonify({
        'total_tasks': total,
        'completed_tasks': completed,
        'pending_tasks': total - completed,
        'completed_on_time': completed_on_time,
        'overdue_completed': overdue_completed,
        'pending_overdue': pending_overdue,
        'completion_rate': round((completed / total * 100) if total else 0),
        'on_time_rate': quality_score,
    })


# PROFILE
@employee_bp.route('/profile', methods=['GET'])
@login_required
def profile(current_user):
    return jsonify({'user': current_user.to_dict()})


@employee_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile(current_user):
    data = request.get_json()
    for f in ['first_name', 'last_name', 'phone', 'designation', 'department']:
        if f in data:
            setattr(current_user, f, data[f])
    if 'experience_years' in data:
        current_user.experience_years = float(data['experience_years']) if data['experience_years'] else None
    db.session.commit()
    return jsonify({'user': current_user.to_dict()})


@employee_bp.route('/profile/password', methods=['PUT'])
@login_required
def change_password(current_user):
    data = request.get_json()
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'current_password and new_password required'}), 400
    if len(data['new_password']) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    if not current_user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 403
    current_user.set_password(data['new_password'])
    db.session.commit()
    return jsonify({'message': 'Password changed'})


# TEAM
@employee_bp.route('/team', methods=['GET'])
@login_required
def my_team(current_user):
    pids = _my_project_ids(current_user)
    members = {}
    if pids:
        team_members = ProjectTeam.query.filter(ProjectTeam.project_id.in_(pids)).all()
        for tm in team_members:
            if tm.user_id != current_user.id and tm.user not in members:
                members[tm.user_id] = {
                    'user_id': tm.user_id,
                    'user_name': tm.user.full_name if tm.user else None,
                    'designation': tm.user.designation if tm.user else None,
                    'role_in_project': tm.role_in_project,
                    'projects': [],
                }
                members[tm.user_id]['projects'].append(tm.project.title if tm.project else None)
    # Also show reporting manager
    mgr = None
    if current_user.reporting_manager_id:
        manager = User.query.get(current_user.reporting_manager_id)
        if manager:
            mgr = {'id': manager.id, 'full_name': manager.full_name, 'designation': manager.designation}
    return jsonify({
        'team_members': list(members.values()),
        'reporting_manager': mgr,
    })


# PROJECT ACTIVITY
@employee_bp.route('/projects/<int:pid>/activities', methods=['GET'])
@login_required
def project_activities(current_user, pid):
    pids = _my_project_ids(current_user)
    if pid not in pids:
        return jsonify({'error': 'Access denied'}), 403
    activities = []
    meetings = Meeting.query.filter_by(project_id=pid).order_by(Meeting.created_at.desc()).limit(10).all()
    for m in meetings:
        activities.append({
            'type': 'meeting', 'action': f'Meeting created: {m.title}',
            'user_name': m.creator.full_name if m.creator else 'Unknown', 'created_at': m.created_at.isoformat() if m.created_at else None,
        })
    tasks = Task.query.filter_by(project_id=pid).order_by(Task.created_at.desc()).limit(10).all()
    for t in tasks:
        activities.append({
            'type': 'task', 'action': f'Task {t.status.lower()}: {t.title}',
            'user_name': t.assignee.full_name if t.assignee else 'Unknown', 'created_at': t.created_at.isoformat() if t.created_at else None,
        })
    docs = ProjectDocument.query.filter_by(project_id=pid).order_by(ProjectDocument.uploaded_at.desc()).limit(10).all()
    for d in docs:
        activities.append({
            'type': 'document', 'action': f'Document uploaded: {d.file_name}',
            'user_name': d.uploader.full_name if d.uploader else None,
            'created_at': d.uploaded_at.isoformat() if d.uploaded_at else None,
        })
    activities.sort(key=lambda a: a.get('created_at', ''), reverse=True)
    return jsonify({'activities': activities})
