import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import app
from models import db

with app.app_context():
    from sqlalchemy import text
    try:
        db.session.execute(text("ALTER TABLE attendance ADD COLUMN face_image_path VARCHAR(500)"))
        print('+ attendance.face_image_path')
    except Exception as e:
        print(f'  attendance.face_image_path: {e}')
    try:
        db.session.execute(text("ALTER TABLE attendance ADD COLUMN face_verified BOOLEAN DEFAULT FALSE"))
        print('+ attendance.face_verified')
    except Exception as e:
        print(f'  attendance.face_verified: {e}')
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN face_registration_path VARCHAR(500)"))
        print('+ users.face_registration_path')
    except Exception as e:
        print(f'  users.face_registration_path: {e}')
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN face_registered_at TIMESTAMP"))
        print('+ users.face_registered_at')
    except Exception as e:
        print(f'  users.face_registered_at: {e}')
    db.session.commit()
    print('Migration complete')
