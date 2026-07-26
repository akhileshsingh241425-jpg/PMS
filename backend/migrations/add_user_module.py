import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    db.create_all()

    for col, typ in [
        ('work_mode', 'VARCHAR(20) DEFAULT "Office"'),
        ('day_end_log_submitted', 'BOOLEAN DEFAULT FALSE'),
    ]:
        try:
            db.session.execute(text(f'ALTER TABLE attendance ADD COLUMN {col} {typ}'))
            print(f'+ attendance.{col}')
        except Exception as e:
            print(f'  attendance.{col}: {e}')

    db.session.commit()
    print('Migration complete — User Module Phase 1 (models + fields)')
