from . import db
from datetime import datetime


class ApprovalRequest(db.Model):
    """Unified approval workflow model for leave, expense, task, etc."""
    __tablename__ = 'approval_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    request_type = db.Column(db.String(30), nullable=False, index=True)  # leave, expense, task, vendor_payment
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    target_id = db.Column(db.Integer, nullable=True)  # leave_id, expense_id, task_id, etc.
    target_type = db.Column(db.String(30), nullable=True)  # leave_request, expense_entry, task, etc.
    
    # Current state
    current_level = db.Column(db.Integer, default=0, nullable=False)  # 0 = pending first approver
    status = db.Column(db.String(20), default='pending', nullable=False)  # pending, approved, rejected, cancelled
    current_approver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    
    # Context data
    payload = db.Column(db.JSON)  # Store request details
    remarks = db.Column(db.Text)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    requester = db.relationship('User', foreign_keys=[requester_id])
    current_approver = db.relationship('User', foreign_keys=[current_approver_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_type': self.request_type,
            'requester_id': self.requester_id,
            'requester_name': self.requester.full_name if self.requester else None,
            'target_id': self.target_id,
            'target_type': self.target_type,
            'current_level': self.current_level,
            'status': self.status,
            'current_approver_id': self.current_approver_id,
            'current_approver_name': self.current_approver.full_name if self.current_approver else None,
            'payload': self.payload,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class ApprovalHistoryEntry(db.Model):
    """Audit trail for approval actions - separate from enterprise ApprovalHistory"""
    __tablename__ = 'approval_history_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    approval_request_id = db.Column(db.Integer, db.ForeignKey('approval_requests.id'), nullable=False, index=True)
    level = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(20), nullable=False)  # approve, reject, recommend, forward
    actor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    approval_request = db.relationship('ApprovalRequest', backref='history_entries')
    actor = db.relationship('User', foreign_keys=[actor_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'approval_request_id': self.approval_request_id,
            'level': self.level,
            'action': self.action,
            'actor_id': self.actor_id,
            'actor_name': self.actor.full_name if self.actor else None,
            'actor_role': self.actor.role if self.actor else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }