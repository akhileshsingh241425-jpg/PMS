import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    for col, typ in [
        ('pan_no', 'VARCHAR(20)'),
        ('bank_account_no', 'VARCHAR(50)'),
        ('bank_ifsc', 'VARCHAR(20)'),
        ('msme_status', 'VARCHAR(20)'),
        ('default_tds_section', 'VARCHAR(20)'),
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE clients ADD COLUMN {col} {typ}"))
            print(f'+ clients.{col}')
        except Exception as e:
            print(f'  clients.{col}: {e}')

    db.session.commit()
    print('Migration complete — added vendor fields to clients table')
