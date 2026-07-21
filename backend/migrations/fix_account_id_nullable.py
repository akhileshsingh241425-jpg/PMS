import sys, os, sqlite3
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Find the database file path
from app import create_app
app = create_app()
db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///instance/pms.db')
db_path = db_uri.replace('sqlite:///', '')
if not os.path.isabs(db_path):
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), db_path)
db_path = os.path.normpath(db_path)

print(f'Database: {db_path}')
if not os.path.exists(db_path):
    print(f'Database file not found at {db_path}')
    sys.exit(1)

# Connect directly to SQLite (bypass SQLAlchemy transactions)
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check current schema
cur.execute('PRAGMA table_info(projects)')
columns = cur.fetchall()
account_id_col = None
for col in columns:
    if col[1] == 'account_id':
        account_id_col = col
        break

if account_id_col and account_id_col[3] == 1:  # 1 = NOT NULL
    print('account_id is NOT NULL — fixing...')
    cur.execute('PRAGMA writable_schema=ON')
    cur.execute("""
        UPDATE sqlite_master 
        SET sql = replace(sql, 'account_id INTEGER NOT NULL', 'account_id INTEGER')
        WHERE name = 'projects' AND type = 'table'
    """)
    cur.execute('PRAGMA writable_schema=OFF')
    # Commit and force schema reload by closing connection
    conn.commit()
    conn.close()
    # Reconnect to verify
    conn2 = sqlite3.connect(db_path)
    cur2 = conn2.cursor()
    cur2.execute('PRAGMA table_info(projects)')
    for col in cur2.fetchall():
        if col[1] == 'account_id':
            print(f'account_id nullable={col[3] == 0} (0=NULLABLE)')
    conn2.close()
    print('account_id is now NULLABLE')
else:
    print('account_id already NULLABLE — no change needed')

print('Migration complete')
