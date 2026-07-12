from . import db
from datetime import datetime


LEAD_STAGES = [
    'Prospecting', 'Lead Qualification', 'Demo or Meeting',
    'Proposal', 'Negotiation & Commitment', 'Purchase Order',
    'Lead Closed (Won)', 'Lead Closed (Lost)',
    'Converted to Account', 'Approval Rejected',
]

LEAD_SOURCES = [
    'Opportunity', 'Referral', 'Website', 'LinkedIn', 'Cold Call',
    'Email Campaign', 'Partner', 'Conference', 'Existing Client', 'Other',
]

LEAD_TYPES = [
    'New Business', 'Existing Client', 'Upsell', 'Cross-sell', 'Other',
]


class Lead(db.Model):
    __tablename__ = 'leads'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.String(20), unique=True, nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    website = db.Column(db.String(255))
    address = db.Column(db.Text)
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(20))
    source = db.Column(db.String(100))
    type = db.Column(db.String(50))
    stage = db.Column(db.String(50), default='Prospecting', index=True)
    subject = db.Column(db.String(255))
    description = db.Column(db.Text)
    estimated_value = db.Column(db.Float)
    service_type = db.Column(db.String(100))
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    closed_on = db.Column(db.DateTime)
    closed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), index=True)
    referral_opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id'))
    referring_account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'))
    referral_date = db.Column(db.DateTime)

    approval_status = db.Column(db.String(20))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    approved_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    account_created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    account_created_at = db.Column(db.DateTime)
    is_readonly = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])
    closer = db.relationship('User', foreign_keys=[closed_by])
    approver = db.relationship('User', foreign_keys=[approved_by])
    account_creator = db.relationship('User', foreign_keys=[account_created_by])
    referral_opportunity = db.relationship('Opportunity', foreign_keys=[referral_opportunity_id])
    referring_account = db.relationship('Account', foreign_keys=[referring_account_id])

    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'website': self.website,
            'address': self.address,
            'state': self.state,
            'pincode': self.pincode,
            'source': self.source,
            'type': self.type,
            'stage': self.stage,
            'subject': self.subject,
            'description': self.description,
            'estimated_value': self.estimated_value,
            'service_type': self.service_type,
            'assigned_to': self.assigned_to,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'created_by': self.created_by,
            'created_by_name': self.creator.full_name if self.creator else None,
            'closed_on': self.closed_on.isoformat() if self.closed_on else None,
            'closed_by': self.closed_by,
            'closed_by_name': self.closer.full_name if self.closer else None,
            'account_id': self.account_id,
            'approval_status': self.approval_status,
            'approved_by': self.approved_by,
            'approved_by_name': self.approver.full_name if self.approver else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'account_created_by': self.account_created_by,
            'account_created_by_name': self.account_creator.full_name if self.account_creator else None,
            'account_created_at': self.account_created_at.isoformat() if self.account_created_at else None,
            'is_readonly': self.is_readonly,
            'referral_opportunity_id': self.referral_opportunity_id,
            'referring_account_id': self.referring_account_id,
            'referring_account_name': self.referring_account.company_name if self.referring_account else None,
            'referral_date': self.referral_date.isoformat() if self.referral_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class LeadRemark(db.Model):
    __tablename__ = 'lead_remarks'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime)

    author = db.relationship('User', foreign_keys=[created_by])
    reactions = db.relationship('LeadRemarkReaction', backref='remark_ref', lazy='dynamic', cascade='all, delete-orphan')
    lead = db.relationship('Lead', backref=db.backref('remarks', lazy='dynamic', order_by='LeadRemark.created_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        reactions_data = {}
        for r in self.reactions:
            if r.emoji not in reactions_data:
                reactions_data[r.emoji] = []
            reactions_data[r.emoji].append({'user_id': r.user_id, 'user_name': r.user.full_name if r.user else None})
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'text': self.text,
            'author': self.author.full_name if self.author else None,
            'author_id': self.created_by,
            'is_edited': self.updated_at is not None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'reactions': reactions_data,
        }

    def soft_delete(self):
        self.deleted_at = datetime.utcnow()


class LeadDocument(db.Model):
    __tablename__ = 'lead_documents'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50))
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    lead = db.relationship('Lead', backref=db.backref('documents', lazy='dynamic', order_by='LeadDocument.uploaded_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        from flask import request as flask_request
        base_url = flask_request.host_url.rstrip('/') if flask_request else ''
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'file_name': self.file_name,
            'category': self.category,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'file_url': f"{base_url}/api/leads/documents/{self.id}" if self.id else None,
        }


class LeadActivity(db.Model):
    __tablename__ = 'lead_activities'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    activity_type = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    activity_date = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])
    lead = db.relationship('Lead', backref=db.backref('activities', lazy='dynamic', order_by='LeadActivity.activity_date.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'activity_type': self.activity_type,
            'title': self.title,
            'description': self.description,
            'activity_date': self.activity_date.isoformat() if self.activity_date else None,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class LeadNote(db.Model):
    __tablename__ = 'lead_notes'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])
    lead = db.relationship('Lead', backref=db.backref('notes', lazy='dynamic', order_by='LeadNote.created_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'content': self.content,
            'author': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class LeadProposal(db.Model):
    __tablename__ = 'lead_proposals'
    id = db.Column(db.Integer, primary_key=True)
    proposal_no = db.Column(db.String(20), unique=True, nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False, index=True)
    version = db.Column(db.Integer, default=1)
    amount = db.Column(db.Float)
    prepared_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    status = db.Column(db.String(20), default='Draft')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    preparer = db.relationship('User', foreign_keys=[prepared_by])
    lead = db.relationship('Lead', backref=db.backref('proposals', lazy='dynamic', order_by='LeadProposal.created_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'proposal_no': self.proposal_no,
            'lead_id': self.lead_id,
            'version': self.version,
            'amount': self.amount,
            'prepared_by': self.prepared_by,
            'prepared_by_name': self.preparer.full_name if self.preparer else None,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class LeadRemarkReaction(db.Model):
    __tablename__ = 'lead_remark_reactions'
    id = db.Column(db.Integer, primary_key=True)
    remark_id = db.Column(db.Integer, db.ForeignKey('lead_remarks.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    emoji = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    __table_args__ = (db.UniqueConstraint('remark_id', 'user_id', 'emoji', name='uq_remark_user_emoji'),)


class LeadAuditLog(db.Model):
    __tablename__ = 'lead_audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False, index=True)
    action = db.Column(db.String(50), nullable=False)
    previous_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    changer = db.relationship('User', foreign_keys=[changed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'action': self.action,
            'previous_value': self.previous_value,
            'new_value': self.new_value,
            'changed_by': self.changed_by,
            'changed_by_name': self.changer.full_name if self.changer else None,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
        }
