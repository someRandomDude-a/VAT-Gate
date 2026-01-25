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
