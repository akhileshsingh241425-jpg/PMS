"""Seed backlog demo data — epics, sprints, issues for first 2 projects."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, Project, Epic, Sprint, Issue, User
from datetime import date, timedelta

app = create_app()

with app.app_context():
    projects = Project.query.limit(2).all()
    if not projects:
        print("No projects found. Run seed_data.py first.")
        sys.exit(1)

    users = User.query.filter_by(is_active=True).all()
    if not users:
        print("No users found.")
        sys.exit(1)

    for project in projects:
        prefix = project.proj_id.split('-')[0][:6].upper()
        existing = Issue.query.filter(Issue.key.like(f'{prefix}-%')).count()
        if existing > 0:
            print(f"  Already seeded for {project.title} ({project.proj_id}), skipping.")
            continue

        print(f"Seeding {project.title}...")

        # Epics
        epics_data = [
            ('Authentication & Authorization', '#0052CC'),
            ('Dashboard & Reporting', '#36B37E'),
            ('API Integration Layer', '#9747FF'),
        ]
        epics = []
        for i, (name, color) in enumerate(epics_data):
            e = Epic(project_id=project.id, name=name, color=color, order=i)
            db.session.add(e)
            epics.append(e)
        db.session.flush()

        # Sprints
        today = date.today()
        sprint = Sprint(
            project_id=project.id, name='Sprint 1',
            goal='Complete core functionality',
            start_date=today - timedelta(days=14),
            end_date=today + timedelta(days=14),
            status='active',
        )
        db.session.add(sprint)
        db.session.flush()

        # Issues for sprint
        sprint_issues = [
            ('Story', 'User login with email/password', 'story', 'ACCOUNTS', 'high', epics[0].id, 'in_progress', users[0].id if len(users) > 0 else None),
            ('Bug', 'Fix 401 error on token expiry', 'bug', 'SECURITY', 'highest', epics[0].id, 'todo', users[-1].id if len(users) > 1 else None),
            ('Task', 'Design dashboard wireframes', 'task', 'FEEDBACK', 'medium', epics[1].id, 'done', None),
            ('Story', 'Real-time statistics cards', 'story', 'BILLING', 'high', epics[1].id, 'in_progress', users[0].id if len(users) > 0 else None),
            ('Sub-task', 'Implement chart component', 'subtask', 'PERFORMANCE', 'medium', epics[1].id, 'todo', None),
            ('Task', 'REST API wrapper for external services', 'task', 'VAPT', 'high', epics[2].id, 'todo', users[-1].id if len(users) > 1 else None),
            ('Bug', 'Rate limiting not working on /api/search', 'bug', 'SECURITY', 'high', epics[2].id, 'review', users[0].id if len(users) > 0 else None),
            ('Story', 'Admin notification preferences', 'story', 'ACCOUNTS', 'low', epics[0].id, 'todo', None),
        ]

        issues = []
        for i, (title_part, title, itype, label, priority, epic_id, status, assignee_id) in enumerate(sprint_issues):
            num = i + 1
            issue = Issue(
                project_id=project.id,
                epic_id=epic_id,
                sprint_id=sprint.id,
                key=f'{prefix}-{num:03d}',
                title=title,
                description=f'As a user, I want to {title.lower()}.',
                type=itype,
                label=label,
                priority=priority,
                status=status,
                assignee_id=assignee_id,
                reporter_id=users[0].id if users else None,
                order=i,
            )
            db.session.add(issue)
            issues.append(issue)

        # Unassigned issues (no sprint)
        unassigned_titles = [
            ('Task', 'Database migration script for v3', 'task', 'DOCUMENTATION', 'medium', epics[2].id),
            ('Story', 'Two-factor authentication', 'story', 'SECURITY', 'high', epics[0].id),
        ]
        for i, (title_part, title, itype, label, priority, epic_id) in enumerate(unassigned_titles):
            num = len(sprint_issues) + i + 1
            issue = Issue(
                project_id=project.id,
                epic_id=epic_id,
                key=f'{prefix}-{num:03d}',
                title=title,
                type=itype,
                label=label,
                priority=priority,
                status='todo',
                reporter_id=users[0].id if users else None,
                order=99 + i,
            )
            db.session.add(issue)

        db.session.commit()
        print(f"  ✓ {len(sprint_issues)} sprint issues + 2 unassigned created")

    print("Done.")
