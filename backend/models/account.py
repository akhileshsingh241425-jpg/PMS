from . import db
from datetime import datetime


class Account(db.Model):
    __tablename__ = 'accounts'
    id = db.Column(db.Integer, primary_key=True)
    acc_id = db.Column(db.String(20), unique=True, nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    contact_name = db.Column(db.String(255))
    contact_email = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    website = db.Column(db.String(255))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100), default='India')
    pincode = db.Column(db.String(20))
    gst_no = db.Column(db.String(50))
    pan_no = db.Column(db.String(50))
    industry = db.Column(db.String(100))
    account_type = db.Column(db.String(20), default='B2B')
    status = db.Column(db.String(20), default='Active')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])
    projects = db.relationship('Project', back_populates='account', lazy='dynamic')

    def to_dict(self, counts=None):
        return {
            'id': self.id,
            'acc_id': self.acc_id,
            'company_name': self.company_name,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'website': self.website,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'country': self.country,
            'pincode': self.pincode,
            'gst_no': self.gst_no,
            'pan_no': self.pan_no,
            'industry': self.industry,
            'account_type': self.account_type,
            'status': self.status,
            'projects_count': counts['projects'] if counts else self.projects.count() if hasattr(self, 'projects') else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
