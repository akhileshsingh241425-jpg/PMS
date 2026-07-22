from flask import Blueprint, request, jsonify
from models import db, User, ChatConversation, ChatConversationParticipant, ConversationMessage, ChatMessageStatus
from middleware.auth import login_required
from datetime import datetime

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')


@chat_bp.route('/conversations', methods=['GET'])
@login_required
def list_conversations(current_user):
    convs = ChatConversation.query.join(ChatConversationParticipant).filter(
        ChatConversationParticipant.user_id == current_user.id
    ).order_by(ChatConversation.updated_at.desc()).all()
    return jsonify({'conversations': [c.to_dict(current_user.id) for c in convs]})


@chat_bp.route('/conversations', methods=['POST'])
@login_required
def create_conversation(current_user):
    data = request.get_json() or {}
    conv_type = data.get('type', 'direct')
    name = data.get('name')
    participant_ids = data.get('participant_ids', [])

    if conv_type == 'direct':
        if not participant_ids or len(participant_ids) != 1:
            return jsonify({'error': 'Need exactly one recipient for DM'}), 400
        recipient_id = participant_ids[0]
        existing = ChatConversation.query.join(ChatConversationParticipant).filter(
            ChatConversation.type == 'direct',
            ChatConversationParticipant.user_id.in_([current_user.id, recipient_id])
        ).group_by(ChatConversation.id).having(
            db.func.count(ChatConversationParticipant.id) == 2
        ).first()
        if existing:
            return jsonify({'conversation': existing.to_dict(current_user.id)})

    conv = ChatConversation(type=conv_type, name=name, created_by=current_user.id)
    db.session.add(conv)
    db.session.flush()

    ids = set(participant_ids + [current_user.id])
    for uid in ids:
        p = ChatConversationParticipant(conversation_id=conv.id, user_id=uid)
        db.session.add(p)
    db.session.commit()
    return jsonify({'conversation': conv.to_dict(current_user.id)}), 201


@chat_bp.route('/conversations/<int:conv_id>', methods=['GET'])
@login_required
def get_conversation(current_user, conv_id):
    conv = ChatConversation.query.get_or_404(conv_id)
    is_member = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=current_user.id).first()
    if not is_member:
        return jsonify({'error': 'Access denied'}), 403
    return jsonify({'conversation': conv.to_dict(current_user.id)})


@chat_bp.route('/conversations/<int:conv_id>/messages', methods=['GET'])
@login_required
def get_messages(current_user, conv_id):
    is_member = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=current_user.id).first()
    if not is_member:
        return jsonify({'error': 'Access denied'}), 403
    before = request.args.get('before', type=int)
    limit = min(request.args.get('limit', 50, type=int), 200)
    q = ConversationMessage.query.filter_by(conversation_id=conv_id)
    if before:
        q = q.filter(ConversationMessage.id < before)
    q = q.order_by(ConversationMessage.created_at.desc()).limit(limit)
    messages = list(reversed(q.all()))
    return jsonify({'messages': [m.to_dict() for m in messages]})


@chat_bp.route('/conversations/<int:conv_id>/read', methods=['POST'])
@login_required
def mark_read(current_user, conv_id):
    now = datetime.utcnow()
    part = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=current_user.id).first()
    if not part:
        return jsonify({'error': 'Not a member'}), 403
    part.last_read_at = now
    msgs = ConversationMessage.query.filter(ConversationMessage.conversation_id == conv_id, ConversationMessage.sender_id != current_user.id).all()
    for m in msgs:
        s = ChatMessageStatus.query.filter_by(message_id=m.id, user_id=current_user.id).first()
        if s and s.status != 'read':
            s.status = 'read'
            s.updated_at = now
    db.session.commit()
    return jsonify({'ok': True})


@chat_bp.route('/users', methods=['GET'])
@login_required
def list_users(current_user):
    search = request.args.get('search', '').strip()
    q = User.query.filter(User.is_active == True)
    if search:
        like = f'%{search}%'
        q = q.filter(db.or_(User.first_name.ilike(like), User.last_name.ilike(like), User.emp_id.ilike(like), User.email.ilike(like)))
    users = q.order_by(User.first_name).all()
    return jsonify({'users': [u.to_dict() for u in users if u.id != current_user.id]})


@chat_bp.route('/conversations/<int:conv_id>/participants', methods=['POST'])
@login_required
def add_participant(current_user, conv_id):
    conv = ChatConversation.query.get_or_404(conv_id)
    is_admin = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=current_user.id, role='admin').first()
    is_creator = conv.created_by == current_user.id
    if not is_admin and not is_creator:
        return jsonify({'error': 'Only admins can add members'}), 403
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400
    existing = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=user_id).first()
    if existing:
        return jsonify({'error': 'Already a member'}), 400
    p = ChatConversationParticipant(conversation_id=conv_id, user_id=user_id)
    db.session.add(p)
    db.session.commit()
    return jsonify({'ok': True})


@chat_bp.route('/conversations/<int:conv_id>/participants/<int:user_id>', methods=['DELETE'])
@login_required
def remove_participant(current_user, conv_id, user_id):
    conv = ChatConversation.query.get_or_404(conv_id)
    is_admin = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=current_user.id, role='admin').first()
    is_creator = conv.created_by == current_user.id
    if not is_admin and not is_creator and current_user.id != user_id:
        return jsonify({'error': 'Not authorized'}), 403
    p = ChatConversationParticipant.query.filter_by(conversation_id=conv_id, user_id=user_id).first()
    if not p:
        return jsonify({'error': 'Not a member'}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({'ok': True})


@chat_bp.route('/messages/<int:msg_id>', methods=['DELETE'])
@login_required
def delete_message(current_user, msg_id):
    msg = ConversationMessage.query.get_or_404(msg_id)
    if msg.sender_id != current_user.id:
        return jsonify({'error': 'Can only delete own messages'}), 403
    msg.deleted_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True})
