import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    # create new tables via SQLAlchemy
    db.create_all()

    # new columns on projects
    for col, typ in [
        ('vendor_email', 'VARCHAR(255)'),
        ('vendor_gstin', 'VARCHAR(50)'),
        ('vendor_pan', 'VARCHAR(20)'),
        ('vendor_address', 'TEXT'),
        ('vendor_contact_person', 'VARCHAR(255)'),
        ('vendor_phone', 'VARCHAR(20)'),
        ('vendor_bank_account_no', 'VARCHAR(50)'),
        ('vendor_bank_ifsc', 'VARCHAR(20)'),
        ('po_delivery_period', 'TEXT'),
        ('po_expected_completion_date', 'DATE'),
        ('po_special_terms', 'TEXT'),
        ('po_gst_type', 'VARCHAR(20) DEFAULT "CGST+SGST"'),
        ('po_amount_in_words', 'VARCHAR(500)'),
        ('po_revision_number', 'INTEGER DEFAULT 0'),
        ('po_parent_id', 'INTEGER'),
        ('completion_date', 'DATE'),
        ('deliverables_received', 'TEXT'),
        ('acceptance_remarks', 'TEXT'),
        ('vendor_invoice_no', 'VARCHAR(100)'),
        ('vendor_invoice_date', 'DATE'),
    ]:
        try:
            db.session.execute(text(f'ALTER TABLE projects ADD COLUMN {col} {typ}'))
            print(f'+ projects.{col}')
        except Exception as e:
            print(f'  projects.{col}: {e}')

    # new columns on po_payments
    for col, typ in [
        ('tds_section', 'VARCHAR(20)'),
        ('tds_percent', 'FLOAT DEFAULT 0'),
        ('tds_amount', 'FLOAT DEFAULT 0'),
        ('net_paid', 'FLOAT'),
        ('payment_mode', 'VARCHAR(30)'),
        ('utr_no', 'VARCHAR(100)'),
        ('vendor_invoice_no', 'VARCHAR(100)'),
        ('vendor_invoice_date', 'DATE'),
    ]:
        try:
            db.session.execute(text(f'ALTER TABLE po_payments ADD COLUMN {col} {typ}'))
            print(f'+ po_payments.{col}')
        except Exception as e:
            print(f'  po_payments.{col}: {e}')

    db.session.commit()
    print('Migration complete — Phase 2 PO OUT models and fields')
