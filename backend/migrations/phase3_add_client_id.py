import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text
    from sqlalchemy import inspect

    inspector = inspect(db.engine)
    all_cols = {}

    for table in ['users', 'meeting_requests', 'client_uploads', 'finding_queries', 'vulnerabilities']:
        all_cols[table] = [c['name'] for c in inspector.get_columns(table)]

    # Add client_id columns
    changes = [
        ('users', 'client_id', 'INTEGER REFERENCES clients(id)'),
        ('meeting_requests', 'client_id', 'INTEGER REFERENCES clients(id)'),
        ('client_uploads', 'client_id', 'INTEGER REFERENCES clients(id)'),
        ('finding_queries', 'client_id', 'INTEGER REFERENCES clients(id)'),
        ('vulnerabilities', 'client_id', 'INTEGER REFERENCES clients(id)'),
    ]

    for table, col, typ in changes:
        if col not in all_cols[table]:
            try:
                db.session.execute(text(f'ALTER TABLE {table} ADD COLUMN {col} {typ}'))
                print(f'+ {table}.{col}')
            except Exception as e:
                if 'Duplicate column' in str(e):
                    print(f'  {table}.{col} already exists')
                else:
                    print(f'  {table}.{col}: {e}')
        else:
            print(f'  {table}.{col} already exists')

    # Populate client_id using account_id → clients mapping
    mapping = db.session.execute(text('SELECT id, account_id FROM clients WHERE account_id IS NOT NULL')).fetchall()
    mapping_dict = {row[1]: row[0] for row in mapping}
    print(f'\nAccount→Client mapping: {len(mapping_dict)} entries')

    for table in ['users', 'meeting_requests', 'client_uploads', 'finding_queries', 'vulnerabilities']:
        rows = db.session.execute(text(f'SELECT id, account_id FROM {table} WHERE account_id IS NOT NULL AND (client_id IS NULL OR client_id = 0)')).fetchall()
        updated = 0
        for row_id, acc_id in rows:
            if acc_id in mapping_dict:
                db.session.execute(text(f'UPDATE {table} SET client_id = :cid WHERE id = :rid'), {'cid': mapping_dict[acc_id], 'rid': row_id})
                updated += 1
        if updated:
            print(f'  {table}: populated {updated} rows')

    db.session.commit()
    print('\nPhase 3 migration complete — client_id columns added and populated')
