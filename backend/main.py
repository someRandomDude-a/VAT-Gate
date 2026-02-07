from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
from werkzeug.security import generate_password_hash, check_password_hash


from db import db, User, SessionToken, Node, Package, NodeLink

app = Flask(__name__)
CORS(app)


import os
DB_USER = os.getenv("MYSQL_USER")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST", "db")
DB_NAME = os.getenv("MYSQL_DATABASE")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
)

db.init_app(app)

with app.app_context():
    db.create_all()


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

    if session.expires_at < datetime.utcnow():
        db.session.delete(session)
        db.session.commit()
        return None


    return session.user_id

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

# ------------------------
# Route calculations
# ------------------------
import heapq
from decimal import Decimal

def dijkstra(start_id, end_id, weight_field):
    """
    weight_field: "time" or "cost"
    """
    graph = {}

    links = NodeLink.query.all()
    for link in links:
        graph.setdefault(link.from_node_id, []).append(
            (link.to_node_id, getattr(link, weight_field))
        )

    queue = [(Decimal(0), start_id, [])]
    visited = set()

    while queue:
        total, current, path = heapq.heappop(queue)

        if current in visited:
            continue
        visited.add(current)

        path = path + [current]

        if current == end_id:
            return {
                "path": path,
                "total": float(total)
            }

        for neighbor, weight in graph.get(current, []):
            if neighbor not in visited:
                heapq.heappush(
                    queue,
                    (total + Decimal(weight), neighbor, path)
                )

    return None



# ------------------------
# Auth API
# ------------------------



# Login API
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    username = data.json.get("username")
    password = data.json.get("password")

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "No such user exists!"}), 200

    if not verify_password(password, user.hash):
        return jsonify({"message": "Incorrect Password!"}), 200

    token = str(uuid.uuid4())
    
    expires_at = datetime.utcnow() + timedelta(days=7)
    session = SessionToken(
        token=token,
        user_id=user.id,
        expires_at=expires_at
    )
    
    db.session.add(session)
    db.session.commit()
    return jsonify({"token": token}), 200


# Registration API
@app.route("/api/register", methods=["POST"])
def createUser():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    username = data.json.get("username")
    password = data.json.get("password")

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

# ------------------------
# Route Database API (AUTH REQUIRED)
# ------------------------

@app.route("/api/routes/connections", methods=["POST", "PUT"])
def create_or_update_connection():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify({"message": "connection saved"}), 200

# Get a list of all existing connections
@app.route("/api/routes/connections", methods=["GET"])
def view_all_connections():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    links = NodeLink.query.all()

    return jsonify({
        "connections": [
            {
                "id": link.id,
                "from_node_id": link.from_node_id,
                "from_node_name": link.from_node.name if link.from_node else None,
                "to_node_id": link.to_node_id,
                "to_node_name": link.to_node.name if link.to_node else None,
                "time": float(link.time)
            }
            for link in links
        ]
    }), 200


# calculate least cost and least time path between two locations
@app.route("/api/routes/calculate", methods=["POST", "PUT"])
def calculate_route_cost():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    from_node_id = data.get("from_node_id")
    to_node_id = data.get("to_node_id")

    if not from_node_id or not to_node_id:
        return jsonify({"error": "from_node_id and to_node_id are required"}), 400

    least_cost = dijkstra(from_node_id, to_node_id, "cost")
    least_time = dijkstra(from_node_id, to_node_id, "time")

    return jsonify({
        "least_cost_path": least_cost,
        "least_time_path": least_time
    }), 200

# ------------------------
# Tracking API
# ------------------------

# Give details of any package if user has the package token
@app.route("/api/tracking/<package_token>", methods=["GET"])
def public_package_tracking(package_token):
    package = Package.query.filter_by(token=package_token).first()

    if not package:
        return jsonify({"error": "Package not found"}), 404

    # Determine status
    if package.current_node_id is None:
        status = "created"
        last_location = None
    elif package.current_node_id == package.destination_node_id:
        status = "delivered"
        last_location = package.destination_node.name if package.destination_node else None
    else:
        status = "in_transit"
        last_location = package.current_node.name if package.current_node else None

    return jsonify({
        "package_token": package.token,
        "status": status,
        "last_location": last_location,
        "created_at": package.created_at.isoformat()
    }), 200


# Give list of all packages of the given user
@app.route("/api/packages", methods=["GET"])
def user_packages():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    packages = Package.query.filter_by(user_id=user_id).all()

    return jsonify({
        "packages": [
            {
                "id": p.id,
                "token": p.token,
                "status": (
                    "created" if p.current_node_id is None
                    else "delivered" if p.current_node_id == p.destination_node_id
                    else "in_transit"
                ),
                "current_node": p.current_node.name if p.current_node else None,
                "origin_node": p.origin_node.name if p.origin_node else None,
                "destination_node": p.destination_node.name if p.destination_node else None,
                "created_at": p.created_at.isoformat()
            }
            for p in packages
        ]
    }), 200


@app.route("/")
def serve_index():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
    return send_from_directory(frontend_dir, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)
