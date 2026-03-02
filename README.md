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
Open a web browser and navigate to `localhost:8080` for the website itself.<br>
Navigate to `localhost:8081` to access PHPmyadmin portal
