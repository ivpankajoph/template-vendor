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

const normalizeStorageToken = (value?: string | null) => String(value || "").trim();

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
  const normalizedVendorId = normalizeStorageToken(vendorId);
  const normalizedWebsiteId =
    normalizeStorageToken(websiteId || getCurrentTemplateWebsiteId() || "") || "default";
  return `template_auth_${normalizedVendorId}_${normalizedWebsiteId}`;
};

const normalizeWebsiteIdentifier = (value?: string | null) =>
  String(value || "").trim().toLowerCase();

const isObjectIdLike = (value?: string | null) =>
  /^[a-f0-9]{24}$/i.test(String(value || "").trim());

const getVendorStorageAliases = (
  vendorId: string,
  payload?: TemplateAuthPayload | null
) => {
  const aliases = new Set<string>();
  const requestedVendorId = normalizeStorageToken(vendorId);
  const accountVendorId = normalizeStorageToken(payload?.user?.vendor_id);

  if (requestedVendorId) aliases.add(requestedVendorId);
  if (accountVendorId) aliases.add(accountVendorId);

  return Array.from(aliases);
};

const getScopedStorageKeys = (vendorId: string, payload?: TemplateAuthPayload | null) => {
  const identifiers = new Set<string>();
  const currentWebsiteId = normalizeWebsiteIdentifier(getCurrentTemplateWebsiteId());
  const accountWebsiteId = normalizeWebsiteIdentifier(payload?.user?.website_id);
  const accountWebsiteSlug = normalizeWebsiteIdentifier(payload?.user?.website_slug);

  if (currentWebsiteId) identifiers.add(currentWebsiteId);
  if (accountWebsiteSlug) identifiers.add(accountWebsiteSlug);
  if (accountWebsiteId) identifiers.add(accountWebsiteId);
  if (!identifiers.size) identifiers.add("default");

  return getVendorStorageAliases(vendorId, payload).flatMap((alias) =>
    Array.from(identifiers).map((identifier) => storageKey(alias, identifier))
  );
};

const parseTemplateAuthPayload = (raw: string | null): TemplateAuthPayload | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TemplateAuthPayload;
  } catch {
    return null;
  }
};

const isAuthAllowedOnCurrentWebsite = (
  payload: TemplateAuthPayload | null,
  websiteId?: string
) => {
  if (!payload) return false;
  const currentWebsiteId = normalizeWebsiteIdentifier(
    websiteId || getCurrentTemplateWebsiteId() || ""
  );
  const accountWebsiteId = normalizeWebsiteIdentifier(payload.user?.website_id);
  const accountWebsiteSlug = normalizeWebsiteIdentifier(payload.user?.website_slug);

  if (!currentWebsiteId) return true;
  if (!accountWebsiteId && !accountWebsiteSlug) return true;

  if (accountWebsiteSlug) {
    return currentWebsiteId === accountWebsiteSlug || currentWebsiteId === accountWebsiteId;
  }

  if (accountWebsiteId && isObjectIdLike(currentWebsiteId)) {
    return currentWebsiteId === accountWebsiteId;
  }

  return true;
};

const dispatchTemplateAuthUpdated = (vendorId: string, websiteId?: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("template-auth-updated", { detail: { vendorId, websiteId } })
  );
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
  const normalizedVendorId = normalizeStorageToken(vendorId);
  if (!normalizedVendorId) return null;
  const currentWebsiteId = String(getCurrentTemplateWebsiteId() || "").trim();
  const scopedKey = storageKey(normalizedVendorId, currentWebsiteId);
  const legacyKey = legacyStorageKey(normalizedVendorId);

  const legacyRaw = localStorage.getItem(legacyKey);
  if (legacyRaw) {
    localStorage.removeItem(legacyKey);
  }

  let raw = localStorage.getItem(scopedKey);
  let payload = parseTemplateAuthPayload(raw);

  if (!raw) {
    const vendorScopedPrefix = `template_auth_${normalizedVendorId}_`;
    const candidateKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith(vendorScopedPrefix)
    );

    for (const candidateKey of candidateKeys) {
      const candidateRaw = localStorage.getItem(candidateKey);
      const candidatePayload = parseTemplateAuthPayload(candidateRaw);
      if (!candidatePayload) continue;
      if (!isAuthAllowedOnCurrentWebsite(candidatePayload, currentWebsiteId)) continue;

      raw = candidateRaw;
      payload = candidatePayload;
      if (candidateKey !== scopedKey && candidateRaw) {
        localStorage.setItem(scopedKey, candidateRaw);
      }
      break;
    }
  }

  if (!raw) return null;
  if (!payload || !isAuthAllowedOnCurrentWebsite(payload, currentWebsiteId)) {
    localStorage.removeItem(scopedKey);
    dispatchTemplateAuthUpdated(vendorId, currentWebsiteId);
    return null;
  }

  return payload;
};

export const useTemplateAuthState = (vendorId: string) => {
  const [auth, setAuth] = useState<TemplateAuthPayload | null>(() =>
    getTemplateAuth(vendorId)
  );

  useEffect(() => {
    const syncAuth = () => {
      setAuth(getTemplateAuth(vendorId));
    };

    syncAuth();

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (
        event.key === legacyStorageKey(vendorId) ||
        event.key.startsWith(`template_auth_${vendorId}_`)
      ) {
        syncAuth();
      }
    };

    window.addEventListener("template-auth-updated", syncAuth);
    window.addEventListener("focus", syncAuth);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("template-auth-updated", syncAuth);
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, [vendorId]);

  return auth;
};

export const setTemplateAuth = (vendorId: string, payload: TemplateAuthPayload) => {
  if (typeof window === "undefined") return;
  const vendorAliases = getVendorStorageAliases(vendorId, payload);
  if (!vendorAliases.length) return;
  const websiteId = String(getCurrentTemplateWebsiteId() || "").trim();
  const normalizedPayload: TemplateAuthPayload = {
    ...payload,
    user: {
      ...payload.user,
      website_id: payload.user?.website_id || websiteId || null,
    },
  };
  vendorAliases.forEach((alias) => {
    localStorage.removeItem(legacyStorageKey(alias));
  });
  const serializedPayload = JSON.stringify(normalizedPayload);
  getScopedStorageKeys(vendorId, normalizedPayload).forEach((key) => {
    localStorage.setItem(key, serializedPayload);
  });
  vendorAliases.forEach((alias) => {
    dispatchTemplateAuthUpdated(alias, websiteId);
  });
};

export const clearTemplateAuth = (vendorId: string, websiteId?: string) => {
  if (typeof window === "undefined") return;
  const normalizedVendorId = normalizeStorageToken(vendorId);
  if (!normalizedVendorId) return;
  const normalizedWebsiteId = String(websiteId || getCurrentTemplateWebsiteId() || "").trim();
  localStorage.removeItem(storageKey(normalizedVendorId, normalizedWebsiteId));
  localStorage.removeItem(legacyStorageKey(normalizedVendorId));
  dispatchTemplateAuthUpdated(normalizedVendorId, normalizedWebsiteId);
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
    const message = String(error?.message || "Request failed");
    if (
      response.status === 403 &&
      message.includes("not allowed on the current website")
    ) {
      clearTemplateAuth(vendorId);
      redirectToTemplateLogin(vendorId);
    }
    throw new Error(message);
  }

  return response.json();
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
    const websiteId = getTemplateWebsiteIdFromSearch(
      window.location.pathname,
      new URLSearchParams(window.location.search)
    );
    if (websiteId) {
      headers.set("x-template-website", websiteId);
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}/template-users${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(String(error?.message || "Request failed"));
  }

  return response.json();
};
