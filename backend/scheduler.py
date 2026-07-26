from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from models import db, Client, ClientFollowUp, Notification

scheduler = BackgroundScheduler()


def _notify(user_id, title, message, module_type=None, module_id=None):
    n = Notification(user_id=user_id, title=title, message=message,
                     module_type=module_type, module_id=module_id)
    db.session.add(n)


def check_dormant_clients():
    today = datetime.utcnow().date()
    twelve_months_ago = today - timedelta(days=365)
    dormant_candidates = Client.query.filter(
        Client.status == 'ACTIVE',
        Client.last_business_date.isnot(None),
        Client.last_business_date < twelve_months_ago,
    ).all()
    for c in dormant_candidates:
        c.status = 'DORMANT'
        c.status_changed_at = datetime.utcnow()
        _notify(c.account_owner_id or c.created_by,
                f'Client marked Dormant',
                f'{c.name} ({c.client_code}) has been auto-marked DORMANT due to 12+ months inactivity.')
    if dormant_candidates:
        db.session.commit()


def check_overdue_followups():
    today = datetime.utcnow().date()
    overdue = ClientFollowUp.query.filter(
        ClientFollowUp.status == 'PENDING',
        ClientFollowUp.date < today,
    ).order_by(ClientFollowUp.client_id).all()
    for fu in overdue:
        client = Client.query.get(fu.client_id)
        if not client:
            continue
        days_overdue = (today - fu.date).days
        _notify(fu.assigned_to,
                f'Follow-up Overdue ({days_overdue}d)',
                f'{client.name}: "{fu.purpose}" was due {fu.date.isoformat()} ({days_overdue} days overdue).',
                'client', client.id)
        if client.account_owner_id and client.account_owner_id != fu.assigned_to:
            _notify(client.account_owner_id,
                    f'Escalation: Follow-up Overdue ({days_overdue}d)',
                    f'{client.name}: "{fu.purpose}" assigned to {fu.assignee.full_name if fu.assignee else "unknown"} is {days_overdue} days overdue.',
                    'client', client.id)
    if overdue:
        db.session.commit()


def send_daily_digest():
    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)
    pending = ClientFollowUp.query.filter(
        ClientFollowUp.status == 'PENDING',
        ClientFollowUp.date <= tomorrow,
    ).order_by(ClientFollowUp.assigned_to, ClientFollowUp.date).all()

    by_user = {}
    for fu in pending:
        uid = fu.assigned_to
        by_user.setdefault(uid, []).append(fu)

    for uid, fups in by_user.items():
        if not fups:
            continue
        due_today = [f for f in fups if f.date == today]
        due_tomorrow = [f for f in fups if f.date == tomorrow]
        overdue = [f for f in fups if f.date < today]
        lines = []
        if overdue:
            lines.append(f'Overdue ({len(overdue)}):')
            for f in overdue[:5]:
                c = Client.query.get(f.client_id)
                lines.append(f'  - {c.name if c else "?"}: {f.purpose} (due {f.date})')
        if due_today:
            lines.append(f'Due Today ({len(due_today)}):')
            for f in due_today[:5]:
                c = Client.query.get(f.client_id)
                lines.append(f'  - {c.name if c else "?"}: {f.purpose}')
        if due_tomorrow:
            lines.append(f'Due Tomorrow ({len(due_tomorrow)}):')
            for f in due_tomorrow[:5]:
                c = Client.query.get(f.client_id)
                lines.append(f'  - {c.name if c else "?"}: {f.purpose}')
        if lines:
            _notify(uid, f'Follow-up Digest ({len(fups)} pending)',
                    '\n'.join(lines), 'client', None)
    if by_user:
        db.session.commit()


def init_scheduler(app):
    with app.app_context():
        if scheduler.running:
            return
        scheduler.add_job(check_dormant_clients, 'cron', hour=2, minute=0, id='check_dormant')
        scheduler.add_job(check_overdue_followups, 'cron', hour=8, minute=0, id='check_overdue_followups')
        scheduler.add_job(send_daily_digest, 'cron', hour=7, minute=30, id='send_daily_digest')
        scheduler.start()
