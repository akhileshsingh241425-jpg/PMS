from . import db
from datetime import datetime

CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']

class EmailAccount(db.Model):
    __tablename__ = 'email_accounts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    email = db.Column(db.String(255), nullable=False)
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text, nullable=False)
    token_expiry = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email': self.email,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailAuthState(db.Model):
    __tablename__ = 'email_auth_states'
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class EmailMessage(db.Model):
    __tablename__ = 'email_messages'
    id = db.Column(db.Integer, primary_key=True)
    email_account_id = db.Column(db.Integer, db.ForeignKey('email_accounts.id'), nullable=False, index=True)
    message_id = db.Column(db.String(255), unique=True, nullable=False)
    subject = db.Column(db.String(500))
    body_preview = db.Column(db.Text)
    sender_name = db.Column(db.String(255))
    sender_email = db.Column(db.String(255))
    recipient_email = db.Column(db.String(255))
    received_at = db.Column(db.DateTime)
    category = db.Column(db.String(50), default='Other')
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    assigned_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='unread')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    email_account = db.relationship('EmailAccount', foreign_keys=[email_account_id])
    assigned_to = db.relationship('User', foreign_keys=[assigned_to_id])
    assigned_by = db.relationship('User', foreign_keys=[assigned_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'email_account_id': self.email_account_id,
            'message_id': self.message_id,
            'subject': self.subject,
            'body_preview': self.body_preview[:300] if self.body_preview else None,
            'sender_name': self.sender_name,
            'sender_email': self.sender_email,
            'recipient_email': self.recipient_email,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'category': self.category,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_name': f'{self.assigned_to.first_name} {self.assigned_to.last_name or ""}'.strip() if self.assigned_to else None,
            'assigned_by_id': self.assigned_by_id,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'status': self.status,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
