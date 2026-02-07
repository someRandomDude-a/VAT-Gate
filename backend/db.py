from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib
import json

db = SQLAlchemy()

# ------------------------
# Models
# ------------------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    hash = db.Column(db.String(255), nullable=False)
    
    access_level = db.Column(db.Integer, default=0, nullable=False)
    
    sessions = db.relationship(
        "SessionToken",
        backref="user",
        cascade="all, delete-orphan",
        lazy=True
        )
    packages = db.relationship(
        "Package",
        backref="user",
        cascade="all, delete-orphan",
        lazy=True
        )


class SessionToken(db.Model):
    __tablename__ = "session_tokens"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)


class Node(db.Model):
    __tablename__ = "nodes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(200), nullable=False)

# Coordinates for each location
    x = db.Column(db.Float, default=0.0)
    y = db.Column(db.Float, default=0.0)
    
    outgoing_links = db.relationship(
        "NodeLink",
        foreign_keys="NodeLink.from_node_id",
        backref="from_node",
        lazy=True
    )

    incoming_links = db.relationship(
        "NodeLink",
        foreign_keys="NodeLink.to_node_id",
        backref="to_node",
        lazy=True
    )


class NodeLink(db.Model):
    __tablename__ = "node_links"
    

    id = db.Column(db.Integer, primary_key=True)

    from_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    to_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id", ondelete="CASCADE"),
        nullable=False,
        index = True
    )

    time = db.Column(db.Numeric(precision=10, scale=2), nullable=False)
    
    cost = db.Column(db.Numeric(precision=10, scale=2), nullable=False)
    __table_args__ = (
        db.UniqueConstraint("from_node_id", "to_node_id", name="uq_node_link"),
    )


class Package(db.Model):
    __tablename__ = "packages"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    current_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id", ondelete="SET NULL"),
        nullable=True
    )

    origin_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id", ondelete="SET NULL"),
        nullable=True
    )

    destination_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class PackageEvent(db.Model):
    __tablename__ = "package_events"

    id = db.Column(db.Integer, primary_key=True)
    package_id = db.Column(db.Integer, db.ForeignKey('packages.id'), nullable=False)
    node_id = db.Column(db.Integer, db.ForeignKey('nodes.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    previous_hash = db.Column(db.String(64), nullable=False)
    current_hash = db.Column(db.String(64), nullable=False)

    package = db.relationship('Package', backref=db.backref('events', lazy=True, order_by="PackageEvent.timestamp"))
    node = db.relationship('Node')

    def calculate_hash(self):
        data_string = f"{self.package_id}{self.node_id}{self.timestamp}{self.previous_hash}"
        return hashlib.sha256(data_string.encode()).hexdigest()