from . import db
from datetime import datetime


class ChatConversation(db.Model):
    __tablename__ = 'chat_conversations'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(10), nullable=False, default='direct')
    name = db.Column(db.String(200))
    group_photo = db.Column(db.String(500))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])
    participants = db.relationship('ChatConversationParticipant', back_populates='conversation', cascade='all, delete-orphan', lazy='joined')

    def to_dict(self, current_user_id=None):
        last_msg = ChatMessage.query.filter_by(conversation_id=self.id).order_by(ChatMessage.created_at.desc()).first()
        other = None
        if self.type == 'direct' and current_user_id:
            other_p = [p for p in self.participants if p.user_id != current_user_id]
            if other_p:
                other = other_p[0].user.to_dict()
        unread = 0
        if current_user_id:
            part = ChatConversationParticipant.query.filter_by(conversation_id=self.id, user_id=current_user_id).first()
            if part and part.last_read_at:
                unread = ChatMessage.query.filter(ChatMessage.conversation_id == self.id, ChatMessage.created_at > part.last_read_at, ChatMessage.sender_id != current_user_id).count()
        return {
            'id': self.id,
            'type': self.type,
            'name': self.name or (other['full_name'] if other else None),
            'group_photo': self.group_photo,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'other_user': other,
            'last_message': last_msg.to_dict() if last_msg else None,
            'unread_count': unread,
            'participants': [{'user_id': p.user_id, 'full_name': p.user.full_name, 'role': p.role} for p in self.participants],
        }


class ChatConversationParticipant(db.Model):
    __tablename__ = 'chat_conversation_participants'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('chat_conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role = db.Column(db.String(20), default='member')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_read_at = db.Column(db.DateTime)

    conversation = db.relationship('ChatConversation', back_populates='participants')
    user = db.relationship('User', foreign_keys=[user_id])

    __table_args__ = (db.UniqueConstraint('conversation_id', 'user_id'),)


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages_new'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('chat_conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    message = db.Column(db.Text)
    message_type = db.Column(db.String(20), default='text')
    file_url = db.Column(db.String(500))
    file_name = db.Column(db.String(255))
    file_size = db.Column(db.Integer)
    reply_to = db.Column(db.Integer, db.ForeignKey('chat_messages_new.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    edited_at = db.Column(db.DateTime)
    deleted_at = db.Column(db.DateTime)

    sender = db.relationship('User', foreign_keys=[sender_id])
    reply_msg = db.relationship('ChatMessage', foreign_keys=[reply_to], remote_side='ChatMessage.id')

    def to_dict(self):
        from models import User
        sender = User.query.get(self.sender_id)
        statuses = ChatMessageStatus.query.filter_by(message_id=self.id).all()
        status_map = {s.user_id: s.status for s in statuses}
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'sender_name': sender.full_name if sender else 'Unknown',
            'message': self.message if not self.deleted_at else None,
            'message_type': self.message_type,
            'file_url': self.file_url,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'reply_to': self.reply_to,
            'reply_message': self.reply_msg.to_dict() if self.reply_msg else None,
            'statuses': status_map,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'is_deleted': self.deleted_at is not None,
        }


class ChatMessageStatus(db.Model):
    __tablename__ = 'chat_message_status'
    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.Integer, db.ForeignKey('chat_messages_new.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(20), default='sent')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('message_id', 'user_id'),)
