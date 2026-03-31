"use client";

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

const getCurrentTemplateWebsiteId = () => {
  if (typeof window === "undefined") return "";
  return (
    getTemplateWebsiteIdFromSearch(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    ) || ""
  );
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const legacyStorageKey = (vendorId: string) => `template_auth_${vendorId}`;

const storageKey = (vendorId: string, websiteId?: string) => {
  const normalizedWebsiteId =
    String(websiteId || getCurrentTemplateWebsiteId() || "").trim() || "default";
  return `template_auth_${vendorId}_${normalizedWebsiteId}`;
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
  const raw = localStorage.getItem(storageKey(vendorId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TemplateAuthPayload;
  } catch {
    return null;
  }
};

export const setTemplateAuth = (vendorId: string, payload: TemplateAuthPayload) => {
  if (typeof window === "undefined") return;
  const websiteId = String(getCurrentTemplateWebsiteId() || "").trim();
  localStorage.removeItem(legacyStorageKey(vendorId));
  localStorage.setItem(storageKey(vendorId, websiteId), JSON.stringify(payload));
  window.dispatchEvent(
    new CustomEvent("template-auth-updated", { detail: { vendorId, websiteId } })
  );
};

export const clearTemplateAuth = (vendorId: string) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(vendorId));
  localStorage.removeItem(legacyStorageKey(vendorId));
  window.dispatchEvent(
    new CustomEvent("template-auth-updated", { detail: { vendorId } })
  );
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
    const websiteId = getTemplateWebsiteIdFromSearch(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    );
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || "Request failed");
  }

  return response.json();
};
