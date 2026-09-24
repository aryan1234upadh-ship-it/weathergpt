import os
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect
from flask_cors import CORS
from .models import db
from sqlalchemy import inspect

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    database_url = os.getenv("DATABASE_URL", "sqlite:///weathergpt.db")
    # Accept the legacy postgres:// form returned by some hosted databases.
    if database_url.startswith("postgres://"):
        database_url = "postgresql://" + database_url[len("postgres://"):]
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    CORS(app)
    db.init_app(app)

    from .routes import api
    from .auth import auth_bp
    from .chat import chat_bp
    from .alerts import alerts_bp
    app.register_blueprint(api)
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(alerts_bp)
    @app.get("/")
    def home():
        return redirect("/static/index.html")

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    with app.app_context():
        db.create_all()
        # Additive SQLite migration for existing farmer profiles.
        if db.engine.dialect.name == "sqlite":
            with db.engine.begin() as conn:
                additions = {
                    "farmer": (("village", "VARCHAR(100)"), ("postal_code", "VARCHAR(12)"),
                               ("latitude", "FLOAT"), ("longitude", "FLOAT")),
                    "alert_log": (("crop_field_id", "INTEGER"), ("crop_name", "VARCHAR(60)"),
                                  ("crop_area", "FLOAT"), ("crop_area_unit", "VARCHAR(12)"),
                                  ("location", "VARCHAR(255)")),
                }
                for table, fields in additions.items():
                    columns = {column["name"] for column in inspect(db.engine).get_columns(table)}
                    for name, kind in fields:
                        if name not in columns:
                            conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {name} {kind}")
    return app
