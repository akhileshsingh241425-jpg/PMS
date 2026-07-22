import sys; sys.path.insert(0, 'backend')
from app import create_app
from models import db
from sqlalchemy import inspect, text

app = create_app()
with app.app_context():
    engine = db.engine
    inspector = inspect(engine)

    # Add new columns to email_messages
    cols = [c['name'] for c in inspector.get_columns('email_messages')]
    additions = [
        ('company', 'VARCHAR(255)'),
        ('priority', 'VARCHAR(20) DEFAULT "Medium"'),
        ('status', 'VARCHAR(30) DEFAULT "New"'),
        ('tags', 'TEXT'),
        ('snooze_at', 'DATETIME'),
    ]
    for name, dtype in additions:
        if name not in cols:
            with engine.connect() as conn:
                conn.execute(text(f'ALTER TABLE email_messages ADD COLUMN {name} {dtype}'))
                conn.commit()
            print(f'Added column: {name}')

    # Create new tables
    new_tables = ['email_activities', 'email_notes', 'email_auto_rules']
    existing = inspector.get_table_names()
    for t in new_tables:
        if t not in existing:
            db.create_all()
            print(f'Created table: {t}')
            break

    print('Migration complete')
