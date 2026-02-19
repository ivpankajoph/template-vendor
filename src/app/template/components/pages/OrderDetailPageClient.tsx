"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

type OrderItem = {
  _id?: string;
  product_id?: string;
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
    country?: string;
  };
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const formatMoney = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function OrderDetailPageClient() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const orderId = params.order_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "oragze" ||
    variant.key === "whiterose";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f5f5f7] text-slate-900"
      : "min-h-screen bg-gray-50";
  const panelClass = isStudio
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
  }, [vendorId, orderId]);

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
              onClick={() =>
                router.push(`/template/${vendorId}/login?next=/template/${vendorId}/orders/${orderId}`)
              }
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
                onClick={() => router.push(`/template/${vendorId}/orders`)}
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
              <div className={panelClass}>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                  <div className="mt-4 space-y-4">
                    {order.items?.map((item) => (
                      <div
                        key={item._id || item.product_id}
                        className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center"
                      >
                        <a
                          href={item.product_id ? `/template/${vendorId}/product/${item.product_id}` : "#"}
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
                        </a>
                        <div className="flex-1 space-y-1">
                          <a
                            href={item.product_id ? `/template/${vendorId}/product/${item.product_id}` : "#"}
                            className="text-base font-semibold text-slate-900 hover:text-slate-700"
                          >
                            {item.product_name}
                          </a>
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
