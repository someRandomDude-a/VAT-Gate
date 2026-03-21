# VAT-Gate

A web-based tool that lets senders compare delivery routes based on cost and time. Users select origin and destination locations, and the system calculates the optimal route — showing estimated time, cost, mode of transport, and package tracking.

## Architecture

| Service | Technology | Port |
|---------|-----------|------|
| Frontend | React 18 + TypeScript + Vite | `5173` |
| Backend | Python 3.11 + Flask + SQLAlchemy | `8080` |
| Database | MariaDB 10.11 | `3306` |
| DB Admin | PHPMyAdmin | `8081` |

The backend uses Dijkstra's algorithm for route optimization and a blockchain-style SHA-256 event chain for tamper-evident package tracking.

---

## Running with Docker (Recommended)

### Prerequisites

- [Docker Desktop](https://docs.docker.com/get-started/get-docker/) or [Docker Engine](https://docs.docker.com/engine/install/) with the Compose plugin

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/someRandomDude-a/VAT-Gate.git
   cd VAT-Gate
   ```

2. Start all services:
   ```bash
   docker compose up --build
   ```

3. Open your browser:
   - **App:** http://localhost:5173
   - **API:** http://localhost:8080
   - **PHPMyAdmin:** http://localhost:8081

To stop: `Ctrl+C`, then `docker compose down`

To reset the database: `docker compose down -v` (removes the `db_data` volume)

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@vatguard.com` | `admin@vatguard.com` |
| User | `user@vatguard.com` | `user@vatguard.com` |
| PHPMyAdmin | `root` | `example` |

---

## Running Locally (Without Docker)

### Backend

```bash
cd backend
pip install -r requirements.txt
# Set environment variables for your local MariaDB instance:
export MYSQL_USER=root
export MYSQL_PASSWORD=example
export MYSQL_HOST=localhost
export MYSQL_DATABASE=VAT_database
python init_db.py
python main.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend reads the API URL from `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:8080
```

---

## Database Design

![Database Design](./backend/Database%20design.png)
