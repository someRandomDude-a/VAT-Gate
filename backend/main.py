from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

from db import db, User, SessionToken, Node

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


# ------------------------
# Helpers / Middleware
# ------------------------

def require_auth():
    """
    Validate auth token from headers.
    Expected header: Authorization: Bearer <token>
    Returns user_id on successful authentication
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "", 1)
    session = SessionToken.query.filter_by(token=token).first()

    if not session:
        return None

    return session.user_id


# ------------------------
# Auth API
# ------------------------

def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

@app.route("/api/login", methods=["POST"])
def login():
    username = request.json.get("username")
    password = request.json.get("password")

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "No such user exists!"}), 200

    if not verify_password(password, user.hash):
        return jsonify({"message": "Incorrect Password!"}), 200

    token = str(uuid.uuid4())
    session = SessionToken(token=token, user_id=user.id)

    db.session.add(session)
    db.session.commit()

    return jsonify({"token": token}), 200

@app.route("/api/register", methods=["POST"])
def createUser():
    username = request.json.get("username")
    password = request.json.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "Username already taken"}), 409

    # Create user with hashed password
    user = User(
        username=username,
        hash=hash_password(password)
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "user_id": user.id
    }), 201


# ------------------------
# Route API (NO AUTH REQUIRED)
# ------------------------

@app.route("/api/routes/locations", methods=["GET"])
def get_all_tracked_locations():
    nodes = Node.query.all()
    return jsonify({
        "locations": [
            {
                "id": n.id,
                "name": n.name,
                "location": n.location
            }
            for n in nodes
        ]
    }), 200


@app.route("/api/routes/calculate", methods=["POST"])
def calculate_route():
    return jsonify({
        "least_cost_path": [],
        "least_time_path": []
    }), 200


# ------------------------
# Route Database API (AUTH REQUIRED)
# ------------------------

@app.route("/api/routes/connections", methods=["POST", "PUT"])
def create_or_update_connection():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({"message": "connection saved"}), 200


@app.route("/api/routes/connections", methods=["GET"])
def view_all_connections():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({"connections": []}), 200


# ------------------------
# Tracking API
# ------------------------

@app.route("/api/tracking/<package_token>", methods=["GET"])
def public_package_tracking(package_token):
    return jsonify({
        "package_token": package_token,
        "status": "stub",
        "last_location": None
    }), 200


@app.route("/api/tracking", methods=["GET"])
def user_packages():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({"packages": []}), 200


if __name__ == "__main__":
    app.run(debug=True)
