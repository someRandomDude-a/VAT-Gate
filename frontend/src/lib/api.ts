// Simple API wrapper for interacting with the VAT‑Gate backend.
//
// All functions return a Promise that resolves to the parsed JSON body
// of the response. If the request fails due to a network error or
// returns a non‑2xx status code the promise will reject with the
// corresponding error message. Consumers of this module should handle
// errors appropriately (e.g. by displaying an error message to the user).

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "";

interface LoginResponse {
  token?: string;
  error?: string;
  message?: string;
}

interface RegisterResponse {
  user_id?: number;
  message?: string;
  error?: string;
}

/**
 * Authenticate a user with the backend. On success a session token
 * valid for seven days is returned. The caller should persist the
 * returned token (e.g. in localStorage) and include it in the
 * `Authorization` header when making subsequent requests.
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      // The API returns error messages with a non‑OK status code.
      return { error: data.error || data.message || "Login failed" };
    }
    return data as LoginResponse;
  } catch (err: any) {
    return { error: err?.message || "Network error" };
  }
}

/**
 * Register a new user account. On success the new user's ID and a
 * confirmation message are returned. The caller should inform the user
 * to log in using their newly created credentials.
 */
export async function register(username: string, password: string): Promise<RegisterResponse> {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { error: data.error || data.message || "Registration failed" };
    }
    return data as RegisterResponse;
  } catch (err: any) {
    return { error: err?.message || "Network error" };
  }
}

/**
 * Retrieve all trackable locations from the backend. This endpoint
 * does not require authentication. It returns an array of nodes
 * including their identifiers, names and coordinates.
 */
export async function getLocations() {
  const resp = await fetch(`${API_BASE_URL}/api/routes/locations`);
  if (!resp.ok) {
    throw new Error("Failed to fetch locations");
  }
  return resp.json();
}

/**
 * Calculate the least cost and least time paths between two nodes.
 * The backend expects node identifiers, not country codes. See
 * integration.md for details. This endpoint does not require
 * authentication.
 */
export async function calculateRoute(from_node_id: number, to_node_id: number) {
  const resp = await fetch(`${API_BASE_URL}/api/routes/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from_node_id, to_node_id }),
  });
  if (!resp.ok) {
    throw new Error("Failed to calculate route");
  }
  return resp.json();
}

/**
 * Retrieve all packages owned by the currently authenticated user.
 * A valid bearer token must be supplied. If authentication fails the
 * API will respond with a 401 status code.
 */
export async function getPackages(token: string) {
  const resp = await fetch(`${API_BASE_URL}/api/packages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    throw new Error("Failed to fetch packages");
  }
  return resp.json();
}

/**
 * Update the current location of a package. The caller must own the
 * package. The backend will store the update on its blockchain and
 * return the new block's hash.
 */
export async function updatePackage(token: string, packageToken: string, current_node_id: number) {
  const resp = await fetch(`${API_BASE_URL}/api/packages/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ token: packageToken, current_node_id }),
  });
  if (!resp.ok) {
    const data = await resp.json();
    throw new Error(data.error || "Failed to update package");
  }
  return resp.json();
}

/**
 * Retrieve public tracking information for a package by its token.
 * This endpoint does not require authentication. It returns the
 * package's status, last location and creation timestamp.
 */
export async function trackPackage(package_token: string) {
  const resp = await fetch(`${API_BASE_URL}/api/tracking/${encodeURIComponent(package_token)}`);
  if (!resp.ok) {
    throw new Error("Package not found");
  }
  return resp.json();
}

/**
 * Retrieve the blockchain/audit history for a package.
 */
export async function auditPackage(package_token: string) {
  const resp = await fetch(`${API_BASE_URL}/api/tracking/${encodeURIComponent(package_token)}/audit`);
  if (!resp.ok) {
    throw new Error("Failed to fetch audit history");
  }
  return resp.json();
}