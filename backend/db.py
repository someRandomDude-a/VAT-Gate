from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


# ------------------------
# Models
# ------------------------

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    hash = db.Column(db.String(255), nullable=False)

    sessions = db.relationship("SessionToken", backref="user", lazy=True)
    packages = db.relationship("Package", backref="user", lazy=True)


class SessionToken(db.Model):
    __tablename__ = "session_tokens"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(255), unique=True, nullable=False)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Node(db.Model):
    __tablename__ = "nodes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(200), nullable=False)

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
        db.ForeignKey("nodes.id"),
        nullable=False
    )

    to_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id"),
        nullable=False
    )

    time = db.Column(db.Float, nullable=False)


class Package(db.Model):
    __tablename__ = "packages"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(255), unique=True, nullable=False)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    current_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id"),
        nullable=True
    )

    origin_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id"),
        nullable=False
    )

    destination_node_id = db.Column(
        db.Integer,
        db.ForeignKey("nodes.id"),
        nullable=False
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    current_node = db.relationship("Node", foreign_keys=[current_node_id])
    origin_node = db.relationship("Node", foreign_keys=[origin_node_id])
    destination_node = db.relationship("Node", foreign_keys=[destination_node_id])
