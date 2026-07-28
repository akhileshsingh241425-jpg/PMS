"""Create one user per role for testing (OTP bypass enabled)"""
from app import create_app
from models import db, User
from datetime import datetime

app = create_app()
with app.app_context():
    users_data = [
        ('superadmin@test.com', 'pass123', 'super_admin', 'Super', 'Admin'),
        ('admin@test.com', 'pass123', 'admin', 'Admin', 'User'),
        ('hr@test.com', 'pass123', 'hr', 'HR', 'Manager'),
        ('finance@test.com', 'pass123', 'finance', 'Finance', 'Manager'),
        ('pm@test.com', 'pass123', 'project_manager', 'Project', 'Manager'),
        ('emp@test.com', 'pass123', 'employee', 'Test', 'Employee'),
    ]

    created = 0
    for email, pw, role, fn, ln in users_data:
        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"  EXISTS {email:35s} -> role={existing.role}")
            continue
        u = User(
            email=email, first_name=fn, last_name=ln,
            role=role, emp_id=f'TEST{role[:3].upper()}',
            is_active=True,
            designation='Test User',
            department='Testing',
            phone='9999999999',
        )
        u.set_password(pw)
        db.session.add(u)
        print(f"  CREATED {email:35s} -> role={role}")
        created += 1

    if created:
        db.session.commit()
        print(f"\nCreated {created} new user(s)")
    else:
        print("\nAll users already exist")