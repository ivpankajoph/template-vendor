"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {

  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateScopedPath } from "@/lib/template-route";
import {
  getTemplateCheckoutCouponCode,
  saveTemplateCheckoutCouponCode,
} from "@/app/template/components/pages/checkout/template-checkout-utils";

type CartItem = {
  _id: string;
  item_type?: "product" | "food";
  product_id?: string;
  food_menu_item_id?: string;
  product_name: string;
  image_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_attributes?: Record<string, any>;
  selected_addons?: Array<{ name?: string; price?: number; is_free?: boolean } | string>;
  addons?: Array<{ name?: string; price?: number; is_free?: boolean } | string>;
};

type Cart = {
  items: CartItem[];
  subtotal: number;
  total_quantity: number;
};

type OfferSummary = {
  total_discount: number;
  final_total: number;
  applied_auto_offer?: { offer_title?: string; discount_amount?: number } | null;
  applied_coupon_offer?: { offer_title?: string; discount_amount?: number; coupon_code?: string } | null;
};

const formatCurrency = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function ShoppingCartPage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);
  const authToken = auth?.token || "";
  const cartPath = buildTemplateScopedPath({ vendorId, suffix: "cart" });
  const loginPath = buildTemplateScopedPath({ vendorId, suffix: "login" });
  const checkoutBagPath = buildTemplateScopedPath({ vendorId, suffix: "checkout/bag" });
  const productPath = (productId?: string) =>
    productId ? buildTemplateScopedPath({ vendorId, suffix: `product/${productId}` }) : "#";

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [offerSummary, setOfferSummary] = useState<OfferSummary | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [showNotification, setShowNotification] = useState(false);

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
    ? "template-surface-card bg-white border border-[#dfe3eb] text-[#172337] rounded-[24px] shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
    : isStudio
    ? "template-surface-card bg-slate-900/80 border border-slate-800 text-slate-100 rounded-md"
    : isTrend
      ? "template-surface-card bg-white border border-rose-200 rounded-[1.4rem]"
      : isMinimal
        ? "template-surface-card bg-white border border-slate-200 rounded-xl"
        : "template-surface-card bg-white border border-slate-200 rounded-2xl";

  const mutedTextClass = isStudio ? "text-slate-300" : isWhiteRose ? "text-[#5f6c7b]" : "text-slate-500";

  const formatAttrs = (attrs?: Record<string, any>) => {
    if (!attrs) return "";
    return Object.values(attrs)
      .filter((value) => value && (typeof value === "string" || typeof value === "number"))
      .join(" / ");
  };

  const formatAddonNames = (
    addons?: Array<{ name?: string; price?: number; is_free?: boolean } | string>,
  ) =>
    (Array.isArray(addons) ? addons : [])
      .map((addon) =>
        typeof addon === "string"
          ? addon.trim()
          : String(addon?.name || "").trim(),
      )
      .filter(Boolean)
      .join(", ");

  const getAddonSummary = (item: CartItem) =>
    formatAddonNames(item.selected_addons) ||
    formatAddonNames(item.addons) ||
    formatAddonNames(item.variant_attributes?.selected_addons) ||
    formatAddonNames(item.variant_attributes?.addons);

  const loadCart = async () => {
    try {
      const data = await templateApiFetch(vendorId, "/cart");
      setCart(data.cart || null);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }
    setCouponCode(getTemplateCheckoutCouponCode(vendorId));
    loadCart();
  }, [authToken, vendorId]);

  useEffect(() => {
    if (!authToken || !cart?.items?.length) {
      setOfferSummary(null);
      return;
    }

    const previewOffers = async () => {
      try {
        const data = await templateApiFetch(vendorId, "/cart/offers/preview", {
          method: "POST",
          body: JSON.stringify({
            coupon_code: getTemplateCheckoutCouponCode(vendorId),
          }),
        });
        setOfferSummary(data?.summary || null);
      } catch {
        setOfferSummary(null);
      }
    };

    void previewOffers();
  }, [authToken, cart?.items?.length, cart?.subtotal, vendorId]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    const data = await templateApiFetch(vendorId, `/cart/item/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
    setCart(data.cart || null);
  };

  const removeItem = async (itemId: string) => {
    try {
      const data = await templateApiFetch(vendorId, `/cart/item/${itemId}`, {
        method: "DELETE",
      });
      // Refresh the local cart state
      await loadCart();
      // Notify other components (like the Navbar) to update their counts
      window.dispatchEvent(new CustomEvent("template-cart-updated"));
      setShowNotification(true);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const subtotal = useMemo(
    () =>
      cart?.items?.reduce(
        (sum, item) =>
          sum + Number(item.total_price || Number(item.unit_price || 0) * Number(item.quantity || 0)),
        0,
      ) || 0,
    [cart?.items],
  );
  const totalDiscount = Number(offerSummary?.total_discount || 0);
  const payableTotal = Math.max(Number(offerSummary?.final_total || subtotal), 0);

  const applyCoupon = async () => {
    try {
      setCouponMessage("");
      const normalizedCode = couponCode.trim().toUpperCase();
      const data = await templateApiFetch(vendorId, "/cart/offers/preview", {
        method: "POST",
        body: JSON.stringify({ coupon_code: normalizedCode }),
      });
      saveTemplateCheckoutCouponCode(vendorId, normalizedCode);
      setCouponCode(normalizedCode);
      setOfferSummary(data?.summary || null);
      setCouponMessage(
        normalizedCode
          ? `Coupon ${normalizedCode} applied successfully.`
          : "Offers refreshed.",
      );
    } catch (error: any) {
      saveTemplateCheckoutCouponCode(vendorId, "");
      setOfferSummary(null);
      setCouponMessage(error?.message || "Failed to apply coupon");
    }
  };

  if (!auth) {
    return (
      <div className={`${pageClass} template-page-shell template-cart-page`}>
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className={`${panelClass} p-8 text-center shadow-sm`}>
            <h1 className={isStudio ? "text-2xl font-bold text-slate-100" : "text-2xl font-bold text-slate-900"}>
              Login required
            </h1>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Sign in to view your cart for this store.
            </p>
            <button
              onClick={() => router.push(`${loginPath}?next=${encodeURIComponent(cartPath)}`)}
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
    <div className={`${pageClass} template-page-shell template-cart-page`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <h1 className={`template-section-title mb-5 text-3xl font-bold sm:mb-6 sm:text-4xl ${isStudio ? "text-slate-100" : "text-gray-900"}`}>
          Cart
        </h1>
        <div className="h-1 mb-6 template-accent-bg"></div>

        {showNotification && (
          <div className={`${panelClass} p-4 mb-6 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <CheckCircle className="template-accent" size={20} />
              <p className={mutedTextClass}>Cart updated successfully.</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className={`${mutedTextClass} hover:text-current`}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {loading ? (
          <div className={`${panelClass} p-6 text-center ${mutedTextClass}`}>
            Loading cart...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="lg:col-span-2">
              <div className={`${panelClass} overflow-hidden`}>
                <div
                  className={`hidden grid-cols-12 gap-4 border-b p-4 font-semibold md:grid ${
                    isStudio
                      ? "bg-slate-900 text-slate-200 border-slate-700"
                      : isTrend
                        ? "bg-rose-50 text-slate-700 border-rose-200"
                        : isWhiteRose
                          ? "bg-[#f8fafc] text-[#172337] border-[#dfe3eb]"
                          : "bg-gray-50 text-gray-700 border-slate-200"
                  }`}
                >
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>

                {cart?.items?.length ? (
                  cart.items.map((item) => (
                    <div
                      key={item._id}
                      className={`relative grid grid-cols-1 gap-4 border-b p-4 md:grid-cols-12 md:items-center ${
                        isStudio
                          ? "border-slate-700"
                          : isTrend
                            ? "border-rose-200"
                            : isWhiteRose
                              ? "border-[#edf1f5]"
                              : "border-slate-200"
                      }`}
                    >
                      <div className="absolute right-3 top-3 md:static md:col-span-1">
                        <button
                          onClick={() => removeItem(item._id)}
                          aria-label={`Remove ${item.product_name}`}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors md:h-8 md:w-8 ${
                            isStudio
                              ? "border-slate-600 hover:bg-slate-800"
                              : isTrend
                                ? "border-rose-200 hover:bg-rose-50"
                                : isWhiteRose
                                  ? "border-[#dfe3eb] hover:bg-[#eef4ff]"
                                  : "border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <X size={16} className={isStudio ? "text-slate-200" : "text-gray-600"} />
                        </button>
                      </div>

                      <div className="min-w-0 pr-12 md:col-span-5 md:pr-0">
                        {item.product_id ? (
                          <Link
                            href={productPath(item.product_id)}
                            className="flex min-w-0 items-start gap-3 sm:gap-4 md:items-center"
                          >
                            <img
                              src={
                                item.image_url ||
                                "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&q=80"
                              }
                              alt={item.product_name}
                              className="template-product-card h-20 w-20 flex-shrink-0 rounded object-cover sm:h-24 sm:w-24 md:h-20 md:w-20"
                            />
                            <div className="min-w-0 space-y-1">
                              <span className="block font-medium template-accent">
                                {item.product_name}
                              </span>
                              <span className={`block text-xs ${mutedTextClass}`}>
                                {formatAttrs(item.variant_attributes) || "Default variant"}
                              </span>
                              {getAddonSummary(item) ? (
                                <span className={`block text-xs ${mutedTextClass}`}>
                                  Extras: {getAddonSummary(item)}
                                </span>
                              ) : null}
                            </div>
                          </Link>
                        ) : (
                          <div className="flex min-w-0 items-start gap-3 sm:gap-4 md:items-center">
                            <img
                              src={
                                item.image_url ||
                                "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=200&q=80"
                              }
                              alt={item.product_name}
                              className="template-product-card h-20 w-20 flex-shrink-0 rounded object-cover sm:h-24 sm:w-24 md:h-20 md:w-20"
                            />
                            <div className="min-w-0 space-y-1">
                              <span className="block font-medium template-accent">
                                {item.product_name}
                              </span>
                              <span className={`block text-xs ${mutedTextClass}`}>
                                {formatAttrs(item.variant_attributes) || "Standard"}
                              </span>
                              {getAddonSummary(item) ? (
                                <span className={`block text-xs ${mutedTextClass}`}>
                                  Extras: {getAddonSummary(item)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 md:contents">
                        <div className={`rounded-lg border px-3 py-2 md:col-span-2 md:border-0 md:p-0 md:text-center ${mutedTextClass} ${
                          isStudio
                            ? "border-slate-700"
                            : isTrend
                              ? "border-rose-100"
                              : isWhiteRose
                                ? "border-[#edf1f5]"
                                : "border-slate-100"
                        }`}>
                          <span className="mb-1 block text-[11px] font-semibold uppercase text-slate-400 md:hidden">
                            Price
                          </span>
                          {formatCurrency(item.unit_price)}
                        </div>

                        <div className={`rounded-lg border px-3 py-2 md:col-span-2 md:flex md:justify-center md:border-0 md:p-0 ${
                          isStudio
                            ? "border-slate-700"
                            : isTrend
                              ? "border-rose-100"
                              : isWhiteRose
                                ? "border-[#edf1f5]"
                                : "border-slate-100"
                        }`}>
                          <span className={`mb-1 block text-[11px] font-semibold uppercase md:hidden ${mutedTextClass}`}>
                            Qty
                          </span>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(item._id, Number(event.target.value))
                            }
                            min="1"
                            className={`h-10 w-full max-w-20 rounded border px-3 py-2 text-center template-focus-accent md:w-16 ${
                              isStudio
                                ? "border-slate-600 bg-slate-900 text-slate-100"
                                : isTrend
                                  ? "border-rose-200 bg-white"
                                  : isWhiteRose
                                    ? "border-[#dfe3eb] bg-[#f8fafc]"
                                    : "border-gray-300"
                            }`}
                          />
                          <span className="sr-only">{item.quantity} quantity</span>
                        </div>

                        <div className={`col-span-2 rounded-lg border px-3 py-2 text-right font-semibold sm:col-span-1 md:col-span-2 md:border-0 md:p-0 ${isStudio ? "text-slate-100 border-slate-700" : isTrend ? "text-gray-900 border-rose-100" : isWhiteRose ? "text-gray-900 border-[#edf1f5]" : "text-gray-900 border-slate-100"}`}>
                          <span className={`mb-1 block text-left text-[11px] font-semibold uppercase md:hidden ${mutedTextClass}`}>
                            Subtotal
                          </span>
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`p-6 text-center ${mutedTextClass}`}>
                    Your cart is empty.
                  </div>
                )}

                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                  className={`w-full flex-1 rounded-lg border px-4 py-3 template-focus-accent ${
                    isStudio
                      ? "border-slate-600 bg-slate-900 text-slate-100"
                      : isTrend
                        ? "border-rose-200 bg-white"
                        : isWhiteRose
                          ? "border-[#dfe3eb] bg-[#f8fafc]"
                          : "border-gray-300"
                  }`}
                />
                <button
                  onClick={() => void applyCoupon()}
                  className="template-primary-button rounded-lg px-6 py-3 font-semibold text-white transition-colors template-accent-bg template-accent-bg-hover sm:px-8"
                >
                  Apply coupon
                </button>
                <button
                  className={`rounded-lg px-6 py-3 font-semibold transition-colors sm:px-8 ${
                    isStudio
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
                      : isTrend
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700"
                        : isWhiteRose
                          ? "bg-[#eef4ff] hover:bg-[#dce9ff] text-[#174ea6]"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                    onClick={() => {
                      loadCart().then(() => setShowNotification(true));
                    }}
                  >
                    Update cart
                  </button>
                </div>
                {couponMessage ? (
                  <p className={`px-4 pb-4 text-sm ${couponMessage.toLowerCase().includes("failed") || couponMessage.toLowerCase().includes("invalid") ? "text-rose-600" : "text-emerald-600"}`}>
                    {couponMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className={`${panelClass} p-6`}>
                <h2
                  className={`text-2xl font-bold mb-6 pb-4 border-b ${
                    isStudio
                      ? "text-slate-100 border-slate-700"
                      : isTrend
                        ? "text-slate-900 border-rose-200"
                        : isWhiteRose
                          ? "text-[#172337] border-[#dfe3eb]"
                          : "text-gray-900 border-slate-200"
                  }`}
                >
                  Cart totals
                </h2>

                <div className="space-y-4 mb-6">
                  <div className={`flex justify-between ${mutedTextClass}`}>
                    <span>Subtotal</span>
                    <span className="font-semibold">{formatCurrency(subtotal)}</span>
                  </div>
                  {offerSummary?.applied_auto_offer ? (
                    <div className={`flex justify-between ${mutedTextClass}`}>
                      <span>{offerSummary.applied_auto_offer.offer_title}</span>
                      <span className="font-semibold text-emerald-600">
                        -{formatCurrency(Number(offerSummary.applied_auto_offer.discount_amount || 0))}
                      </span>
                    </div>
                  ) : null}
                  {offerSummary?.applied_coupon_offer ? (
                    <div className={`flex justify-between ${mutedTextClass}`}>
                      <span>Coupon {offerSummary.applied_coupon_offer.coupon_code || ""}</span>
                      <span className="font-semibold text-emerald-600">
                        -{formatCurrency(Number(offerSummary.applied_coupon_offer.discount_amount || 0))}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`flex justify-between font-semibold text-lg pt-4 border-t ${
                      isStudio
                        ? "text-slate-100 border-slate-700"
                      : isTrend
                        ? "text-slate-900 border-rose-200"
                        : isWhiteRose
                          ? "text-[#172337] border-[#dfe3eb]"
                          : "text-gray-900 border-slate-200"
                    }`}
                  >
                    <span>Total</span>
                    <span>{formatCurrency(payableTotal)}</span>
                  </div>
                  {offerSummary?.applied_auto_offer ? (
                    <p className={`text-xs ${mutedTextClass}`}>
                      Combo/offer discount applied. You pay the final offer total shown above.
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={() => router.push(checkoutBagPath)}
                  className="template-primary-button w-full text-white py-4 rounded-full font-semibold transition-colors text-lg template-accent-bg template-accent-bg-hover"
                >
                  Proceed to checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
