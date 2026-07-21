from datetime import datetime
from . import db

class Epic(db.Model):
    __tablename__ = 'epics'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    color = db.Column(db.String(20), default='#0052CC')
    status = db.Column(db.String(30), default='in_progress')
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('epics', lazy='dynamic', cascade='all,delete-orphan'))
    issues = db.relationship('Issue', backref='epic', lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        total = self.issues.count()
        done = self.issues.filter_by(status='done').count()
        in_progress = self.issues.filter(Issue.status.in_(['in_progress', 'review'])).count()
        todo = total - done - in_progress
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'color': self.color,
            'status': self.status,
            'order': self.order,
            'issue_count': total,
            'progress': {
                'done': round(done / total * 100) if total else 0,
                'in_progress': round(in_progress / total * 100) if total else 0,
                'todo': round(todo / total * 100) if total else 0,
            },
        }


class Sprint(db.Model):
    __tablename__ = 'sprints'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    goal = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(30), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('sprints', lazy='dynamic', cascade='all,delete-orphan'))
    issues = db.relationship('Issue', backref='sprint', lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        all_issues = self.issues.all()
        status_counts = {'todo': 0, 'in_progress': 0, 'review': 0, 'done': 0}
        for i in all_issues:
            s = i.status or 'todo'
            status_counts[s] = status_counts.get(s, 0) + 1
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'goal': self.goal,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'issue_count': len(all_issues),
            'status_counts': status_counts,
            'issues': [i.to_dict() for i in all_issues],
        }


class Issue(db.Model):
    __tablename__ = 'issues'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False, index=True)
    epic_id = db.Column(db.Integer, db.ForeignKey('epics.id'), nullable=True, index=True)
    sprint_id = db.Column(db.Integer, db.ForeignKey('sprints.id'), nullable=True, index=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('issues.id'), nullable=True)
    key = db.Column(db.String(50), nullable=False, unique=True, index=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(30), default='task')
    label = db.Column(db.String(100), nullable=True)
    priority = db.Column(db.String(20), default='medium')
    status = db.Column(db.String(30), default='todo')
    story_points = db.Column(db.Integer, nullable=True)
    assignee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = db.relationship('Project', backref=db.backref('issues', lazy='dynamic', cascade='all,delete-orphan'))
    assignee = db.relationship('User', foreign_keys=[assignee_id], backref=db.backref('assigned_issues', lazy='dynamic'))
    reporter = db.relationship('User', foreign_keys=[reporter_id], backref=db.backref('reported_issues', lazy='dynamic'))
    children = db.relationship('Issue', backref=db.backref('parent', remote_side=[id]), lazy='dynamic', cascade='all,delete-orphan')

    def to_dict(self):
        assignee = self.assignee
        reporter = self.reporter
        return {
            'id': self.id,
            'project_id': self.project_id,
            'epic_id': self.epic_id,
            'sprint_id': self.sprint_id,
            'parent_id': self.parent_id,
            'key': self.key,
            'title': self.title,
            'description': self.description,
            'type': self.type,
            'label': self.label,
            'priority': self.priority,
            'status': self.status,
            'story_points': self.story_points,
            'assignee': {
                'id': assignee.id,
                'name': f'{assignee.first_name} {assignee.last_name or ""}'.strip(),
                'email': assignee.email,
                'avatar_url': None,
            } if assignee else None,
            'reporter': {
                'id': reporter.id,
                'name': f'{reporter.first_name} {reporter.last_name or ""}'.strip(),
            } if reporter else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
