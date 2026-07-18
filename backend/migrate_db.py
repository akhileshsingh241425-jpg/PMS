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
    'users': [
        ('reporting_manager_id', 'INTEGER REFERENCES users(id)'),
        ('certifications', 'TEXT'),
        ('experience_years', 'FLOAT'),
    ],
    'leads': [
        ('closed_by', 'INTEGER'), ('approval_status', 'VARCHAR(20)'),
        ('approved_by', 'INTEGER'), ('approved_at', 'DATETIME'),
        ('rejection_reason', 'TEXT'), ('account_created_by', 'INTEGER'),
        ('account_created_at', 'DATETIME'), ('is_readonly', 'BOOLEAN'),
        ('referral_opportunity_id', 'INTEGER'),
        ('referring_account_id', 'INTEGER'),
        ('referral_date', 'DATETIME'),
    ],
    'lead_remarks': [
        ('updated_at', 'DATETIME'), ('deleted_at', 'DATETIME'),
    ],
    'tasks': [
        ('estimated_hours', 'FLOAT'),
        ('actual_hours', 'FLOAT'),
        ('updated_at', 'DATETIME'),
    ],
    'opportunities': [
        ('probability', 'INTEGER'),
        ('expected_close_date', 'DATE'),
        ('loss_reason', 'TEXT'),
        ('referral_status', 'VARCHAR(30)'),
        ('referral_notes', 'TEXT'),
        ('location', 'VARCHAR(255)'),
        ('product_interest', 'VARCHAR(255)'),
        ('referral_lead_id', 'INTEGER'),
    ],
    'accounts': [
        ('acquisition_source', 'VARCHAR(50)'),
        ('referred_by_account_id', 'INTEGER'),
        ('referral_opportunity_id', 'INTEGER'),
        ('converted_lead_id', 'INTEGER'),
        ('conversion_date', 'DATETIME'),
    ],
    'lead_proposals': [
        ('html_content', 'TEXT'),
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

if 'lead_proposals' not in tables:
    c.execute('''CREATE TABLE lead_proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT, proposal_no VARCHAR(20) UNIQUE NOT NULL,
        lead_id INTEGER NOT NULL REFERENCES leads(id), version INTEGER DEFAULT 1,
        amount FLOAT, prepared_by INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'Draft', notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    print('  lead_proposals table created')

if 'project_reports' not in tables:
    c.execute('''CREATE TABLE project_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id),
        report_type VARCHAR(20) NOT NULL, title VARCHAR(255) NOT NULL, description TEXT,
        file_name VARCHAR(255) NOT NULL, file_path VARCHAR(500) NOT NULL, version INTEGER DEFAULT 1,
        uploaded_by INTEGER REFERENCES users(id), uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    print('  project_reports table created')

if 'teams' not in tables:
    c.execute('''CREATE TABLE teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(100) NOT NULL,
        description TEXT, leader_id INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    print('  teams table created')

if 'team_members' not in tables:
    c.execute('''CREATE TABLE team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT, team_id INTEGER NOT NULL REFERENCES teams(id),
        user_id INTEGER NOT NULL REFERENCES users(id), created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
    )''')
    print('  team_members table created')

if 'referral_status_log' not in tables:
    c.execute('''CREATE TABLE referral_status_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
        from_status VARCHAR(30), to_status VARCHAR(30) NOT NULL,
        changed_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )''')
    print('  referral_status_log table created')

conn.commit()
conn.close()
print('Migration done')
