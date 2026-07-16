from . import db
from datetime import datetime


class TaskChecklistItem(db.Model):
    __tablename__ = 'task_checklist_items'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    text = db.Column(db.String(255), nullable=False)
    is_completed = db.Column(db.Boolean, default=False)
    completed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'task_id': self.task_id, 'text': self.text,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class TaskComment(db.Model):
    __tablename__ = 'task_comments'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    text = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'task_id': self.task_id, 'text': self.text,
            'author_name': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    status = db.Column(db.String(30), default='Open')
    priority = db.Column(db.String(20), default='Normal')
    due_date = db.Column(db.Date)
    estimated_hours = db.Column(db.Float)
    actual_hours = db.Column(db.Float)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])
    checklist = db.relationship('TaskChecklistItem', backref='task', lazy='dynamic', cascade='all, delete-orphan')
    comments = db.relationship('TaskComment', backref='task', lazy='dynamic', cascade='all, delete-orphan', order_by='TaskComment.created_at.asc()')

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'project_id': self.project_id,
            'status': self.status, 'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'estimated_hours': self.estimated_hours,
            'actual_hours': self.actual_hours,
            'assigned_to': self.assigned_to,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'checklist_count': self.checklist.count(),
            'checklist_completed': self.checklist.filter_by(is_completed=True).count(),
            'comment_count': self.comments.count(),
        }


class Meeting(db.Model):
    __tablename__ = 'meetings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    meeting_date = db.Column(db.DateTime)
    location = db.Column(db.String(255))
    meeting_link = db.Column(db.String(500))
    status = db.Column(db.String(30), default='Scheduled')
    mom = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'project_id': self.project_id,
            'meeting_date': self.meeting_date.isoformat() if self.meeting_date else None,
            'location': self.location, 'meeting_link': self.meeting_link,
            'status': self.status, 'mom': self.mom,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class MeetingDocument(db.Model):
    __tablename__ = 'meeting_documents'
    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey('meetings.id', ondelete='CASCADE'), nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), index=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])

    def to_dict(self):
        return {
            'id': self.id, 'meeting_id': self.meeting_id,
            'file_name': self.file_name, 'file_type': self.file_type,
            'description': self.description,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class MeetingRequestDocument(db.Model):
    __tablename__ = 'meeting_request_documents'
    id = db.Column(db.Integer, primary_key=True)
    meeting_request_id = db.Column(db.Integer, db.ForeignKey('meeting_requests.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])

    def to_dict(self):
        return {
            'id': self.id, 'meeting_request_id': self.meeting_request_id,
            'file_name': self.file_name, 'file_type': self.file_type,
            'description': self.description,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class Note(db.Model):
    __tablename__ = 'notes'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    is_client_note = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'content': self.content,
            'project_id': self.project_id,
            'is_client_note': self.is_client_note,
            'author': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
