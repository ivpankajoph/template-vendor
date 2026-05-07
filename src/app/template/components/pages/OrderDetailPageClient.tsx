"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useTemplateAuthState,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateScopedPath } from "@/lib/template-route";

type OrderItem = {
  _id?: string;
  item_type?: "product" | "food";
  product_id?: string;
  food_menu_item_id?: string;
  product_name: string;
  image_url?: string;
  variant_attributes?: Record<string, string>;
  quantity: number;
  unit_price?: number;
  total_price?: number;
};

type OrderDetail = {
  _id: string;
  order_number: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  createdAt?: string;
  subtotal?: number;
  discount?: number;
  shipping_fee?: number;
  total?: number;
  items: OrderItem[];
  shipping_address?: {
    full_name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    delivery_instructions?: string;
    country?: string;
  };
  delivery_provider?: string;
  delivery_cost?: number;
  actual_delivery_cost?: number;
  borzo?: {
    order_id?: number | string;
    status?: string;
    status_description?: string;
    tracking_url?: string;
    courier?: Record<string, unknown>;
  };
  delhivery?: {
    order_id?: string;
    waybill?: string;
    waybills?: string[];
    label_url?: string;
    pickup_location?: string;
    pickup_request_id?: string;
    pickup_request_status?: string;
    pickup_request_message?: string;
    pickup_request_date?: string;
    pickup_request_time?: string;
    pickup_request_packages?: number;
    payment_mode?: string;
    status?: string;
    status_description?: string;
    package_count?: number;
    packages?: unknown;
    tracking_data?: unknown;
    scans?: unknown;
    updated_at?: string;
  };
  shadowfax?: {
    order_model?: string;
    order_id?: string;
    tracking_number?: string;
    client_order_id?: string;
    payment_mode?: string;
    status?: string;
    status_description?: string;
  };
};

