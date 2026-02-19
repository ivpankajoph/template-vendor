import axios, { AxiosInstance } from "axios";
import { store } from "../store";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { logoutAuth } from "@/store/slices/authSlice";

const BASE_URL = NEXT_PUBLIC_API_URL;

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    if (typeof window === "undefined") return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const isJwtExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + 1000;
};

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const state = store.getState() as any;
    const token = state.auth?.token;
    const role = state.auth?.user?.role;

    if (token && isJwtExpired(token)) {
      store.dispatch(logoutAuth());
      return Promise.reject(new axios.Cancel("Session expired"));
    }

    if (
      config.url &&
      !config.url.startsWith("/auth") &&
      !config.url.includes("/login")
    ) {
      const prefix = role === "vendor" ? "/vendor" : "/admin";
      if (!config.url.startsWith(prefix)) {
        config.url = `${prefix}${config.url}`;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = (store.getState() as any)?.auth?.token;
    if (error.response?.status === 401 && token) {
      store.dispatch(logoutAuth());
    }
    return Promise.reject(error);
  }
);

export default api;
