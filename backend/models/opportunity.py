from . import db
from datetime import datetime
from sqlalchemy.orm import validates

OPPORTUNITY_STAGES = [
    ('Prospecting', 10),
    ('Qualification', 10),
    ('Needs Analysis', 20),
    ('Value Proposition', 50),
    ('Identify Decision Makers', 70),
    ('Perception Analysis', 80),
    ('Proposal/Price Quote', 90),
    ('Negotiation/Review', 90),
    ('Closed Won', 100),
    ('Closed Lost', 0),
]

STAGE_NAMES = [s[0] for s in OPPORTUNITY_STAGES]
STAGE_MAP = {s[0]: s[1] for s in OPPORTUNITY_STAGES}


class Opportunity(db.Model):
    __tablename__ = 'opportunities'
    id = db.Column(db.Integer, primary_key=True)
    opp_id = db.Column(db.String(20), unique=True, nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    source = db.Column(db.String(100))
    service_interest = db.Column(db.String(255))
    description = db.Column(db.Text)
    stage = db.Column(db.String(50), default='Prospecting', index=True)
    probability = db.Column(db.Integer, default=10)
    estimated_value = db.Column(db.Float)
    expected_close_date = db.Column(db.Date)
    loss_reason = db.Column(db.Text)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), index=True)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = db.relationship('Account', back_populates='opportunities')
    leads = db.relationship('Lead', back_populates='opportunity')
    assignee = db.relationship('User', foreign_keys=[assigned_to])
    creator = db.relationship('User', foreign_keys=[created_by])
    remarks = db.relationship('OpportunityRemark', back_populates='opportunity', order_by='OpportunityRemark.created_at.desc()', cascade='all, delete-orphan')

    @validates('stage')
    def validate_stage(self, key, stage):
        if stage not in STAGE_NAMES:
            raise ValueError(f'Invalid stage: {stage}. Must be one of {STAGE_NAMES}')
        return stage

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
            'probability': self.probability,
            'estimated_value': self.estimated_value,
            'expected_close_date': self.expected_close_date.isoformat() if self.expected_close_date else None,
            'loss_reason': self.loss_reason,
            'account_id': self.account_id,
            'assigned_to': self.assigned_to,
            'assigned_name': self.assignee.full_name if self.assignee else None,
            'created_by': self.created_by,
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
    opportunity = db.relationship('Opportunity', back_populates='remarks')

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'author': self.author.full_name if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