type TimelinePoint = {
  status: string;
  description: string;
  location: string;
  time: string;
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const formatMoney = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`;

const readText = (value: unknown) => String(value ?? "").trim();

const normalizeTimeline = (rows: unknown): TimelinePoint[] => {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map((row: any) => ({
      status: readText(row?.status || row?.status_type || row?.scan || "Update"),
      description: readText(row?.description || row?.remark || row?.instructions || ""),
      location: readText(row?.location || row?.city || row?.hub || ""),
      time: readText(row?.time || row?.updated_at || row?.date || ""),
    }))
    .filter((row) => row.status);
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
};

const formatProviderName = (value?: string) => {
  const provider = readText(value || "none").toLowerCase();
  if (provider === "delhivery") return "Delhivery";
  if (provider === "borzo") return "Borzo";
  if (provider === "shadowfax") return "Shadowfax";
  return "Not assigned";
};

const getDeliveryStatus = (order: OrderDetail) =>
  readText(
    order.delhivery?.status ||
      order.delhivery?.status_description ||
      order.borzo?.status_description ||
      order.borzo?.status ||
      order.shadowfax?.status_description ||
      order.shadowfax?.status ||
      order.status,
  );

const getTrackingNumber = (order: OrderDetail) =>
  readText(
    order.delhivery?.waybill ||
      order.delhivery?.waybills?.[0] ||
      order.shadowfax?.tracking_number ||
      order.shadowfax?.order_id ||
      order.borzo?.order_id ||
      "",
  );

const getDeliveryTimeline = (order: OrderDetail) =>
  normalizeTimeline(order.delhivery?.scans);

export default function OrderDetailPageClient() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const orderId = params.order_id as string;
  const router = useRouter();
  const auth = useTemplateAuthState(vendorId);
  const loginPath = buildTemplateScopedPath({ vendorId, suffix: "login" });
  const ordersPath = buildTemplateScopedPath({ vendorId, suffix: "orders" });
  const orderDetailPath = buildTemplateScopedPath({
    vendorId,
    suffix: `orders/${orderId}`,
  });
  const productPath = (productId?: string) =>
    productId ? buildTemplateScopedPath({ vendorId, suffix: `product/${productId}` }) : "#";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const isStudio = variant.key === "studio";
  const isWhiteRose = variant.key === "whiterose";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "oragze" ||
    variant.key === "whiterose";
  const pageClass = isWhiteRose
    ? "min-h-screen bg-[#f1f3f6] text-[#172337]"
    : isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f5f5f7] text-slate-900"
      : "min-h-screen bg-gray-50";
  const panelClass = isWhiteRose
    ? "rounded-[24px] border border-[#dfe3eb] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
    : isStudio
    ? "rounded-2xl border border-slate-800 bg-slate-900/70"
    : "rounded-2xl border border-slate-200 bg-white shadow-sm";

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await templateApiFetch(vendorId, `/orders/${orderId}`);
        setOrder(data?.order || null);
        setError("");
      } catch (err: any) {
        setOrder(null);
        setError(err?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    if (orderId) load();
  }, [auth, vendorId, orderId]);

  const totals = useMemo(() => {
    if (!order) return null;
    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const shipping = Number(order.shipping_fee || 0);
    const baseAmount = Math.max(subtotal - discount + shipping, 0);
    const taxAmount = Math.max(Number(order.total || 0) - baseAmount, 0);
    const taxRate = baseAmount ? (taxAmount / baseAmount) * 100 : 0;
    return {
      subtotal,
      discount,
      shipping,
      taxAmount,
      taxRate,
      total: Number(order.total || 0),
    };
  }, [order]);

  const deliveryTimeline = useMemo(
    () => (order ? getDeliveryTimeline(order) : []),
    [order],
  );

  const downloadInvoice = async () => {
    if (!auth?.token) return;
    try {
      setDownloading(true);
      const response = await fetch(`${API_BASE}/template-users/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to download invoice");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${order?.order_number || orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  if (!auth) {
    return (
      <div className={pageClass}>
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">Login required</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to view your order.</p>
            <button
              onClick={() => router.push(`${loginPath}?next=${encodeURIComponent(orderDetailPath)}`)}
              className="mt-6 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-6">
        <div className={panelClass}>
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm text-slate-500">Order details</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                {order?.order_number ? `Order #${order.order_number}` : "Order"}
              </h1>
              <p className="text-sm text-slate-500">
                {order?.createdAt ? new Date(order.createdAt).toLocaleString() : "Loading..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push(ordersPath)}
                className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Back to orders
              </button>
              <button
                type="button"
                onClick={downloadInvoice}
                disabled={!order || downloading}
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {downloading ? "Downloading..." : "Download invoice"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        {loading && (
          <div className={`${panelClass} p-6 text-center text-sm text-slate-500`}>
            Loading order details...
          </div>
        )}

        {!loading && !order && (
          <div className={`${panelClass} p-6 text-center text-sm text-slate-500`}>
            Order not found.
          </div>
        )}

        {order && totals && (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className={panelClass} id="delivery-tracking">
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Delivery tracking
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Courier status, tracking number, and scan updates.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                      {formatProviderName(order.delivery_provider)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Tracking / AWB", getTrackingNumber(order) || "Not available"],
                      ["Delivery status", getDeliveryStatus(order) || "Not available"],
                      ["Payment mode", order.delhivery?.payment_mode || order.shadowfax?.payment_mode || order.payment_method || "Not available"],
                      ["Package count", String(order.delhivery?.package_count || order.delhivery?.pickup_request_packages || order.items?.length || 0)],
                      ["Pickup location", order.delhivery?.pickup_location || "Not available"],
                      ["Pickup request", order.delhivery?.pickup_request_id || order.delhivery?.pickup_request_status || "Not available"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-white p-3 text-sm">
                        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                        <p className="mt-1 break-words font-semibold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {order.delhivery?.pickup_request_message ||
                  order.delhivery?.pickup_request_date ||
                  order.delhivery?.pickup_request_time ? (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="font-semibold">Pickup details</p>
                      <p className="mt-1">
                        {order.delhivery?.pickup_request_message ||
                          order.delhivery?.pickup_request_status ||
                          "Pickup request created"}
                      </p>
                      <p className="mt-1 text-xs">
                        {[order.delhivery?.pickup_request_date, order.delhivery?.pickup_request_time]
                          .filter(Boolean)
                          .join(" at ") || "Slot not available"}
                      </p>
                    </div>
                  ) : null}

                  {order.borzo?.tracking_url ? (
                    <a
                      href={order.borzo.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Open courier tracking
                    </a>
                  ) : null}

                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Tracking timeline
                    </h3>
                    {deliveryTimeline.length ? (
                      <div className="mt-4 space-y-0">
                        {deliveryTimeline.map((point, index) => (
                          <div
                            key={`${point.status}-${point.time}-${index}`}
                            className="flex gap-3"
                          >
                            <div className="flex w-6 flex-col items-center">
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                              {index !== deliveryTimeline.length - 1 ? (
                                <span className="mt-1 h-full w-px bg-slate-200" />
                              ) : null}
                            </div>
                            <div className="pb-4 text-sm">
                              <p className="font-semibold text-slate-900">{point.status}</p>
                              {point.description ? (
                                <p className="text-slate-600">{point.description}</p>
                              ) : null}
                              <p className="text-xs text-slate-500">
                                {point.location || "Location not available"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDateTime(point.time)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                        Tracking updates will appear here after the courier shares scans.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={panelClass}>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                  <div className="mt-4 space-y-4">
                    {order.items?.map((item, index) => (
                      <div
                        key={item._id || item.product_id || item.food_menu_item_id || `${item.product_name}-${index}`}
                        className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center"
                      >
                        {item.product_id ? (
                          <Link
                            href={productPath(item.product_id)}
                            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                item.image_url ||
                                "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&q=80"
                              }
                              alt={item.product_name || "Product"}
                              className="h-full w-full object-cover"
                            />
                          </Link>
                        ) : (
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                item.image_url ||
                                "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&q=80"
                              }
                              alt={item.product_name || "Product"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          {item.product_id ? (
                            <Link
                              href={productPath(item.product_id)}
                              className="text-base font-semibold text-slate-900 hover:text-slate-700"
                            >
                              {item.product_name}
                            </Link>
                          ) : (
                            <p className="text-base font-semibold text-slate-900">
                              {item.product_name}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {Object.values(item.variant_attributes || {}).join(" / ") || "Standard"}
                          </p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right text-sm font-semibold text-slate-900">
                          {formatMoney(item.total_price || 0)}
                          <p className="text-xs text-slate-500">{formatMoney(item.unit_price || 0)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={panelClass}>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Shipping address</h2>
                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {order.shipping_address?.full_name || "Customer"}
                    </p>
                    <p>{order.shipping_address?.phone}</p>
                    <p>{order.shipping_address?.line1}</p>
                    {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
                    <p>
                      {order.shipping_address?.city}, {order.shipping_address?.state}{" "}
                      {order.shipping_address?.pincode}
                    </p>
                    {order.shipping_address?.landmark ? (
                      <p>Landmark: {order.shipping_address.landmark}</p>
                    ) : null}
                    {order.shipping_address?.delivery_instructions ? (
                      <p>
                        Instructions: {order.shipping_address.delivery_instructions}
                      </p>
                    ) : null}
                    <p>{order.shipping_address?.country || "India"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className={panelClass}>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment</span>
                      <span className="text-slate-900">
                        {order.payment_method || "cod"} ({order.payment_status || "pending"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-900">{formatMoney(totals.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span className="text-slate-900">- {formatMoney(totals.discount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="text-slate-900">{formatMoney(totals.shipping)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GST ({totals.taxRate.toFixed(2)}%)</span>
                      <span className="text-slate-900">{formatMoney(totals.taxAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 text-base font-semibold text-slate-900">
                      <span>Total</span>
                      <span>{formatMoney(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
