"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";

const getStorageId = (key: string, storage: Storage) => {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    storage.setItem(key, generated);
    return generated;
  } catch (error) {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

const getVendorIdFromPath = (path: string) => {
  const match = path.match(/\/template\/([^/?#]+)/);
  return match?.[1] || "";
};

const getSourceFromPath = (path: string) =>
  path.startsWith("/template/") ? "template" : "ophmart";

const buildMetadata = (searchParams: URLSearchParams | null) => {
  if (!searchParams) return {};
  const utmSource = searchParams.get("utm_source");
  const utmMedium = searchParams.get("utm_medium");
  const utmCampaign = searchParams.get("utm_campaign");
  const utmTerm = searchParams.get("utm_term");
  const utmContent = searchParams.get("utm_content");
  return {
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    utmContent,
  };
};

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useSelector((state: RootState) => state.customerAuth?.user);
  const templateData = useSelector((state: RootState) => state.alltemplatepage?.data);
  const userIdRef = useRef<string>("");
  const visitorIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");
  const metadataRef = useRef<Record<string, unknown>>({});
  const templateMetaRef = useRef<Record<string, unknown>>({});
  const clientIpRef = useRef<string>("");
  const clientIpPromiseRef = useRef<Promise<string> | null>(null);
  const lastPageRef = useRef<{
    path: string;
    fullUrl: string;
    startedAt: number;
  } | null>(null);

  const apiBase = NEXT_PUBLIC_API_URL || "";
  const isDev =
    typeof process !== "undefined" && process.env.NODE_ENV !== "production";

  const metadata = useMemo(() => buildMetadata(searchParams), [searchParams]);

  useEffect(() => {
    metadataRef.current = metadata;
  }, [metadata]);

  useEffect(() => {
    const templateMeta = {
      template_id: templateData?._id || templateData?.id || "",
      template_key: templateData?.template_key || templateData?.templateKey || "",
      template_name: templateData?.template_name || templateData?.templateName || "",
    };
    templateMetaRef.current = templateMeta;
    if (typeof window !== "undefined") {
      if (templateMeta.template_id) {
        window.localStorage.setItem("oph_template_id", String(templateMeta.template_id));
      }
      if (templateMeta.template_key) {
        window.localStorage.setItem("oph_template_key", String(templateMeta.template_key));
      }
      if (templateMeta.template_name) {
        window.localStorage.setItem("oph_template_name", String(templateMeta.template_name));
      }
    }
  }, [templateData]);

  useEffect(() => {
    userIdRef.current =
      user?._id || user?.id || user?.userId || user?.customerId || "";
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    visitorIdRef.current = getStorageId("oph_visitor_id", localStorage);
    sessionIdRef.current = getStorageId("oph_session_id", sessionStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;
    const ipPromise = fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ip) return String(data.ip);
        return "";
      })
      .catch(() => "");

    clientIpPromiseRef.current = ipPromise;
    ipPromise
      .then((ip) => {
        if (!isMounted || !ip) return;
        clientIpRef.current = ip;
        if (isDev) {
          console.debug("AnalyticsTracker client IP", ip);
        }
      })
      .catch((error) => {
        if (isDev) {
          console.warn("AnalyticsTracker IP lookup failed", error);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [isDev]);

  const resolveClientIp = async () => {
    if (clientIpRef.current) return clientIpRef.current;
    const promise = clientIpPromiseRef.current;
    if (!promise) return "";
    const timeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve(""), 800)
    );
    const ip = await Promise.race([promise, timeout]);
    if (ip) clientIpRef.current = ip;
    return clientIpRef.current;
  };

  useEffect(() => {
    if (!apiBase || typeof window === "undefined") return;

    const path = `${window.location.pathname}${window.location.search}`;
    const fullUrl = window.location.href;
    const now = Date.now();
    const source = getSourceFromPath(window.location.pathname);

    if (!apiBase) {
      if (isDev) {
        console.warn("AnalyticsTracker: NEXT_PUBLIC_API_URL is empty");
      }
      return;
    }

    const analyticsUrl = apiBase.endsWith("/v1")
      ? `${apiBase}/analytics/track`
      : `${apiBase}/v1/analytics/track`;

    const sendEvent = async (payload: Record<string, unknown>) => {
      const url = analyticsUrl;
      const clientIp = await resolveClientIp();
      const deviceHint =
        typeof navigator !== "undefined" &&
        "userAgentData" in navigator &&
        (navigator as any).userAgentData?.mobile
          ? "mobile"
          : "desktop";
      const body = JSON.stringify({
        ...payload,
        clientIp,
        clientUserAgent: navigator.userAgent,
        clientDevice: deviceHint,
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        const ok = navigator.sendBeacon(url, blob);
        if (isDev) {
          console.debug("AnalyticsTracker beacon", ok, payload);
        }
        return;
      }

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok && isDev) {
            console.warn("AnalyticsTracker failed", res.status, payload);
          }
        })
        .catch((error) => {
          if (isDev) {
            console.warn("AnalyticsTracker error", error);
          }
        });
    };

    const prev = lastPageRef.current;
    if (prev && prev.path !== path) {
      void sendEvent({
        eventType: "page_duration",
        path: prev.path,
        fullUrl: prev.fullUrl,
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        userId: userIdRef.current,
        vendorId: getVendorIdFromPath(prev.path),
        source: getSourceFromPath(prev.path),
        durationMs: Math.max(0, now - prev.startedAt),
        metadata: { ...metadata, ...templateMetaRef.current },
      });
    }

    void sendEvent({
      eventType: "page_view",
      path,
      fullUrl,
      title: document.title,
      referrer: document.referrer || "",
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      userId: userIdRef.current,
      vendorId: getVendorIdFromPath(path),
      source,
      screen: { width: window.screen.width, height: window.screen.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      metadata: { ...metadata, ...templateMetaRef.current },
    });

    lastPageRef.current = { path, fullUrl, startedAt: now };
  }, [apiBase, pathname, searchParams, metadata]);

  useEffect(() => {
    if (!apiBase || typeof window === "undefined") return;
    if (!apiBase) {
      if (isDev) {
        console.warn("AnalyticsTracker: NEXT_PUBLIC_API_URL is empty");
      }
      return;
    }

    const analyticsUrl = apiBase.endsWith("/v1")
      ? `${apiBase}/analytics/track`
      : `${apiBase}/v1/analytics/track`;

    const sendEvent = async (payload: Record<string, unknown>) => {
      const url = analyticsUrl;
      const clientIp = await resolveClientIp();
      const deviceHint =
        typeof navigator !== "undefined" &&
        "userAgentData" in navigator &&
        (navigator as any).userAgentData?.mobile
          ? "mobile"
          : "desktop";
      const body = JSON.stringify({
        ...payload,
        clientIp,
        clientUserAgent: navigator.userAgent,
        clientDevice: deviceHint,
      });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        const ok = navigator.sendBeacon(url, blob);
        if (isDev) {
          console.debug("AnalyticsTracker beacon", ok, payload);
        }
        return;
      }
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      })
        .then((res) => {
          if (!res.ok && isDev) {
            console.warn("AnalyticsTracker failed", res.status, payload);
          }
        })
        .catch((error) => {
          if (isDev) {
            console.warn("AnalyticsTracker error", error);
          }
        });
    };

    return () => {
      const prev = lastPageRef.current;
      if (!prev) return;
      void sendEvent({
        eventType: "page_duration",
        path: prev.path,
        fullUrl: prev.fullUrl,
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
        userId: userIdRef.current,
        vendorId: getVendorIdFromPath(prev.path),
        source: getSourceFromPath(prev.path),
        durationMs: Math.max(0, Date.now() - prev.startedAt),
        metadata: { ...metadataRef.current, ...templateMetaRef.current },
      });
    };
  }, [apiBase]);

  return null;
}
