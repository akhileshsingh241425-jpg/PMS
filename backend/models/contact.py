from . import db
from datetime import datetime


class Contact(db.Model):
    __tablename__ = 'contacts'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False, index=True)
    salutation = db.Column(db.String(20))
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    mobile = db.Column(db.String(20))
    designation = db.Column(db.String(100))
    department = db.Column(db.String(100))
    is_primary = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = db.relationship('User', foreign_keys=[created_by])

    def to_dict(self):
        return {
            'id': self.id,
            'account_id': self.account_id,
            'salutation': self.salutation,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.salutation + ' ' if self.salutation else ''}{self.first_name} {self.last_name or ''}".strip(),
            'email': self.email,
            'phone': self.phone,
            'mobile': self.mobile,
            'designation': self.designation,
            'department': self.department,
            'is_primary': self.is_primary,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
