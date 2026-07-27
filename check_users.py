import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"id={u.id} email={u.email} role={u.role} manager={u.reporting_manager_id}")