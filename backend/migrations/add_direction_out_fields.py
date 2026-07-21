import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    for col, typ in [
        ('direction', "VARCHAR(10) DEFAULT 'IN'"),
        ('vendor_name', 'VARCHAR(255)'),
        ('po_template', 'VARCHAR(100)'),
        ('approval_status', "VARCHAR(30) DEFAULT 'Pending'"),
        ('send_method', 'VARCHAR(30)'),
        ('advance_paid', 'FLOAT DEFAULT 0'),
        ('balance_outstanding', 'FLOAT DEFAULT 0'),
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE projects ADD COLUMN {col} {typ}"))
            print(f'+ projects.{col}')
        except Exception as e:
            print(f'  projects.{col}: {e}')

    db.session.commit()
    print('Migration complete — added direction and PO Out fields')
