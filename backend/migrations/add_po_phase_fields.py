import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()

with app.app_context():
    from sqlalchemy import text

    # === project_phases table ===
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS project_phases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                "order" INTEGER DEFAULT 0,
                status VARCHAR(30) DEFAULT 'Pending'
            )
        """))
        print('+ project_phases table')
    except Exception as e:
        print(f'  project_phases: {e}')

    # === projects columns ===
    for col, typ in [
        ('po_number', 'VARCHAR(100)'),
        ('po_date', 'DATE'),
        ('po_amount', 'FLOAT'),
        ('po_terms', 'TEXT'),
        ('po_document_id', 'INTEGER'),
        ('project_type', 'VARCHAR(50)'),
        ('plan_generated', 'BOOLEAN'),
        ('tds', 'FLOAT'),
        ('gst', 'FLOAT'),
        ('net_amount', 'FLOAT'),
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE projects ADD COLUMN {col} {typ}"))
            print(f'+ projects.{col}')
        except Exception as e:
            print(f'  projects.{col}: {e}')

    # === tasks columns ===
    for col, typ in [
        ('phase_id', 'INTEGER'),
        ('parent_task_id', 'INTEGER'),
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE tasks ADD COLUMN {col} {typ}"))
            print(f'+ tasks.{col}')
        except Exception as e:
            print(f'  tasks.{col}: {e}')

    # === indexes ===
    for tbl, col in [
        ('project_phases', 'project_id'),
        ('tasks', 'phase_id'),
        ('tasks', 'parent_task_id'),
    ]:
        idx_name = f'ix_{tbl}_{col}'
        try:
            db.session.execute(text(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {tbl}({col})"))
            print(f'+ index {idx_name}')
        except Exception as e:
            print(f'  index {idx_name}: {e}')

    db.session.commit()
    print('Migration complete')
