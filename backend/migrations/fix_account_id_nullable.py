import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    # Check current schema
    r = db.session.execute(text('PRAGMA table_info(projects)'))
    for row in r:
        if row[1] == 'account_id' and row[3] == 1:  # 1 = NOT NULL
            print('account_id is NOT NULL — fixing...')
            db.session.execute(text("PRAGMA writable_schema=ON"))
            db.session.execute(text("""
                UPDATE sqlite_master 
                SET sql = replace(sql, 'account_id INTEGER NOT NULL', 'account_id INTEGER')
                WHERE name = 'projects'
            """))
            db.session.execute(text("PRAGMA writable_schema=OFF"))
            db.session.execute(text("VACUUM"))
            print('account_id is now NULLABLE')
            break
    else:
        print('account_id already NULLABLE — no change needed')

    db.session.commit()
    print('Migration complete')
