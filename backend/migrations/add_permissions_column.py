from sqlalchemy import text
from models import db

def run():
    try:
        db.session.execute(text("ALTER TABLE users ADD COLUMN permissions_json TEXT"))
        db.session.commit()
        print('+ users.permissions_json')
    except Exception as e:
        db.session.rollback()
        print(f'  users.permissions_json: {e}')
