# VAT-Gate

A web based tool too allow senders to easily compare delivery routes based on cost and time parameters.
Front end will be basically let user choose to and from places then calulate the best route showing him time and route also mode of transport and tracking options

## How To Run?

### This project uses docker to run

- Step 1:
Install docker on your deployment location. For installation, refer to [Docker Desktop](https://docs.docker.com/get-started/get-docker/) or [Docker Engine](https://docs.docker.com/engine/install/)
- Step 2:
Download the Files under VAT-GATE/backend/Docker
- Step 3:
  - Open a terminal in the project `root` directory
  - run `cd ./backend/Docker`
  - run `ssh-keygen -t ed25519 -C "docker-deploy-key" -f ./deploy_key -q`
  - use an empty passphrase
  - Add deploy_key.pub to the [deploy keys in VAT-GATE](https://github.com/someRandomDude-a/VAT-Gate/settings/keys)

- Step 4:
Run docker-compose.yml

> [!NOTE]
> To change the branch being pulled, edit [Line 17, `BRANCH: your-branch-name`](./backend/Docker/docker-compose.yml#L17)  

- Step 5:
Open a web browser and navigate to `localhost:8080` for the website itself.

Navigate to `localhost:8081` to access PHPmyadmin portal

## Database

![Database Designer](./backend/Database%20design.png)

## Structure

```python
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

If these variables are _not_ provided the server build fails

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

``` bash
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

## Deployment

1. Clone or download this repository via GitHub Desktop.
2. Start the backend using Docker Compose or run it manually.
3. Start the frontend dev server with `npm run dev` or build it for
   production with `npm run build`.
4. Access the frontend at `http://localhost:5173` (development) or
   wherever you choose to host the static files. The app will
   automatically communicate with the backend according to the value
   of `VITE_API_BASE_URL`.
