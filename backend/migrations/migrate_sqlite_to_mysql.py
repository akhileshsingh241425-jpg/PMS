import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import create_engine, text as sa_text
from sqlalchemy.orm import Session
import json

SQLITE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'pms_v2.db')
MYSQL_URL = os.environ.get('DATABASE_URL', 'mysql+pymysql://pms_user:pms_pass@localhost:3306/pms_v2')

TABLES_ORDER = [
    'users', 'accounts', 'projects', 'project_phases', 'project_documents',
    'project_remark_reactions', 'project_remarks', 'project_reports',
    'project_team', 'project_change_requests', 'project_invoices',
    'project_issues', 'project_milestones', 'project_risks',
    'project_timesheets', 'leads', 'lead_remarks', 'lead_remark_reactions',
    'lead_documents', 'lead_activities', 'lead_notes', 'lead_audit_logs',
    'lead_proposals', 'opportunities', 'opportunity_remarks',
    'opportunity_documents', 'opportunity_activities', 'opportunity_notes',
    'tasks', 'task_checklist_items', 'task_comments', 'meetings',
    'meeting_shares', 'meeting_activities', 'meeting_documents',
    'meeting_request_documents', 'meeting_request_shares',
    'meeting_request_activities', 'meeting_requests', 'notes',
    'notifications', 'contacts', 'teams', 'team_members',
    'attendance', 'device_tokens', 'location_logs', 'chat_messages',
    'vulnerabilities', 'email_templates',
    'client_uploads', 'finding_queries',
    'chat_conversations', 'chat_conversation_participants',
    'chat_messages_new', 'chat_message_status',
    'po_payments', 'approval_history',
    'clients',
]

def migrate():
    sqlite_engine = create_engine(f'sqlite:///{SQLITE_PATH}')
    mysql_engine = create_engine(MYSQL_URL)

    with Session(sqlite_engine) as src_session:
        with Session(mysql_engine) as dst_session:
            for table in TABLES_ORDER:
                try:
                    rows = src_session.execute(sa_text(f'SELECT * FROM {table}')).fetchall()
                    if not rows:
                        print(f'{table}: 0 rows (skipped)')
                        continue
                    columns = rows[0]._fields
                    col_list = ', '.join(columns)
                    placeholders = ', '.join([f':{c}' for c in columns])
                    for row in rows:
                        data = dict(zip(columns, row))
                        data = {k: (v if v is not None else None) for k, v in data.items()}
                        try:
                            dst_session.execute(
                                sa_text(f'INSERT INTO {table} ({col_list}) VALUES ({placeholders})'),
                                data
                            )
                        except Exception as e:
                            if 'Duplicate' in str(e):
                                pass
                            else:
                                print(f'{table}: insert error: {e}')
                    dst_session.commit()
                    print(f'{table}: {len(rows)} rows migrated')
                except Exception as e:
                    dst_session.rollback()
                    print(f'{table}: SKIPPED - {e}')
    print('Migration complete!')

if __name__ == '__main__':
    migrate()