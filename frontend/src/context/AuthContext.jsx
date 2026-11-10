// src/context/AuthContext.jsx
// Centralized React Context for user authentication, login/register, session persistence, and role management.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Hydrate user session from /api/auth/me on initial app load
  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      // If token is invalid or expired, clear session
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Persist session tokens and user state
  const persistSession = (data) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    const userData = {
      _id: data._id || data.user?._id,
      name: data.name || data.user?.name,
      email: data.email || data.user?.email,
      isAdmin: Boolean(data.isAdmin || data.user?.isAdmin),
    };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // Login handler
  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    persistSession(data);
    return data;
  };

  // Register handler
  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    persistSession(data);
    return data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(user?.isAdmin),
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
