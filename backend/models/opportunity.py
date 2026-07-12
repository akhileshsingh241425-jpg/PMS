from . import db
from datetime import datetime

OPPORTUNITY_STAGES = [
    'Prospecting', 'Qualification', 'Needs Analysis',
    'Proposal/Price Quote', 'Negotiation/Review',
    'Closed Won', 'Closed Lost',
]

OPPORTUNITY_SOURCES = [
    'Referral', 'Website', 'LinkedIn', 'Cold Call',
    'Email Campaign', 'Partner', 'Conference/Event',
    'Existing Client', 'Other',
]


class Opportunity(db.Model):
    __tablename__ = 'opportunities'
    id = db.Column(db.Integer, primary_key=True)
    opp_id = db.Column(db.String(20), unique=True, nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    source = db.Column(db.String(100))
    service_interest = db.Column(db.String(100))
    description = db.Column(db.Text)
    stage = db.Column(db.String(50), default='Prospecting', index=True)
    estimated_value = db.Column(db.Float)
    expected_close_date = db.Column(db.Date)
    loss_reason = db.Column(db.Text)
    probability = db.Column(db.Integer, default=10)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])
    account = db.relationship('Account', foreign_keys=[account_id])

    def to_dict(self):
        return {
            'id': self.id,
            'opp_id': self.opp_id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'source': self.source,
            'service_interest': self.service_interest,
            'description': self.description,
            'stage': self.stage,
            'estimated_value': self.estimated_value,
            'expected_close_date': self.expected_close_date.isoformat() if self.expected_close_date else None,
            'loss_reason': self.loss_reason,
            'probability': self.probability,
            'account_id': self.account_id,
            'account_name': self.account.company_name if self.account else None,
            'assigned_to': self.assigned_to,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'created_by': self.created_by,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class OpportunityRemark(db.Model):
    __tablename__ = 'opportunity_remarks'
    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id', ondelete='CASCADE'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    author = db.relationship('User', foreign_keys=[created_by])
    opportunity = db.relationship('Opportunity', backref=db.backref('remarks', lazy='dynamic', order_by='OpportunityRemark.created_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'text': self.text,
            'author': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class OpportunityDocument(db.Model):
    __tablename__ = 'opportunity_documents'
    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50))
    review_status = db.Column(db.String(30), default='Pending')
    reviewer_remarks = db.Column(db.Text)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploader = db.relationship('User', foreign_keys=[uploaded_by])
    opportunity = db.relationship('Opportunity', backref=db.backref('documents', lazy='dynamic', order_by='OpportunityDocument.uploaded_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'category': self.category,
            'review_status': self.review_status,
            'reviewer_remarks': self.reviewer_remarks,
            'uploaded_by_name': self.uploader.full_name if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class OpportunityActivity(db.Model):
    __tablename__ = 'opportunity_activities'
    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id', ondelete='CASCADE'), nullable=False)
    activity_type = db.Column(db.String(30), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    activity_date = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])
    opportunity = db.relationship('Opportunity', backref=db.backref('activities', lazy='dynamic', order_by='OpportunityActivity.activity_date.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'activity_type': self.activity_type,
            'title': self.title,
            'description': self.description,
            'activity_date': self.activity_date.isoformat() if self.activity_date else None,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class OpportunityNote(db.Model):
    __tablename__ = 'opportunity_notes'
    id = db.Column(db.Integer, primary_key=True)
    opportunity_id = db.Column(db.Integer, db.ForeignKey('opportunities.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])
    opportunity = db.relationship('Opportunity', backref=db.backref('notes', lazy='dynamic', order_by='OpportunityNote.created_at.desc()', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'opportunity_id': self.opportunity_id,
            'content': self.content,
            'author': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
