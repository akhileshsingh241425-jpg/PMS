import os
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Task, TaskChecklistItem, TaskComment, Meeting, MeetingDocument, MeetingShare, MeetingActivity, Note, User
from middleware.auth import login_required, role_required
from utils import validate_file, safe_filename

activity_bp = Blueprint('activities', __name__, url_prefix='/api')


# TASKS
@activity_bp.route('/tasks', methods=['GET'])
@login_required
def list_tasks(current_user):
    query = Task.query
    if pi := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pi))
    if at := request.args.get('assigned_to'):
        query = query.filter_by(assigned_to=int(at))
    return jsonify({'tasks': [t.to_dict() for t in query.order_by(Task.created_at.desc()).all()]})


@activity_bp.route('/tasks', methods=['POST'])
@login_required
def create_task(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('project_id'):
        return jsonify({'error': 'title and project_id required'}), 400
    task = Task(
        title=data['title'], description=data.get('description'),
        project_id=int(data['project_id']),
        status=data.get('status', 'Open'), priority=data.get('priority', 'Normal'),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
        assigned_to=int(data['assigned_to']) if data.get('assigned_to') else None,
        created_by=current_user.id,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201


@activity_bp.route('/tasks/<int:tid>', methods=['GET'])
@login_required
def get_task(current_user, tid):
    task = Task.query.get_or_404(tid)
    return jsonify({
        'task': task.to_dict(),
        'checklist': [i.to_dict() for i in TaskChecklistItem.query.filter_by(task_id=tid).order_by(TaskChecklistItem.created_at.asc()).all()],
        'comments': [c.to_dict() for c in TaskComment.query.filter_by(task_id=tid).order_by(TaskComment.created_at.asc()).all()],
    })

@activity_bp.route('/tasks/<int:tid>', methods=['PUT'])
@login_required
def update_task(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized to update this task'}), 403
    data = request.get_json()
    for f in ['title', 'description', 'status', 'priority']:
        if f in data:
            setattr(task, f, data[f])
    if 'estimated_hours' in data:
        task.estimated_hours = float(data['estimated_hours']) if data['estimated_hours'] else None
    if 'actual_hours' in data:
        task.actual_hours = float(data['actual_hours']) if data['actual_hours'] else None
    if 'assigned_to' in data:
        task.assigned_to = int(data['assigned_to']) if data['assigned_to'] else None
    if data.get('status') == 'Completed':
        task.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'task': task.to_dict()})


@activity_bp.route('/tasks/<int:tid>', methods=['DELETE'])
@role_required('admin')
def delete_task(current_user, tid):
    db.session.delete(Task.query.get_or_404(tid))
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# TASK CHECKLIST
@activity_bp.route('/tasks/<int:tid>/checklist', methods=['GET'])
@login_required
def list_checklist(current_user, tid):
    Task.query.get_or_404(tid)
    items = TaskChecklistItem.query.filter_by(task_id=tid).order_by(TaskChecklistItem.created_at.asc()).all()
    return jsonify({'checklist': [i.to_dict() for i in items]})

@activity_bp.route('/tasks/<int:tid>/checklist', methods=['POST'])
@login_required
def add_checklist_item(current_user, tid):
    Task.query.get_or_404(tid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    item = TaskChecklistItem(task_id=tid, text=data['text'])
    db.session.add(item)
    db.session.commit()
    return jsonify({'item': item.to_dict()}), 201

@activity_bp.route('/checklist/<int:cid>', methods=['PUT'])
@login_required
def update_checklist_item(current_user, cid):
    item = TaskChecklistItem.query.get_or_404(cid)
    data = request.get_json()
    if 'is_completed' in data:
        item.is_completed = data['is_completed']
        item.completed_by = current_user.id if data['is_completed'] else None
    if 'text' in data:
        item.text = data['text']
    db.session.commit()
    return jsonify({'item': item.to_dict()})

@activity_bp.route('/checklist/<int:cid>', methods=['DELETE'])
@login_required
def delete_checklist_item(current_user, cid):
    db.session.delete(TaskChecklistItem.query.get_or_404(cid))
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# TASK COMMENTS
@activity_bp.route('/tasks/<int:tid>/comments', methods=['GET'])
@login_required
def list_comments(current_user, tid):
    Task.query.get_or_404(tid)
    comments = TaskComment.query.filter_by(task_id=tid).order_by(TaskComment.created_at.asc()).all()
    return jsonify({'comments': [c.to_dict() for c in comments]})

@activity_bp.route('/tasks/<int:tid>/comments', methods=['POST'])
@login_required
def add_comment(current_user, tid):
    Task.query.get_or_404(tid)
    data = request.get_json()
    if not data.get('text'):
        return jsonify({'error': 'text required'}), 400
    c = TaskComment(task_id=tid, text=data['text'], created_by=current_user.id)
    db.session.add(c)
    db.session.commit()
    return jsonify({'comment': c.to_dict()}), 201

@activity_bp.route('/comments/<int:cid>', methods=['DELETE'])
@login_required
def delete_comment(current_user, cid):
    c = TaskComment.query.get_or_404(cid)
    if c.created_by != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized'}), 403
    db.session.delete(c)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# MEETINGS
@activity_bp.route('/meetings', methods=['GET'])
@login_required
def list_meetings(current_user):
    query = Meeting.query
    if pi := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pi))
    return jsonify({'meetings': [m.to_dict() for m in query.order_by(Meeting.meeting_date.desc()).all()]})


