from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
import secrets
from route_calculator import route_calc, update_graph
from password_handling import hash_password, verify_password, hash_token
from db import db, User, SessionToken, Node, Package, NodeLink, PackageEvent
import os

app = Flask(__name__)
CORS(app)

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
    token_hash = hash_token(token)
    session = SessionToken.query.filter_by(token_hash=token_hash).first()

    if session is None:
        return None

    if session.expires_at < datetime.now(timezone.utc):
        db.session.delete(session)
        db.session.commit()
        return None
    
    return session.user_id


# ------------------------
# Auth API's
# ------------------------

# Login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if data is None:
            return jsonify({"error": "Invalid JSON payload"}), 400
    if not isinstance(data, dict):
            return jsonify({"error": "JSON body must be an object"}), 400
    
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 401

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"message": "Incorrect Username or Password!"}), 401

    if not verify_password(password, user.password_hash):
        return jsonify({"message": "Incorrect Username or Password!"}), 401

    token = secrets.token_urlsafe(32)
    token_hash = hash_token(token)
    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(days=7)
    session = SessionToken(
        token_hash=token_hash,
        user_id=user.id,
        created_at=created_at,
        expires_at=expires_at
    )
    
    db.session.add(session)
    db.session.commit()
    return jsonify({"token": token}), 200


# Registration
@app.route("/api/register", methods=["POST"])
def createUser():
    data = request.get_json(silent=True)
    if data is None:
            return jsonify({"error": "Invalid JSON payload"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400
    
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

# Get a list of all existing connections
@app.route("/api/routes/connections", methods=["GET"])
def view_all_connections():
    user_id = require_auth()
    if user_id is None:
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
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    from_node_id = data.get("from_node_id")
    to_node_id = data.get("to_node_id")

    if from_node_id is None or to_node_id is None:
        return jsonify({"error": "from_node_id and to_node_id are required"}), 400

    if Node.query.get(from_node_id) is None or Node.query.get(to_node_id) is None:
        return jsonify({"error": "Invalid node id"}), 400

    least_cost = route_calc(from_node_id, to_node_id, "cost")
    least_time = route_calc(from_node_id, to_node_id, "time")

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

    if package is None:
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
    if user_id is None:
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


#Create a new package for the user
@app.route("/api/packages/create", methods=["POST"])
def create_package():
    user_id = require_auth()
    if user_id is None:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    origin_node_id = data.get("origin_node_id")
    destination_node_id = data.get("destination_node_id")
    
    if origin_node_id is None or destination_node_id is None:
        return jsonify({"error": "origin_node_id and destination_node_id are required"}), 400

    if origin_node_id == destination_node_id:
        return jsonify({"error": "Origin and destination cannot be the same"}), 400
    
    if Node.query.get(origin_node_id) is None or Node.query.get(destination_node_id) is None:
        return jsonify({"error": "Invalid node id"}), 400
    
    try:
        package_token = secrets.token_urlsafe(32)

        new_package = Package(
            token=package_token,
            user_id=user_id,
            origin_node_id=origin_node_id,
            destination_node_id=destination_node_id,
            current_node_id=origin_node_id,
            created_at=datetime.now(timezone.utc)
        )
        db.sessions.add(new_package)
        db.session.flush()

        genesis_previous_hash = "GENESIS_BLOCK_HASH_0000000000000000"
        genesis_event = PackageEvent(
                    package_id=new_package.id,
                    node_id=origin_node_id,
                    previous_hash=genesis_previous_hash,
                    timestamp=datetime.now(timezone.utc)
                )

        genesis_event.current_hash = genesis_event.calculate_hash()

        db.session.add(genesis_event)

        db.session.commit()

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to create package"}), 500

    return jsonify({
        "message": "Package created successfully",
        "package": {
            "id": new_package.id,
            "token": new_package.token,
            "origin": origin_node.name,
            "destination": destination_node.name,
            "status": "created",
            "created_at": new_package.created_at.isoformat()
        }
    }), 201


# ------------------------
# Admin management
# ------------------------

# Allow admins to create new locations
@app.route("/api/routes/createNode", methods=["POST"])
def create_node():
    user_id = require_auth()
    if user_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.get(user_id)
    if user is None or user.access_level < 4:
        return jsonify({"error": "Forbidden: Insufficient access rights"}), 403

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400
    
    name = data.get("name")
    location = data.get("location")
    # Get coordinatesm, return error if not provided
    try:
        x = float(data.get("x", 0.0) or 0.0)
        y = float(data.get("y", 0.0) or 0.0)
    except (TypeError, ValueError):
        return jsonify({"error": "x and y must be numeric"}), 400
    
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
    if user_id is None:
        return jsonify({"error": "Unauthorized"}), 401

    user = User.query.get(user_id)
    if user is None or user.access_level < 4:
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    from_node_id = data.get("from_node_id")
    to_node_id = data.get("to_node_id")
    time_val = data.get("time")
    cost_val = data.get("cost")

    if  time_val is None or cost_val is None:
        return jsonify({"error": "Missing required fields (from_node_id, to_node_id, time, cost)"}), 400
    
    if db.session.get(Node, from_node_id) is None or db.session.get(Node, to_node_id) is None:
        return jsonify({"error": "Invalid node id"}), 400

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

    #Invalidate graph cache and djkastra cache
    update_graph()
    return jsonify({"message": "Node link created successfully", "id": new_link.id}), 201


# Allow users logged in that own to update packages
@app.route("/api/packages/update", methods=["POST"])
def update_package_location():
    user_id = require_auth()
    if user_id is None:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Invalid JSON"}), 400
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body must be an object"}), 400

    token = data.get("token")
    new_node_id = data.get("current_node_id")

    if token is None or new_node_id is None:
        return jsonify({"error": "Missing data"}), 400
    
    if Node.query.get(new_node_id) is None:
        return jsonify({"error": "Invalid node id"}), 400

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
        timestamp=datetime.now(timezone.utc)
    )

    new_event.current_hash = new_event.calculate_hash()

    try:   
        db.session.add(new_event)
        package.current_node_id = new_node_id
        db.session.commit()
    except:
        db.session.rollback()
        return jsonify({"error": "Update failed"}), 500

    return jsonify({
        "message": "Package location updated on blockchain",
        "block_hash": new_event.current_hash,
        "previous_hash": new_event.previous_hash
    }), 200


# Check integrity of the package's event blockchain
@app.route("/api/tracking/<package_token>/audit", methods=["GET"])
def audit_package_chain(package_token):
    package = Package.query.filter_by(token=package_token).first()
    if package is None:
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
                "timestamp": e.timestamp.isoformat(),
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
    
