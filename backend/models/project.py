from . import db
from datetime import datetime
from sqlalchemy.orm import validates
from .activity import Task

PROJECT_STAGES = [
    'Created', 'Initiated', 'Planning', 'Information Gathering', 'Execution', 'Internal Review', 'Client Review', 'Remediation Support', 'Final Delivery',
    'Invoice Raised', 'Payment Pending', 'Partial Payment Received', 'Full Payment Received',
    'Closed',
    'On Hold', 'Delayed', 'Cancelled', 'Escalated',
    'Awaiting Client Response', 'Awaiting Documents', 'Awaiting Payment',
]


class ProjectStageTemplate(db.Model):
    __tablename__ = 'project_stage_templates'
    id = db.Column(db.Integer, primary_key=True)
    project_type = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    order = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    color = db.Column(db.String(20), default='#6366F1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('project_type', 'name', name='uq_stage_template_type_name'),)

    def to_dict(self):
        return {
            'id': self.id,
            'project_type': self.project_type,
            'name': self.name,
            'order': self.order,
            'is_active': self.is_active,
            'color': self.color,
        }


class ProjectStage(db.Model):
    __tablename__ = 'project_stages'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    order = db.Column(db.Integer, default=0, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    color = db.Column(db.String(20), default='#6366F1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'order': self.order,
            'is_active': self.is_active,
            'color': self.color,
        }


PROJECT_TYPES = ['VAPT', 'IS Audit', 'ISMS Implementation', 'Technical Assessment', 'GRC', 'CS Framework Implementation']


class PlanTemplateMaster(db.Model):
    __tablename__ = 'plan_template_masters'
    id = db.Column(db.Integer, primary_key=True)
    project_type = db.Column(db.String(50), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    modules = db.relationship('PlanTemplateModule', back_populates='template', order_by='PlanTemplateModule.order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'project_type': self.project_type, 'name': self.name,
            'description': self.description, 'is_active': self.is_active,
            'modules': [m.to_dict() for m in self.modules],
        }


class PlanTemplateModule(db.Model):
    __tablename__ = 'plan_template_modules'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('plan_template_masters.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    template = db.relationship('PlanTemplateMaster', back_populates='modules')
    submodules = db.relationship('PlanTemplateSubmodule', back_populates='module', order_by='PlanTemplateSubmodule.order', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id, 'template_id': self.template_id, 'name': self.name,
            'order': self.order, 'submodules': [s.to_dict() for s in self.submodules],
        }


class PlanTemplateSubmodule(db.Model):
    __tablename__ = 'plan_template_submodules'
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('plan_template_modules.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    default_deliverable = db.Column(db.String(255))
    order = db.Column(db.Integer, default=0)

    module = db.relationship('PlanTemplateModule', back_populates='submodules')

    def to_dict(self):
        return {
            'id': self.id, 'module_id': self.module_id, 'name': self.name,
            'default_deliverable': self.default_deliverable, 'order': self.order,
        }


class PlanVersion(db.Model):
    __tablename__ = 'plan_versions'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    version_number = db.Column(db.Integer, nullable=False)
    change_summary = db.Column(db.Text)
    plan_data = db.Column(db.JSON, nullable=False)
    is_baseline = db.Column(db.Boolean, default=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('plan_versions', lazy='dynamic', order_by='PlanVersion.version_number.desc()', cascade='all, delete-orphan'))
    changer = db.relationship('User', foreign_keys=[changed_by])

    def to_dict(self):
        return {
            'id': self.id, 'project_id': self.project_id, 'version_number': self.version_number,
            'change_summary': self.change_summary, 'is_baseline': self.is_baseline,
            'changed_by_name': self.changer.full_name if self.changer else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PlanSubmodule(db.Model):
    __tablename__ = 'plan_submodules'
    id = db.Column(db.Integer, primary_key=True)
    phase_id = db.Column(db.Integer, db.ForeignKey('project_phases.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    deliverable = db.Column(db.String(255))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    support_ids = db.Column(db.JSON)
    effort_days = db.Column(db.Float)
    dependency_id = db.Column(db.Integer, db.ForeignKey('plan_submodules.id', ondelete='SET NULL'))
    milestone_flag = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer, default=0)
    status = db.Column(db.String(30), default='Pending')
    progress = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    phase = db.relationship('ProjectPhase', backref=db.backref('submodules', lazy='dynamic', order_by='PlanSubmodule.order', cascade='all, delete-orphan'))
    owner = db.relationship('User', foreign_keys=[owner_id])
    dependency = db.relationship('PlanSubmodule', foreign_keys=[dependency_id], remote_side='PlanSubmodule.id')

    def to_dict(self):
        return {
            'id': self.id, 'phase_id': self.phase_id, 'name': self.name,
            'deliverable': self.deliverable,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'owner_id': self.owner_id, 'owner_name': self.owner.full_name if self.owner else None,
            'support_ids': self.support_ids or [],
            'effort_days': self.effort_days, 'dependency_id': self.dependency_id,
            'milestone_flag': self.milestone_flag, 'order': self.order,
            'status': self.status, 'progress': self.progress,
        }


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    proj_id = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    stage = db.Column(db.String(50), default='Created', index=True)
    service_type = db.Column(db.String(100))
    client_id = db.Column(db.Integer, db.ForeignKey('clients.id'), nullable=True, index=True)
    pm_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    total_value = db.Column(db.Float)
    start_date = db.Column(db.Date)
    target_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    is_client_review_enabled = db.Column(db.Boolean, default=False)
    po_number = db.Column(db.String(100))
    po_date = db.Column(db.Date)
    po_amount = db.Column(db.Float)
    po_terms = db.Column(db.Text)
    po_document_id = db.Column(db.Integer, db.ForeignKey('project_documents.id'))
    project_type = db.Column(db.String(50))
    plan_generated = db.Column(db.Boolean, default=False)
    tds = db.Column(db.Float)
    gst = db.Column(db.Float)
    net_amount = db.Column(db.Float)
    direction = db.Column(db.String(10), default='IN')
    vendor_name = db.Column(db.String(255))
    po_template = db.Column(db.String(100))
    approval_status = db.Column(db.String(30), default='Pending')
    send_method = db.Column(db.String(30))
    advance_paid = db.Column(db.Float, default=0)
    balance_outstanding = db.Column(db.Float, default=0)
    po_out_status = db.Column(db.String(30), default='DRAFT')
    po_in_status = db.Column(db.String(30), default=None)
    source_po_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True, index=True)
    po_acknowledged = db.Column(db.Boolean, default=False)
    po_acknowledged_at = db.Column(db.DateTime)
    po_acknowledgement_sent_to = db.Column(db.String(255))
    po_approver_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    po_approved_at = db.Column(db.DateTime)
    po_rejected_reason = db.Column(db.Text)
    po_resubmitted_at = db.Column(db.DateTime)
    po_sent_via = db.Column(db.String(30))
    po_sent_date = db.Column(db.DateTime)
    po_work_started = db.Column(db.Boolean, default=False)
    po_work_started_at = db.Column(db.DateTime)
    po_work_completed = db.Column(db.Boolean, default=False)
    po_work_completed_at = db.Column(db.DateTime)
    po_next_due_date = db.Column(db.Date)
    vendor_email = db.Column(db.String(255))
    vendor_gstin = db.Column(db.String(50))
    vendor_pan = db.Column(db.String(20))
    vendor_address = db.Column(db.Text)
    vendor_contact_person = db.Column(db.String(255))
    vendor_phone = db.Column(db.String(20))
    vendor_bank_account_no = db.Column(db.String(50))
    vendor_bank_ifsc = db.Column(db.String(20))
    po_delivery_period = db.Column(db.Text)
    po_expected_completion_date = db.Column(db.Date)
    po_special_terms = db.Column(db.Text)
    po_gst_type = db.Column(db.String(20), default='CGST+SGST')
    po_amount_in_words = db.Column(db.String(500))
    po_revision_number = db.Column(db.Integer, default=0)
    po_parent_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    linked_project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True, index=True)
    completion_date = db.Column(db.Date)
    deliverables_received = db.Column(db.Text)
    acceptance_remarks = db.Column(db.Text)
    vendor_invoice_no = db.Column(db.String(100))
    vendor_invoice_date = db.Column(db.Date)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = db.relationship('Client', foreign_keys=[client_id], backref='projects')
    linked_project = db.relationship('Project', foreign_keys=[linked_project_id], remote_side='Project.id', backref=db.backref('linked_children', lazy='dynamic'))
    source_po = db.relationship('Project', foreign_keys=[source_po_id], remote_side='Project.id', backref=db.backref('child_projects', lazy='dynamic'))
    pm = db.relationship('User', foreign_keys=[pm_id])
    creator = db.relationship('User', foreign_keys=[created_by])
    po_approver = db.relationship('User', foreign_keys=[po_approver_id])
    po_payments = db.relationship('PoPayment', back_populates='project', order_by='PoPayment.date.desc()', cascade='all, delete-orphan')
    line_items = db.relationship('POLineItem', back_populates='project', order_by='POLineItem.id', cascade='all, delete-orphan')
    remarks = db.relationship('ProjectRemark', back_populates='project', order_by='ProjectRemark.created_at.desc()', cascade='all, delete-orphan')
    documents = db.relationship('ProjectDocument', foreign_keys='ProjectDocument.project_id', back_populates='project', order_by='ProjectDocument.uploaded_at.desc()', cascade='all, delete-orphan')
    team = db.relationship('ProjectTeam', back_populates='project', cascade='all, delete-orphan')
    phases = db.relationship('ProjectPhase', back_populates='project', order_by='ProjectPhase.order', cascade='all, delete-orphan')

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
            'client_id': self.client_id,
            'client_name': self.client.name if self.client else None,
            'pm_id': self.pm_id,
            'pm_name': self.pm.full_name if self.pm else None,
            'total_value': self.total_value,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'actual_end_date': self.actual_end_date.isoformat() if self.actual_end_date else None,
            'is_client_review_enabled': self.is_client_review_enabled,
            'po_number': self.po_number,
            'po_date': self.po_date.isoformat() if self.po_date else None,
            'po_amount': self.po_amount,
            'po_terms': self.po_terms,
            'po_document_id': self.po_document_id,
            'project_type': self.project_type,
            'plan_generated': self.plan_generated,
            'tds': self.tds,
            'gst': self.gst,
            'net_amount': self.net_amount,
            'direction': self.direction,
            'vendor_name': self.vendor_name,
            'po_template': self.po_template,
            'approval_status': self.approval_status,
            'send_method': self.send_method,
            'advance_paid': self.advance_paid,
            'balance_outstanding': self.balance_outstanding,
            'po_out_status': self.po_out_status,
            'po_in_status': self.po_in_status,
            'po_acknowledged': self.po_acknowledged,
            'po_acknowledged_at': self.po_acknowledged_at.isoformat() if self.po_acknowledged_at else None,
            'po_acknowledgement_sent_to': self.po_acknowledgement_sent_to,
            'po_approver_id': self.po_approver_id,
            'po_approver_name': self.po_approver.full_name if self.po_approver else None,
            'po_approved_at': self.po_approved_at.isoformat() if self.po_approved_at else None,
            'po_rejected_reason': self.po_rejected_reason,
            'po_resubmitted_at': self.po_resubmitted_at.isoformat() if self.po_resubmitted_at else None,
            'po_sent_via': self.po_sent_via,
            'po_sent_date': self.po_sent_date.isoformat() if self.po_sent_date else None,
            'po_work_started': self.po_work_started,
            'po_work_started_at': self.po_work_started_at.isoformat() if self.po_work_started_at else None,
            'po_work_completed': self.po_work_completed,
            'po_work_completed_at': self.po_work_completed_at.isoformat() if self.po_work_completed_at else None,
            'po_next_due_date': self.po_next_due_date.isoformat() if self.po_next_due_date else None,
            'vendor_email': self.vendor_email,
            'vendor_gstin': self.vendor_gstin,
            'vendor_pan': self.vendor_pan,
            'vendor_address': self.vendor_address,
            'vendor_contact_person': self.vendor_contact_person,
            'vendor_phone': self.vendor_phone,
            'vendor_bank_account_no': self.vendor_bank_account_no,
            'vendor_bank_ifsc': self.vendor_bank_ifsc,
            'po_delivery_period': self.po_delivery_period,
            'po_expected_completion_date': self.po_expected_completion_date.isoformat() if self.po_expected_completion_date else None,
            'po_special_terms': self.po_special_terms,
            'po_gst_type': self.po_gst_type,
            'po_amount_in_words': self.po_amount_in_words,
            'po_revision_number': self.po_revision_number,
            'po_parent_id': self.po_parent_id,
            'linked_project_id': self.linked_project_id,
            'source_po_id': self.source_po_id,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'deliverables_received': self.deliverables_received,
            'acceptance_remarks': self.acceptance_remarks,
            'vendor_invoice_no': self.vendor_invoice_no,
            'vendor_invoice_date': self.vendor_invoice_date.isoformat() if self.vendor_invoice_date else None,
            'line_items': [li.to_dict() for li in self.line_items] if self.line_items else [],
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
    is_verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    verified_at = db.Column(db.DateTime)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])
    verifier = db.relationship('User', foreign_keys=[verified_by])
    project = db.relationship('Project', foreign_keys=[project_id], back_populates='documents')

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
            'is_verified': self.is_verified,
            'verified_by_name': self.verifier.full_name if self.verifier else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
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

    def     to_dict(self):
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


class ProjectAsset(db.Model):
    __tablename__ = 'project_assets'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    asset_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('assets', lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'asset_type': self.asset_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ProjectPhase(db.Model):
    __tablename__ = 'project_phases'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    order = db.Column(db.Integer, default=0)
    status = db.Column(db.String(30), default='Pending')
    deliverable = db.Column(db.String(255))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    weight = db.Column(db.Float, default=0)
    milestone_flag = db.Column(db.Boolean, default=False)
    plan_version = db.Column(db.Integer, default=1)
    progress = db.Column(db.Float, default=0)

    project = db.relationship('Project', back_populates='phases')
    tasks = db.relationship('Task', backref='phase', lazy='dynamic')
    phase_owner = db.relationship('User', foreign_keys=[owner_id])

    def to_dict(self):
        parent_tasks = self.tasks.filter_by(parent_task_id=None).order_by(Task.created_at.asc()).all()
        task_dicts = []
        for t in parent_tasks:
            td = t.to_dict()
            td['subtasks'] = [s.to_dict() for s in t.subtasks.order_by(Task.created_at.asc()).all()]
            task_dicts.append(td)
        sub = self.submodules.order_by(PlanSubmodule.order).all() if hasattr(self, 'submodules') else []
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'order': self.order,
            'status': self.status,
            'deliverable': self.deliverable,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'owner_id': self.owner_id,
            'owner_name': self.phase_owner.full_name if self.phase_owner else None,
            'weight': self.weight,
            'milestone_flag': self.milestone_flag,
            'plan_version': self.plan_version,
            'progress': self.progress,
            'tasks': task_dicts,
            'submodules': [s.to_dict() for s in sub],
        }


class PoPayment(db.Model):
    __tablename__ = 'po_payments'
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    mode = db.Column(db.String(50))
    tds_section = db.Column(db.String(20))
    tds_percent = db.Column(db.Float, default=0)
    tds_amount = db.Column(db.Float, default=0)
    net_paid = db.Column(db.Float)
    payment_mode = db.Column(db.String(30))
    utr_no = db.Column(db.String(100))
    vendor_invoice_no = db.Column(db.String(100))
    vendor_invoice_date = db.Column(db.Date)
    remarks = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', foreign_keys=[po_id], back_populates='po_payments')
    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'po_id': self.po_id,
            'amount': self.amount,
            'date': self.date.isoformat() if self.date else None,
            'mode': self.mode,
            'tds_section': self.tds_section,
            'tds_percent': self.tds_percent,
            'tds_amount': self.tds_amount,
            'net_paid': self.net_paid,
            'payment_mode': self.payment_mode,
            'utr_no': self.utr_no,
            'vendor_invoice_no': self.vendor_invoice_no,
            'vendor_invoice_date': self.vendor_invoice_date.isoformat() if self.vendor_invoice_date else None,
            'remarks': self.remarks,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