@activity_bp.route('/meetings/<int:mid>', methods=['GET'])
@login_required
def get_meeting(current_user, mid):
    m = Meeting.query.get_or_404(mid)
    return jsonify({'meeting': m.to_dict()})


@activity_bp.route('/meetings', methods=['POST'])
@login_required
def create_meeting(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('project_id'):
        return jsonify({'error': 'title and project_id required'}), 400
    if not data.get('title') or not data.get('project_id') or not data.get('meeting_date') or not data.get('meeting_link'):
        return jsonify({'error': 'title, project_id, meeting_date, and meeting_link are required'}), 400
    m = Meeting(
        title=data['title'], description=data.get('description'),
        project_id=int(data['project_id']),
        meeting_date=datetime.fromisoformat(data['meeting_date']),
        location=data.get('location'), meeting_link=data['meeting_link'],
        status=data.get('status', 'Scheduled'),
        mom=data.get('mom'), created_by=current_user.id,
    )
    db.session.add(m)
    db.session.commit()
    act = MeetingActivity(meeting_id=m.id, action='created', description=f'Meeting "{m.title}" created', user_id=current_user.id)
    db.session.add(act)
    db.session.commit()
    return jsonify({'meeting': m.to_dict()}), 201


@activity_bp.route('/meetings/<int:mid>', methods=['PUT'])
@login_required
def update_meeting(current_user, mid):
    m = Meeting.query.get_or_404(mid)
    if m.created_by != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized to update this meeting'}), 403
    data = request.get_json()
    for f in ['title', 'description', 'location', 'meeting_link', 'status', 'mom', 'meeting_notes']:
        if f in data:
            setattr(m, f, data[f])
    if 'meeting_date' in data:
        m.meeting_date = datetime.fromisoformat(data['meeting_date']) if data['meeting_date'] else None
    notes_changed = 'meeting_notes' in data and data['meeting_notes'] != m.meeting_notes
    status_changed = 'status' in data and data['status'] != m.status
    if status_changed:
        act = MeetingActivity(meeting_id=mid, action='status_changed', description=f'Status changed to {data["status"]}', user_id=current_user.id)
        db.session.add(act)
    if notes_changed:
        act = MeetingActivity(meeting_id=mid, action='notes_updated', description='Meeting notes updated', user_id=current_user.id)
        db.session.add(act)
    db.session.commit()
    return jsonify({'meeting': m.to_dict()})


# MEETING SHARE
@activity_bp.route('/meetings/<int:mid>/share', methods=['GET'])
@login_required
def get_meeting_shares(current_user, mid):
    Meeting.query.get_or_404(mid)
    shares = MeetingShare.query.filter_by(meeting_id=mid).order_by(MeetingShare.created_at.desc()).all()
    return jsonify({'shares': [s.to_dict() for s in shares]})


@activity_bp.route('/meetings/<int:mid>/share', methods=['POST'])
@login_required
def add_meeting_share(current_user, mid):
    m = Meeting.query.get_or_404(mid)
    data = request.get_json()
    if not data.get('user_ids'):
        return jsonify({'error': 'user_ids required'}), 400
    user_ids = data['user_ids'] if isinstance(data['user_ids'], list) else [data['user_ids']]
    added = []
    for uid in user_ids:
        existing = MeetingShare.query.filter_by(meeting_id=mid, user_id=int(uid)).first()
        if not existing:
            share = MeetingShare(meeting_id=mid, user_id=int(uid), can_edit=data.get('can_edit', False))
            db.session.add(share)
            added.append(uid)
    # Log activity
    if added:
        name_users = User.query.filter(User.id.in_([int(u) for u in added])).all()
        name_str = ', '.join([u.full_name for u in name_users])
        act = MeetingActivity(meeting_id=mid, action='shared', description=f'Shared with {name_str}', user_id=current_user.id)
        db.session.add(act)
    db.session.commit()
    shares = MeetingShare.query.filter_by(meeting_id=mid).all()
    return jsonify({'shares': [s.to_dict() for s in shares]})


@activity_bp.route('/meetings/<int:mid>/share/<int:uid>', methods=['DELETE'])
@login_required
def remove_meeting_share(current_user, mid, uid):
    share = MeetingShare.query.filter_by(meeting_id=mid, user_id=uid).first_or_404()
    db.session.delete(share)
    act = MeetingActivity(meeting_id=mid, action='unshared', description=f'Removed from sharing', user_id=current_user.id)
    db.session.add(act)
    db.session.commit()
    return jsonify({'message': 'Removed'})


# MEETING ACTIVITIES
@activity_bp.route('/meetings/<int:mid>/activities', methods=['GET'])
@login_required
def list_meeting_activities(current_user, mid):
    Meeting.query.get_or_404(mid)
    acts = MeetingActivity.query.filter_by(meeting_id=mid).order_by(MeetingActivity.created_at.desc()).all()
    return jsonify({'activities': [a.to_dict() for a in acts]})


# MEETING DOCUMENTS
MEETING_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'meetings')
os.makedirs(MEETING_UPLOAD_DIR, exist_ok=True)


