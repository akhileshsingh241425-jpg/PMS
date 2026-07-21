import sys, os, sqlite3, re
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

# List all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]
print(f'Tables: {tables}')

# Check projects table schema
cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND LOWER(name)='projects'")
row = cur.fetchone()
if not row:
    print('ERROR: projects table not found in sqlite_master!')
    # Try without lower
    cur.execute("SELECT sql FROM sqlite_master WHERE name='projects' AND type='table'")
    row2 = cur.fetchone()
    if row2:
        print('Found with exact name match')
    else:
        cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table'")
        for r in cur.fetchall():
            print(f'  {r[0]}: {r[1][:80]}...')
    conn.close()
    sys.exit(1)

ddl = row[0]
print(f'DDL: {ddl[:200]}...')

# Check constraint
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

cur.execute("PRAGMA foreign_keys=OFF")

# Save indexes
cur.execute("SELECT sql FROM sqlite_master WHERE type='index' AND LOWER(tbl_name)='projects' AND sql IS NOT NULL")
indexes = [r[0] for r in cur.fetchall()]
# Save triggers
cur.execute("SELECT sql FROM sqlite_master WHERE type='trigger' AND LOWER(tbl_name)='projects' AND sql IS NOT NULL")
triggers = [r[0] for r in cur.fetchall()]
print(f'Indexes: {len(indexes)}, Triggers: {len(triggers)}')

# New DDL
new_ddl = re.sub(r'account_id\s+INTEGER\s+NOT\s+NULL', 'account_id INTEGER', ddl)
if new_ddl == ddl:
    print('WARNING: DDL not changed. Trying different regex...')
    new_ddl = re.sub(r'account_id\s+INTEGER\s+NOT\s+NULL', 'account_id INTEGER', ddl, flags=re.IGNORECASE)

print(f'Old: {ddl[:200]}...')
print(f'New: {new_ddl[:200]}...')

cur.execute(f"ALTER TABLE projects RENAME TO projects_old")
cur.execute(new_ddl)
cur.execute("INSERT INTO projects SELECT * FROM projects_old")
cur.execute("DROP TABLE projects_old")

for idx_sql in indexes:
    try:
        cur.execute(idx_sql)
    except Exception as e:
        print(f'  index: {e}')
for trig_sql in triggers:
    try:
        cur.execute(trig_sql)
    except Exception as e:
        print(f'  trigger: {e}')
print('  + indexes/triggers restored')

cur.execute("PRAGMA foreign_keys=ON")
conn.commit()

# Verify
cur.execute('PRAGMA table_info(projects)')
for col in cur.fetchall():
    if col[1] == 'account_id':
        print(f'account_id now notnull={col[3]}')

conn.close()
print('Migration complete — account_id is now NULLABLE')
