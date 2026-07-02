import os
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from models import db, bcrypt


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

    from routes import auth_bp, account_bp, project_bp, activity_bp, portal_bp, queries_bp, dash_bp, meeting_req_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(project_bp)
    app.register_blueprint(activity_bp)
    app.register_blueprint(portal_bp)
    app.register_blueprint(queries_bp)
    app.register_blueprint(dash_bp)
    app.register_blueprint(meeting_req_bp)

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        return send_from_directory(frontend_dir, 'index.html')

    with app.app_context():
        db.create_all()

    return app
