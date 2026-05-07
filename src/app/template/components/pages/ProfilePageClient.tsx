"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useTemplateAuthState,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateScopedPath } from "@/lib/template-route";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import {
  readPocoFoodWishlist,
  removePocoFoodWishlistItem,
  syncPocoFoodWishlistWithAccount,
  type PocoFoodWishlistItem,
} from "@/app/template/components/pocofood/pocofood-wishlist";

type Profile = {
  name?: string;
  email?: string;
  phone?: string;
};

type Address = {
  _id: string;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

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
    scans?: unknown;
  };
  shadowfax?: {
    tracking_number?: string;
    order_id?: string;
    status?: string;
    status_description?: string;
  };
  items?: Array<{
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

export default function TemplateProfilePage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = useTemplateAuthState(vendorId);
  const profilePath = buildTemplateScopedPath({ vendorId, suffix: "profile" });
  const loginPath = buildTemplateScopedPath({ vendorId, suffix: "login" });

  const [profile, setProfile] = useState<Profile | null>(auth?.user || null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<PocoFoodWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingOrderId, setDownloadingOrderId] = useState("");
  const isStudio = variant.key === "studio";
  const isWhiteRose = variant.key === "whiterose";
  const isPocoFood = variant.key === "pocofood";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "oragze" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isWhiteRose
    ? "min-h-screen bg-[#f1f3f6] text-[#172337]"
    : isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isPocoFood
      ? "min-h-screen bg-[#fbfaf4] text-[#171717]"
    : isMinimal
      ? "min-h-screen bg-[#f5f5f7] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-gray-50";
  const panelClass = isWhiteRose
    ? "template-surface-card rounded-[24px] border border-[#dfe3eb] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
    : isStudio
    ? "template-surface-card rounded-md border border-slate-800 bg-slate-900/80 text-slate-100"
    : isPocoFood
      ? "template-surface-card rounded-[24px] border border-[#eadfb7] bg-white shadow-[0_16px_42px_rgba(23,23,23,0.06)]"
      : isTrend
        ? "template-surface-card rounded-[1.4rem] border border-rose-200 bg-white"
        : "template-surface-card rounded-2xl border border-slate-200 bg-white";
  const subPanelClass = isWhiteRose
    ? "rounded-[18px] border border-[#e6ebf2] bg-[#f8fafc] p-4"
    : isStudio
      ? "rounded-lg border border-slate-800 bg-slate-950/60 p-4"
      : isPocoFood
        ? "rounded-2xl border border-[#f2e9c8] bg-[#fffdf5] p-4"
        : "rounded-xl border border-slate-200 bg-slate-50 p-4";
  const mutedTextClass = isStudio
    ? "text-slate-300"
    : isWhiteRose
      ? "text-[#5f6c7b]"
      : isPocoFood
        ? "text-[#6f6b5d]"
        : "text-slate-500";
  const strongTextClass = isStudio ? "text-slate-100" : "text-slate-900";
  const accentButtonClass = isPocoFood
    ? "rounded-full bg-[#ffc222] px-5 py-2.5 text-sm font-extrabold text-[#171717] transition hover:bg-[#ffae00]"
    : "template-primary-button rounded-lg px-5 py-2.5 text-sm font-semibold text-white";
  const orderDetailPath = (orderId?: string) =>
    orderId ? buildTemplateScopedPath({ vendorId, suffix: `orders/${orderId}` }) : "#";
  const productPath = (productId?: string) =>
    productId ? buildTemplateScopedPath({ vendorId, suffix: `product/${productId}` }) : "#";
  const wishlistPath = buildTemplateScopedPath({ vendorId, suffix: "wishlist" });

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const [profileRes, addressRes, ordersRes] = await Promise.allSettled([
        templateApiFetch(vendorId, "/me"),
        templateApiFetch(vendorId, "/addresses"),
        templateApiFetch(vendorId, "/orders"),
      ]);

      setProfile(
        profileRes.status === "fulfilled"
          ? profileRes.value.user || auth?.user || null
          : auth?.user || null
      );
      setAddresses(addressRes.status === "fulfilled" ? addressRes.value.addresses || [] : []);
      setOrders(ordersRes.status === "fulfilled" ? ordersRes.value.orders || [] : []);
      setLoading(false);
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
      // Users can retry from the same button.
    } finally {
      setDownloadingOrderId("");
    }
  };

  useEffect(() => {
    if (!isPocoFood || typeof window === "undefined") return;

    const syncWishlist = () => {
      setWishlistItems(readPocoFoodWishlist(vendorId));
    };

    syncWishlist();
    void syncPocoFoodWishlistWithAccount(vendorId);
    window.addEventListener("pocofood-wishlist-updated", syncWishlist);
    window.addEventListener("storage", syncWishlist);
    window.addEventListener("focus", syncWishlist);
    const handleAuthRefresh = () => {
      syncWishlist();
      void syncPocoFoodWishlistWithAccount(vendorId);
    };
    window.addEventListener("template-auth-updated", handleAuthRefresh);

    return () => {
      window.removeEventListener("pocofood-wishlist-updated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener("focus", syncWishlist);
      window.removeEventListener("template-auth-updated", handleAuthRefresh);
    };
  }, [isPocoFood, vendorId]);

  if (!auth) {
    return (
      <div className={`${pageClass} template-page-shell`}>
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className={`${panelClass} p-8 text-center`}>
            <h1 className={`text-2xl font-bold ${strongTextClass}`}>Login required</h1>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Sign in to view your profile.
            </p>
            <button
              onClick={() => router.push(`${loginPath}?next=${encodeURIComponent(profilePath)}`)}
              className={`mt-6 ${accentButtonClass}`}
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${pageClass} template-page-shell`}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${isPocoFood ? "text-[#d94b2b]" : mutedTextClass}`}>
              Account
            </p>
            <h1 className={`template-section-title mt-2 text-3xl font-extrabold sm:text-4xl ${isStudio ? "text-slate-100" : "text-gray-900"}`}>
              My Profile
            </h1>
          </div>
          {!loading ? (
            <div className={`flex flex-wrap gap-2 text-xs font-semibold ${mutedTextClass}`}>
              <span className={subPanelClass}>{orders.length} orders</span>
              <span className={subPanelClass}>{addresses.length} addresses</span>
              {isPocoFood ? (
                <span className={subPanelClass}>{wishlistItems.length} wishlist</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mb-6 h-1 template-accent-bg"></div>

        {loading ? (
          <div className={`${panelClass} p-6 text-center ${mutedTextClass}`}>
            Loading profile...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="space-y-6">
              <section className={`${panelClass} p-5 sm:p-6`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold ${isPocoFood ? "bg-[#fff0b8] text-[#d94b2b]" : "bg-slate-100 text-slate-700"}`}>
                    {(profile?.name || profile?.email || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-xl font-bold ${strongTextClass}`}>
                      {profile?.name || "Not provided"}
                    </p>
                    <p className={`truncate text-sm ${mutedTextClass}`}>
                      {profile?.email || "Email not provided"}
                    </p>
                  </div>
                </div>
              </section>

              <section className={`${panelClass} p-5 sm:p-6`}>
                <h2 className={`text-xl font-semibold ${strongTextClass}`}>
                  Account details
                </h2>
                <div className={`mt-4 grid gap-3 text-sm ${mutedTextClass}`}>
                  {[
                    ["Name", profile?.name || "Not provided"],
                    ["Email", profile?.email || "Not provided"],
                    ["Phone", profile?.phone || "Not provided"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1 rounded-xl border border-black/5 bg-white/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span className={`font-semibold ${strongTextClass}`}>{label}</span>
                      <span className="min-w-0 break-words sm:text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className={`${panelClass} p-5 sm:p-6`}>
                <h2 className={`text-xl font-semibold ${strongTextClass}`}>
                  Saved addresses
                </h2>
                <div className={`mt-4 space-y-3 text-sm ${mutedTextClass}`}>
                  {addresses.length ? (
                    addresses.map((address) => (
                      <div key={address._id} className={subPanelClass}>
                        <p className={`font-semibold ${strongTextClass}`}>
                          {address.label || "Address"}
                        </p>
                        <p>
                          {address.full_name} - {address.phone}
                        </p>
                        <p>
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                        </p>
                        <p>
                          {address.city}, {address.state} {address.pincode}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p>No addresses saved yet.</p>
                  )}
                </div>
              </section>

              {isPocoFood ? (
                <section className={`${panelClass} p-5 sm:p-6`}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className={`text-xl font-semibold ${strongTextClass}`}>
                      Wishlist
                    </h2>
                    <Link
                      href={wishlistPath}
                      className="rounded-full bg-[#ffc222] px-4 py-2 text-xs font-extrabold text-[#171717] transition hover:bg-[#ffae00]"
                    >
                      View all
                    </Link>
                  </div>
                  <div className={`mt-4 space-y-3 text-sm ${mutedTextClass}`}>
                    {wishlistItems.length ? (
                      wishlistItems.slice(0, 4).map((item) => (
                        <div key={item.product_id} className="flex gap-3 rounded-2xl border border-[#f2e9c8] bg-[#fffdf5] p-3">
                          <Link
                            href={item.href || wishlistPath}
                            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#fff6d6]"
                          >
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-[#d94b2b]">Saved</span>
                            )}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={item.href || wishlistPath}
                              className={`line-clamp-2 font-semibold ${strongTextClass}`}
                            >
                              {item.product_name}
                            </Link>
                            {Number.isFinite(Number(item.price)) ? (
                              <p className="mt-1 font-extrabold text-[#ffae00]">
                                Rs. {Number(item.price || 0).toLocaleString("en-IN")}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setWishlistItems(
                                removePocoFoodWishlistItem(vendorId, item.product_id)
                              )
                            }
                            className="h-8 rounded-full border border-[#eadfb7] px-3 text-xs font-bold text-[#d94b2b]"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No wishlist items yet.</p>
                    )}
                  </div>
                </section>
              ) : null}
            </aside>

            <section id="orders" className="min-w-0">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-2xl font-extrabold ${strongTextClass}`}>
                    My Orders
                  </h2>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Recent orders, item details, and invoices in one place.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {orders.length ? (
                  orders.map((order) => (
                    <div key={order._id} className={`${panelClass} p-4 sm:p-6`}>
                      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                        <div className="min-w-0">
                          <p className={`text-sm ${mutedTextClass}`}>Order</p>
                          <p className={`break-words text-lg font-bold ${strongTextClass}`}>
                            {order.order_number}
                          </p>
                          <p className={`mt-1 text-sm ${mutedTextClass}`}>
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${isPocoFood ? "bg-[#fff0b8] text-[#d94b2b]" : isStudio ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                            {order.status}
                          </span>
                          <span className={`text-lg font-extrabold ${strongTextClass}`}>
                            {formatMoney(order.total)}
                          </span>
                        </div>
                      </div>

                      <div className={`mt-4 grid gap-3 text-sm ${mutedTextClass}`}>
                        {(order.items || []).slice(0, 3).map((item, index) => (
                          <Link
                            key={`${order._id}-${item._id || index}`}
                            href={productPath(item.product_id)}
                            className={`flex min-w-0 items-start justify-between gap-3 rounded-2xl border p-3 transition ${isPocoFood ? "border-[#f2e9c8] bg-[#fffdf5] hover:border-[#ffc222]" : isStudio ? "border-slate-700 bg-slate-900 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={
                                  item.image_url ||
                                  "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&q=80"
                                }
                                alt={item.product_name}
                                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                              />
                              <div className="min-w-0">
                                <p className={`break-words text-sm font-semibold ${strongTextClass}`}>
                                  {item.product_name}
                                </p>
                                <p className={`text-xs ${mutedTextClass}`}>
                                  {formatAttrs(item.variant_attributes) || "Default variant"}
                                </p>
                                <p className={`text-xs ${mutedTextClass}`}>Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 text-sm font-semibold ${strongTextClass}`}>
                              {formatMoney(item.total_price || 0)}
                            </span>
                          </Link>
                        ))}
                        {(order.items || []).length > 3 ? (
                          <p className={`text-xs font-semibold ${mutedTextClass}`}>
                            +{(order.items || []).length - 3} more items
                          </p>
                        ) : null}
                      </div>

                      <div className={`mt-4 flex flex-col gap-3 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between ${isPocoFood ? "border-[#f2e9c8]" : "border-slate-200"}`}>
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${isPocoFood ? "bg-[#fff6d6] text-[#171717]" : isStudio ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                          {order.items?.length || 0} items
                        </span>
                        {(order.delivery_provider && order.delivery_provider !== "none") ||
                        getTrackingNumber(order) ||
                        getDeliveryStatus(order) ? (
                          <div className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs ${isPocoFood ? "border-[#f2e9c8] bg-[#fffdf5]" : isStudio ? "border-slate-700 bg-slate-950/50" : "border-slate-200 bg-slate-50"}`}>
                            <p className={`font-bold ${strongTextClass}`}>
                              {formatProviderName(order.delivery_provider)}
                              {getTrackingNumber(order) ? ` - ${getTrackingNumber(order)}` : ""}
                            </p>
                            <p className={`mt-0.5 ${mutedTextClass}`}>
                              {getDeliveryStatus(order) || "Tracking updates pending"}
                            </p>
                          </div>
                        ) : null}
                        <div className="grid gap-2 sm:flex sm:justify-end">
                          <Link
                            href={orderDetailPath(order._id)}
                            className={`inline-flex justify-center rounded-full border px-4 py-2 text-xs font-bold ${isPocoFood ? "border-[#eadfb7] text-[#171717] hover:border-[#ffc222] hover:bg-[#fff6d6]" : isStudio ? "border-slate-700 text-slate-200 hover:border-slate-600" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                          >
                            View details
                          </Link>
                          <Link
                            href={`${orderDetailPath(order._id)}#delivery-tracking`}
                            className={`inline-flex justify-center rounded-full border px-4 py-2 text-xs font-bold ${isPocoFood ? "border-[#eadfb7] text-[#171717] hover:border-[#ffc222] hover:bg-[#fff6d6]" : isStudio ? "border-slate-700 text-slate-200 hover:border-slate-600" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                          >
                            Track delivery
                          </Link>
                          <button
                            type="button"
                            onClick={() => downloadInvoice(order._id, order.order_number)}
                            disabled={downloadingOrderId === order._id}
                            className={`${accentButtonClass} justify-center text-xs disabled:opacity-60`}
                          >
                            {downloadingOrderId === order._id ? "Downloading..." : "Download invoice"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${panelClass} p-6 text-center ${mutedTextClass}`}>
                    No orders yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
