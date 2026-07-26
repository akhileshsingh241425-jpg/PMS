from . import db
from datetime import datetime


class TaskActivity(db.Model):
    __tablename__ = 'task_activities'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), index=True)
    action = db.Column(db.String(50), nullable=False)
    old_value = db.Column(db.String(100))
    new_value = db.Column(db.String(100))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])
    task = db.relationship('Task', foreign_keys=[task_id])

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'user_name': self.user.full_name if self.user else None,
            'action': self.action,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
