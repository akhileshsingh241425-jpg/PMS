from . import db
from datetime import datetime
from sqlalchemy.orm import validates

LEAD_STAGES = [
    'Prospecting',
    'Lead Qualification',
    'Demo or Meeting',
    'Proposal',
    'Negotiation & Commitment',
    'Purchase Order',
    'Lead Closed',
    'Lead Converted',
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
    source = db.Column(db.String(100))
    service_type = db.Column(db.String(100))
    description = db.Column(db.Text)
    stage = db.Column(db.String(50), default='Prospecting', index=True)
    estimated_value = db.Column(db.Float)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id'), index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = db.relationship('Account', back_populates='leads')
    opportunity = db.relationship('Opportunity', back_populates='leads')
    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])
    remarks = db.relationship('LeadRemark', back_populates='lead', order_by='LeadRemark.created_at.desc()', cascade='all, delete-orphan')
    documents = db.relationship('LeadDocument', back_populates='lead', order_by='LeadDocument.uploaded_at.desc()', cascade='all, delete-orphan')

    @validates('stage')
    def validate_stage(self, key, stage):
        if stage not in LEAD_STAGES:
            raise ValueError(f'Invalid stage: {stage}. Must be one of {LEAD_STAGES}')
        return stage

    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'website': self.website,
            'source': self.source,
            'service_type': self.service_type,
            'description': self.description,
            'stage': self.stage,
            'estimated_value': self.estimated_value,
            'assigned_to': self.assigned_to,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'opportunity_id': self.opportunity_id,
            'account_id': self.account_id,
            'created_by': self.created_by,
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

    author = db.relationship('User', foreign_keys=[created_by])
    lead = db.relationship('Lead', back_populates='remarks')

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'author': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class LeadDocument(db.Model):
    __tablename__ = 'lead_documents'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50))
    category = db.Column(db.String(50))  # Proposal, PO, Agreement, Other
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    lead = db.relationship('Lead', back_populates='documents')

    def to_dict(self):
        return {
            'id': self.id,
            'file_name': self.file_name,
            'file_type': self.file_type,
            'category': self.category,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }
