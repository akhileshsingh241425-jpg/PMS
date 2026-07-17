from . import db
from datetime import datetime
from sqlalchemy.orm import validates

PROJECT_STAGES = [
    'Initiated', 'Planning', 'Information Gathering', 'Execution', 'Internal Review', 'Client Review', 'Remediation Support', 'Final Delivery',
    'Invoice Raised', 'Payment Pending', 'Partial Payment Received', 'Full Payment Received',
    'Closed',
    'On Hold', 'Delayed', 'Cancelled', 'Escalated',
    'Awaiting Client Response', 'Awaiting Documents', 'Awaiting Payment',
]


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    proj_id = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    stage = db.Column(db.String(50), default='Created', index=True)
    service_type = db.Column(db.String(100))
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False, index=True)
    pm_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    total_value = db.Column(db.Float)
    start_date = db.Column(db.Date)
    target_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    is_client_review_enabled = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = db.relationship('Account', foreign_keys=[account_id], back_populates='projects')
    pm = db.relationship('User', foreign_keys=[pm_id])
    creator = db.relationship('User', foreign_keys=[created_by])
    remarks = db.relationship('ProjectRemark', back_populates='project', order_by='ProjectRemark.created_at.desc()', cascade='all, delete-orphan')
    documents = db.relationship('ProjectDocument', back_populates='project', order_by='ProjectDocument.uploaded_at.desc()', cascade='all, delete-orphan')
    team = db.relationship('ProjectTeam', back_populates='project', cascade='all, delete-orphan')

    @validates('stage')
    def validate_stage(self, key, stage):
        if stage not in PROJECT_STAGES:
            raise ValueError(f'Invalid stage: {stage}. Must be one of {PROJECT_STAGES}')
        return stage

    def to_dict(self):
        return {
            'id': self.id,
            'proj_id': self.proj_id,
            'title': self.title,
            'description': self.description,
            'stage': self.stage,
            'service_type': self.service_type,
            'account_id': self.account_id,
            'account_name': self.account.company_name if self.account else None,
            'pm_id': self.pm_id,
            'pm_name': self.pm.full_name if self.pm else None,
            'total_value': self.total_value,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'actual_end_date': self.actual_end_date.isoformat() if self.actual_end_date else None,
            'is_client_review_enabled': self.is_client_review_enabled,
            'team_count': len(self.team),
            'team_names': ', '.join(tm.user.full_name for tm in self.team if tm.user) if self.team else '',
            'creator_name': self.creator.full_name if self.creator else None,
            'closed_by_name': None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectRemark(db.Model):
    __tablename__ = 'project_remarks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', foreign_keys=[created_by])
    project = db.relationship('Project', back_populates='remarks')
    reactions = db.relationship('ProjectRemarkReaction', backref='remark', lazy='dynamic', cascade='all, delete-orphan')

    def get_reactions(self):
        grouped = {}
        for r in self.reactions:
            u = User.query.get(r.user_id)
            name = u.full_name if u else 'Unknown'
            grouped.setdefault(r.emoji, []).append(name)
        return grouped

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'author': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reactions': self.get_reactions(),
        }


class ProjectDocument(db.Model):
    __tablename__ = 'project_documents'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    category = db.Column(db.String(50))
    is_client_visible = db.Column(db.Boolean, default=False)
    review_status = db.Column(db.String(30))
    reviewer_remarks = db.Column(db.Text)
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    project = db.relationship('Project', back_populates='documents')

    def to_dict(self):
        return {
            'id': self.id,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'category': self.category,
            'is_client_visible': self.is_client_visible,
            'review_status': self.review_status,
            'reviewer_remarks': self.reviewer_remarks,
            'reviewed_by_name': self.reviewer.full_name if self.reviewer else None,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'file_url': f'/api/projects/documents/{self.id}' if self.file_path else None,
        }


class ProjectRemarkReaction(db.Model):
    __tablename__ = 'project_remark_reactions'
    id = db.Column(db.Integer, primary_key=True)
    remark_id = db.Column(db.Integer, db.ForeignKey('project_remarks.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    emoji = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (db.UniqueConstraint('remark_id', 'user_id', 'emoji'),)

    def to_dict(self):
        return {'id': self.id, 'remark_id': self.remark_id, 'user_id': self.user_id, 'emoji': self.emoji}


class ProjectTeam(db.Model):
    __tablename__ = 'project_team'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    role_in_project = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    project = db.relationship('Project', back_populates='team')
    __table_args__ = (db.UniqueConstraint('project_id', 'user_id'),)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'designation': self.user.designation if self.user else None,
            'role_in_project': self.role_in_project,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ProjectReport(db.Model):
    __tablename__ = 'project_reports'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    report_type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    version = db.Column(db.Integer, default=1)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    project = db.relationship('Project', backref=db.backref('reports', lazy='dynamic', order_by='ProjectReport.uploaded_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        from flask import request as flask_request
        base_url = flask_request.host_url.rstrip('/') if flask_request else ''
        return {
            'id': self.id,
            'project_id': self.project_id,
            'report_type': self.report_type,
            'title': self.title,
            'description': self.description,
            'file_name': self.file_name,
            'version': self.version,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'file_url': f"{base_url}/api/projects/reports/{self.id}",
        }
