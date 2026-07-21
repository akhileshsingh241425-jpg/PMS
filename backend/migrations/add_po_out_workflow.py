import sys, os, sqlite3
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app
app = create_app()
db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///instance/pms.db')
db_path = db_uri.replace('sqlite:///', '')
if not os.path.isabs(db_path):
    db_path = os.path.join(app.instance_path, db_path)
db_path = os.path.normpath(db_path)

print(f'Database: {db_path}')
if not os.path.exists(db_path):
    print(f'Database file not found at {db_path}')
    sys.exit(1)

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# === 1. Project columns ===
for col, typ in [
    ('po_out_status', "VARCHAR(30) DEFAULT 'Draft'"),
    ('po_approver_id', 'INTEGER'),
    ('po_approved_at', 'DATETIME'),
    ('po_rejected_reason', 'TEXT'),
    ('po_resubmitted_at', 'DATETIME'),
    ('po_sent_via', 'VARCHAR(30)'),
    ('po_sent_date', 'DATETIME'),
    ('po_work_started', 'BOOLEAN DEFAULT 0'),
    ('po_work_started_at', 'DATETIME'),
    ('po_work_completed', 'BOOLEAN DEFAULT 0'),
    ('po_work_completed_at', 'DATETIME'),
    ('po_next_due_date', 'DATE'),
]:
    try:
        cur.execute(f"ALTER TABLE projects ADD COLUMN {col} {typ}")
        print(f'+ projects.{col}')
    except Exception as e:
        print(f'  projects.{col}: {e}')

# === 2. po_payments table ===
try:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS po_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            amount FLOAT NOT NULL,
            date DATE NOT NULL,
            mode VARCHAR(50),
            remarks TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print('+ po_payments table')
except Exception as e:
    print(f'  po_payments: {e}')

# === 3. Document verify columns ===
for col, typ in [
    ('is_verified', 'BOOLEAN DEFAULT 0'),
    ('verified_by', 'INTEGER'),
    ('verified_at', 'DATETIME'),
]:
    try:
        cur.execute(f"ALTER TABLE project_documents ADD COLUMN {col} {typ}")
        print(f'+ project_documents.{col}')
    except Exception as e:
        print(f'  project_documents.{col}: {e}')

conn.commit()
conn.close()
print('Migration complete — PO Out workflow columns added')
