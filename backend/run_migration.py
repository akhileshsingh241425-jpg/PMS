import sqlite3
conn = sqlite3.connect('pms_v2.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
table = cur.fetchone()
if table:
    cur.execute('PRAGMA table_info(projects)')
    cols = [c[1] for c in cur.fetchall()]
    print('Existing columns:', cols)
    col_types = {
        'po_in_status': "VARCHAR(30) DEFAULT 'WORK ORDER RECEIVED'",
        'po_acknowledged': 'BOOLEAN DEFAULT 0',
        'po_acknowledged_at': 'DATETIME',
        'po_acknowledgement_sent_to': 'VARCHAR(255)',
    }
    for col, typ in col_types.items():
        if col not in cols:
            cur.execute(f'ALTER TABLE projects ADD COLUMN {col} {typ}')
            print(f'Added column: {col}')
        else:
            print(f'Column already exists: {col}')
    conn.commit()
    print('Migration complete')
else:
    print('Table "projects" does not exist. It will be created on first app run.')
conn.close()
