from . import db
from datetime import datetime

# ─── PERMISSION DEFINITIONS ────────────────────────────────────────────────
ROLE_PERMISSIONS = {
    'super_admin': [
        'lead.*', 'client.*', 'contact.*', 'opportunity.*', 'project.*',
        'task.*', 'meeting.*', 'document.*', 'remark.*', 'note.*',
        'user.*', 'role.*', 'setting.*', 'report.*', 'audit.*',
        'approve.lead', 'approve.client', 'approve.project_closure',
        'approve.project', 'reject.*', 'restore.*', 'delete.*',
        'export.*', 'import.*', 'system.*',
    ],
    'admin': [
        'lead.create', 'lead.edit', 'lead.view', 'lead.assign', 'lead.close',
        'lead.convert', 'lead.approve',
        'client.view', 'client.create',
        'contact.*',
        'opportunity.create', 'opportunity.edit', 'opportunity.view',
        'meeting.*',
        'report.view',
        'project.view', 'task.*',
        'document.*', 'remark.*', 'note.*',
        'notification.view',
        'approve.lead_conversion',
    ],
    'project_manager': [
        'project.view_assigned', 'project.edit', 'project.close_request',
        'task.create', 'task.edit', 'task.view', 'task.approve',
        'team.assign',
        'milestone.*',
        'meeting.create', 'meeting.view',
        'document.upload', 'document.view',
        'remark.*', 'note.*',
        'client.view_assigned', 'contact.view_assigned',
        'timesheet.*',
        'notification.view',
    ],
    'team_member': [
        'task.view_assigned', 'task.edit_status', 'task.edit',
        'document.upload_work', 'document.view',
        'remark.create', 'remark.view',
        'note.create', 'note.view',
        'timesheet.create', 'timesheet.view',
        'meeting.view',
        'notification.view',
        'project.view_assigned',
    ],
    'client': [
        'project.view', 'project.approve_deliverable',
        'document.download', 'document.upload_client',
        'remark.view_client', 'remark.create_client',
        'meeting.view',
        'invoice.view',
        'support.create',
        'notification.view',
    ],
}


def has_permission(user_role, permission):
    """Check if a role has a specific permission (supports wildcard)."""
    perms = ROLE_PERMISSIONS.get(user_role, [])
    for p in perms:
        if p.endswith('.*'):
            prefix = p[:-2]
            if permission.startswith(prefix):
                return True
        elif p == permission:
            return True
    return False


# ─── AUDIT LOG MODEL ──────────────────────────────────────────────────────
class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    module = db.Column(db.String(50), nullable=False, index=True)
    module_id = db.Column(db.Integer, index=True)
    action = db.Column(db.String(50), nullable=False)
    summary = db.Column(db.String(500))
    details = db.Column(db.Text)
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    action_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    actor = db.relationship('User', foreign_keys=[action_by])

    def to_dict(self):
        return {
            'id': self.id, 'module': self.module, 'module_id': self.module_id,
            'action': self.action, 'summary': self.summary, 'details': self.details,
            'old_value': self.old_value, 'new_value': self.new_value,
            'ip_address': self.ip_address,
            'action_by_name': self.actor.full_name if self.actor else 'System',
            'action_by_role': self.actor.role if self.actor else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

