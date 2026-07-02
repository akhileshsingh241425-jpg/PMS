import os
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from models import db, bcrypt, Role, Department, Permission


def create_app():
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    app.config.from_object(Config)

    db.init_app(app)
    Migrate(app, db)
    bcrypt.init_app(app)
    CORS(app, origins=['*'], supports_credentials=True)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'ok', 'version': '2.0'})

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Not found'}), 404
        return send_from_directory(frontend_dir, 'index.html')

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    from routes import auth_bp, opp_bp, lead_bp, account_bp, project_bp, activity_bp, portal_bp, queries_bp, dash_bp, meeting_req_bp, notif_bp, admin_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(opp_bp)
    app.register_blueprint(lead_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(activity_bp)
    app.register_blueprint(portal_bp)
    app.register_blueprint(queries_bp)
    app.register_blueprint(dash_bp)
    app.register_blueprint(meeting_req_bp)
    app.register_blueprint(notif_bp)
    app.register_blueprint(admin_bp)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        return send_from_directory(frontend_dir, 'index.html')

    with app.app_context():
        db.create_all()
        _seed(app)

    return app


def _seed(app):
    if not Role.query.first():
        roles = [
            Role(name='Super Admin', code='super_admin', description='Full system access'),
            Role(name='Project Lead', code='project_lead', description='Manages projects and team'),
            Role(name='Consultant', code='consultant', description='Auditor / Security consultant'),
            Role(name='BD Executive', code='bd_executive', description='Business development / Sales'),
            Role(name='Employee', code='employee', description='General employee'),
        ]
        db.session.add_all(roles)

    if not Department.query.first():
        depts = [
            Department(name='IT & Security', code='IT'),
            Department(name='Business Development', code='BD'),
            Department(name='Admin & Finance', code='ADMIN'),
        ]
        db.session.add_all(depts)

    if not Permission.query.first():
        perms = [
            Permission(code='dashboard_view', name='View Dashboard', module='dashboard'),
            Permission(code='projects_view', name='View Projects', module='projects'),
            Permission(code='projects_create', name='Create Projects', module='projects'),
            Permission(code='projects_edit', name='Edit Projects', module='projects'),
            Permission(code='leads_view', name='View Leads', module='leads'),
            Permission(code='leads_create', name='Create Leads', module='leads'),
            Permission(code='leads_edit', name='Edit Leads', module='leads'),
            Permission(code='accounts_view', name='View Accounts', module='accounts'),
            Permission(code='accounts_create', name='Create Accounts', module='accounts'),
            Permission(code='accounts_edit', name='Edit Accounts', module='accounts'),
            Permission(code='opportunities_view', name='View Opportunities', module='opportunities'),
            Permission(code='opportunities_create', name='Create Opportunities', module='opportunities'),
            Permission(code='opportunities_edit', name='Edit Opportunities', module='opportunities'),
            Permission(code='users_view', name='View Users', module='users'),
            Permission(code='users_create', name='Create Users', module='users'),
            Permission(code='users_edit', name='Edit Users', module='users'),
        ]
        db.session.add_all(perms)

    db.session.commit()


