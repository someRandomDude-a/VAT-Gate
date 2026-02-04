from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from db import *

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
    Returns user_id on successfull authentication
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return False
    # Authentication here
    sessions = SessionToken.query.filter_by(SessionToken=auth_header).first()
    if sessions is None:
        return False
    else:
        return sessions.user_id


# ------------------------
# Auth API
# ------------------------

# To be updated in future
def passHash(password):
    return password


@app.route("/api/login", methods=["POST"])
def login():
    """
    Login API
    Receives credentials
    Returns session auth token
    """
    username = request.json.get("username")
    password = request.json.get("password")
    passwordHash = passHash(password)
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "No such user exists!"}), 200

    if user.hash != passwordHash:
        return jsonify({"message": "Incorrect Password!"}), 200


# ------------------------
# Route API (NO AUTH REQUIRED)
# ------------------------

@app.route("/api/routes/locations", methods=["GET"])
def get_all_tracked_locations():
    """
    Sends all tracked locations to frontend
    No auth required
    """
    return jsonify({"locations": [Node.query.all()]}), 200


@app.route("/api/routes/calculate", methods=["POST"])
def calculate_route():
    """
    Send two locations
    Returns:
    - path of least cost
    - path of least time
    No auth required
    """
    # start = request.json.get("start")
    # end = request.json.get("end")
    return jsonify({
        "least_cost_path": [],
        "least_time_path": []
    }), 200


# ------------------------
# Route Database API (AUTH REQUIRED)
# ------------------------

@app.route("/api/routes/connections", methods=["POST", "PUT"])
def create_or_update_connection():
    """
    Create or update connections between locations
    Auth required
    """
    if not require_auth():
        return jsonify({"error": "Unauthorized"}), 401

    # connection data from request.json
    return jsonify({"message": "connection saved"}), 200


@app.route("/api/routes/connections", methods=["GET"])
def view_all_connections():
    """
    View all existing connections
    Auth required
    """
    if not require_auth():
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({"connections": []}), 200


# ------------------------
# Tracking API
# ------------------------

@app.route("/api/tracking/<package_token>", methods=["GET"])
def public_package_tracking(package_token):
    """
    Send package token
    Returns publicly visible package info
    No auth required
    """
    return jsonify({
        "package_token": package_token,
        "status": "stub",
        "last_location": None
    }), 200


@app.route("/api/tracking", methods=["GET"])
def user_packages():
    """
    If user is logged in,
    return all packages related to their account
    Auth required
    """
    if not require_auth():
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({"packages": []}), 200



if __name__ == "__main__":
    app.run(debug=True)
