import axios from "axios";
import Constants from "expo-constants";

const API_URL =
  (Constants.expoConfig?.extra as any)?.API_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:3001/api";

export const http = axios.create({
  baseURL: API_URL,
});

http.interceptors.request.use((config) => {
  // Para simplificar, usar AsyncStorage seria o ideal; mas manteremos localStorage-like via globalThis for web
  const token = (globalThis as any).access_token as string | undefined;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = (globalThis as any).refresh_token as
            | string
            | undefined;
          if (!refreshToken) throw new Error("No refresh token");
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          if (data?.accessToken) {
            (globalThis as any).access_token = data.accessToken;
            (globalThis as any).refresh_token = data.refreshToken;
            pendingQueue.forEach((resolve) => resolve(data.accessToken));
            pendingQueue = [];
          } else {
            pendingQueue.forEach((resolve) => resolve(null));
            pendingQueue = [];
          }
          isRefreshing = false;
        } else {
          const newToken = await new Promise<string | null>((resolve) =>
            pendingQueue.push(resolve)
          );
          if (!newToken) throw error;
        }
        const token = (globalThis as any).access_token as string | undefined;
        original.headers = original.headers || {};
        if (token) original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch (e) {
        (globalThis as any).access_token = undefined;
        (globalThis as any).refresh_token = undefined;
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
