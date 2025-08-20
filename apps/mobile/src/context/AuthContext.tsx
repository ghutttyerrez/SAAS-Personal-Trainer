import React, { createContext, useContext, useMemo, useState } from "react";
import { http } from "../lib/http";

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    tenant_name: string
  ) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(undefined as any);

  const login = async (email: string, password: string) => {
    const { data } = await http.post("/auth/login", { email, password });
    if (data?.accessToken) {
      (globalThis as any).access_token = data.accessToken;
      (globalThis as any).refresh_token = data.refreshToken;
      setToken(data.accessToken);
      setUser(data.user || null);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    tenant_name: string
  ) => {
    const { data } = await http.post("/auth/register", {
      name,
      email,
      password,
      tenant_name,
    });
    if (data?.accessToken) {
      (globalThis as any).access_token = data.accessToken;
      (globalThis as any).refresh_token = data.refreshToken;
      setToken(data.accessToken);
      setUser(data.user || null);
    }
  };

  const logout = () => {
    (globalThis as any).access_token = undefined;
    (globalThis as any).refresh_token = undefined;
    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({ user, token, login, register, logout }),
    [user, token]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
