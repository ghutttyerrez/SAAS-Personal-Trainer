import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
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
          const refreshToken = localStorage.getItem("refresh_token");
          if (!refreshToken) throw new Error("No refresh token");
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          if (data?.accessToken) {
            localStorage.setItem("access_token", data.accessToken);
            pendingQueue.forEach((resolve) => resolve(data.accessToken));
            pendingQueue = [];
          } else {
            pendingQueue.forEach((resolve) => resolve(null));
            pendingQueue = [];
          }
          isRefreshing = false;
        } else {
          const newToken = await new Promise<string | null>((resolve) => {
            pendingQueue.push(resolve);
          });
          if (!newToken) throw error;
        }
        const token = localStorage.getItem("access_token");
        original.headers = original.headers || {};
        if (token) original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch (e) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
