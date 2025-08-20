import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("access_token")
  );

  useEffect(() => {
    if (token) {
      // opcional: puxar perfil atual
      http
        .get("/auth/me")
        .then((res) => setUser(res.data?.user || null))
        .catch(() => {});
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await http.post("/auth/login", { email, password });
    if (data?.accessToken) {
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
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
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      setToken(data.accessToken);
      setUser(data.user || null);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
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
