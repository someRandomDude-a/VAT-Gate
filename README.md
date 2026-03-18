# VAT-Gate

A web based tool too allow senders to easily compare delivery routes based on cost and time parameters.
Front end will be basically let user choose to and from places then calulate the best route showing him time and route also mode of transport and tracking options

## How To Run?

### This project uses docker to run

- Step 1:
Install docker on your deployment location. For installation, refer to [Docker Desktop](https://docs.docker.com/get-started/get-docker/) or [Docker Engine](https://docs.docker.com/engine/install/)
- Step 2:
create a `docker-compose.yaml` file

```yaml
services:
  # Python Service
  python:
    image: ghcr.io/somerandomdude-a/vat-gate:main
    container_name: python-container
    ports:
      - "8080:80"
    depends_on:
      db:
        condition: service_healthy
    environment:
      MYSQL_HOST: db
      MYSQL_USER: root
      MYSQL_PASSWORD: example
      MYSQL_DATABASE: VAT_database
    restart: unless-stopped
    networks:
      - backend

  # PHP myadmin
  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: phpmyadmin-container
    environment:
      PMA_HOST: db
      PMA_USER: root
      PMA_PASSWORD: example
    ports:
      - "8081:80"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - backend

    restart: unless-stopped

  # MariaDB Service
  db:
    image: mariadb:latest
    container_name: mariadb-container
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: VAT_database
    volumes:
      - VAT_database:/var/lib/mysql
    restart: unless-stopped
    networks:
      - backend
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      start_period: 10s
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  VAT_database:
    driver: local

networks:
  backend:
    driver: bridge
```

- Step 3:
Run `docker compose up --build`

> [!NOTE]  
> For development purpose, the docker compose file in `./backend/Docker` can be used instead.
> It will build from local context as opposed to pulling from the repository packages.

- Step 4:
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

> [!NOTE]
> This repo uses python 3.14.
> It may also work on other builds on python but stability and operation is not guaranteed.

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
