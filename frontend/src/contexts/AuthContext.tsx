import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as api from "@/lib/api";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// No longer using a simulated user database. Authentication is now
// delegated to the backend via the API wrapper defined in
// `src/lib/api.ts`. When a user logs in successfully the backend
// returns a session token which we persist in localStorage.

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("vatguard_token");
    const savedUser = localStorage.getItem("vatguard_user");
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        localStorage.removeItem("vatguard_token");
        localStorage.removeItem("vatguard_user");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Call the backend to authenticate. The backend identifies users by
    // `username` rather than `email`, so we pass the email through as
    // the username. On success the API returns a token; on failure it
    // returns an error message.
    const res = await api.login(email, password);
    if (!res || !res.token) {
      return { success: false, error: res?.error || res?.message || "Invalid credentials" };
    }
    // Construct a minimal user object. Since the backend does not
    // currently expose a user details endpoint, we use the email as
    // both the identifier and display name. You can enhance this by
    // adding a `/me` endpoint on the backend to retrieve the user’s
    // actual name and access level.
    const newUser: User = {
      id: email,
      email,
      name: email,
      role: "user",
    };
    setUser(newUser);
    setToken(res.token);
    localStorage.setItem("vatguard_token", res.token);
    localStorage.setItem("vatguard_user", JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("vatguard_token");
    localStorage.removeItem("vatguard_user");
  };

  const updateName = (name: string) => {
    if (!user) return;
    const updated = { ...user, name };
    setUser(updated);
    localStorage.setItem("vatguard_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isAdmin: user?.role === "admin", login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
