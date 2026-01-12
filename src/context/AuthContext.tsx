"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        setUser(null);
        setRoles({});
        return;
      }
      const data = await res.json();
      setUser(data?.user || null);
      setRoles(data?.roles || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(async (username, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Error al iniciar sesion");
    }
    const data = await res.json();
    setUser(data?.user || null);
    setRoles(data?.roles || {});
    return data;
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setRoles({});
  }, []);

  const canAccess = useCallback(
    (appKey, required = "standard") => {
      const role = roles?.[appKey];
      if (!role) return false;
      if (role === "admin") return true;
      return required === "standard" && role === "standard";
    },
    [roles]
  );

  const value = useMemo(
    () => ({
      user,
      roles,
      loading,
      login,
      logout,
      canAccess,
      refresh: loadMe,
    }),
    [user, roles, loading, login, logout, canAccess, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
