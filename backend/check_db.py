import sqlite3
conn = sqlite3.connect('pms_v2.db')
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = cur.fetchall()
print('Tables:', [t[0] for t in tables])
if ('projects',) in tables:
    cur.execute('PRAGMA table_info(projects)')
    cols = [c[1] for c in cur.fetchall()]
    print('Projects columns:', cols)
conn.close()
