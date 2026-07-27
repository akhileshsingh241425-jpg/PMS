import sys
sys.path.insert(0, "/var/www/pms-dev/backend")
from app import create_app
from models import db, User
app = create_app()
with app.app_context():
    user = User.query.filter_by(email="neha@gmail.com").first()
    user.set_password("pass1234")
    db.session.commit()
    print(f"Password reset for {user.email}")