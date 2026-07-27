import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, User
app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"id={u.id} email={u.email} role={u.role} pw_hash={u.password_hash[:20] if u.password_hash else None}")