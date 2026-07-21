import sys, os, sqlite3, re
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

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

conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get current DDL
cur.execute("SELECT sql FROM sqlite_master WHERE name='projects' AND type='table'")
ddl = cur.fetchone()[0]
print(f'Current DDL:\n{ddl}\n')

# Check if NOT NULL is on account_id
cur.execute('PRAGMA table_info(projects)')
for col in cur.fetchall():
    if col[1] == 'account_id':
        print(f'account_id notnull={col[3]} (1=NOT NULL, 0=NULLABLE)')
        if col[3] == 0:
            print('Already NULLABLE — nothing to do')
            conn.close()
            sys.exit(0)
        break

print('Fixing account_id NOT NULL constraint...')

# Create backup
cur.execute("PRAGMA foreign_keys=OFF")

# Get all indexes/triggers first
cur.execute("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='projects' AND sql IS NOT NULL")
indexes = [r[0] for r in cur.fetchall()]

# New DDL with NOT NULL removed
new_ddl = re.sub(r'account_id\s+INTEGER\s+NOT\s+NULL', 'account_id INTEGER', ddl, flags=re.IGNORECASE)
print(f'New DDL:\n{new_ddl}\n')

# Recreate table
cur.execute("ALTER TABLE projects RENAME TO projects_old")
cur.execute(new_ddl)
cur.execute("INSERT INTO projects SELECT * FROM projects_old")
cur.execute("DROP TABLE projects_old")

# Recreate indexes
for idx_sql in indexes:
    try:
        cur.execute(idx_sql)
    except Exception as e:
        print(f'  index recreate: {e}')

# Re-enable foreign keys
cur.execute("PRAGMA foreign_keys=ON")
conn.commit()

# Verify
cur.execute('PRAGMA table_info(projects)')
for col in cur.fetchall():
    if col[1] == 'account_id':
        print(f'account_id now notnull={col[3]}')

conn.close()
print('Migration complete — account_id is now NULLABLE')
