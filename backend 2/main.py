from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from functools import lru_cache
import heapq
from decimal import Decimal

from db import db, User, SessionToken, Node, Package, NodeLink, PackageEvent
import os

app = Flask(__name__)
CORS(app)


# Attempt to read MySQL connection details from environment variables. If
# any of the required values are missing we fall back to a local
# SQLite database. This makes the backend easier to run in
# development environments (e.g. without Docker). To use MySQL set
# `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_DATABASE`. You can also
# override the hostname via `MYSQL_HOST` (defaults to "db" in the
# docker‑compose file).
DB_USER = os.getenv("MYSQL_USER")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST", "db")
DB_NAME = os.getenv("MYSQL_DATABASE")

if DB_USER and DB_PASSWORD and DB_NAME:
    app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
else:
    # Default to a local SQLite DB if MySQL settings are not provided
    sqlite_path = os.path.join(os.path.dirname(__file__), "database.sqlite3")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{sqlite_path}"

db.init_app(app)

with app.app_context():
    db.create_all()

GRAPH_CACHE = {}


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
# Auth API's
# ------------------------



# Login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    # `request.get_json()` already returns a dict. The previous
    # implementation incorrectly attempted to access `data.json`.
    username = data.get("username")
    password = data.get("password")

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


# Registration
@app.route("/api/register", methods=["POST"])
def createUser():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400
    
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({"error": "Username already taken"}), 409

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


# Get a list of all existing locations
@app.route("/api/routes/locations", methods=["GET"])
def get_all_tracked_locations():
    nodes = Node.query.all()
    return jsonify({
        "locations": [
            {
                "id": n.id,
                "name": n.name,
                "location": n.location,
                "x": n.x,
                "y": n.y
            }
            for n in nodes
        ]
    }), 200

# ------------------------
# Routes Database (AUTH REQUIRED)
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

# -----------------
# Route calculation
# -----------------

def get_graph(weight_field):
    """
    Lazy loads the graph from the DB only if it's not already in memory.
    weight_field: 'time' or 'cost'
    """
    global GRAPH_CACHE

    if weight_field in GRAPH_CACHE:
        return GRAPH_CACHE[weight_field]

    print(f"Building {weight_field} graph from database...") # Debugging log
    links = NodeLink.query.all()
    
    new_graph = {}
    for link in links:
        # We build the adjacency list: Node -> [(Neighbor, Weight)]
        new_graph.setdefault(link.from_node_id, []).append(
            (link.to_node_id, getattr(link, weight_field))
        )
    
    GRAPH_CACHE[weight_field] = new_graph
    
    return new_graph

@lru_cache(maxsize=512)  # Cache results of route calculations for faster repeat queries
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
# Tracking
# ------------------------

# Give details of any package if user has the token
@app.route("/api/tracking/<package_token>", methods=["GET"])
def public_package_tracking(package_token):
    package = Package.query.filter_by(token=package_token).first()

    if not package:
        return jsonify({"error": "Package not found"}), 404

    # status parsing
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


# Give list of all packages sent by user
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

# ------------------------
# Admin management
# ------------------------

# Allow admins to create new locations
@app.route("/api/routes/createNode", methods=["POST"])
def create_node():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.get(user_id)
    if not user or user.access_level < 4:
        return jsonify({"error": "Forbidden: Insufficient access rights"}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    name = data.get("name")
    location = data.get("location")
    # Get coordinates, default to 0.0 if not provided
    x = float(data.get("x", 0.0) or 0.0)
    y = float(data.get("y", 0.0) or 0.0)


    if not name or not location:
        return jsonify({"error": "Name and location are required"}), 400

    new_node = Node(name=name, location=location, x=x, y=y)
    db.session.add(new_node)
    db.session.commit()

    return jsonify({
        "message": "Node created successfully",
        "node": {
            "id": new_node.id, 
            "name": new_node.name, 
            "location": new_node.location,
            "x": new_node.x,
            "y": new_node.y
        }
    }), 201

# Create a link between two nodes with time and cost weight fields
@app.route("/api/routes/createNodeLink", methods=["POST"])
def create_node_link():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.get(user_id)
    if not user or user.access_level < 4:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    from_node_id = data.get("from_node_id")
    to_node_id = data.get("to_node_id")
    time_val = data.get("time")
    cost_val = data.get("cost")

    if not all([from_node_id, to_node_id, time_val is not None, cost_val is not None]):
        return jsonify({"error": "Missing required fields (from_node_id, to_node_id, time, cost)"}), 400

    new_link = NodeLink(
        from_node_id=from_node_id,
        to_node_id=to_node_id,
        time=time_val,
        cost=cost_val
    )
    
    try:
        db.session.add(new_link)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create link. It might already exist."}), 409

# Invalidate the graph cache since the underlying data has changed
    global GRAPH_CACHE
    GRAPH_CACHE.clear()
# Wipe lru_cache of dijkstra since the graph has changed
    dijkstra.cache_clear()

    return jsonify({"message": "Node link created successfully", "id": new_link.id}), 201


# Allow users logged in that own to update packages
@app.route("/api/packages/update", methods=["POST"])
def update_package_location():
    user_id = require_auth()
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    token = data.get("token")
    new_node_id = data.get("current_node_id")

    if not token or not new_node_id:
        return jsonify({"error": "Missing data"}), 400

    package = Package.query.filter_by(token=token).first()
    if not package:
        return jsonify({"error": "Package not found"}), 404
    
    if package.user_id != user_id:
        return jsonify({"error": "Forbidden"}), 403

    last_event = PackageEvent.query.filter_by(package_id=package.id)\
        .order_by(PackageEvent.timestamp.desc()).first()

    if last_event:
        prev_hash = last_event.current_hash
    else:
        # If no history exists, this is the "Genesis Block"
        prev_hash = "GENESIS_BLOCK_HASH_0000000000000000"

    new_event = PackageEvent(
        package_id=package.id,
        node_id=new_node_id,
        previous_hash=prev_hash,
        timestamp=datetime.utcnow()
    )

    new_event.current_hash = new_event.calculate_hash()

    db.session.add(new_event)
    package.current_node_id = new_node_id
    
    db.session.commit()

    return jsonify({
        "message": "Package location updated on blockchain",
        "block_hash": new_event.current_hash,
        "previous_hash": new_event.previous_hash
    }), 200


# Check integrity of the package's event blockchain
@app.route("/api/tracking/<package_token>/audit", methods=["GET"])
def audit_package_chain(package_token):
    package = Package.query.filter_by(token=package_token).first()
    if not package:
        return jsonify({"error": "Package not found"}), 404

    events = PackageEvent.query.filter_by(package_id=package.id)\
        .order_by(PackageEvent.timestamp.asc()).all()

    chain_is_valid = True
    errors = []

    for i, event in enumerate(events):
        recalculated_hash = event.calculate_hash()
        if recalculated_hash != event.current_hash:
            chain_is_valid = False
            errors.append(f"Block {i} (ID {event.id}) has been tampered with! Data hash mismatch.")

        if i > 0:
            previous_event = events[i-1]
            if event.previous_hash != previous_event.current_hash:
                chain_is_valid = False
                errors.append(f"Block {i} (ID {event.id}) is broken! It does not link to Block {i-1}.")

    return jsonify({
        "valid": chain_is_valid,
        "chain_length": len(events),
        "errors": errors,
        "history": [
            {
                "node": e.node.name,
                "timestamp": e.timestamp,
                "hash": e.current_hash
            } for e in events
        ]
    })

@app.route("/")
def serve_index():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend"))
    return send_from_directory(frontend_dir, "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80, debug=True)


