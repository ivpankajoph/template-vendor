"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useTemplateAuthState,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateScopedPath } from "@/lib/template-route";

type Order = {
  _id: string;
  order_number: string;
  status: string;
  total: number;
  payment_method?: string;
  createdAt: string;
  delivery_provider?: string;
  borzo?: {
    order_id?: number | string;
    status?: string;
    status_description?: string;
    tracking_url?: string;
  };
  delhivery?: {
    waybill?: string;
    waybills?: string[];
    status?: string;
    status_description?: string;
    pickup_request_status?: string;
  };
  shadowfax?: {
    tracking_number?: string;
    order_id?: string;
    status?: string;
    status_description?: string;
  };
  items: Array<{
    _id?: string;
    product_id?: string;
    product_name: string;
    image_url?: string;
    variant_attributes?: Record<string, string>;
    quantity: number;
    total_price?: number;
  }>;
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const formatMoney = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`;

const readText = (value: unknown) => String(value ?? "").trim();

const formatProviderName = (value?: string) => {
  const provider = readText(value || "none").toLowerCase();
  if (provider === "delhivery") return "Delhivery";
  if (provider === "borzo") return "Borzo";
  if (provider === "shadowfax") return "Shadowfax";
  return "Delivery";
};

const getDeliveryStatus = (order: Order) =>
  readText(
    order.delhivery?.status ||
      order.delhivery?.status_description ||
      order.delhivery?.pickup_request_status ||
      order.borzo?.status_description ||
      order.borzo?.status ||
      order.shadowfax?.status_description ||
      order.shadowfax?.status ||
      "",
  );

const getTrackingNumber = (order: Order) =>
  readText(
    order.delhivery?.waybill ||
      order.delhivery?.waybills?.[0] ||
      order.shadowfax?.tracking_number ||
      order.shadowfax?.order_id ||
      order.borzo?.order_id ||
      "",
  );

export default function TemplateOrdersPage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = useTemplateAuthState(vendorId);
  const ordersPath = buildTemplateScopedPath({ vendorId, suffix: "orders" });
  const loginPath = buildTemplateScopedPath({ vendorId, suffix: "login" });
  const productPath = (productId?: string) =>
    productId ? buildTemplateScopedPath({ vendorId, suffix: `product/${productId}` }) : "#";
  const orderDetailPath = (orderId?: string) =>
    orderId ? buildTemplateScopedPath({ vendorId, suffix: `orders/${orderId}` }) : "#";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState("");

  const isStudio = variant.key === "studio";
  const isWhiteRose = variant.key === "whiterose";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isWhiteRose
    ? "min-h-screen bg-[#f1f3f6] text-[#172337]"
    : isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-gray-50";
  const panelClass = isWhiteRose
    ? "template-surface-card rounded-[24px] border border-[#dfe3eb] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
    : isStudio
    ? "template-surface-card rounded-md border border-slate-800 bg-slate-900/80 text-slate-100"
    : isTrend
      ? "template-surface-card rounded-[1.4rem] border border-rose-200 bg-white"
      : isMinimal
        ? "template-surface-card rounded-xl border border-slate-200 bg-white"
        : "template-surface-card rounded-2xl border border-slate-200 bg-white";

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await templateApiFetch(vendorId, "/orders");
        setOrders(data.orders || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth, vendorId]);

  const formatAttrs = (attrs?: Record<string, string>) => {
    if (!attrs) return "";
    return Object.values(attrs)
      .filter((value) => value)
      .join(" / ");
  };

  const downloadInvoice = async (orderId: string, orderNumber?: string) => {
    if (!auth?.token) return;
    try {
      setDownloadingOrderId(orderId);
      const response = await fetch(`${API_BASE}/template-users/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${orderNumber || orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // users can retry
    } finally {
      setDownloadingOrderId("");
    }
  };

  if (!auth) {
    return (
      <div className={`${pageClass} template-page-shell template-orders-page`}>
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className={`${panelClass} p-8 text-center shadow-sm`}>
            <h1 className={isStudio ? "text-2xl font-bold text-slate-100" : "text-2xl font-bold text-slate-900"}>Login required</h1>
            <p className={isStudio ? "mt-2 text-sm text-slate-300" : isWhiteRose ? "mt-2 text-sm text-[#5f6c7b]" : "mt-2 text-sm text-slate-500"}>Sign in to view your orders.</p>
            <button
              onClick={() => router.push(`${loginPath}?next=${encodeURIComponent(ordersPath)}`)}
              className="template-primary-button mt-6 rounded-lg px-6 py-3 text-sm font-semibold text-white"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${pageClass} template-page-shell template-orders-page`}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className={`template-section-title text-4xl font-bold mb-6 ${isStudio ? "text-slate-100" : "text-gray-900"}`}>My Orders</h1>
        <div className="h-1 mb-6 template-accent-bg"></div>

        {loading ? (
          <div className={`${panelClass} p-6 text-center ${isStudio ? "text-slate-300" : isWhiteRose ? "text-[#5f6c7b]" : "text-slate-500"}`}>Loading orders...</div>
        ) : orders.length ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`${panelClass} p-6 shadow-sm`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={isStudio ? "text-sm text-slate-400" : isWhiteRose ? "text-sm text-[#5f6c7b]" : "text-sm text-slate-500"}>Order</p>
                    <p className={isStudio ? "text-lg font-semibold text-slate-100" : "text-lg font-semibold text-slate-900"}>{order.order_number}</p>
                  </div>
                  <div className={isStudio ? "text-sm text-slate-400" : isWhiteRose ? "text-sm text-[#5f6c7b]" : "text-sm text-slate-500"}>
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${isStudio ? "bg-slate-800 text-slate-200" : isTrend ? "bg-rose-100 text-rose-700" : isWhiteRose ? "bg-[#eef4ff] text-[#174ea6]" : "bg-slate-100 text-slate-600"}`}>
                    {order.status}
                  </div>
                  <div className={isStudio ? "text-lg font-semibold text-slate-100" : "text-lg font-semibold text-slate-900"}>{formatMoney(order.total)}</div>
                </div>

                <div className={`mt-4 grid gap-3 text-sm ${isStudio ? "text-slate-300" : isWhiteRose ? "text-[#5f6c7b]" : "text-slate-600"}`}>
                  {order.items.map((item, index) => (
                    <Link
                      key={`${order._id}-${item._id || index}`}
                      href={productPath(item.product_id)}
                      className={`template-product-card flex items-start justify-between gap-3 rounded-lg border p-3 transition ${isStudio ? "border-slate-700 bg-slate-900 hover:border-slate-600" : isTrend ? "border-rose-200 bg-white hover:border-rose-300" : isWhiteRose ? "border-[#dfe3eb] bg-[#f8fafc] hover:border-[#2874f0]" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            item.image_url ||
                            "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&q=80"
                          }
                          alt={item.product_name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className={isStudio ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold text-slate-900"}>{item.product_name}</p>
                          <p className={isStudio ? "text-xs text-slate-400" : isWhiteRose ? "text-xs text-[#5f6c7b]" : "text-xs text-slate-500"}>
                            {formatAttrs(item.variant_attributes) || "Default variant"}
                          </p>
                          <p className={isStudio ? "text-xs text-slate-400" : isWhiteRose ? "text-xs text-[#5f6c7b]" : "text-xs text-slate-500"}>Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className={isStudio ? "text-sm font-semibold text-slate-100" : "text-sm font-semibold text-slate-900"}>
                        {formatMoney(item.total_price || 0)}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isStudio ? "bg-slate-800 text-slate-200" : isTrend ? "bg-rose-100 text-rose-700" : isWhiteRose ? "bg-[#eef4ff] text-[#174ea6]" : "bg-slate-100 text-slate-600"}`}>
                    {order.items?.length || 0} items
                  </span>
                  {(order.delivery_provider && order.delivery_provider !== "none") ||
                  getTrackingNumber(order) ||
                  getDeliveryStatus(order) ? (
                    <div className={`min-w-[220px] flex-1 rounded-xl border px-3 py-2 text-xs ${isStudio ? "border-slate-700 bg-slate-950/50 text-slate-300" : isTrend ? "border-rose-200 bg-rose-50 text-rose-700" : isWhiteRose ? "border-[#dfe3eb] bg-[#f8fafc] text-[#5f6c7b]" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                      <p className={isStudio ? "font-bold text-slate-100" : "font-bold text-slate-900"}>
                        {formatProviderName(order.delivery_provider)}
                        {getTrackingNumber(order) ? ` - ${getTrackingNumber(order)}` : ""}
                      </p>
                      <p className="mt-0.5">
                        {getDeliveryStatus(order) || "Tracking updates pending"}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={orderDetailPath(order._id)}
                      className={`inline-flex items-center rounded-lg border px-4 py-2 text-xs font-semibold ${isStudio ? "border-slate-700 text-slate-200 hover:border-slate-600" : isTrend ? "border-rose-200 text-rose-700 hover:border-rose-300" : isWhiteRose ? "border-[#dfe3eb] text-[#172337] hover:border-[#2874f0] hover:text-[#2874f0]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                    >
                      View details
                    </Link>
                    <Link
                      href={`${orderDetailPath(order._id)}#delivery-tracking`}
                      className={`inline-flex items-center rounded-lg border px-4 py-2 text-xs font-semibold ${isStudio ? "border-slate-700 text-slate-200 hover:border-slate-600" : isTrend ? "border-rose-200 text-rose-700 hover:border-rose-300" : isWhiteRose ? "border-[#dfe3eb] text-[#172337] hover:border-[#2874f0] hover:text-[#2874f0]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                    >
                      Track delivery
                    </Link>
                    <button
                      type="button"
                      onClick={() => downloadInvoice(order._id, order.order_number)}
                      disabled={downloadingOrderId === order._id}
                      className="template-primary-button inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {downloadingOrderId === order._id ? "Downloading..." : "Download invoice"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${panelClass} p-6 text-center ${isStudio ? "text-slate-300" : isWhiteRose ? "text-[#5f6c7b]" : "text-slate-500"}`}>No orders yet.</div>
        )}
      </div>
    </div>
  );
}
