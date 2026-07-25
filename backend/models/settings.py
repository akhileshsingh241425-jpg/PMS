from . import db
from datetime import datetime

SETTING_GROUPS = [
    'organisation', 'numbering', 'masters', 'financial',
    'templates', 'workflow', 'notifications', 'users_roles', 'security'
]

class Setting(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    group = db.Column(db.String(50), nullable=False, index=True)
    key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    value = db.Column(db.Text, nullable=False, default='')
    data_type = db.Column(db.String(20), default='string')
    label = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    is_sensitive = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    effective_from = db.Column(db.Date, nullable=True)
    maker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    checker_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    checked_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'group': self.group,
            'key': self.key,
            'value': self.value,
            'data_type': self.data_type,
            'label': self.label,
            'description': self.description,
            'is_sensitive': self.is_sensitive,
            'is_active': self.is_active,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'maker_id': self.maker_id,
            'checker_id': self.checker_id,
            'checked_at': self.checked_at.isoformat() if self.checked_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class SettingVersion(db.Model):
    __tablename__ = 'setting_versions'
    id = db.Column(db.Integer, primary_key=True)
    setting_id = db.Column(db.Integer, db.ForeignKey('settings.id'), nullable=False, index=True)
    old_value = db.Column(db.Text, default='')
    new_value = db.Column(db.Text, default='')
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'setting_id': self.setting_id,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'changed_by': self.changed_by,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
        }


class SettingSuggestion(db.Model):
    __tablename__ = 'setting_suggestions'
    id = db.Column(db.Integer, primary_key=True)
    parameter_name = db.Column(db.String(200), nullable=False)
    module = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    example_values = db.Column(db.Text, default='')
    suggested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='pending')
    admin_remark = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'parameter_name': self.parameter_name,
            'module': self.module,
            'reason': self.reason,
            'example_values': self.example_values,
            'suggested_by': self.suggested_by,
            'status': self.status,
            'admin_remark': self.admin_remark,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
