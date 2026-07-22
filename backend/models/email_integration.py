from . import db
from datetime import datetime

CATEGORIES = ['Lead', 'Client', 'Follow-up', 'Support', 'Task', 'Meeting', 'Invoice', 'Other']
EMAIL_STATUSES = ['New', 'Assigned', 'Working', 'Waiting Customer', 'Completed', 'Closed']
PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
TAGS_PRESET = ['Solar', 'Urgent', 'Tender', 'Payment', 'Warranty', 'Support', 'VIP']


class EmailAuthState(db.Model):
    __tablename__ = 'email_auth_states'
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


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
    company = db.Column(db.String(255))
    received_at = db.Column(db.DateTime)
    category = db.Column(db.String(50), default='Other')
    priority = db.Column(db.String(20), default='Medium')
    status = db.Column(db.String(30), default='New')
    tags = db.Column(db.Text)
    snooze_at = db.Column(db.DateTime)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    assigned_at = db.Column(db.DateTime)
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
            'subject': self.subject,
            'body_preview': self.body_preview[:500] if self.body_preview else None,
            'sender_name': self.sender_name,
            'sender_email': self.sender_email,
            'recipient_email': self.recipient_email,
            'company': self.company,
            'received_at': self.received_at.isoformat() if self.received_at else None,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'tags': self.tags.split(',') if self.tags else [],
            'snooze_at': self.snooze_at.isoformat() if self.snooze_at else None,
            'assigned_to_id': self.assigned_to_id,
            'assigned_to_name': f'{self.assigned_to.first_name} {self.assigned_to.last_name or ""}'.strip() if self.assigned_to else None,
            'assigned_by_id': self.assigned_by_id,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailActivity(db.Model):
    __tablename__ = 'email_activities'
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.Integer, db.ForeignKey('email_messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(50), nullable=False)
    detail = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    email = db.relationship('EmailMessage', foreign_keys=[email_id])

    def to_dict(self):
        return {
            'id': self.id,
            'email_id': self.email_id,
            'user_id': self.user_id,
            'user_name': f'{self.user.first_name} {self.user.last_name or ""}'.strip() if self.user else None,
            'action': self.action,
            'detail': self.detail,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailNote(db.Model):
    __tablename__ = 'email_notes'
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.Integer, db.ForeignKey('email_messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'email_id': self.email_id,
            'user_id': self.user_id,
            'user_name': f'{self.user.first_name} {self.user.last_name or ""}'.strip() if self.user else None,
            'note': self.note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailFollowUp(db.Model):
    __tablename__ = 'email_followups'
    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.Integer, db.ForeignKey('email_messages.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text)
    followup_at = db.Column(db.DateTime, nullable=False)
    is_done = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'email_id': self.email_id,
            'user_id': self.user_id, 'note': self.note,
            'followup_at': self.followup_at.isoformat() if self.followup_at else None,
            'is_done': self.is_done,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailTemplate(db.Model):
    __tablename__ = 'email_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'subject': self.subject, 'body': self.body,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailAutoRule(db.Model):
    __tablename__ = 'email_auto_rules'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    match_type = db.Column(db.String(20), nullable=False)
    match_value = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(50))
    priority = db.Column(db.String(20), default='Medium')
    assign_to_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assign_to = db.relationship('User', foreign_keys=[assign_to_id])

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'match_type': self.match_type,
            'match_value': self.match_value,
            'category': self.category,
            'priority': self.priority,
            'assign_to_id': self.assign_to_id,
            'assign_to_name': f'{self.assign_to.first_name} {self.assign_to.last_name or ""}'.strip() if self.assign_to else None,
            'is_active': self.is_active,
        }
