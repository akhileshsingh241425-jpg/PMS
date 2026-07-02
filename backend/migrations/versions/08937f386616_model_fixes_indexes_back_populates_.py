"""model fixes: indexes, back_populates, stage validation

Revision ID: 08937f386616
Revises: c77d7ea483dc
Create Date: 2026-07-03 00:58:00.683441

"""
from alembic import op
import sqlalchemy as sa


revision = '08937f386616'
down_revision = 'c77d7ea483dc'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('accounts') as b:
        b.create_index('ix_accounts_created_by', ['created_by'])
    with op.batch_alter_table('client_uploads') as b:
        b.create_index('ix_client_uploads_account_id', ['account_id'])
        b.create_index('ix_client_uploads_project_id', ['project_id'])
        b.create_index('ix_client_uploads_uploaded_by', ['uploaded_by'])
    with op.batch_alter_table('client_users') as b:
        b.create_index('ix_client_users_account_id', ['account_id'])
    with op.batch_alter_table('document_revision_requests') as b:
        b.create_index('ix_document_revision_requests_account_id', ['account_id'])
        b.create_index('ix_document_revision_requests_document_id', ['document_id'])
        b.create_index('ix_document_revision_requests_requested_by', ['requested_by'])
    with op.batch_alter_table('finding_queries') as b:
        b.create_index('ix_finding_queries_account_id', ['account_id'])
        b.create_index('ix_finding_queries_document_id', ['document_id'])
        b.create_index('ix_finding_queries_project_id', ['project_id'])
        b.create_index('ix_finding_queries_raised_by', ['raised_by'])
        b.create_index('ix_finding_queries_responded_by', ['responded_by'])
    with op.batch_alter_table('leads') as b:
        b.create_index('ix_leads_account_id', ['account_id'])
        b.create_index('ix_leads_assigned_to', ['assigned_to'])
        b.create_index('ix_leads_opportunity_id', ['opportunity_id'])
        b.create_index('ix_leads_stage', ['stage'])
    with op.batch_alter_table('meeting_requests') as b:
        b.create_index('ix_meeting_requests_account_id', ['account_id'])
        b.create_index('ix_meeting_requests_project_id', ['project_id'])
        b.create_index('ix_meeting_requests_requested_by', ['requested_by'])
    with op.batch_alter_table('meetings') as b:
        b.create_index('ix_meetings_created_by', ['created_by'])
        b.create_index('ix_meetings_module_id', ['module_id'])
        b.create_index('ix_meetings_module_type', ['module_type'])
    with op.batch_alter_table('notes') as b:
        b.create_index('ix_notes_module_id', ['module_id'])
        b.create_index('ix_notes_module_type', ['module_type'])
    with op.batch_alter_table('notifications') as b:
        b.create_index('ix_notifications_module_id', ['module_id'])
        b.create_index('ix_notifications_module_type', ['module_type'])
        b.create_index('ix_notifications_user_id', ['user_id'])
    with op.batch_alter_table('opportunities') as b:
        b.create_index('ix_opportunities_account_id', ['account_id'])
        b.create_index('ix_opportunities_assigned_to', ['assigned_to'])
        b.create_index('ix_opportunities_stage', ['stage'])
    with op.batch_alter_table('project_team') as b:
        b.create_index('ix_project_team_user_id', ['user_id'])
    with op.batch_alter_table('projects') as b:
        b.create_index('ix_projects_account_id', ['account_id'])
        b.create_index('ix_projects_lead_id', ['lead_id'])
        b.create_index('ix_projects_pm_id', ['pm_id'])
        b.create_index('ix_projects_stage', ['stage'])
    with op.batch_alter_table('reminders') as b:
        b.create_index('ix_reminders_module_id', ['module_id'])
        b.create_index('ix_reminders_module_type', ['module_type'])
        b.create_index('ix_reminders_remind_to', ['remind_to'])
    with op.batch_alter_table('tasks') as b:
        b.create_index('ix_tasks_assigned_to', ['assigned_to'])
        b.create_index('ix_tasks_module_id', ['module_id'])
        b.create_index('ix_tasks_module_type', ['module_type'])
    with op.batch_alter_table('user_permissions') as b:
        b.create_index('ix_user_permissions_user_id', ['user_id'])
    with op.batch_alter_table('users') as b:
        b.create_index('ix_users_manager_id', ['manager_id'])


def downgrade():
    with op.batch_alter_table('users') as b:
        b.drop_index('ix_users_manager_id')
    with op.batch_alter_table('user_permissions') as b:
        b.drop_index('ix_user_permissions_user_id')
    with op.batch_alter_table('tasks') as b:
        b.drop_index('ix_tasks_module_type')
        b.drop_index('ix_tasks_module_id')
        b.drop_index('ix_tasks_assigned_to')
    with op.batch_alter_table('reminders') as b:
        b.drop_index('ix_reminders_remind_to')
        b.drop_index('ix_reminders_module_type')
        b.drop_index('ix_reminders_module_id')
    with op.batch_alter_table('projects') as b:
        b.drop_index('ix_projects_stage')
        b.drop_index('ix_projects_pm_id')
        b.drop_index('ix_projects_lead_id')
        b.drop_index('ix_projects_account_id')
    with op.batch_alter_table('project_team') as b:
        b.drop_index('ix_project_team_user_id')
    with op.batch_alter_table('opportunities') as b:
        b.drop_index('ix_opportunities_stage')
        b.drop_index('ix_opportunities_assigned_to')
        b.drop_index('ix_opportunities_account_id')
    with op.batch_alter_table('notifications') as b:
        b.drop_index('ix_notifications_user_id')
        b.drop_index('ix_notifications_module_type')
        b.drop_index('ix_notifications_module_id')
    with op.batch_alter_table('notes') as b:
        b.drop_index('ix_notes_module_type')
        b.drop_index('ix_notes_module_id')
    with op.batch_alter_table('meetings') as b:
        b.drop_index('ix_meetings_module_type')
        b.drop_index('ix_meetings_module_id')
        b.drop_index('ix_meetings_created_by')
    with op.batch_alter_table('meeting_requests') as b:
        b.drop_index('ix_meeting_requests_requested_by')
        b.drop_index('ix_meeting_requests_project_id')
        b.drop_index('ix_meeting_requests_account_id')
    with op.batch_alter_table('leads') as b:
        b.drop_index('ix_leads_stage')
        b.drop_index('ix_leads_opportunity_id')
        b.drop_index('ix_leads_assigned_to')
        b.drop_index('ix_leads_account_id')
    with op.batch_alter_table('finding_queries') as b:
        b.drop_index('ix_finding_queries_responded_by')
        b.drop_index('ix_finding_queries_raised_by')
        b.drop_index('ix_finding_queries_project_id')
        b.drop_index('ix_finding_queries_document_id')
        b.drop_index('ix_finding_queries_account_id')
    with op.batch_alter_table('document_revision_requests') as b:
        b.drop_index('ix_document_revision_requests_requested_by')
        b.drop_index('ix_document_revision_requests_document_id')
        b.drop_index('ix_document_revision_requests_account_id')
    with op.batch_alter_table('client_users') as b:
        b.drop_index('ix_client_users_account_id')
    with op.batch_alter_table('client_uploads') as b:
        b.drop_index('ix_client_uploads_uploaded_by')
        b.drop_index('ix_client_uploads_project_id')
        b.drop_index('ix_client_uploads_account_id')
    with op.batch_alter_table('accounts') as b:
        b.drop_index('ix_accounts_created_by')
