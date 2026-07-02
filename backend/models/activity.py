from . import db
from datetime import datetime


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)  # meeting_request, finding_query, revision_request
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    module_type = db.Column(db.String(30), index=True)
    module_id = db.Column(db.Integer, index=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'module_type': self.module_type,
            'module_id': self.module_id,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    module_type = db.Column(db.String(30), nullable=False, index=True)  # opportunity, lead, project
    module_id = db.Column(db.Integer, nullable=False, index=True)
    status = db.Column(db.String(30), default='Open')  # Open, In Progress, Completed
    priority = db.Column(db.String(20), default='Normal')  # Low, Normal, High, Urgent
    due_date = db.Column(db.Date)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'module_type': self.module_type, 'module_id': self.module_id,
            'status': self.status, 'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'assigned_to': self.assigned_to,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Meeting(db.Model):
    __tablename__ = 'meetings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    module_type = db.Column(db.String(30), nullable=False, index=True)
    module_id = db.Column(db.Integer, nullable=False, index=True)
    meeting_date = db.Column(db.DateTime)
    location = db.Column(db.String(255))
    status = db.Column(db.String(30), default='Scheduled')  # Scheduled, Completed, Cancelled
    mom = db.Column(db.Text)  # Minutes of Meeting
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'module_type': self.module_type, 'module_id': self.module_id,
            'meeting_date': self.meeting_date.isoformat() if self.meeting_date else None,
            'location': self.location, 'status': self.status, 'mom': self.mom,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Reminder(db.Model):
    __tablename__ = 'reminders'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    module_type = db.Column(db.String(30), index=True)
    module_id = db.Column(db.Integer, index=True)
    remind_at = db.Column(db.DateTime, nullable=False)
    is_done = db.Column(db.Boolean, default=False)
    remind_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=False, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    target_user = db.relationship('User', foreign_keys=[remind_to])
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title,
            'module_type': self.module_type, 'module_id': self.module_id,
            'remind_at': self.remind_at.isoformat() if self.remind_at else None,
            'is_done': self.is_done,
            'remind_to_name': self.target_user.full_name if self.target_user else None,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    module_type = db.Column(db.String(30), nullable=False, index=True)
    module_id = db.Column(db.Integer, nullable=False, index=True)
    is_client_note = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'content': self.content,
            'module_type': self.module_type, 'module_id': self.module_id,
            'is_client_note': self.is_client_note,
            'author': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
