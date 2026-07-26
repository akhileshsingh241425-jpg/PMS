import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    db.create_all()

    for col, typ in [
        ('business_type', 'VARCHAR(10)'),
        ('client_category', 'VARCHAR(50)'),
        ('vendor_category', 'VARCHAR(50)'),
        ('gst_unregistered', 'BOOLEAN DEFAULT FALSE'),
        ('registered_address', 'TEXT'),
        ('state', 'VARCHAR(50)'),
        ('state_code', 'VARCHAR(10)'),
        ('website', 'VARCHAR(255)'),
        ('cin_number', 'VARCHAR(50)'),
        ('nda_file_path', 'VARCHAR(500)'),
        ('nda_validity', 'DATE'),
        ('payment_terms', 'VARCHAR(100)'),
        ('credit_limit', 'FLOAT'),
        ('bank_cheque_path', 'VARCHAR(500)'),
        ('reference_source', 'VARCHAR(50)'),
        ('referring_client_id', 'INTEGER'),
        ('account_owner_id', 'INTEGER'),
        ('first_follow_up_date', 'DATE'),
        ('onboarding_remarks', 'TEXT'),
        ('blacklist_reason', 'TEXT'),
        ('business_value', 'FLOAT DEFAULT 0'),
        ('last_business_date', 'DATE'),
    ]:
        try:
            db.session.execute(text(f'ALTER TABLE clients ADD COLUMN {col} {typ}'))
            print(f'+ clients.{col}')
        except Exception as e:
            print(f'  clients.{col}: {e}')

    db.session.commit()
    print('Migration complete — Client Module Phase 1 (extended model + new tables)')
