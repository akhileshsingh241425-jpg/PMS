from . import db
from datetime import datetime

LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'LWP', 'Short Leave']
LEAVE_STATUSES = ['Pending', 'Approved', 'Rejected']


class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    leave_type = db.Column(db.String(30), nullable=False)
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    from_time = db.Column(db.String(10))
    to_time = db.Column(db.String(10))
    reason = db.Column(db.Text, nullable=False)
    attachment_path = db.Column(db.String(500))
    status = db.Column(db.String(20), default='Pending')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    reviewed_at = db.Column(db.DateTime)
    reviewer_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    reviewer = db.relationship('User', foreign_keys=[reviewed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'leave_type': self.leave_type,
            'from_date': self.from_date.isoformat() if self.from_date else None,
            'to_date': self.to_date.isoformat() if self.to_date else None,
            'from_time': self.from_time,
            'to_time': self.to_time,
            'reason': self.reason,
            'attachment_path': self.attachment_path,
            'status': self.status,
            'reviewed_by_name': self.reviewer.full_name if self.reviewer else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'reviewer_remarks': self.reviewer_remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
