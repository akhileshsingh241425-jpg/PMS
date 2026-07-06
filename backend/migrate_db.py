import sqlite3, os

base_dir = os.path.dirname(__file__)
db_path = os.path.join(base_dir, 'instance', 'pms_v2.db')
if not os.path.exists(db_path):
    alt = os.path.join(base_dir, 'pms_v2.db')
    if os.path.exists(alt): db_path = alt
    else: print('DB not found'); exit()

print(f'DB: {db_path}')
conn = sqlite3.connect(db_path)
c = conn.cursor()

MIGRATIONS = {
    'users': [('reporting_manager_id', 'INTEGER REFERENCES users(id)')],
    'leads': [
        ('closed_by', 'INTEGER'), ('approval_status', 'VARCHAR(20)'),
        ('approved_by', 'INTEGER'), ('approved_at', 'DATETIME'),
        ('rejection_reason', 'TEXT'), ('account_created_by', 'INTEGER'),
        ('account_created_at', 'DATETIME'), ('is_readonly', 'BOOLEAN'),
    ],
    'lead_remarks': [
        ('updated_at', 'DATETIME'), ('deleted_at', 'DATETIME'),
    ],
}

for table, cols in MIGRATIONS.items():
    existing = {r[1] for r in c.execute(f'PRAGMA table_info({table})').fetchall()}
    for col, typ in cols:
        if col not in existing:
            c.execute(f'ALTER TABLE {table} ADD COLUMN {col} {typ}')
            print(f'  {table}.{col} added')

tables = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
if 'lead_audit_logs' not in tables:
    c.execute('''CREATE TABLE lead_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER NOT NULL REFERENCES leads(id),
        action VARCHAR(50) NOT NULL, previous_value TEXT, new_value TEXT,
        changed_by INTEGER REFERENCES users(id), changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    print('  lead_audit_logs table created')

if 'notifications' not in tables:
    c.execute('''CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL, message TEXT, module_type VARCHAR(50),
        module_id INTEGER, type VARCHAR(50) DEFAULT 'info', is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    print('  notifications table created')

conn.commit()
conn.close()
print('Migration done')
