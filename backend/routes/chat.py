from flask import Blueprint, request, jsonify
from models import db, ChatMessage
from middleware.auth import login_required

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


@chat_bp.route('/messages', methods=['GET'])
@login_required
def get_messages(current_user):
    project_id = request.args.get('project_id', type=int)
    before = request.args.get('before', type=int)
    limit = min(request.args.get('limit', 50, type=int), 200)

    q = ChatMessage.query
    if project_id:
        q = q.filter_by(project_id=project_id)
    if before:
        q = q.filter(ChatMessage.id < before)
    q = q.order_by(ChatMessage.created_at.desc()).limit(limit)

    messages = list(reversed(q.all()))
    return jsonify({'messages': [m.to_dict() for m in messages]})


@chat_bp.route('/messages', methods=['POST'])
@login_required
def send_message(current_user):
    data = request.get_json() or {}
    if not data.get('message'):
        return jsonify({'error': 'message required'}), 400
    msg = ChatMessage(
        project_id=data.get('project_id'),
        sender_id=current_user.id,
        message=data['message'],
        message_type=data.get('message_type', 'text'),
    )
    db.session.add(msg)
    db.session.commit()
    return jsonify({'message': msg.to_dict()}), 201


@chat_bp.route('/recent-projects', methods=['GET'])
@login_required
def recent_projects(current_user):
    from models import Project, ProjectTeam
    pids = set()
    if current_user.role == 'admin':
        projects = Project.query.order_by(Project.updated_at.desc()).limit(20).all()
    else:
        pids = {t.project_id for t in ProjectTeam.query.filter_by(user_id=current_user.id).all()}
        projects = Project.query.filter(Project.id.in_(pids)).order_by(Project.updated_at.desc()).all() if pids else []
    return jsonify({'projects': [{'id': p.id, 'title': p.title} for p in projects]})
