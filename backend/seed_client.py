"""Create client portal user for IFCI."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, User, Account

app = create_app()
with app.app_context():
    acc = Account.query.filter_by(company_name='IFCI Limited').first()
    if not acc:
        print("ERROR: IFCI account not found. Run seed_data.py first.")
        exit(1)

    existing = User.query.filter_by(email='vivek@ifci.com').first()
    if existing:
        print(f"Client user already exists: {existing.email}")
    else:
        client = User(
            email='vivek@ifci.com',
            first_name='Vivek',
            last_name='Gupta',
            phone='9811111001',
            role='client',
            client_company_name='IFCI Limited',
            account_id=acc.id,
        )
        client.set_password('client123')
        db.session.add(client)
        db.session.commit()
        print(f"Client user created!")

    print(f"\n===== CLIENT PORTAL LOGIN =====")
    print(f"Email: vivek@ifci.com")
    print(f"Password: client123")
    print(f"Company: IFCI Limited")
