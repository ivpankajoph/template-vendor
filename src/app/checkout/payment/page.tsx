"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Landmark, Smartphone, Wallet } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";
import { fetchCart } from "@/store/slices/customerCartSlice";
import { fetchAddresses } from "@/store/slices/customerAddressSlice";
import { createOrder } from "@/store/slices/customerOrderSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toastError, toastSuccess } from "@/lib/toast";
import userApi from "@/lib/userApi";
import { trackPurchase } from "@/lib/analytics-events";

import CheckoutShell from "../components/checkout-shell";
import {
  clearCheckoutSession,
  formatAmount,
  getSavedCheckoutAddressId,
  getSavedCheckoutPaymentMethod,
  saveCheckoutAddressId,
  saveCheckoutPaymentMethod,
} from "../components/checkout-utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type CheckoutAddress = {
  _id: string;
  full_name: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
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

export default function CheckoutPaymentPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const token = useSelector((state: RootState) => state.customerAuth.token);
  const user = useSelector((state: RootState) => state.customerAuth.user);
  const cart = useSelector((state: RootState) => state.customerCart.cart);
  const cartLoading = useSelector((state: RootState) => state.customerCart.loading);
  const addresses = useSelector(
    (state: RootState) => state.customerAddress.addresses as CheckoutAddress[],
  );
  const orderLoading = useSelector((state: RootState) => state.customerOrder.loading);

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">(
    "razorpay",
  );
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    dispatch(fetchCart());
    dispatch(fetchAddresses());
    setPaymentMethod(getSavedCheckoutPaymentMethod());
  }, [dispatch, token, router]);

  useEffect(() => {
    if (!addresses.length) {
      setSelectedAddressId("");
      saveCheckoutAddressId("");
      return;
    }

    const storedAddressId = getSavedCheckoutAddressId();
    const matchedStored = addresses.find((item) => item._id === storedAddressId);
    const fallbackAddress = addresses.find((item) => item.is_default) || addresses[0];
    const nextAddressId = matchedStored?._id || fallbackAddress?._id || "";
    setSelectedAddressId(nextAddressId);
    saveCheckoutAddressId(nextAddressId);
  }, [addresses]);

  useEffect(() => {
    saveCheckoutPaymentMethod(paymentMethod);
  }, [paymentMethod]);

  const fetchShippingQuote = async (addressId: string, method: "razorpay" | "cod") => {
    if (!addressId) return;
    try {
      setShippingLoading(true);
      setShippingError("");
      const response = await userApi.post("/orders/borzo/calculate", {
        address_id: addressId,
        payment_method: method,
        delivery_provider: "borzo",
      });
      const payload = response?.data || {};
      const fixedAmount = payload?.configured_delivery?.is_fixed
        ? Number(payload?.configured_delivery?.amount)
        : Number.NaN;
      const quotedAmount = Number(payload?.response?.order?.payment_amount);
      const amount = Number.isFinite(fixedAmount) ? fixedAmount : quotedAmount;
      setShippingFee(Number.isFinite(amount) ? amount : 0);
    } catch (error: any) {
      setShippingFee(0);
      setShippingError(
        error?.response?.data?.message || "Unable to fetch delivery fee.",
      );
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
  const totalAmount = subtotal + shippingFee;
  const orderItems = cart?.items || [];

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
        name: "Ophmate",
        description: `Order ${order?.order_number || ""}`,
        prefill: {
          name: user?.name || user?.full_name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        handler: async (response: any) => {
          try {
            await userApi.post(`/orders/${order._id}/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await userApi.post(`/orders/${order._id}/razorpay/failed`, {
                reason: "dismissed",
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
          await userApi.post(`/orders/${order._id}/razorpay/failed`, {
            reason: response?.error?.description || "payment_failed",
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
      toastError("Please choose a delivery address.");
      router.push("/checkout/address");
      return;
    }
    try {
      setPaymentProcessing(true);
      const orderResponse = await dispatch(
        createOrder({
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          shipping_fee: shippingFee,
          discount: 0,
          notes: "",
          delivery_provider: "borzo",
        }),
      ).unwrap();

      if (paymentMethod === "razorpay") {
        if (!orderResponse?.payment?.orderId) {
          throw new Error("Payment initialization failed");
        }
        await handleRazorpayPayment(orderResponse.order, orderResponse.payment);
        toastSuccess("Payment successful");
      } else {
        toastSuccess("Order placed successfully");
      }

      trackPurchase({
        userId: user?._id || user?.id || "",
        cartTotal: totalAmount,
        orderId:
          orderResponse?.order?._id || orderResponse?.order?.order_number || "",
        metadata: {
          items: cart?.items?.map((item: any) => ({
            name: item.product_name,
            quantity: item.quantity,
            total_price: item.total_price,
          })),
        },
      });

      clearCheckoutSession();
      setOrderCompleted(true);
      const message = `Payment successful. Order ${orderResponse?.order?.order_number || ""} created.`;
      setSuccessMessage(message);

      await dispatch(fetchCart());
      setTimeout(() => {
        router.push("/orders");
      }, 1400);
    } catch (error: any) {
      toastError(error?.message || error || "Failed to place order");
    } finally {
      setPaymentProcessing(false);
    }
  };

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

  if (!token) return null;

  if (orderCompleted) {
    return (
      <CheckoutShell activeStep="payment">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-xl">
            <CardContent className="space-y-3 p-8 text-center">
              <p className="text-2xl font-semibold text-emerald-700">
                Order Confirmed
              </p>
              <p className="text-slate-600">{successMessage}</p>
              <p className="text-sm text-slate-500">
                Redirecting to your order history...
              </p>
            </CardContent>
          </Card>
        </div>
      </CheckoutShell>
    );
  }

  if (!cart || orderItems.length === 0) {
    return (
      <CheckoutShell activeStep="payment">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6 text-center">
              <p>{cartLoading ? "Loading bag..." : "Your bag is empty."}</p>
              <Button onClick={() => router.push("/checkout/bag")}>
                Go To Bag
              </Button>
            </CardContent>
          </Card>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell activeStep="payment">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <p className="text-base font-semibold text-slate-900">Bank Offer</p>
            <p className="mt-2 text-sm text-slate-600">
              10% instant discount on selected cards is available at Razorpay
              checkout.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-semibold text-slate-900">
                Choose Payment Mode
              </h2>
              <Button asChild variant="outline" className="h-9 px-4">
                <Link href="/checkout/address">Change Address</Link>
              </Button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="rounded-md border border-slate-200">
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
                          ? "bg-[#fff1f5] text-[#ff3f6c]"
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
                      className="mt-1 h-4 w-4 accent-[#ff3f6c]"
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
                      className="mt-1 h-4 w-4 accent-[#ff3f6c]"
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

                <Button
                  onClick={placeOrder}
                  disabled={!selectedAddressId || orderLoading || paymentProcessing}
                  className="mt-5 h-11 w-full bg-[#ff3f6c] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#e93861]"
                >
                  {orderLoading || paymentProcessing
                    ? "Processing..."
                    : paymentMethod === "razorpay"
                      ? `Pay ${formatAmount(totalAmount)}`
                      : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
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
            By placing the order, you agree to Ophmate terms and privacy policy.
          </p>
        </aside>
      </div>

    </CheckoutShell>
  );
}
