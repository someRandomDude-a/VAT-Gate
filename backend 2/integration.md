# VAT-Gate API Documentation

## Overview

**Authentication:**

* Most endpoints require an `Authorization` header with a Bearer token: `Authorization: Bearer <token>`.
* **Access Levels:** Users have an access level (Default: 0).
* **Level 0:** Standard user (Tracking, Viewing).
* **Level 4+:** Admin user (Creating Nodes, Linking Nodes).

## 1. Authentication API

### Login

* **Route:** `/api/login`
* **Method:** `POST`
* **Auth Required:** No
* **Description:** Authenticates a user and returns a session token valid for 7 days.
* **Body:**

```json
{
  "username": "ExampleUser",
  "password": "ExamplePassword"
}

```

* **Response:** `{"token": "uuid-string"}`

### Register

* **Route:** `/api/register`
* **Method:** `POST`
* **Auth Required:** No
* **Description:** Creates a new user account (Default Access Level: 0).
* **Body:**

```json
{
  "username": "NewUser",
  "password": "SecurePassword123"
}

```

---

## 2. Route & Node API

### Get All Locations

* **Route:** `/api/routes/locations`
* **Method:** `GET`
* **Auth Required:** No
* **Description:** Returns a list of all trackable nodes/locations, including their coordinates.
* **Response Example:**

```json
{
  "locations": [
    {
      "id": 1,
      "name": "Warehouse A",
      "location": "New York",
      "x": 40.7128,
      "y": -74.0060
    }
  ]
}

```

### Create Node (Admin Only)

* **Route:** `/api/routes/createNode`
* **Method:** `POST`
* **Auth Required:** Yes (**Level 4+**)
* **Description:** Adds a new location node to the database.
* **Body:**

```json
{
  "name": "Distribution Center B",
  "location": "123 Logistics Way",
  "x": 10.5,   // Optional (defaults to 0.0)
  "y": 20.5    // Optional (defaults to 0.0)
}

```

### Create Node Link (Admin Only)

* **Route:** `/api/routes/createNodeLink`
* **Method:** `POST`
* **Auth Required:** Yes (**Level 4+**)
* **Description:** Creates a directional connection between two nodes with associated costs and time.
* **Body:**

```json
{
  "from_node_id": 1,
  "to_node_id": 2,
  "time": 4.5,  // e.g., hours
  "cost": 100.0 // e.g., currency
}

```

### View All Connections

* **Route:** `/api/routes/connections`
* **Method:** `GET`
* **Auth Required:** Yes
* **Description:** Returns all existing links between nodes.

### Calculate Route

* **Route:** `/api/routes/calculate`
* **Method:** `POST`
* **Auth Required:** No
* **Description:** Calculates the path of least time and least cost between two nodes.
* **Body:**

```json
{
  "from_node_id": 5,
  "to_node_id": 12
}

```

* **Response:**

```json
{
  "least_cost_path": { "path": [5, 8, 12], "total": 50.0 },
  "least_time_path": { "path": [5, 12], "total": 10.0 }
}

```

---

## 3. Tracking API

### Public Package Tracking

* **Route:** `/api/tracking/<package_token>`
* **Method:** `GET`
* **Auth Required:** No
* **Description:** Returns publicly visible status (Status, Last Location) for a specific package.
* **Example:** `GET /api/tracking/abc-123-xyz`

### User Packages

* **Route:** `/api/packages`
* **Method:** `GET`
* **Auth Required:** Yes
* **Description:** Returns all packages associated with the logged-in user.

### Update Package Location

* **Route:** `/api/packages/update`
* **Method:** `POST`
* **Auth Required:** Yes
* **Description:** Updates the current location of a package. Only updates if package is owned by logged in user.
* **Body:**

```json
{
  "token": "abc-123-xyz",
  "current_node_id": 3
}

```
