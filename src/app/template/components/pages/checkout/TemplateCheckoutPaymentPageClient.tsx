"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";

import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { trackPurchase } from "@/lib/analytics-events";

import TemplateCheckoutShell from "./template-checkout-shell";
import {
  clearTemplateCheckoutSession,
  formatAmount,
  getTemplateCheckoutAddressId,
  getTemplateCheckoutPaymentMethod,
  saveTemplateCheckoutAddressId,
  saveTemplateCheckoutPaymentMethod,
} from "./template-checkout-utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type TemplateAddress = {
  _id: string;
  full_name: string;
  city: string;
  state: string;
  pincode: string;
};

type TemplateCartItem = {
  _id: string;
  product_name: string;
  quantity: number;
  total_price: number;
};

type TemplateCart = {
  items: TemplateCartItem[];
  subtotal: number;
};

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function TemplateCheckoutPaymentPageClient() {
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<TemplateCart | null>(null);
  const [addresses, setAddresses] = useState<TemplateAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);

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
      setPaymentMethod(getTemplateCheckoutPaymentMethod(vendorId));
    } catch (err: any) {
      setError(err?.message || "Failed to load payment data");
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    loadData();
  }, [vendorId]);

  useEffect(() => {
    saveTemplateCheckoutPaymentMethod(vendorId, paymentMethod);
  }, [vendorId, paymentMethod]);

  const fetchShippingQuote = async (addressId: string, method: "razorpay" | "cod") => {
    if (!addressId) return;
    try {
      setShippingLoading(true);
      setShippingError("");
      const response = await templateApiFetch(vendorId, "/orders/borzo/calculate", {
        method: "POST",
        body: JSON.stringify({
          address_id: addressId,
          payment_method: method,
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
    fetchShippingQuote(selectedAddressId, paymentMethod);
  }, [selectedAddressId, paymentMethod]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item._id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  const subtotal = Number(cart?.subtotal || 0);
  const orderItems = cart?.items || [];
  const totalAmount = subtotal + shippingFee;

  const handleRazorpayPayment = async (order: any, payment: any) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Failed to load payment gateway");

    return new Promise<void>((resolve, reject) => {
      const options = {
        key: payment.keyId,
        order_id: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        name: "Ophmate Store",
        description: `Order ${order?.order_number || ""}`,
        prefill: {
          name: auth?.user?.name || "",
          email: auth?.user?.email || "",
          contact: auth?.user?.phone || "",
        },
        handler: async (response: any) => {
          try {
            await templateApiFetch(vendorId, `/orders/${order._id}/razorpay/verify`, {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await templateApiFetch(vendorId, `/orders/${order._id}/razorpay/failed`, {
                method: "POST",
                body: JSON.stringify({ reason: "dismissed" }),
              });
            } catch {
              // ignored
            }
            reject(new Error("Payment cancelled"));
          },
        },
        theme: { color: "#ff3f6c" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", async (response: any) => {
        try {
          await templateApiFetch(vendorId, `/orders/${order._id}/razorpay/failed`, {
            method: "POST",
            body: JSON.stringify({
              reason: response?.error?.description || "payment_failed",
            }),
          });
        } catch {
          // ignored
        }
        reject(new Error(response?.error?.description || "Payment failed"));
      });
      razorpay.open();
    });
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      setError("Please choose a delivery address.");
      router.push(`/template/${vendorId}/checkout/address`);
      return;
    }
    try {
      setPaymentProcessing(true);
      setError("");

      const orderResponse = await templateApiFetch(vendorId, "/orders", {
        method: "POST",
        body: JSON.stringify({
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          shipping_fee: shippingFee,
          discount: 0,
          notes: "",
          delivery_provider: "borzo",
        }),
      });

      if (paymentMethod === "razorpay") {
        if (!orderResponse?.payment?.orderId) {
          throw new Error("Payment initialization failed");
        }
        await handleRazorpayPayment(orderResponse.order, orderResponse.payment);
      }

      trackPurchase({
        vendorId,
        userId: auth?.user?.id || "",
        cartTotal: totalAmount,
        orderId: orderResponse?.order?._id || orderResponse?.order?.order_number || "",
        metadata: {
          items: orderItems.map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
            total_price: item.total_price,
          })),
        },
      });

      clearTemplateCheckoutSession(vendorId);
      setOrderCompleted(true);
      setSuccessMessage(
        `Payment successful. Order ${orderResponse?.order?.order_number || ""} created.`,
      );
      setTimeout(() => {
        router.push(`/template/${vendorId}/orders`);
      }, 1400);
    } catch (err: any) {
      setError(err?.message || "Failed to place order");
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!auth) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="payment">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Login required</p>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue checkout.
            </p>
            <button
              onClick={() =>
                router.push(
                  `/template/${vendorId}/login?next=/template/${vendorId}/checkout/payment`,
                )
              }
              className="mt-4 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go to login
            </button>
          </div>
        </div>
      </TemplateCheckoutShell>
    );
  }

  if (orderCompleted) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="payment">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-2xl font-semibold text-emerald-700">Order Confirmed</p>
            <p className="mt-2 text-slate-600">{successMessage}</p>
            <p className="mt-1 text-sm text-slate-500">
              Redirecting to your order history...
            </p>
          </div>
        </div>
      </TemplateCheckoutShell>
    );
  }

  if (!loading && orderItems.length === 0) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="payment">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Your bag is empty.</p>
            <button
              onClick={() => router.push(`/template/${vendorId}/checkout/bag`)}
              className="mt-4 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Go To Bag
            </button>
          </div>
        </div>
      </TemplateCheckoutShell>
    );
  }

  const methodOptions = [
    {
      id: "cod",
      label: "Cash On Delivery",
      hint: "Pay after delivery",
      icon: Banknote,
    },
    {
      id: "razorpay",
      label: "UPI (Pay via any app)",
      hint: "Secure Razorpay checkout",
      icon: Smartphone,
    },
    {
      id: "card",
      label: "Credit/Debit Card",
      hint: "via Razorpay",
      icon: CreditCard,
    },
    {
      id: "wallet",
      label: "Wallets",
      hint: "via Razorpay",
      icon: Wallet,
    },
    {
      id: "netbanking",
      label: "Net Banking",
      hint: "via Razorpay",
      icon: Landmark,
    },
  ] as const;

  return (
    <TemplateCheckoutShell vendorId={vendorId} activeStep="payment">
      <div className="template-checkout-page grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="template-checkout-card rounded-md border border-slate-200 bg-white p-5">
            <p className="text-base font-semibold text-slate-900">Bank Offer</p>
            <p className="mt-2 text-sm text-slate-600">
              10% instant discount on selected cards is available at Razorpay
              checkout.
            </p>
          </div>

          <div className="template-checkout-card rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-semibold text-slate-900">
                Choose Payment Mode
              </h2>
              <Link
                href={`/template/${vendorId}/checkout/address`}
                className="template-checkout-accent-outline h-9 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Change Address
              </Link>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="template-checkout-card rounded-md border border-slate-200">
                {methodOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive =
                    (option.id === "cod" && paymentMethod === "cod") ||
                    (option.id !== "cod" && paymentMethod === "razorpay");
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setPaymentMethod(option.id === "cod" ? "cod" : "razorpay")
                      }
                      className={`flex w-full items-center gap-3 border-b border-slate-200 px-4 py-3 text-left last:border-b-0 ${
                        isActive
                          ? "template-checkout-accent-soft bg-[#fff1f5] text-[#ff3f6c]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-md border border-slate-200 p-4">
                <p className="text-xl font-semibold text-slate-900">
                  Recommended Payment Option
                </p>
                <div className="mt-4 rounded-md border border-slate-200 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      className="template-checkout-accent-input mt-1 h-4 w-4 accent-[#ff3f6c]"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                    />
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        Pay Online (Razorpay)
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Use UPI, Card, Wallet or Net Banking. Instant payment
                        confirmation.
                      </p>
                    </div>
                  </label>
                </div>
                <div className="mt-3 rounded-md border border-slate-200 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="payment_method"
                      className="template-checkout-accent-input mt-1 h-4 w-4 accent-[#ff3f6c]"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                    />
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        Cash On Delivery
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Pay after your order is delivered.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Delivering to</p>
                  {selectedAddress ? (
                    <p className="mt-1">
                      {selectedAddress.full_name}, {selectedAddress.city},{" "}
                      {selectedAddress.state} - {selectedAddress.pincode}
                    </p>
                  ) : (
                    <p className="mt-1 text-rose-600">
                      Address not selected. Go back to address step.
                    </p>
                  )}
                </div>

                <button
                  onClick={placeOrder}
                  disabled={!selectedAddressId || paymentProcessing}
                  className="template-checkout-accent mt-5 h-11 w-full rounded-md bg-[#ff3f6c] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#e93861] disabled:opacity-50"
                >
                  {paymentProcessing
                    ? "Processing..."
                    : paymentMethod === "razorpay"
                      ? `Pay ${formatAmount(totalAmount)}`
                      : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="template-checkout-card h-fit rounded-md border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
            PRICE DETAILS ({orderItems.length} ITEM{orderItems.length > 1 ? "S" : ""})
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Total MRP</span>
              <span>{formatAmount(subtotal)}</span>
            </div>
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
          <p className="mt-3 text-xs text-slate-500">
            By placing the order, you agree to terms and privacy policy.
          </p>
        </aside>
      </div>
    </TemplateCheckoutShell>
  );
}
