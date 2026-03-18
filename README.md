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
  # PHP Service
  python:
    image: ghcr.io/somerandomdude-a/vat-gate:main
    container_name: python-container
    ports:
      - "8080:80"
    depends_on:
      - db
    environment:
      MYSQL_HOST: db
      MYSQL_USER: root
      MYSQL_PASSWORD: example
      MYSQL_DATABASE: VAT_database
      BRANCH: main
    restart: unless-stopped

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
      - db
    restart: unless-stopped

  # MariaDB Service
  db:
    image: mariadb:latest
    container_name: mariadb-container
    environment:
      MYSQL_ROOT_PASSWORD: example
      MYSQL_DATABASE: VAT_database
    ports:
      - "3306:3306"
    volumes:
      - VAT_database:/var/lib/mysql
    restart: unless-stopped

volumes:
  VAT_database:
    driver: local
```

- Step 3:
  - Open a terminal in the project `root` directory
  - run `cd ./backend/Docker`
  - run `ssh-keygen -t ed25519 -C "docker-deploy-key" -f ./deploy_key -q`
  - Add deploy_key.pub to the [deploy keys in VAT-GATE](https://github.com/someRandomDude-a/VAT-Gate/settings/keys)

- Step 4:
Run docker-compose.yml

> [!NOTE]
> To change the branch being pulled, edit [Line 17, `BRANCH: your-branch-name`](./backend/Docker/docker-compose.yml#L17)  

- Step 5:
Open a web browser and navigate to `localhost:8080` for the website itself.<br>
Navigate to `localhost:8081` to access PHPmyadmin portal

## Database Design
![Database Designer](./backend/Database%20design.png)