@activity_bp.route('/meetings/<int:mid>/documents', methods=['GET'])
@login_required
def list_meeting_docs(current_user, mid):
    docs = MeetingDocument.query.filter_by(meeting_id=mid).order_by(MeetingDocument.uploaded_at.desc()).all()
    return jsonify({'documents': [d.to_dict() for d in docs]})


@activity_bp.route('/meetings/<int:mid>/documents', methods=['POST'])
@login_required
def upload_meeting_doc(current_user, mid):
    m = Meeting.query.get_or_404(mid)
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    valid, err = validate_file(file)
    if not valid:
        return jsonify({'error': err}), 400
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    fname = safe_filename(f'meeting_{mid}', file.filename)
    path = os.path.join(MEETING_UPLOAD_DIR, fname)
    file.save(path)
    doc = MeetingDocument(
        meeting_id=mid,
        account_id=m.project.account_id if m.project else None,
        file_name=file.filename, file_path=path, file_type=ext,
        description=request.form.get('description', ''),
        uploaded_by=current_user.id,
    )
    db.session.add(doc)
    db.session.commit()
    act = MeetingActivity(meeting_id=mid, action='document_uploaded', description=f'Uploaded: {file.filename}', user_id=current_user.id)
    db.session.add(act)
    db.session.commit()
    return jsonify({'document': doc.to_dict()}), 201


@activity_bp.route('/meetings/<int:mid>/documents/<int:did>', methods=['GET'])
@login_required
def download_meeting_doc(current_user, mid, did):
    from flask import send_file
    doc = MeetingDocument.query.get_or_404(did)
    if doc.meeting_id != mid:
        return jsonify({'error': 'Document not found for this meeting'}), 404
    import os
    if not os.path.isfile(doc.file_path):
        return jsonify({'error': 'File not found on server'}), 404
    return send_file(doc.file_path, as_attachment=False, download_name=doc.file_name)


@activity_bp.route('/meetings/<int:mid>/documents/<int:did>', methods=['DELETE'])
@login_required
def delete_meeting_doc(current_user, mid, did):
    doc = MeetingDocument.query.get_or_404(did)
    if doc.meeting_id != mid:
        return jsonify({'error': 'Document not found'}), 404
    if doc.uploaded_by != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized'}), 403
    import os
    if os.path.isfile(doc.file_path):
        os.remove(doc.file_path)
    db.session.delete(doc)
    act = MeetingActivity(meeting_id=mid, action='document_deleted', description=f'Deleted document: {doc.file_name}', user_id=current_user.id)
    db.session.add(act)
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# USERS (for sharing)
@activity_bp.route('/users', methods=['GET'])
@login_required
def list_team_users(current_user):
    role_filter = request.args.get('role', '').split(',')
    query = User.query.filter(User.is_active == True)
    if role_filter and role_filter[0]:
        query = query.filter(User.role.in_(role_filter))
    users = query.order_by(User.first_name.asc()).all()
    return jsonify({'users': [{'id': u.id, 'full_name': u.full_name, 'designation': u.designation, 'role': u.role} for u in users]})


# NOTES
@activity_bp.route('/notes', methods=['GET'])
@login_required
def list_notes(current_user):
    query = Note.query
    if pi := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pi))
    return jsonify({'notes': [n.to_dict() for n in query.order_by(Note.created_at.desc()).all()]})


@activity_bp.route('/notes', methods=['POST'])
@login_required
def create_note(current_user):
    data = request.get_json()
    if not data.get('content') or not data.get('project_id'):
        return jsonify({'error': 'content and project_id required'}), 400
    n = Note(
        content=data['content'], project_id=int(data['project_id']),
        is_client_note=data.get('is_client_note', False),
        created_by=current_user.id,
    )
    db.session.add(n)
    db.session.commit()
    return jsonify({'note': n.to_dict()}), 201


@activity_bp.route('/notes/<int:nid>', methods=['DELETE'])
@login_required
def delete_note(current_user, nid):
    n = Note.query.get_or_404(nid)
    if n.created_by != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized to delete this note'}), 403
    db.session.delete(n)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
