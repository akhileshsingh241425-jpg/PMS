from . import db, bcrypt
from datetime import datetime


class ClientUser(db.Model):
    """Separate login for external clients — limited access."""
    __tablename__ = 'client_users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    company_name = db.Column(db.String(255))
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    account = db.relationship('Account', foreign_keys=[account_id])

    def set_password(self, pw):
        self.password_hash = bcrypt.generate_password_hash(pw).decode('utf-8')

    def check_password(self, pw):
        return bcrypt.check_password_hash(self.password_hash, pw)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'company_name': self.company_name,
            'account_id': self.account_id,
            'is_active': self.is_active,
        }


class MeetingRequest(db.Model):
    """Client requests a meeting with audit team."""
    __tablename__ = 'meeting_requests'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), index=True)
    requested_by = db.Column(db.Integer, db.ForeignKey('client_users.id', ondelete='CASCADE'), nullable=False, index=True)
    preferred_date = db.Column(db.DateTime, nullable=False)
    agenda = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Requested')  # Requested, Confirmed, Rescheduled, Cancelled
    confirmed_date = db.Column(db.DateTime)
    team_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requester = db.relationship('ClientUser', foreign_keys=[requested_by])
    account = db.relationship('Account', foreign_keys=[account_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        return {
            'id': self.id, 'account_id': self.account_id, 'project_id': self.project_id,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'agenda': self.agenda, 'status': self.status,
            'confirmed_date': self.confirmed_date.isoformat() if self.confirmed_date else None,
            'team_remarks': self.team_remarks,
            'requested_by_name': self.requester.name if self.requester else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class DocumentRevisionRequest(db.Model):
    """Client requests changes to an approved document."""
    __tablename__ = 'document_revision_requests'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    document_id = db.Column(db.Integer, db.ForeignKey('project_documents.id'), nullable=False, index=True)
    requested_by = db.Column(db.Integer, db.ForeignKey('client_users.id', ondelete='CASCADE'), nullable=False, index=True)
    comments = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Submitted')  # Submitted, Under Review, Resolved
    team_response = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requester = db.relationship('ClientUser', foreign_keys=[requested_by])
    document = db.relationship('ProjectDocument', foreign_keys=[document_id])
    account = db.relationship('Account', foreign_keys=[account_id])

    def to_dict(self):
        return {
            'id': self.id, 'document_id': self.document_id,
            'document_name': self.document.file_name if self.document else None,
            'comments': self.comments, 'status': self.status,
            'team_response': self.team_response,
            'requested_by_name': self.requester.name if self.requester else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ClientUpload(db.Model):
    """Documents uploaded by client (policies, evidence, etc.)."""
    __tablename__ = 'client_uploads'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('client_users.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    category = db.Column(db.String(50))  # Policy, Network Diagram, Evidence, Compliance Doc, Other
    description = db.Column(db.Text)
    status = db.Column(db.String(30), default='Uploaded')  # Uploaded, Acknowledged
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('ClientUser', foreign_keys=[uploaded_by])
    account = db.relationship('Account', foreign_keys=[account_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id,
            'file_name': self.file_name, 'file_type': self.file_type,
            'category': self.category, 'description': self.description,
            'status': self.status,
            'uploaded_by_name': self.uploader.name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class FindingQuery(db.Model):
    """Client raises query on audit finding."""
    __tablename__ = 'finding_queries'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    document_id = db.Column(db.Integer, db.ForeignKey('project_documents.id'), index=True)
    raised_by = db.Column(db.Integer, db.ForeignKey('client_users.id', ondelete='CASCADE'), nullable=False, index=True)
    subject = db.Column(db.String(255), nullable=False)
    question = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), default='Open')  # Open, Answered, Reopened
    response = db.Column(db.Text)
    responded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    raiser = db.relationship('ClientUser', foreign_keys=[raised_by])
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
            'raised_by_name': self.raiser.name if self.raiser else None,
            'responded_by': self.responded_by,
            'responded_by_name': self.responder.full_name if self.responder else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
