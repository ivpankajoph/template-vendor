"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { trackCheckout } from "@/lib/analytics-events";
import { buildTemplateScopedPath } from "@/lib/template-route";

import TemplateCheckoutShell from "./template-checkout-shell";
import {
  formatAmount,
  getTemplateCheckoutAddressId,
  getTemplateCheckoutCouponCode,
  getTemplateCheckoutPaymentMethod,
  saveTemplateCheckoutAddressId,
  saveTemplateCheckoutCouponCode,
} from "./template-checkout-utils";

type TemplateCartItem = {
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

type TemplateCart = {
  items: TemplateCartItem[];
  subtotal: number;
};

type OfferSummary = {
  total_discount: number;
  final_total: number;
  applied_auto_offer?: { offer_title?: string; discount_amount?: number } | null;
  applied_coupon_offer?: { offer_title?: string; discount_amount?: number; coupon_code?: string } | null;
};

type TemplateAddress = {
  _id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
};

const formatVariantText = (attrs?: Record<string, any>) =>
  Object.values(attrs || {})
    .filter((value) => value && (typeof value === "string" || typeof value === "number"))
    .join(" / ");

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

const getAddonSummary = (item: TemplateCartItem) =>
  formatAddonNames(item.selected_addons) ||
  formatAddonNames(item.addons) ||
  formatAddonNames(item.variant_attributes?.selected_addons) ||
  formatAddonNames(item.variant_attributes?.addons);

export default function TemplateCheckoutBagPageClient() {
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);
  const authToken = auth?.token || "";
  const authUserId = auth?.user?.id || "";
  const homePath = buildTemplateScopedPath({ vendorId, suffix: "" });
  const bagPath = buildTemplateScopedPath({ vendorId, suffix: "checkout/bag" });
  const addressPath = buildTemplateScopedPath({ vendorId, suffix: "checkout/address" });
  const loginPath = buildTemplateScopedPath({ vendorId, suffix: "login" });
  const productPath = (productId?: string) =>
    productId ? buildTemplateScopedPath({ vendorId, suffix: `product/${productId}` }) : "#";

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<TemplateCart | null>(null);
  const [addresses, setAddresses] = useState<TemplateAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [offerSummary, setOfferSummary] = useState<OfferSummary | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [cartResponse, addressResponse] = await Promise.all([
        templateApiFetch(vendorId, "/cart"),
        templateApiFetch(vendorId, "/addresses"),
      ]);
      const nextCart = cartResponse?.cart || null;
      const nextAddresses = addressResponse?.addresses || [];
      setCart(nextCart);
      setAddresses(nextAddresses);

      const storedAddressId = getTemplateCheckoutAddressId(vendorId);
      const selected =
        nextAddresses.find((item: TemplateAddress) => item._id === storedAddressId)?._id ||
        nextAddresses[0]?._id ||
        "";
      setSelectedAddressId(selected);
      saveTemplateCheckoutAddressId(vendorId, selected);
      setCouponCode(getTemplateCheckoutCouponCode(vendorId));
    } catch (err: any) {
      setError(err?.message || "Failed to load bag data");
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
    loadData();
  }, [authToken, vendorId]);

  useEffect(() => {
    if (!authUserId || !cart) return;
    trackCheckout({
      vendorId,
      userId: authUserId,
      cartTotal: cart.subtotal,
      metadata: {
        items: cart.items?.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          total_price: item.total_price,
        })),
      },
    });
  }, [authUserId, cart, vendorId]);

  useEffect(() => {
    if (!authToken || !cart?.items?.length) {
      setOfferSummary(null);
      return;
    }

    const previewOffers = async () => {
      try {
        const response = await templateApiFetch(vendorId, "/cart/offers/preview", {
          method: "POST",
          body: JSON.stringify({
            coupon_code: getTemplateCheckoutCouponCode(vendorId),
          }),
        });
        setOfferSummary(response?.summary || null);
      } catch {
        setOfferSummary(null);
      }
    };

    void previewOffers();
  }, [authToken, cart?.items?.length, cart?.subtotal, vendorId]);

  const fetchShippingQuote = async (addressId: string) => {
    if (!addressId) {
      setShippingFee(0);
      return;
    }
    try {
      setShippingLoading(true);
      setShippingError("");
      const paymentMethod = getTemplateCheckoutPaymentMethod(vendorId);
      const response = await templateApiFetch(vendorId, "/orders/borzo/calculate", {
        method: "POST",
        body: JSON.stringify({
          address_id: addressId,
          payment_method: paymentMethod,
          delivery_provider: "borzo",
        }),
      });
      const fixedAmount = response?.configured_delivery?.is_fixed
        ? Number(response?.configured_delivery?.amount)
        : Number.NaN;
      const quotedAmount = Number(response?.response?.order?.payment_amount);
      const amount = Number.isFinite(fixedAmount) ? fixedAmount : quotedAmount;
      setShippingFee(Number.isFinite(amount) ? amount : 0);
    } catch (err: any) {
      setShippingFee(0);
      setShippingError(err?.message || "Unable to fetch delivery fee");
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAddressId) return;
    fetchShippingQuote(selectedAddressId);
  }, [selectedAddressId]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item._id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      setActionLoading(true);
      const response = await templateApiFetch(vendorId, `/cart/item/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      setCart(response?.cart || null);
    } catch (err: any) {
      setError(err?.message || "Failed to update quantity");
    } finally {
      setActionLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setActionLoading(true);
      const response = await templateApiFetch(vendorId, `/cart/item/${itemId}`, {
        method: "DELETE",
      });
      setCart(response?.cart || null);
    } catch (err: any) {
      setError(err?.message || "Failed to remove item");
    } finally {
      setActionLoading(false);
    }
  };

  if (!auth) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="bag">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Login required</p>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue checkout.
            </p>
            <button
              onClick={() => router.push(`${loginPath}?next=${encodeURIComponent(bagPath)}`)}
              className="mt-4 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to login
            </button>
          </div>
        </div>
      </TemplateCheckoutShell>
    );
  }

  const bagItems = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0);
  const totalDiscount = Number(offerSummary?.total_discount || 0);
  const discountedSubtotal = Math.max(subtotal - totalDiscount, 0);
  const totalAmount = discountedSubtotal + shippingFee;

  const applyCoupon = async () => {
    try {
      setCouponMessage("");
      const normalizedCode = couponCode.trim().toUpperCase();
      const response = await templateApiFetch(vendorId, "/cart/offers/preview", {
        method: "POST",
        body: JSON.stringify({ coupon_code: normalizedCode }),
      });
      saveTemplateCheckoutCouponCode(vendorId, normalizedCode);
      setCouponCode(normalizedCode);
      setOfferSummary(response?.summary || null);
      setCouponMessage(
        normalizedCode ? `Coupon ${normalizedCode} applied successfully.` : "Offers refreshed.",
      );
    } catch (err: any) {
      saveTemplateCheckoutCouponCode(vendorId, "");
      setOfferSummary(null);
      setCouponMessage(err?.message || "Failed to apply coupon");
    }
  };

  if (!loading && bagItems.length === 0) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="bag">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Your bag is empty.</p>
            <button
              onClick={() => router.push(homePath)}
              className="mt-4 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </TemplateCheckoutShell>
    );
  }

  return (
    <TemplateCheckoutShell vendorId={vendorId} activeStep="bag">
      <div className="template-checkout-page grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="template-checkout-card rounded-md border border-[#f1e0df] bg-[#fff7f7] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  Deliver to:{" "}
                  {selectedAddress
                    ? `${selectedAddress.full_name}, ${selectedAddress.pincode}`
                    : "Select address"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedAddress
                    ? `${selectedAddress.line1} ${selectedAddress.city}, ${selectedAddress.state}`
                    : "Choose delivery address in next step."}
                </p>
              </div>
              <button
                onClick={() => router.push(addressPath)}
                className="template-checkout-accent-outline h-10 rounded-md border border-[#ff3f6c] px-5 text-sm font-semibold text-[#ff3f6c] hover:bg-[#fff1f5]"
              >
                CHANGE ADDRESS
              </button>
            </div>
          </div>

          <div className="template-checkout-card rounded-md border border-slate-200 bg-white p-4">
            <p className="text-lg font-semibold text-slate-900">
              {bagItems.length}/{bagItems.length} ITEMS SELECTED
            </p>
          </div>

          <div className="space-y-3">
            {bagItems.map((item) => {
              const variantText = formatVariantText(item.variant_attributes) || "Default variant";
              const addonText = getAddonSummary(item);
              return (
                <div
                  key={item._id}
                  className="template-checkout-card rounded-md border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-4">
                    {item.product_id ? (
                      <Link
                        href={productPath(item.product_id)}
                        className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-md bg-slate-100"
                      >
                        <Image
                          src={item.image_url || "/placeholder.png"}
                          alt={item.product_name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </Link>
                    ) : (
                      <div className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                        <Image
                          src={item.image_url || "/placeholder.png"}
                          alt={item.product_name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 justify-between gap-4">
                      <div className="min-w-0">
                        {item.product_id ? (
                          <Link
                            href={productPath(item.product_id)}
                            className="block text-lg font-semibold text-slate-900 hover:text-[#ff3f6c]"
                          >
                            {item.product_name}
                          </Link>
                        ) : (
                          <p className="block text-lg font-semibold text-slate-900">
                            {item.product_name}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-slate-500">{variantText}</p>
                        {addonText ? (
                          <p className="mt-1 text-sm text-slate-500">Extras: {addonText}</p>
                        ) : null}
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item._id, Math.max(1, item.quantity - 1))
                            }
                            disabled={actionLoading}
                            className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            disabled={actionLoading}
                            className="h-8 w-8 rounded-md border border-slate-300 text-sm font-semibold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">
                          {formatAmount(item.total_price || 0)}
                        </p>
                        <button
                          onClick={() => removeItem(item._id)}
                          disabled={actionLoading}
                          className="mt-3 inline-flex items-center text-sm font-semibold text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="template-checkout-card rounded-md border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-700">
              Coupon code
            </p>
            <div className="mt-3 flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                placeholder="Enter coupon"
                className="h-11 flex-1 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-900 outline-none focus:border-[#ff3f6c]"
              />
              <button
                type="button"
                onClick={() => void applyCoupon()}
                className="template-checkout-accent h-11 rounded-md bg-[#ff3f6c] px-5 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#e93861]"
              >
                Apply
              </button>
            </div>
            {couponMessage ? (
              <p className={`mt-3 text-sm ${couponMessage.toLowerCase().includes("invalid") || couponMessage.toLowerCase().includes("failed") ? "text-rose-600" : "text-emerald-600"}`}>
                {couponMessage}
              </p>
            ) : null}
          </div>
        </section>

        <aside className="template-checkout-card h-fit rounded-md border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
            PRICE DETAILS ({bagItems.length} ITEM{bagItems.length > 1 ? "S" : ""})
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Total MRP</span>
              <span>{formatAmount(subtotal)}</span>
            </div>
            {offerSummary?.applied_auto_offer ? (
              <div className="flex items-center justify-between text-emerald-700">
                <span>{offerSummary.applied_auto_offer.offer_title}</span>
                <span>-{formatAmount(Number(offerSummary.applied_auto_offer.discount_amount || 0))}</span>
              </div>
            ) : null}
            {offerSummary?.applied_coupon_offer ? (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Coupon {offerSummary.applied_coupon_offer.coupon_code || ""}</span>
                <span>-{formatAmount(Number(offerSummary.applied_coupon_offer.discount_amount || 0))}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span>Delivery Fee (Borzo)</span>
              <span>
                {shippingLoading ? "Calculating..." : formatAmount(shippingFee)}
              </span>
            </div>
          </div>
          {shippingError ? (
            <p className="mt-2 text-xs text-rose-600">{shippingError}</p>
          ) : null}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-2xl font-semibold text-slate-900">
            <span>Total Amount</span>
            <span>{formatAmount(totalAmount)}</span>
          </div>
          <button
            onClick={() => router.push(addressPath)}
            className="template-checkout-accent mt-5 h-11 w-full rounded-md bg-[#ff3f6c] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#e93861]"
          >
            PLACE ORDER
          </button>
        </aside>
      </div>
    </TemplateCheckoutShell>
  );
}
