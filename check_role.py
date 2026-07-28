from app import create_app
from models import db, User
app = create_app()
with app.app_context():
    for u in User.query.filter(User.role.in_(["admin","super_admin"])).all():
        print(f"ID={u.id} | {u.email:30s} | role={u.role}")