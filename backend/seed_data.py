"""Seed dummy data — users, accounts, projects."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, User, Account, Project, ProjectRemark, ProjectDocument, ProjectTeam, Task, Meeting, Note
from datetime import datetime, date, timedelta

app = create_app()

with app.app_context():
    # Clear old data
    db.session.execute(db.text("DELETE FROM finding_queries"))
    db.session.execute(db.text("DELETE FROM client_uploads"))
    db.session.execute(db.text("DELETE FROM meeting_requests"))
    db.session.execute(db.text("DELETE FROM notes"))
    db.session.execute(db.text("DELETE FROM meetings"))
    db.session.execute(db.text("DELETE FROM tasks"))
    db.session.execute(db.text("DELETE FROM project_team"))
    db.session.execute(db.text("DELETE FROM project_remarks"))
    db.session.execute(db.text("DELETE FROM project_documents"))
    db.session.execute(db.text("DELETE FROM projects"))
    db.session.execute(db.text("DELETE FROM accounts"))
    db.session.execute(db.text("DELETE FROM users"))
    db.session.commit()

    # USERS — only Jagbir (admin)
    user = User(
        emp_id='ADMIN001', email='jagbir@infocus-it.com',
        first_name='Jagbir', last_name='Singh', phone='9810000001',
        designation='Director', role='admin',
    )
    user.set_password('pass123')
    db.session.add(user)
    db.session.commit()
    print(f"Created user: jagbir@infocus-it.com / pass123 (admin)")
