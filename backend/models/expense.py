from . import db
from datetime import datetime

EXPENSE_CATEGORIES = ['Travel', 'Conveyance', 'Food', 'Lodging', 'Client-site expense', 'Tools/License', 'Other']
EXPENSE_STATUSES = ['Pending', 'Approved', 'Reimbursed']


class ExpenseEntry(db.Model):
    __tablename__ = 'expense_entries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    category = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='SET NULL'), index=True)
    bill_path = db.Column(db.String(500))
    status = db.Column(db.String(20), default='Pending')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    reviewed_at = db.Column(db.DateTime)
    reviewer_remarks = db.Column(db.Text)
    reimbursed_at = db.Column(db.DateTime)
    reimbursement_ref = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    project = db.relationship('Project', foreign_keys=[project_id])
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'date': self.date.isoformat() if self.date else None,
            'category': self.category,
            'amount': self.amount,
            'reason': self.reason,
            'project_id': self.project_id,
            'project_name': self.project.title if self.project else None,
            'bill_path': self.bill_path,
            'status': self.status,
            'reviewed_by_name': self.reviewer.full_name if self.reviewer else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'reviewer_remarks': self.reviewer_remarks,
            'reimbursed_at': self.reimbursed_at.isoformat() if self.reimbursed_at else None,
            'reimbursement_ref': self.reimbursement_ref,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
