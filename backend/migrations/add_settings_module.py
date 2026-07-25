"""
Migration: Add settings, setting_versions, setting_suggestions tables
Run: python migrations/add_settings_module.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from app import create_app
from models import db

app = create_app()
with app.app_context():
    from sqlalchemy import inspect, text
    inspector = inspect(db.engine)
    existing = inspector.get_table_names()

    if 'settings' not in existing:
        db.session.execute(text("""
            CREATE TABLE settings (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                `group` VARCHAR(50) NOT NULL,
                `key` VARCHAR(100) NOT NULL UNIQUE,
                value TEXT NOT NULL DEFAULT '',
                data_type VARCHAR(20) DEFAULT 'string',
                label VARCHAR(200) NOT NULL,
                description TEXT DEFAULT '',
                is_sensitive BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                effective_from DATE,
                maker_id INTEGER REFERENCES users(id),
                checker_id INTEGER REFERENCES users(id),
                checked_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """))
        db.session.execute(text("CREATE INDEX idx_settings_group ON settings(`group`)"))
        db.session.execute(text("CREATE INDEX idx_settings_key ON settings(`key`)"))
        print('+ settings')

    if 'setting_versions' not in existing:
        db.session.execute(text("""
            CREATE TABLE setting_versions (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                setting_id INTEGER NOT NULL REFERENCES settings(id),
                old_value TEXT DEFAULT '',
                new_value TEXT DEFAULT '',
                changed_by INTEGER REFERENCES users(id),
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        db.session.execute(text("CREATE INDEX idx_sv_setting ON setting_versions(setting_id)"))
        print('+ setting_versions')

    if 'setting_suggestions' not in existing:
        db.session.execute(text("""
            CREATE TABLE setting_suggestions (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                parameter_name VARCHAR(200) NOT NULL,
                module VARCHAR(100) NOT NULL,
                reason TEXT NOT NULL,
                example_values TEXT DEFAULT '',
                suggested_by INTEGER REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending',
                admin_remark TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print('+ setting_suggestions')

    db.session.commit()
    print('Migration complete')
