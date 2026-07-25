import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    # new tables
    for tbl, cols in {
        'po_line_items': [
            ('id', 'INTEGER PRIMARY KEY AUTO_INCREMENT'),
            ('po_id', 'INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE'),
            ('item_name', 'VARCHAR(255) NOT NULL'),
            ('sac_hsn', 'VARCHAR(20)'),
            ('qty', 'FLOAT DEFAULT 1'),
            ('rate', 'FLOAT DEFAULT 0'),
            ('taxable_value', 'FLOAT DEFAULT 0'),
            ('gst_rate', 'FLOAT DEFAULT 18'),
            ('created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
        ],
        'tds_records': [
            ('id', 'INTEGER PRIMARY KEY AUTO_INCREMENT'),
            ('po_id', 'INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE'),
            ('payment_id', 'INTEGER REFERENCES po_payments(id) ON DELETE SET NULL'),
            ('section', 'VARCHAR(20) NOT NULL'),
            ('base_amount', 'FLOAT DEFAULT 0'),
            ('tds_percent', 'FLOAT DEFAULT 0'),
            ('tds_amount', 'FLOAT DEFAULT 0'),
            ('form_16a_issued', 'BOOLEAN DEFAULT 0'),
            ('form_16a_issued_at', 'DATETIME'),
            ('quarter', 'VARCHAR(10)'),
            ('financial_year', 'VARCHAR(20)'),
            ('created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
        ],
        'po_versions': [
            ('id', 'INTEGER PRIMARY KEY AUTO_INCREMENT'),
            ('po_id', 'INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE'),
            ('revision_number', 'INTEGER DEFAULT 1'),
            ('pdf_path', 'VARCHAR(500)'),
            ('reason', 'TEXT'),
            ('created_by', 'INTEGER REFERENCES users(id) ON DELETE SET NULL'),
            ('created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP'),
        ],
    }:
        try:
            db.session.execute(text(f'CREATE TABLE IF NOT EXISTS {tbl} ({", ".join(f"{c} {t}" for c, t in cols)})'))
            print(f'+ table {tbl} created')
        except Exception as e:
            print(f'  {tbl}: {e}')

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
        ('po_parent_id', 'INTEGER REFERENCES projects(id)'),
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
    pay_cols = [
        ('tds_section', 'VARCHAR(20)'),
        ('tds_percent', 'FLOAT DEFAULT 0'),
        ('tds_amount', 'FLOAT DEFAULT 0'),
        ('net_paid', 'FLOAT'),
        ('payment_mode', 'VARCHAR(30)'),
        ('utr_no', 'VARCHAR(100)'),
        ('vendor_invoice_no', 'VARCHAR(100)'),
        ('vendor_invoice_date', 'DATE'),
    ]
    for col, typ in pay_cols:
        try:
            db.session.execute(text(f'ALTER TABLE po_payments ADD COLUMN {col} {typ}'))
            print(f'+ po_payments.{col}')
        except Exception as e:
            print(f'  po_payments.{col}: {e}')

    db.session.commit()
    print('Migration complete — Phase 2 PO OUT models and fields')
