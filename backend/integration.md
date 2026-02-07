# VAT-Gate

## leave what API's you want for the frontend and what you want them to do

- login API to recieve session auth token
- Route API (does not need auth token)
  - Sends all tracked locations to frontend
  - Send two locations to API, returns path of least cost and path of least time
- Route database API
  - Create / Update connections between locations
  - View all existing connections
- Tracking API
  - Send package token, returns publicly visible information for said packagae (does not need auth token)
  - If user is logged in, sends all packages related to their account

Note, every API requires an Auth token unless specifically specified otherwise

## API documentation

### Login API

- Route: `/api/login`
- Method: POST
- Expected data:
  - username (string)
  - password (string)
- Format: application/json

**Example:**

```json
{
  "username": "ExampleUser",
  "password": "ExamplePassword"
}
```

### Registration API

- Route: `/api/register`
- Method: POST
- Expected data:
- username (string)
- password (string)

- Format: application/json

**Example:**

```json
{
  "username": "NewUser",
  "password": "SecurePassword123"
}

```

### Get Locations API

- Route: `/api/routes/locations`
- Method: GET
- Expected data: None
- Format: N/A

### Create/Update Connection API

- Route: `/api/routes/connections`
- Method: POST (or PUT)
- Headers: `Authorization: Bearer <token>`
- Expected data:
- -Note: Your current code implementation is a stub (it returns success without processing data), but usually expects:-
- from_node_id (integer)
- to_node_id (integer)
- time (float/integer)
- cost (float/integer)

- Format: application/json

**Example:**

```json
{
  "from_node_id": 1,
  "to_node_id": 2,
  "time": 10.5,
  "cost": 50
}

```

### View All Connections API

- Route: `/api/routes/connections`
- Method: GET
- Headers: `Authorization: Bearer <token>`
- Expected data: None
- Format: N/A

### Calculate Route API

- Route: `/api/routes/calculate`
- Method: POST (or PUT)
- Expected data:
- from_node_id (integer)
- to_node_id (integer)

- Format: application/json

**Example:**

```json
{
  "from_node_id": 5,
  "to_node_id": 12
}

```

### Public Package Tracking API

- Route: `/api/tracking/<package_token>`
- Method: GET
- Expected data:
- package_token (string) - *Passed via URL, not JSON body*

- Format: URL Parameter

**Example:**

`GET /api/tracking/abc-123-xyz`

### User Packages API

- Route: `/api/packages`
- Method: GET
- Headers: `Authorization: Bearer <token>`
- Expected data: None
- Format: N/A
