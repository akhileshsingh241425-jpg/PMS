import jwt
from flask import current_app, request
from datetime import datetime

online_users = {}


def get_user_from_sid(sid):
    return online_users.get(sid)


def register_socketio_events(socketio):

    @socketio.on('connect')
    def handle_connect():
        token = request.args.get('token', '')
        if not token:
            return False
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            from models import User
            user = User.query.get(data['user_id'])
            if not user or not user.is_active:
                return False
            online_users[request.sid] = user
            socketio.emit('user_status', {'user_id': user.id, 'status': 'online', 'full_name': user.full_name})
            return True
        except:
            return False

    @socketio.on('disconnect')
    def handle_disconnect():
        user = online_users.pop(request.sid, None)
        if user:
            still_online = any(u.id == user.id for u in online_users.values())
            if not still_online:
                socketio.emit('user_status', {'user_id': user.id, 'status': 'offline', 'last_seen': datetime.utcnow().isoformat()})

    @socketio.on('join')
    def handle_join(data):
        conversation_id = data.get('conversation_id')
        if conversation_id:
            socketio.join_room(f'conversation_{conversation_id}', sid=request.sid)

    @socketio.on('leave')
    def handle_leave(data):
        conversation_id = data.get('conversation_id')
        if conversation_id:
            socketio.leave_room(f'conversation_{conversation_id}', sid=request.sid)

    @socketio.on('send_message')
    def handle_send_message(data):
        from models import db, ChatConversation, ChatConversationParticipant, ConversationMessage, ChatMessageStatus
        user = online_users.get(request.sid)
        if not user:
            print(f'[send_message] user not found for sid {request.sid}')
            return

        conversation_id = data.get('conversation_id')
        message_text = data.get('message', '').strip()
        reply_to = data.get('reply_to')
        message_type = data.get('message_type', 'text')
        file_url = data.get('file_url')
        file_name = data.get('file_name')
        file_size = data.get('file_size')

        if not conversation_id:
            recipient_id = data.get('recipient_id')
            if not recipient_id:
                return
            existing = ChatConversation.query.join(ChatConversationParticipant).filter(
                ChatConversation.type == 'direct',
                ChatConversationParticipant.user_id.in_([user.id, recipient_id])
            ).group_by(ChatConversation.id).having(
                db.func.count(ChatConversationParticipant.id) == 2
            ).first()
            if existing:
                conversation_id = existing.id
            else:
                conv = ChatConversation(type='direct', created_by=user.id)
                db.session.add(conv)
                db.session.flush()
                p1 = ChatConversationParticipant(conversation_id=conv.id, user_id=user.id)
                p2 = ChatConversationParticipant(conversation_id=conv.id, user_id=recipient_id)
                db.session.add_all([p1, p2])
                db.session.flush()
                conversation_id = conv.id

        if not message_text and not file_url and not message_type == 'text':
            return

        msg = ConversationMessage(
            conversation_id=conversation_id,
            sender_id=user.id,
            message=message_text or None,
            message_type=message_type,
            file_url=file_url,
            file_name=file_name,
            file_size=file_size,
            reply_to=reply_to,
        )
        db.session.add(msg)
        db.session.flush()

        participants = ChatConversationParticipant.query.filter_by(conversation_id=conversation_id).all()
        for p in participants:
            status = 'sent' if p.user_id == user.id else 'delivered'
            ms = ChatMessageStatus(message_id=msg.id, user_id=p.user_id, status=status)
            db.session.add(ms)
        db.session.commit()

        conv = ChatConversation.query.get(conversation_id)
        conv.updated_at = datetime.utcnow()
        db.session.commit()

        msg_data = msg.to_dict()
        print(f'[send_message] emitting new_message to conversation_{conversation_id}: {msg.id}')
        socketio.emit('new_message', msg_data, room=f'conversation_{conversation_id}')

    @socketio.on('typing_start')
    def handle_typing_start(data):
        user = online_users.get(request.sid)
        if not user:
            return
        conversation_id = data.get('conversation_id')
        if conversation_id:
            socketio.emit('typing', {'conversation_id': conversation_id, 'user_id': user.id, 'full_name': user.full_name, 'typing': True}, room=f'conversation_{conversation_id}')

    @socketio.on('typing_stop')
    def handle_typing_stop(data):
        user = online_users.get(request.sid)
        if not user:
            return
        conversation_id = data.get('conversation_id')
        if conversation_id:
            socketio.emit('typing', {'conversation_id': conversation_id, 'user_id': user.id, 'typing': False}, room=f'conversation_{conversation_id}')

    @socketio.on('mark_read')
    def handle_mark_read(data):
        from models import db, ChatConversationParticipant, ConversationMessage, ChatMessageStatus
        user = online_users.get(request.sid)
        if not user:
            return
        conversation_id = data.get('conversation_id')
        if not conversation_id:
            return
        now = datetime.utcnow()
        part = ChatConversationParticipant.query.filter_by(conversation_id=conversation_id, user_id=user.id).first()
        if part:
            part.last_read_at = now
            db.session.commit()
        msgs = ConversationMessage.query.filter(ConversationMessage.conversation_id == conversation_id, ConversationMessage.sender_id != user.id).all()
        for m in msgs:
            status = ChatMessageStatus.query.filter_by(message_id=m.id, user_id=user.id).first()
            if status and status.status != 'read':
                status.status = 'read'
                status.updated_at = now
        db.session.commit()

    @socketio.on('delete_message')
    def handle_delete_message(data):
        from models import db, ConversationMessage
        user = online_users.get(request.sid)
        if not user:
            return
        message_id = data.get('message_id')
        scope = data.get('scope', 'me')
        msg = ConversationMessage.query.get(message_id)
        if not msg or msg.sender_id != user.id:
            return
        if scope == 'everyone':
            msg.deleted_at = datetime.utcnow()
        else:
            msg.deleted_at = datetime.utcnow()
        db.session.commit()
        socketio.emit('message_deleted', {'message_id': message_id, 'conversation_id': msg.conversation_id, 'scope': scope}, room=f'conversation_{msg.conversation_id}')
