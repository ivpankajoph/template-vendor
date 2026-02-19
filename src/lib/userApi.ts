import axios, { AxiosInstance } from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";

const BASE_URL = NEXT_PUBLIC_API_URL;

const userApi: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/users`,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

let isSessionRedirectInProgress = false;

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

const isAuthPath = (url?: string) => {
  if (!url) return false;
  return ["/login", "/register", "/send-otp", "/verify-otp"].some((path) =>
    url.includes(path)
  );
};

const forceCustomerLogout = async () => {
  if (isSessionRedirectInProgress) return;
  isSessionRedirectInProgress = true;

  try {
    const [{ store }, { logoutCustomer }] = await Promise.all([
      import("@/store"),
      import("@/store/slices/customerAuthSlice"),
    ]);
    store.dispatch(logoutCustomer());
  } catch {
    // Ignore logout failures and still try to redirect.
  }

  if (typeof window !== "undefined") {
    if (!window.location.pathname.startsWith("/login")) {
      const nextPath =
        `${window.location.pathname}${window.location.search}${window.location.hash}` ||
        "/";
      window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
  }

  isSessionRedirectInProgress = false;
};

userApi.interceptors.request.use(
  async (config) => {
    try {
      const storeModule = await import("@/store");
      const state = storeModule.store.getState() as any;
      const token = state.customerAuth?.token;
      if (token && isJwtExpired(token)) {
        await forceCustomerLogout();
        return Promise.reject(new axios.Cancel("Session expired"));
      }
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Ignore when store isn't initialized yet.
    }
    return config;
  },
  (error) => Promise.reject(error),
);

userApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url;

    if (status === 401 && !isAuthPath(requestUrl)) {
      try {
        const { store } = await import("@/store");
        const token = (store.getState() as any)?.customerAuth?.token;
        if (token) {
          await forceCustomerLogout();
        }
      } catch {
        // Ignore store access errors in interceptor.
      }
    }

    return Promise.reject(error);
  }
);

export default userApi;
