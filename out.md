
## Structure

```
vatgate-integrated/
  backend/    # Flask API and database models
  frontend/   # React (Vite) web application
  backend_README.md  # Original README from VAT‑Gate
  The Digital Bretton Woods, Gaurev Ajwani, Aijaz Ahmed Shaikh.pdf
```

### Backend

The backend is a Flask application exposing a REST API. It uses
SQLAlchemy to talk to a database. By default the application reads
MySQL connection details from the following environment variables:

- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_HOST` (optional, defaults to `db` in Docker)

If these variables are _not_ provided the server automatically falls
back to a local SQLite database stored in `backend/database.sqlite3`.

To run the backend locally without Docker:

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

Alternatively you can use the provided Docker Compose file
`backend/Docker/docker-compose.yml` which spins up MariaDB, phpMyAdmin
and the Python API. When using Docker Compose the API will be exposed
on `http://localhost:8080` and the database credentials are already
configured in the compose file.

```
cd backend/Docker
docker compose up --build
```

### Frontend

The frontend is a React application built with Vite and TypeScript.
Authentication and API calls have been wired up to the Flask backend
via a lightweight wrapper located at `frontend/src/lib/api.ts`. A
sample `.env` file is provided with the base URL for API requests. By
default it points to `http://localhost:8080` which matches the
configuration in the Docker Compose file. If you run the backend on a
different port or host adjust `VITE_API_BASE_URL` accordingly.

To get started:

```bash
cd frontend
npm install
npm run dev
```

During development the frontend runs on its own dev server
(`http://localhost:5173` by default) and proxies API requests to the
backend according to the base URL defined in `.env`. For production
builds run `npm run build` and serve the contents of
`frontend/dist` via any static file server or integrate it into the
Flask application.

### Notes on Integration

- **Authentication:** The mock login has been removed. The
  `AuthContext` now calls the backend’s `/api/login` endpoint and
  stores the returned session token. Since the backend does not yet
  expose a user details endpoint the frontend fabricates a basic user
  object using the supplied email.
- **API wrapper:** All communication with the API is handled via
  `frontend/src/lib/api.ts`. Additional endpoints can be added there
  as the backend evolves.
- **Database fallback:** If you wish to test the backend without
  spinning up a MySQL/MariaDB server simply omit the `MYSQL_*`
  environment variables. The API will create a SQLite database
  automatically.

## Deployment

1. Clone or download this repository via GitHub Desktop.
2. Start the backend using Docker Compose or run it manually.
3. Start the frontend dev server with `npm run dev` or build it for
   production with `npm run build`.
4. Access the frontend at `http://localhost:5173` (development) or
   wherever you choose to host the static files. The app will
   automatically communicate with the backend according to the value
   of `VITE_API_BASE_URL`.

With both services up and running you’ll have a unified VATGate
application ready for further development or deployment.