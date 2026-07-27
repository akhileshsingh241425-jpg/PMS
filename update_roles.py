import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    # Update 'user' role to 'employee' for all users except admin/super_admin/client
    users = User.query.filter(User.role == 'user').all()
    for u in users:
        u.role = 'employee'
    db.session.commit()
    print(f"Updated {len(users)} users from 'user' to 'employee'")
    
    # Assign project_manager role to some employees
    pm_users = User.query.filter(User.email.in_(['amit@gmail.com', 'priya@gmail.com', 'raj@gmail.com'])).all()
    for u in pm_users:
        u.role = 'project_manager'
    db.session.commit()
    print(f"Assigned project_manager to: {[u.email for u in pm_users]}")
    
    # Create HR user
    hr = User.query.filter_by(email='hr@infocus-it.com').first()
    if not hr:
        hr = User(
            emp_id='HR001',
            email='hr@infocus-it.com',
            first_name='HR',
            last_name='Manager',
            role='hr',
            department='HR',
            is_active=True
        )
        hr.set_password('pass1234')
        db.session.add(hr)
        db.session.commit()
        print(f"Created HR user: hr@infocus-it.com / pass1234")
    
    # Create Finance user
    fin = User.query.filter_by(email='finance@infocus-it.com').first()
    if not fin:
        fin = User(
            emp_id='FIN001',
            email='finance@infocus-it.com',
            first_name='Finance',
            last_name='Manager',
            role='finance',
            department='Finance',
            is_active=True
        )
        fin.set_password('pass1234')
        db.session.add(fin)
        db.session.commit()
        print(f"Created Finance user: finance@infocus-it.com / pass1234")
    
    # Show all users
    users = User.query.all()
    for u in users:
        print(f"id={u.id} email={u.email} role={u.role} dept={u.department}")