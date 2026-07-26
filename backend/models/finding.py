from . import db
from datetime import datetime

FINDING_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
FINDING_STATUSES = ['Open', 'Submitted', 'Fix Pending', 'Retested-Closed', 'Retested-Open']
FINDING_TYPES = ['NC Major', 'NC Minor', 'Observation', 'OFI']


class Finding(db.Model):
    __tablename__ = 'findings'
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False, index=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    phase_id = db.Column(db.Integer, db.ForeignKey('project_phases.id', ondelete='SET NULL'), index=True)
    title = db.Column(db.String(255), nullable=False)
    severity = db.Column(db.String(20), default='MEDIUM')
    cvss_score = db.Column(db.Float)
    affected_asset = db.Column(db.String(500))
    finding_type = db.Column(db.String(20))
    clause_ref = db.Column(db.String(100))
    asset_id = db.Column(db.Integer, db.ForeignKey('project_assets.id', ondelete='SET NULL'), index=True)
    description = db.Column(db.Text)
    impact = db.Column(db.Text)
    poc_data = db.Column(db.JSON)
    recommendation = db.Column(db.Text)
    cwe_ref = db.Column(db.String(50))
    status = db.Column(db.String(30), default='Open')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = db.relationship('Task', foreign_keys=[task_id])
    project = db.relationship('Project', foreign_keys=[project_id])
    phase = db.relationship('ProjectPhase', foreign_keys=[phase_id])
    creator = db.relationship('User', foreign_keys=[created_by])
    asset = db.relationship('ProjectAsset', foreign_keys=[asset_id])

    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'project_id': self.project_id,
            'project_name': self.project.title if self.project else None,
            'phase_id': self.phase_id,
            'phase_name': self.phase.name if self.phase else None,
            'title': self.title,
            'severity': self.severity,
            'cvss_score': self.cvss_score,
            'affected_asset': self.affected_asset,
            'finding_type': self.finding_type,
            'clause_ref': self.clause_ref,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'description': self.description,
            'impact': self.impact,
            'poc_data': self.poc_data,
            'recommendation': self.recommendation,
            'cwe_ref': self.cwe_ref,
            'status': self.status,
            'created_by_name': self.creator.full_name if self.creator else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
