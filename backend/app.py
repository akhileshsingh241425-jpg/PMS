import os
import traceback
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from models import db, bcrypt
from email_utils import init_mail


def create_app():
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    app.config.from_object(Config)

    db.init_app(app)
    Migrate(app, db)
    bcrypt.init_app(app)
    init_mail(app)
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
        app.logger.error('500 error: %s', traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

    from routes import auth_bp, account_bp, project_bp, activity_bp, portal_bp, queries_bp, dash_bp, meeting_req_bp, notif_bp, leads_bp, opp_bp, contact_bp, enterprise_bp, admin_bp, search_bp, team_bp, me_bp, employee_bp, pm_bp, vuln_bp, attendance_bp, backlog_bp, client_bp, email_bp
    from routes.push_routes import push_bp
    from routes.chat import chat_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(activity_bp)
    app.register_blueprint(portal_bp)
    app.register_blueprint(queries_bp)
    app.register_blueprint(dash_bp)
    app.register_blueprint(meeting_req_bp)
    app.register_blueprint(notif_bp)
    app.register_blueprint(leads_bp)
    app.register_blueprint(opp_bp)
    app.register_blueprint(contact_bp)
    app.register_blueprint(enterprise_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(team_bp)
    app.register_blueprint(me_bp)
    app.register_blueprint(employee_bp)
    app.register_blueprint(pm_bp)
    app.register_blueprint(vuln_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(backlog_bp)
    app.register_blueprint(push_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(email_bp)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        file_path = os.path.join(frontend_dir, path)
        if os.path.isfile(file_path):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, 'index.html')

    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    import os
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    port = int(os.environ.get('PORT', 5002))
    host = os.environ.get('HOST', '0.0.0.0')
    app = create_app()
    app.run(debug=debug, host=host, port=port)
