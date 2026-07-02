from . import db
from datetime import datetime


class MeetingRequest(db.Model):
    __tablename__ = 'meeting_requests'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True)
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    preferred_date = db.Column(db.DateTime, nullable=False)
    agenda = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Requested')
    confirmed_date = db.Column(db.DateTime)
    team_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requester = db.relationship('User', foreign_keys=[requested_by])
    account = db.relationship('Account', foreign_keys=[account_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        return {
            'id': self.id, 'account_id': self.account_id, 'project_id': self.project_id,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'agenda': self.agenda, 'status': self.status,
            'confirmed_date': self.confirmed_date.isoformat() if self.confirmed_date else None,
            'team_remarks': self.team_remarks,
            'requested_by_name': self.requester.full_name if self.requester else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ClientUpload(db.Model):
    __tablename__ = 'client_uploads'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    status = db.Column(db.String(30), default='Uploaded')
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    account = db.relationship('Account', foreign_keys=[account_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id,
            'file_name': self.file_name, 'file_type': self.file_type,
            'category': self.category, 'description': self.description,
            'status': self.status,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class FindingQuery(db.Model):
    __tablename__ = 'finding_queries'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    document_id = db.Column(db.Integer, db.ForeignKey('project_documents.id'), index=True)
    raised_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject = db.Column(db.String(255), nullable=False)
    question = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Open')
    response = db.Column(db.Text)
    responded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    raiser = db.relationship('User', foreign_keys=[raised_by])
    responder = db.relationship('User', foreign_keys=[responded_by])
    account = db.relationship('Account', foreign_keys=[account_id])
    project = db.relationship('Project', foreign_keys=[project_id])
    document = db.relationship('ProjectDocument', foreign_keys=[document_id])

    def to_dict(self):
        return {
            'id': self.id, 'account_id': self.account_id,
            'project_id': self.project_id,
            'document_id': self.document_id,
            'subject': self.subject, 'question': self.question,
            'status': self.status, 'response': self.response,
            'raised_by': self.raised_by,
            'raised_by_name': self.raiser.full_name if self.raiser else None,
            'responded_by': self.responded_by,
            'responded_by_name': self.responder.full_name if self.responder else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
