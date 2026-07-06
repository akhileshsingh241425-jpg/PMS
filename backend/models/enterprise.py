from . import db
from datetime import datetime


class ProjectRisk(db.Model):
    __tablename__ = 'project_risks'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    impact = db.Column(db.String(20), default='Medium')
    probability = db.Column(db.String(20), default='Medium')
    severity = db.Column(db.String(20), default='Medium')
    status = db.Column(db.String(20), default='Open')
    mitigation = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = db.relationship('User', foreign_keys=[owner_id])
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id, 'title': self.title,
            'description': self.description, 'category': self.category,
            'impact': self.impact, 'probability': self.probability, 'severity': self.severity,
            'status': self.status, 'mitigation': self.mitigation,
            'owner_name': self.owner.full_name if self.owner else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectIssue(db.Model):
    __tablename__ = 'project_issues'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='Medium')
    status = db.Column(db.String(20), default='Open')
    resolution = db.Column(db.Text)
    raised_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    raiser = db.relationship('User', foreign_keys=[raised_by])
    assignee = db.relationship('User', foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id, 'title': self.title,
            'description': self.description, 'priority': self.priority, 'status': self.status,
            'resolution': self.resolution,
            'raised_by_name': self.raiser.full_name if self.raiser else None,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectMilestone(db.Model):
    __tablename__ = 'project_milestones'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.Date)
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='Pending')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id, 'title': self.title,
            'description': self.description, 'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ProjectInvoice(db.Model):
    __tablename__ = 'project_invoices'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    invoice_no = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    tax = db.Column(db.Float, default=0)
    total = db.Column(db.Float)
    status = db.Column(db.String(20), default='Draft')
    issued_date = db.Column(db.Date)
    due_date = db.Column(db.Date)
    paid_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id, 'invoice_no': self.invoice_no,
            'amount': self.amount, 'tax': self.tax,
            'total': self.total or (self.amount + (self.tax or 0)),
            'status': self.status,
            'issued_date': self.issued_date.isoformat() if self.issued_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ProjectTimesheet(db.Model):
    __tablename__ = 'project_timesheets'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    hours = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String(20), default='Submitted')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    approver = db.relationship('User', foreign_keys=[approved_by])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id,
            'user_name': self.user.full_name if self.user else None,
            'date': self.date.isoformat() if self.date else None,
            'hours': self.hours, 'description': self.description, 'status': self.status,
            'approved_by_name': self.approver.full_name if self.approver else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ProjectChangeRequest(db.Model):
    __tablename__ = 'project_change_requests'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    reason = db.Column(db.Text)
    impact = db.Column(db.Text)
    priority = db.Column(db.String(20), default='Medium')
    status = db.Column(db.String(20), default='Pending')
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    approved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    requester = db.relationship('User', foreign_keys=[requested_by])
    approver = db.relationship('User', foreign_keys=[approved_by])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id, 'title': self.title,
            'description': self.description, 'reason': self.reason, 'impact': self.impact,
            'priority': self.priority, 'status': self.status,
            'requested_by_name': self.requester.full_name if self.requester else None,
            'approved_by_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ApprovalHistory(db.Model):
    __tablename__ = 'approval_history'
    id = db.Column(db.Integer, primary_key=True)
    module_type = db.Column(db.String(50), nullable=False)
    module_id = db.Column(db.Integer, nullable=False, index=True)
    level = db.Column(db.String(50))
    action = db.Column(db.String(20), nullable=False)
    remarks = db.Column(db.Text)
    action_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship('User', foreign_keys=[action_by])

    def to_dict(self):
        return {
            'id': self.id, 'module_type': self.module_type, 'module_id': self.module_id,
            'level': self.level, 'action': self.action, 'remarks': self.remarks,
            'action_by_name': self.actor.full_name if self.actor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
