import sys
import os
sys.path.insert(0, '/var/www/pms-dev/backend')

from app import create_app
from models import db, ProjectStageTemplate, PROJECT_TYPES, PROJECT_STAGES

app = create_app()
with app.app_context():
    created = 0
    for pt in PROJECT_TYPES:
        existing = ProjectStageTemplate.query.filter_by(project_type=pt).first()
        if not existing:
            for i, stage in enumerate(PROJECT_STAGES):
                t = ProjectStageTemplate(project_type=pt, name=stage, order=i)
                db.session.add(t)
                created += 1
    db.session.commit()
    print("Created {} stage templates".format(created))