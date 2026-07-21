"""Seed client data — 7 clients, 1 with a sub-client."""
import sys
sys.path.insert(0, '.')
from app import create_app
from models import db, Client, Project
from datetime import datetime, date

app = create_app()

with app.app_context():
    existing = Client.query.count()
    if existing > 0:
        print(f"Clients table already has {existing} records. Skipping seed.")
        sys.exit(0)

    clients_data = [
        {
            'name': 'Infocus IT Services',
            'client_code': 'ACC6455',
            'gst_number': '07AAACI1234A1Z5',
            'location': 'Delhi',
            'contact_name': 'Rahul Sharma',
            'contact_email': 'rahul@infocus-it.com',
            'contact_phone': '+91 98100 00001',
            'industry': 'IT',
            'status': 'Active',
            'client_type': 'main',
        },
        {
            'name': 'Delhi Metro Rail Corp',
            'client_code': 'ACC6456',
            'gst_number': '07AAAD1234A1Z6',
            'location': 'Delhi',
            'contact_name': 'Amit Verma',
            'contact_email': 'amit@dmrc.org',
            'contact_phone': '+91 98100 00002',
            'industry': 'PSU',
            'status': 'Active',
            'client_type': 'main',
        },
        {
            'name': 'State Bank of India',
            'client_code': 'ACC6457',
            'gst_number': '27AAACS1234A1Z7',
            'location': 'Mumbai',
            'contact_name': 'Priya Patel',
            'contact_email': 'priya@sbi.co.in',
            'contact_phone': '+91 98100 00003',
            'industry': 'BFSI',
            'status': 'Active',
            'client_type': 'main',
        },
        {
            'name': 'NTPC Limited',
            'client_code': 'ACC6458',
            'gst_number': '07AAACN1234A1Z8',
            'location': 'Noida',
            'contact_name': 'Vikram Singh',
            'contact_email': 'vikram@ntpc.co.in',
            'contact_phone': '+91 98100 00004',
            'industry': 'PSU',
            'status': 'Active',
            'client_type': 'main',
        },
        {
            'name': 'Delhi University',
            'client_code': 'ACC6459',
            'gst_number': '',
            'location': 'Delhi',
            'contact_name': 'Prof. Sunita Gupta',
            'contact_email': 'sunita@du.ac.in',
            'contact_phone': '+91 98100 00005',
            'industry': 'Education',
            'status': 'Active',
            'client_type': 'main',
        },
        {
            'name': 'Ministry of Defence',
            'client_code': 'ACC6460',
            'gst_number': '',
            'location': 'New Delhi',
            'contact_name': 'Col. Arjun Mehta',
            'contact_email': 'arjun.mod@gov.in',
            'contact_phone': '+91 98100 00006',
            'industry': 'Defence',
            'status': 'Active',
            'client_type': 'main',
        },
        {
            'name': 'Apollo Hospitals',
            'client_code': 'ACC6461',
            'gst_number': '36AAACA1234A1Z9',
            'location': 'Hyderabad',
            'contact_name': 'Dr. Neha Reddy',
            'contact_email': 'neha@apollohospitals.com',
            'contact_phone': '+91 98100 00007',
            'industry': 'Healthcare',
            'status': 'Inactive',
            'client_type': 'main',
        },
    ]

    created_ids = []
    for data in clients_data:
        c = Client(**data)
        db.session.add(c)
        db.session.flush()
        created_ids.append(c.id)
        print(f"  Created client: {c.name} ({c.client_code})")

    # Add one sub-client under DMRC (first entry)
    parent_id = Client.query.filter_by(name='Delhi Metro Rail Corp').first().id
    sub = Client(
        name='DMRC IT Solutions',
        client_code='ACC6462',
        gst_number='07AAAD1234A1Z6',
        location='Delhi',
        contact_name='Rohit Kumar',
        contact_email='rohit@dmrc-it.org',
        contact_phone='+91 98100 00008',
        industry='IT',
        status='Active',
        client_type='sub',
        parent_client_id=parent_id,
    )
    db.session.add(sub)
    db.session.flush()
    print(f"  Created sub-client: {sub.name} ({sub.client_code}) under {sub.parent.name}")

    # Create a few sample projects linked to clients
    sample_projects = [
        (created_ids[0], 'VAPT Assessment - Q2 2026', 'VAPT'),
        (created_ids[0], 'ISMS Implementation', 'ISMS Implementation'),
        (created_ids[1], 'Network Security Audit', 'IS Audit'),
        (created_ids[1], 'Web Application Pentest', 'VAPT'),
        (created_ids[2], 'Mobile App Security Review', 'VAPT'),
        (created_ids[3], 'Infrastructure Assessment', 'IS Audit'),
        (created_ids[4], 'Security Awareness Training', 'ISMS Implementation'),
    ]
    from models import Project
    proj_count = len(sample_projects)
    for i, (cid, title, svc) in enumerate(sample_projects):
        p = Project(
            proj_id=f'PRJ{7001+i}',
            title=title,
            service_type=svc,
            client_id=cid,
            stage='Created',
            created_by=1,
        )
        db.session.add(p)
    db.session.commit()
    print(f"  Created {proj_count} sample projects linked to clients")
    print("Done.")
