from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Task, Meeting, Reminder, Note
from middleware.auth import login_required, role_required

activity_bp = Blueprint('activities', __name__, url_prefix='/api')


# ═══ TASKS ═══
@activity_bp.route('/tasks', methods=['GET'])
@login_required
def list_tasks(current_user):
    query = Task.query
    if mt := request.args.get('module_type'):
        query = query.filter_by(module_type=mt)
    if mi := request.args.get('module_id'):
        query = query.filter_by(module_id=int(mi))
    if at := request.args.get('assigned_to'):
        query = query.filter_by(assigned_to=int(at))
    return jsonify({'tasks': [t.to_dict() for t in query.order_by(Task.created_at.desc()).all()]})


@activity_bp.route('/tasks', methods=['POST'])
@login_required
def create_task(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('module_type') or not data.get('module_id'):
        return jsonify({'error': 'title, module_type, module_id required'}), 400
    task = Task(
        title=data['title'], description=data.get('description'),
        module_type=data['module_type'], module_id=int(data['module_id']),
        status=data.get('status', 'Open'), priority=data.get('priority', 'Normal'),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
        assigned_to=int(data['assigned_to']) if data.get('assigned_to') else None,
        created_by=current_user.id,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201


@activity_bp.route('/tasks/<int:tid>', methods=['PUT'])
@login_required
def update_task(current_user, tid):
    task = Task.query.get_or_404(tid)
    if task.assigned_to != current_user.id and 'super_admin' not in current_user.roles:
        return jsonify({'error': 'Not authorized to update this task'}), 403
    data = request.get_json()
    for f in ['title', 'description', 'status', 'priority']:
        if f in data:
            setattr(task, f, data[f])
    if 'assigned_to' in data:
        task.assigned_to = int(data['assigned_to']) if data['assigned_to'] else None
    if data.get('status') == 'Completed':
        task.completed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'task': task.to_dict()})


@activity_bp.route('/tasks/<int:tid>', methods=['DELETE'])
@role_required('super_admin')
def delete_task(current_user, tid):
    db.session.delete(Task.query.get_or_404(tid))
    db.session.commit()
    return jsonify({'message': 'Deleted'})


# ═══ MEETINGS ═══
@activity_bp.route('/meetings', methods=['GET'])
@login_required
def list_meetings(current_user):
    query = Meeting.query
    if mt := request.args.get('module_type'):
        query = query.filter_by(module_type=mt)
    if mi := request.args.get('module_id'):
        query = query.filter_by(module_id=int(mi))
    return jsonify({'meetings': [m.to_dict() for m in query.order_by(Meeting.meeting_date.desc()).all()]})


@activity_bp.route('/meetings', methods=['POST'])
@login_required
def create_meeting(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('module_type') or not data.get('module_id'):
        return jsonify({'error': 'title, module_type, module_id required'}), 400
    m = Meeting(
        title=data['title'], description=data.get('description'),
        module_type=data['module_type'], module_id=int(data['module_id']),
        meeting_date=datetime.fromisoformat(data['meeting_date']) if data.get('meeting_date') else None,
        location=data.get('location'), status=data.get('status', 'Scheduled'),
        mom=data.get('mom'), created_by=current_user.id,
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({'meeting': m.to_dict()}), 201


@activity_bp.route('/meetings/<int:mid>', methods=['PUT'])
@login_required
def update_meeting(current_user, mid):
    m = Meeting.query.get_or_404(mid)
    if m.created_by != current_user.id and 'super_admin' not in current_user.roles:
        return jsonify({'error': 'Not authorized to update this meeting'}), 403
    data = request.get_json()
    for f in ['title', 'description', 'location', 'status', 'mom']:
        if f in data:
            setattr(m, f, data[f])
    if 'meeting_date' in data and data['meeting_date']:
        m.meeting_date = datetime.fromisoformat(data['meeting_date'])
    db.session.commit()
    return jsonify({'meeting': m.to_dict()})


# ═══ REMINDERS ═══
@activity_bp.route('/reminders', methods=['GET'])
@login_required
def list_reminders(current_user):
    query = Reminder.query
    if mt := request.args.get('module_type'):
        query = query.filter_by(module_type=mt)
    if mi := request.args.get('module_id'):
        query = query.filter_by(module_id=int(mi))
    if request.args.get('my'):
        query = query.filter_by(remind_to=current_user.id)
    return jsonify({'reminders': [r.to_dict() for r in query.order_by(Reminder.remind_at.desc()).all()]})


@activity_bp.route('/reminders', methods=['POST'])
@login_required
def create_reminder(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('remind_at'):
        return jsonify({'error': 'title and remind_at required'}), 400
    r = Reminder(
        title=data['title'], module_type=data.get('module_type'),
        module_id=int(data['module_id']) if data.get('module_id') else None,
        remind_at=datetime.fromisoformat(data['remind_at']),
        remind_to=int(data.get('remind_to', current_user.id)),
        created_by=current_user.id,
    )
    db.session.add(r)
    db.session.commit()
    return jsonify({'reminder': r.to_dict()}), 201


@activity_bp.route('/reminders/<int:rid>', methods=['PUT'])
@login_required
def update_reminder(current_user, rid):
    r = Reminder.query.get_or_404(rid)
    if 'is_done' in (data := request.get_json()):
        r.is_done = data['is_done']
    db.session.commit()
    return jsonify({'reminder': r.to_dict()})


# ═══ NOTES ═══
@activity_bp.route('/notes', methods=['GET'])
@login_required
def list_notes(current_user):
    query = Note.query
    if mt := request.args.get('module_type'):
        query = query.filter_by(module_type=mt)
    if mi := request.args.get('module_id'):
        query = query.filter_by(module_id=int(mi))
    return jsonify({'notes': [n.to_dict() for n in query.order_by(Note.created_at.desc()).all()]})


@activity_bp.route('/notes', methods=['POST'])
@login_required
def create_note(current_user):
    data = request.get_json()
    if not data.get('content') or not data.get('module_type') or not data.get('module_id'):
        return jsonify({'error': 'content, module_type, module_id required'}), 400
    n = Note(
        content=data['content'], module_type=data['module_type'],
        module_id=int(data['module_id']), is_client_note=data.get('is_client_note', False),
        created_by=current_user.id,
    )
    db.session.add(n)
    db.session.commit()
    return jsonify({'note': n.to_dict()}), 201


@activity_bp.route('/notes/<int:nid>', methods=['DELETE'])
@login_required
def delete_note(current_user, nid):
    n = Note.query.get_or_404(nid)
    if n.created_by != current_user.id and 'super_admin' not in current_user.roles:
        return jsonify({'error': 'Not authorized to delete this note'}), 403
    db.session.delete(n)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
