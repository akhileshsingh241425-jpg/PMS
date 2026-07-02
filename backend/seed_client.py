"""Create client portal user for IFCI."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, ClientUser, Account

app = create_app()
with app.app_context():
    # Get IFCI account
    acc = Account.query.filter_by(company_name='IFCI Limited').first()
    if not acc:
        print("ERROR: IFCI account not found. Run seed_data.py first.")
        exit(1)

    # Check if client user exists
    existing = ClientUser.query.filter_by(email='vivek@ifci.com').first()
    if existing:
        print(f"Client user already exists: {existing.email}")
    else:
        client = ClientUser(
            email='vivek@ifci.com',
            name='Vivek Gupta',
            phone='9811111001',
            company_name='IFCI Limited',
            account_id=acc.id,
        )
        client.set_password('client123')
        db.session.add(client)
        db.session.commit()
        print(f"Client user created!")

    print("\n===== CLIENT PORTAL LOGIN =====")
    print(f"URL: http://localhost:5174/client-login")
    print(f"Email: vivek@ifci.com")
    print(f"Password: client123")
    print(f"Company: IFCI Limited")
    print("================================")
