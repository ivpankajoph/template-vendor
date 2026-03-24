import { NEXT_PUBLIC_API_URL } from "@/config/variables";

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

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

const getSessionId = () =>
  typeof window === "undefined"
    ? ""
    : getStorageId("oph_session_id", sessionStorage);

const getVisitorId = () =>
  typeof window === "undefined"
    ? ""
    : getStorageId("oph_visitor_id", localStorage);

const getTemplateMeta = () => {
  if (typeof window === "undefined") return {};
  const templateId = window.localStorage.getItem("oph_template_id") || "";
  const templateKey = window.localStorage.getItem("oph_template_key") || "";
  const templateName = window.localStorage.getItem("oph_template_name") || "";
  return {
    template_id: templateId,
    template_key: templateKey,
    template_name: templateName,
  };
};

const getDocumentVendorId = () => {
  if (typeof document === "undefined") return "";
  return (
    document.body?.dataset?.templateVendor ||
    document.documentElement?.dataset?.templateVendor ||
    ""
  );
};

const getVendorIdFromPath = (path: string) => {
  const match = path.match(/\/template\/([^/?#]+)/);
  return match?.[1] || getDocumentVendorId();
};

const getSourceFromPath = (path: string, vendorId = "") =>
  path.startsWith("/template/") || Boolean(vendorId) ? "template" : "ophmart";

type AnalyticsPayload = {
  eventType: "add_to_cart" | "checkout" | "purchase";
  vendorId?: string;
  userId?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  quantity?: number;
  cartTotal?: number;
  orderId?: string;
  metadata?: Record<string, unknown>;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const trackMetaPixelEvent = (
  eventName: "AddToCart" | "InitiateCheckout" | "Purchase",
  params: Record<string, unknown>
) => {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;

  try {
    window.fbq("track", eventName, params);
  } catch {
    // Meta Pixel should not block user flows.
  }
};

const sendAnalyticsEvent = async (payload: AnalyticsPayload) => {
  if (!API_BASE || typeof window === "undefined") return;

  const path = window.location.pathname;
  const vendorId = payload.vendorId || getVendorIdFromPath(path);
  const source = getSourceFromPath(path, vendorId);
  const metadata = { ...getTemplateMeta(), ...(payload.metadata || {}) };

  const body = {
    ...payload,
    vendorId,
    source,
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    path,
    fullUrl: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer || "",
    metadata,
  };

  try {
    await fetch(`${API_BASE}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch (error) {
    // Analytics should not block user flows.
  }
};

export const trackAddToCart = (payload: Omit<AnalyticsPayload, "eventType">) => {
  trackMetaPixelEvent("AddToCart", {
    content_ids: payload.productId ? [payload.productId] : [],
    content_name: payload.productName || "",
    content_type: "product",
    currency: "INR",
    num_items: Number(payload.quantity || 1),
    value: Number(payload.productPrice || 0) * Number(payload.quantity || 1),
  });

  return sendAnalyticsEvent({ ...payload, eventType: "add_to_cart" });
};

export const trackCheckout = (payload: Omit<AnalyticsPayload, "eventType">) => {
  trackMetaPixelEvent("InitiateCheckout", {
    currency: "INR",
    num_items: Number(payload.quantity || 1),
    value: Number(payload.cartTotal || 0),
  });

  return sendAnalyticsEvent({ ...payload, eventType: "checkout" });
};

export const trackPurchase = (payload: Omit<AnalyticsPayload, "eventType">) => {
  trackMetaPixelEvent("Purchase", {
    content_ids: payload.productId ? [payload.productId] : [],
    currency: "INR",
    num_items: Number(payload.quantity || 1),
    value: Number(payload.cartTotal || 0),
    order_id: payload.orderId || "",
  });

  return sendAnalyticsEvent({ ...payload, eventType: "purchase" });
};
