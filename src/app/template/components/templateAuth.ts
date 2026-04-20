"use client";

import { useEffect, useState } from "react";

import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { buildStorefrontScopedPath } from "@/lib/template-route";
import { getTemplateWebsiteIdFromSearch } from "@/lib/template-website";

export type TemplateAuthPayload = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    vendor_id: string;
    website_id?: string | null;
    website_slug?: string;
    website_name?: string;
  };
};

const normalizeWebsiteId = (value?: string | null) => String(value || "").trim();

const getTemplateWebsiteIdFromDocument = () => {
  if (typeof document === "undefined") return "";

  return normalizeWebsiteId(
    document.body?.dataset?.templateWebsite ||
      document.documentElement?.dataset?.templateWebsite ||
      ""
  );
};

const getCurrentTemplateWebsiteId = () => {
  if (typeof window === "undefined") return "";
  return (
    getTemplateWebsiteIdFromSearch(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    ) ||
    getTemplateWebsiteIdFromDocument() ||
    ""
  );
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const legacyStorageKey = (vendorId: string) => `template_auth_${vendorId}`;

const storageKey = (vendorId: string, websiteId?: string) => {
  const normalizedVendorId = normalizeWebsiteId(vendorId);
  const normalizedWebsiteId =
    normalizeWebsiteId(websiteId || getCurrentTemplateWebsiteId()) || "default";
  return `template_auth_${normalizedVendorId}_${normalizedWebsiteId}`;
};

const getVendorStorageKeys = (vendorId: string) => {
  if (typeof window === "undefined") return [];

  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(`template_auth_${vendorId}_`)) {
      keys.push(key);
    }
  }

  return keys;
};

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

const redirectToTemplateLogin = (vendorId: string) => {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname || "/";
  const loginPath = buildStorefrontScopedPath({
    vendorId,
    pathname: currentPath,
    suffix: "login",
  });
  if (window.location.pathname.startsWith(loginPath)) return;

  const nextPath =
    `${window.location.pathname}${window.location.search}${window.location.hash}` ||
    buildStorefrontScopedPath({
      vendorId,
      pathname: currentPath,
    });

  window.location.replace(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
};

export const getTemplateAuth = (vendorId: string): TemplateAuthPayload | null => {
  if (typeof window === "undefined") return null;
  const currentWebsiteId = normalizeWebsiteId(getCurrentTemplateWebsiteId());

  const candidateKeys = [
    storageKey(vendorId),
    storageKey(vendorId, getTemplateWebsiteIdFromDocument()),
    legacyStorageKey(vendorId),
    ...getVendorStorageKeys(vendorId),
  ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

  const parsedPayloads: TemplateAuthPayload[] = [];

  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const payload = JSON.parse(raw) as TemplateAuthPayload;
      parsedPayloads.push(payload);
      const payloadWebsiteId = normalizeWebsiteId(payload?.user?.website_id);
      const payloadWebsiteSlug = normalizeWebsiteId(payload?.user?.website_slug);
      if (
        currentWebsiteId &&
        (payloadWebsiteId === currentWebsiteId || payloadWebsiteSlug === currentWebsiteId)
      ) {
        return payload;
      }
    } catch {
      localStorage.removeItem(key);
    }
  }

  return parsedPayloads[0] || null;
};

export const setTemplateAuth = (vendorId: string, payload: TemplateAuthPayload) => {
  if (typeof window === "undefined") return;
  const routeWebsiteId = getCurrentTemplateWebsiteId();
  const websiteId =
    normalizeWebsiteId(payload?.user?.website_id) || routeWebsiteId;
  localStorage.removeItem(legacyStorageKey(vendorId));
  localStorage.setItem(storageKey(vendorId, websiteId), JSON.stringify(payload));
  if (routeWebsiteId && routeWebsiteId !== websiteId) {
    localStorage.setItem(storageKey(vendorId, routeWebsiteId), JSON.stringify(payload));
  }
  window.dispatchEvent(
    new CustomEvent("template-auth-updated", { detail: { vendorId, websiteId } })
  );
};

export const clearTemplateAuth = (vendorId: string, websiteId?: string) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(legacyStorageKey(vendorId));
  getVendorStorageKeys(vendorId).forEach((key) => {
    localStorage.removeItem(key);
  });
  if (websiteId) {
    localStorage.removeItem(storageKey(vendorId, websiteId));
  }
  localStorage.removeItem(storageKey(vendorId));
  window.dispatchEvent(
    new CustomEvent("template-auth-updated", { detail: { vendorId } })
  );
};

export const useTemplateAuthState = (vendorId: string) => {
  const [auth, setAuth] = useState<TemplateAuthPayload | null>(() =>
    getTemplateAuth(vendorId)
  );

  useEffect(() => {
    setAuth(getTemplateAuth(vendorId));

    const syncAuth = () => {
      setAuth(getTemplateAuth(vendorId));
    };

    window.addEventListener("template-auth-updated", syncAuth);
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);

    return () => {
      window.removeEventListener("template-auth-updated", syncAuth);
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
    };
  }, [vendorId]);

  return auth;
};

export const templateApiFetchWithToken = async (
  vendorId: string,
  token: string,
  path: string,
  options: RequestInit = {}
) => {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const websiteId = getCurrentTemplateWebsiteId();
    if (websiteId) {
      headers.set("x-template-website", websiteId);
    }
  }
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}/template-users${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearTemplateAuth(vendorId);
    redirectToTemplateLogin(vendorId);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorMessage = "";

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText);
        errorMessage = String(parsed?.message || parsed?.error || "").trim();
      } catch {
        errorMessage = errorText.trim();
      }
    }

    throw new Error(errorMessage || `Request failed (${response.status})`);
  }

  return response.json();
};

export const templateApiFetch = async (
  vendorId: string,
  path: string,
  options: RequestInit = {}
) => {
  const auth = getTemplateAuth(vendorId);
  if (auth?.token && isJwtExpired(auth.token)) {
    clearTemplateAuth(vendorId);
    redirectToTemplateLogin(vendorId);
    throw new Error("Session expired. Please log in again.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (typeof window !== "undefined") {
    const websiteId = getCurrentTemplateWebsiteId();
    if (websiteId) {
      headers.set("x-template-website", websiteId);
    }
  }
  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  const response = await fetch(`${API_BASE}/template-users${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && auth?.token) {
    clearTemplateAuth(vendorId);
    redirectToTemplateLogin(vendorId);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let errorMessage = "";

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText);
        errorMessage = String(parsed?.message || parsed?.error || "").trim();
      } catch {
        errorMessage = errorText.trim();
      }
    }

    throw new Error(errorMessage || `Request failed (${response.status})`);
  }

  return response.json();
};
