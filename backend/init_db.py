"""
Database initialization and seeding script.
Runs once at container startup before gunicorn launches the main app.
Creates all tables and seeds demo users + EU country nodes if empty.
"""
import os
import time
from datetime import datetime, timedelta

from flask import Flask
from sqlalchemy import inspect, text
from db import db, User, Node, NodeLink, Package, PackageEvent
from werkzeug.security import generate_password_hash

app = Flask(__name__)

DB_USER = os.getenv("MYSQL_USER")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD")
DB_HOST = os.getenv("MYSQL_HOST", "db")
DB_NAME = os.getenv("MYSQL_DATABASE")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
)
db.init_app(app)

# Wait for the database to be ready (up to 60 seconds)
for attempt in range(30):
    try:
        with app.app_context():
            db.create_all()
        print("Database connected and tables created.")
        break
    except Exception as e:
        print(f"Waiting for database... attempt {attempt + 1}/30 ({e})")
        time.sleep(2)
else:
    print("ERROR: Could not connect to database after 30 attempts.")
    exit(1)

with app.app_context():
    # ── Migrate: add value column to packages if missing ─────────────
    inspector = inspect(db.engine)
    existing_cols = [c["name"] for c in inspector.get_columns("packages")]
    if "value" not in existing_cols:
        db.session.execute(text(
            "ALTER TABLE packages ADD COLUMN value DECIMAL(10,2) NULL DEFAULT 0.0"
        ))
        db.session.commit()
        print("Migration: added value column to packages table.")
    if "name" not in existing_cols:
        db.session.execute(text(
            "ALTER TABLE packages ADD COLUMN `name` VARCHAR(255) NULL DEFAULT ''"
        ))
        db.session.commit()
        print("Migration: added name column to packages table.")

    # ── Seed demo users ──────────────────────────────────────────────
    if User.query.count() == 0:
        users = [
            User(
                username="admin@vatguard.com",
                hash=generate_password_hash("admin123"),
                access_level=4,
            ),
            User(
                username="user@vatguard.com",
                hash=generate_password_hash("user123"),
                access_level=0,
            ),
        ]
        db.session.add_all(users)
        db.session.commit()
        print("Seeded demo users: admin@vatguard.com and user@vatguard.com")

    # ── Seed EU country nodes ────────────────────────────────────────
    if Node.query.count() == 0:
        nodes = [
            Node(name="Germany",        location="Frankfurt, Germany",       x=50.1, y=8.7),
            Node(name="France",         location="Paris, France",            x=48.9, y=2.3),
            Node(name="Netherlands",    location="Amsterdam, Netherlands",   x=52.4, y=4.9),
            Node(name="Belgium",        location="Brussels, Belgium",        x=50.8, y=4.4),
            Node(name="Poland",         location="Warsaw, Poland",           x=52.2, y=21.0),
            Node(name="Austria",        location="Vienna, Austria",          x=48.2, y=16.4),
            Node(name="Spain",          location="Madrid, Spain",            x=40.4, y=-3.7),
            Node(name="Italy",          location="Rome, Italy",              x=41.9, y=12.5),
            Node(name="Czech Republic", location="Prague, Czech Republic",   x=50.1, y=14.4),
            Node(name="Hungary",        location="Budapest, Hungary",        x=47.5, y=19.0),
            Node(name="Sweden",         location="Stockholm, Sweden",        x=59.3, y=18.1),
            Node(name="Denmark",        location="Copenhagen, Denmark",      x=55.7, y=12.6),
            Node(name="Portugal",       location="Lisbon, Portugal",         x=38.7, y=-9.1),
            Node(name="Romania",        location="Bucharest, Romania",       x=44.4, y=26.1),
            Node(name="Greece",         location="Athens, Greece",           x=37.9, y=23.7),
            Node(name="Switzerland",    location="Zurich, Switzerland",      x=47.4, y=8.5),
        ]
        db.session.add_all(nodes)
        db.session.commit()
        print("Seeded 16 EU country nodes.")

    # ── Seed node links (bidirectional) ──────────────────────────────
    if NodeLink.query.count() == 0:
        all_nodes = {n.name: n.id for n in Node.query.all()}

        # (from, to, time_hours, cost_eur)
        links_data = [
            ("Germany",     "Netherlands", 4.0,  120.0),
            ("Netherlands", "Germany",     4.0,  120.0),
            ("Germany",     "Belgium",     3.5,  110.0),
            ("Belgium",     "Germany",     3.5,  110.0),
            ("Germany",     "France",      8.0,  180.0),
            ("France",      "Germany",     8.0,  180.0),
            ("Germany",     "Austria",     6.0,  150.0),
            ("Austria",     "Germany",     6.0,  150.0),
            ("Germany",     "Poland",      7.0,  160.0),
            ("Poland",      "Germany",     7.0,  160.0),
            ("Netherlands", "Belgium",     2.0,   80.0),
            ("Belgium",     "Netherlands", 2.0,   80.0),
            ("Belgium",     "France",      3.0,  100.0),
            ("France",      "Belgium",     3.0,  100.0),
            ("France",      "Spain",      10.0,  200.0),
            ("Spain",       "France",     10.0,  200.0),
            ("France",      "Italy",      12.0,  220.0),
            ("Italy",       "France",     12.0,  220.0),
            ("Austria",     "Italy",       5.0,  130.0),
            ("Italy",       "Austria",     5.0,  130.0),
            ("Austria",     "Poland",      8.0,  170.0),
            ("Poland",      "Austria",     8.0,  170.0),
            ("Spain",          "Italy",          14.0,  250.0),
            ("Italy",          "Spain",          14.0,  250.0),
            # New links for added countries
            ("Germany",        "Czech Republic",  3.5,  110.0),
            ("Czech Republic", "Germany",         3.5,  110.0),
            ("Germany",        "Denmark",         8.0,  170.0),
            ("Denmark",        "Germany",         8.0,  170.0),
            ("Germany",        "Switzerland",     5.0,  135.0),
            ("Switzerland",    "Germany",         5.0,  135.0),
            ("Czech Republic", "Poland",          5.5,  130.0),
            ("Poland",         "Czech Republic",  5.5,  130.0),
            ("Czech Republic", "Austria",         4.0,  115.0),
            ("Austria",        "Czech Republic",  4.0,  115.0),
            ("Czech Republic", "Hungary",         4.5,  120.0),
            ("Hungary",        "Czech Republic",  4.5,  120.0),
            ("Austria",        "Hungary",         2.5,   90.0),
            ("Hungary",        "Austria",         2.5,   90.0),
            ("Austria",        "Switzerland",     3.0,  105.0),
            ("Switzerland",    "Austria",         3.0,  105.0),
            ("Hungary",        "Romania",         8.0,  165.0),
            ("Romania",        "Hungary",         8.0,  165.0),
            ("Romania",        "Greece",         15.0,  230.0),
            ("Greece",         "Romania",        15.0,  230.0),
            ("Denmark",        "Sweden",          4.5,  140.0),
            ("Sweden",         "Denmark",         4.5,  140.0),
            ("Switzerland",    "France",          3.5,  115.0),
            ("France",         "Switzerland",     3.5,  115.0),
            ("Switzerland",    "Italy",           3.5,  115.0),
            ("Italy",          "Switzerland",     3.5,  115.0),
            ("Spain",          "Portugal",        5.0,  120.0),
            ("Portugal",       "Spain",           5.0,  120.0),
            ("Italy",          "Greece",         18.0,  260.0),
            ("Greece",         "Italy",          18.0,  260.0),
        ]

        for from_name, to_name, time_val, cost_val in links_data:
            from_id = all_nodes.get(from_name)
            to_id = all_nodes.get(to_name)
            if from_id and to_id:
                link = NodeLink(
                    from_node_id=from_id,
                    to_node_id=to_id,
                    time=time_val,
                    cost=cost_val,
                )
                db.session.add(link)

        db.session.commit()
        print(f"Seeded {len(links_data)} node links.")

    # ── Seed demo packages ───────────────────────────────────────────
    if Package.query.count() == 0:
        demo_user = User.query.filter_by(username="user@vatguard.com").first()
        admin_user = User.query.filter_by(username="admin@vatguard.com").first()
        all_nodes = {n.name: n for n in Node.query.all()}

        GENESIS = "GENESIS_BLOCK_HASH_0000000000000000"

        def make_event(package, node, prev_hash, ts_offset_minutes=0):
            ts = datetime(2026, 3, 1, 10, 0, 0) + timedelta(minutes=ts_offset_minutes)
            event = PackageEvent(
                package_id=package.id,
                node_id=node.id,
                previous_hash=prev_hash,
                timestamp=ts,
            )
            # Hash only depends on package_id/node_id/timestamp/previous_hash,
            # so it can be computed before the INSERT (no event.id needed).
            event.current_hash = event.calculate_hash()
            db.session.add(event)
            db.session.flush()
            return event.current_hash

        uid = demo_user.id if demo_user else None
        aid = admin_user.id if admin_user else None

        # ── user@vatguard.com packages ────────────────────────────────
        # 1: Germany → Netherlands · delivered (3 events)
        p = Package(token="demo-u-001", user_id=uid,
                    origin_node_id=all_nodes["Germany"].id,
                    destination_node_id=all_nodes["Netherlands"].id,
                    current_node_id=all_nodes["Netherlands"].id,
                    value=1200.00, name="Consumer Electronics")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Germany"], GENESIS, 0)
        h = make_event(p, all_nodes["Belgium"], h, 120)
        make_event(p, all_nodes["Netherlands"], h, 240)

        # 2: France → Italy · in_transit at Switzerland (2 events)
        p = Package(token="demo-u-002", user_id=uid,
                    origin_node_id=all_nodes["France"].id,
                    destination_node_id=all_nodes["Italy"].id,
                    current_node_id=all_nodes["Switzerland"].id,
                    value=3400.00, name="Luxury Watches")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["France"], GENESIS, 0)
        make_event(p, all_nodes["Switzerland"], h, 210)

        # 3: Poland → Spain · in_transit at Germany (2 events)
        p = Package(token="demo-u-003", user_id=uid,
                    origin_node_id=all_nodes["Poland"].id,
                    destination_node_id=all_nodes["Spain"].id,
                    current_node_id=all_nodes["Germany"].id,
                    value=3200.00, name="Industrial Parts")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Poland"], GENESIS, 0)
        make_event(p, all_nodes["Germany"], h, 420)

        # 4: Netherlands → Portugal · created (no dispatch yet)
        p = Package(token="demo-u-004", user_id=uid,
                    origin_node_id=all_nodes["Netherlands"].id,
                    destination_node_id=all_nodes["Portugal"].id,
                    current_node_id=None,
                    value=5500.00, name="Pharmaceutical Supplies")
        db.session.add(p)

        # 5: Czech Republic → Sweden · in_transit at Germany (2 events)
        p = Package(token="demo-u-005", user_id=uid,
                    origin_node_id=all_nodes["Czech Republic"].id,
                    destination_node_id=all_nodes["Sweden"].id,
                    current_node_id=all_nodes["Germany"].id,
                    value=8900.00, name="Medical Equipment")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Czech Republic"], GENESIS, 0)
        make_event(p, all_nodes["Germany"], h, 210)

        # 6: Austria → Greece · delivered (3 events)
        p = Package(token="demo-u-006", user_id=uid,
                    origin_node_id=all_nodes["Austria"].id,
                    destination_node_id=all_nodes["Greece"].id,
                    current_node_id=all_nodes["Greece"].id,
                    value=620.00, name="Ceramic Artworks")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Austria"], GENESIS, 0)
        h = make_event(p, all_nodes["Hungary"], h, 150)
        h = make_event(p, all_nodes["Romania"], h, 480)
        make_event(p, all_nodes["Greece"], h, 900)

        # ── admin@vatguard.com packages ───────────────────────────────
        # 7: Germany → France · in_transit at Belgium (2 events)
        p = Package(token="demo-a-001", user_id=aid,
                    origin_node_id=all_nodes["Germany"].id,
                    destination_node_id=all_nodes["France"].id,
                    current_node_id=all_nodes["Belgium"].id,
                    value=2400.00, name="Automotive Parts")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Germany"], GENESIS, 0)
        make_event(p, all_nodes["Belgium"], h, 210)

        # 8: Netherlands → Italy · created
        p = Package(token="demo-a-002", user_id=aid,
                    origin_node_id=all_nodes["Netherlands"].id,
                    destination_node_id=all_nodes["Italy"].id,
                    current_node_id=None,
                    value=650.00, name="Artisan Goods")
        db.session.add(p)

        # 9: Sweden → Spain · in_transit at Germany (2 events)
        p = Package(token="demo-a-003", user_id=aid,
                    origin_node_id=all_nodes["Sweden"].id,
                    destination_node_id=all_nodes["Spain"].id,
                    current_node_id=all_nodes["Germany"].id,
                    value=4750.00, name="Precision Instruments")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Sweden"], GENESIS, 0)
        make_event(p, all_nodes["Germany"], h, 270)

        # 10: Romania → Netherlands · delivered (3 events)
        p = Package(token="demo-a-004", user_id=aid,
                    origin_node_id=all_nodes["Romania"].id,
                    destination_node_id=all_nodes["Netherlands"].id,
                    current_node_id=all_nodes["Netherlands"].id,
                    value=1850.00, name="Textile Goods")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Romania"], GENESIS, 0)
        h = make_event(p, all_nodes["Hungary"], h, 480)
        h = make_event(p, all_nodes["Austria"], h, 780)
        h = make_event(p, all_nodes["Germany"], h, 1020)
        make_event(p, all_nodes["Netherlands"], h, 1260)

        # 11: Poland → Portugal · in_transit at France (3 events)
        p = Package(token="demo-a-005", user_id=aid,
                    origin_node_id=all_nodes["Poland"].id,
                    destination_node_id=all_nodes["Portugal"].id,
                    current_node_id=all_nodes["France"].id,
                    value=6100.00, name="Machine Components")
        db.session.add(p); db.session.flush()
        h = make_event(p, all_nodes["Poland"], GENESIS, 0)
        h = make_event(p, all_nodes["Germany"], h, 420)
        make_event(p, all_nodes["France"], h, 900)

        # 12: Italy → Denmark · created
        p = Package(token="demo-a-006", user_id=aid,
                    origin_node_id=all_nodes["Italy"].id,
                    destination_node_id=all_nodes["Denmark"].id,
                    current_node_id=None,
                    value=980.00, name="Designer Furniture")
        db.session.add(p)

        db.session.commit()
        print("Seeded 12 demo packages (6 per user).")

print("Database initialization complete.")
