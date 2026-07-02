from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Task, Meeting, Note
from middleware.auth import login_required, role_required

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


# MEETINGS
@activity_bp.route('/meetings', methods=['GET'])
@login_required
def list_meetings(current_user):
    query = Meeting.query
    if pi := request.args.get('project_id'):
        query = query.filter_by(project_id=int(pi))
    return jsonify({'meetings': [m.to_dict() for m in query.order_by(Meeting.meeting_date.desc()).all()]})


@activity_bp.route('/meetings', methods=['POST'])
@login_required
def create_meeting(current_user):
    data = request.get_json()
    if not data.get('title') or not data.get('project_id'):
        return jsonify({'error': 'title and project_id required'}), 400
    m = Meeting(
        title=data['title'], description=data.get('description'),
        project_id=int(data['project_id']),
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
    if m.created_by != current_user.id and current_user.role != 'admin':
        return jsonify({'error': 'Not authorized to update this meeting'}), 403
    data = request.get_json()
    for f in ['title', 'description', 'location', 'status', 'mom']:
        if f in data:
            setattr(m, f, data[f])
    if 'meeting_date' in data and data['meeting_date']:
        m.meeting_date = datetime.fromisoformat(data['meeting_date'])
    db.session.commit()
    return jsonify({'meeting': m.to_dict()})


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
