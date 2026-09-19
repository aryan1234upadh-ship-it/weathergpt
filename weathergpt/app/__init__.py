import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from .models import db

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///weathergpt.db")
    CORS(app)
    db.init_app(app)

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    with app.app_context():
        db.create_all()
    return app