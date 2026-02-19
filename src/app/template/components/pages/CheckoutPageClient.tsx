"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { trackCheckout, trackPurchase } from "@/lib/analytics-events";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

type Cart = {
  items: Array<{
    _id: string;
    product_name: string;
    quantity: number;
    total_price: number;
  }>;
  subtotal: number;
};

export default function TemplateCheckoutPage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-gray-50";
  const panelClass = isStudio
    ? "template-surface-card bg-slate-900/80 border border-slate-800 text-slate-100 rounded-md"
    : isTrend
      ? "template-surface-card bg-white border border-rose-200 rounded-[1.4rem]"
      : isMinimal
        ? "template-surface-card bg-white border border-slate-200 rounded-xl"
        : "template-surface-card bg-white border border-slate-200 rounded-2xl";
  const mutedTextClass = isStudio ? "text-slate-300" : "text-slate-500";

  const [form, setForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const subtotal = useMemo(() => cart?.subtotal || 0, [cart]);
  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [cartRes, addressRes] = await Promise.all([
          templateApiFetch(vendorId, "/cart"),
          templateApiFetch(vendorId, "/addresses"),
        ]);
        setCart(cartRes.cart || null);
        setAddresses(addressRes.addresses || []);
        if (addressRes.addresses?.[0]?._id) {
          setSelectedAddress(addressRes.addresses[0]._id);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load checkout data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [vendorId]);

  useEffect(() => {
    if (!auth || !cart) return;
    trackCheckout({
      vendorId,
      userId: auth?.user?.id,
      cartTotal: cart.subtotal,
      metadata: {
        items: cart.items?.map((item) => ({
          name: item.product_name,
          quantity: item.quantity,
          total_price: item.total_price,
        })),
      },
    });
  }, [auth, cart, vendorId]);

  const fetchShippingQuote = async (addressId: string) => {
    try {
      setShippingLoading(true);
      setShippingError("");
      const data = await templateApiFetch(vendorId, "/orders/borzo/calculate", {
        method: "POST",
        body: JSON.stringify({
          address_id: addressId,
          payment_method: paymentMethod,
          delivery_provider: "borzo",
        }),
      });
      const fixedAmount = data?.configured_delivery?.is_fixed
        ? Number(data?.configured_delivery?.amount)
        : Number.NaN;
      const quotedAmount = Number(data?.response?.order?.payment_amount);
      const amount = Number.isFinite(fixedAmount) ? fixedAmount : quotedAmount;
      setShippingFee(Number.isFinite(amount) ? amount : 0);
    } catch (err: any) {
      setShippingFee(0);
      setShippingError(err?.message || "Failed to calculate delivery fee");
    } finally {
      setShippingLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedAddress) return;
    fetchShippingQuote(selectedAddress);
  }, [selectedAddress, paymentMethod]);

  const handleCreateAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const data = await templateApiFetch(vendorId, "/addresses", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const nextAddresses = [data.address, ...addresses];
      setAddresses(nextAddresses);
      setSelectedAddress(data.address._id);
      setForm({
        label: "Home",
        full_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
    } catch (err: any) {
      setError(err.message || "Failed to save address");
    } finally {
      setCreating(false);
    }
  };

  const handleRazorpayPayment = async (order: any, payment: any) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error("Failed to load payment gateway");
    }

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
              // ignore
            }
            reject(new Error("Payment cancelled"));
          },
        },
        theme: {
          color: "#1f2937",
        },
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
          // ignore
        }
        reject(new Error(response?.error?.description || "Payment failed"));
      });
      razorpay.open();
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Select an address before placing order.");
      return;
    }
    setCreating(true);
    setPaymentProcessing(true);
    setError("");
    setSuccess("");
    try {
      const orderRes = await templateApiFetch(vendorId, "/orders", {
        method: "POST",
        body: JSON.stringify({
          address_id: selectedAddress,
          payment_method: paymentMethod,
          shipping_fee: shippingFee,
          delivery_provider: "borzo",
        }),
      });
      if (paymentMethod === "razorpay") {
        if (!orderRes?.payment?.orderId) {
          throw new Error("Payment initialization failed");
        }
        await handleRazorpayPayment(orderRes.order, orderRes.payment);
        setSuccess("Payment successful");
      } else {
        setSuccess("Order placed");
      }
      trackPurchase({
        vendorId,
        userId: auth?.user?.id,
        cartTotal: total,
        orderId: orderRes?.order?._id || orderRes?.order?.order_number,
        metadata: {
          items: cart?.items?.map((item) => ({
            name: item.product_name,
            quantity: item.quantity,
            total_price: item.total_price,
          })),
        },
      });
      router.push(`/template/${vendorId}/orders`);
    } catch (err: any) {
      setError(err.message || "Failed to place order");
    } finally {
      setCreating(false);
      setPaymentProcessing(false);
    }
  };

  if (!auth) {
    return (
      <div className={`${pageClass} template-page-shell template-checkout-page`}>
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className={`${panelClass} p-8 text-center shadow-sm`}>
            <h1 className={isStudio ? "text-2xl font-bold text-slate-100" : "text-2xl font-bold text-slate-900"}>
              Login required
            </h1>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Sign in to continue checkout.
            </p>
            <button
              onClick={() =>
                router.push(`/template/${vendorId}/login?next=/template/${vendorId}/checkout`)
              }
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
    <div className={`${pageClass} template-page-shell template-checkout-page`}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className={`template-section-title text-4xl font-bold mb-6 ${isStudio ? "text-slate-100" : "text-gray-900"}`}>Checkout</h1>
        <div className="h-1 mb-6 template-accent-bg"></div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg bg-white p-6 text-center text-gray-500">
            Loading checkout...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Shipping address
                </h2>
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`flex items-start gap-3 rounded-lg border p-4 text-sm transition ${
                        selectedAddress === address._id
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress === address._id}
                        onChange={() => setSelectedAddress(address._id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {address.label || "Address"}
                        </p>
                        <p className="text-slate-600">
                          {address.full_name} • {address.phone}
                        </p>
                        <p className="text-slate-500">
                          {address.line1} {address.line2 && `, ${address.line2}`}
                        </p>
                        <p className="text-slate-500">
                          {address.city}, {address.state} {address.pincode}
                        </p>
                      </div>
                    </label>
                  ))}
                  {!addresses.length && (
                    <p className="text-sm text-slate-500">
                      No saved addresses yet.
                    </p>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleCreateAddress}
                className="bg-white rounded-lg shadow-sm p-6 space-y-4"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  Add new address
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={form.full_name}
                    onChange={(event) =>
                      setForm({ ...form, full_name: event.target.value })
                    }
                    placeholder="Full name"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    placeholder="Phone"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    value={form.line1}
                    onChange={(event) =>
                      setForm({ ...form, line1: event.target.value })
                    }
                    placeholder="Address line 1"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm md:col-span-2"
                    required
                  />
                  <input
                    value={form.line2}
                    onChange={(event) =>
                      setForm({ ...form, line2: event.target.value })
                    }
                    placeholder="Address line 2"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm md:col-span-2"
                  />
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm({ ...form, city: event.target.value })
                    }
                    placeholder="City"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    value={form.state}
                    onChange={(event) =>
                      setForm({ ...form, state: event.target.value })
                    }
                    placeholder="State"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                  <input
                    value={form.pincode}
                    onChange={(event) =>
                      setForm({ ...form, pincode: event.target.value })
                    }
                    placeholder="Pincode"
                    className="rounded-lg border border-slate-200 px-4 py-3 text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {creating ? "Saving..." : "Save address"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Order summary
                </h2>
                <div className="space-y-3 text-sm">
                  {cart?.items?.map((item) => (
                    <div key={item._id} className="flex justify-between">
                      <span>
                        {item.product_name} x{item.quantity}
                      </span>
                      <span>₹{item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-4 space-y-2 border-t pt-3 text-sm">
                    <p className="font-semibold text-slate-900">Payment Method</p>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "razorpay"}
                        onChange={() => setPaymentMethod("razorpay")}
                      />
                      Pay online (Razorpay)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                      />
                      Cash on Delivery
                    </label>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 border-t pt-3">
                    <span>Delivery (Borzo)</span>
                    <span>{shippingLoading ? "Calculating..." : `₹${shippingFee.toFixed(2)}`}</span>
                  </div>
                  {shippingError && (
                    <p className="text-xs text-rose-600">{shippingError}</p>
                  )}
                  <div className="flex justify-between border-t pt-3 font-semibold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={creating || paymentProcessing || !cart?.items?.length}
                  className="mt-6 w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {creating || paymentProcessing
                    ? "Processing..."
                    : paymentMethod === "razorpay"
                      ? "Pay & Place Order"
                      : "Place order (COD)"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
