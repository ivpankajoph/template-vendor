"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Trash2 } from "lucide-react";

import type { AppDispatch, RootState } from "@/store";
import {
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "@/store/slices/customerCartSlice";
import { fetchAddresses } from "@/store/slices/customerAddressSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toastError, toastSuccess } from "@/lib/toast";
import userApi from "@/lib/userApi";
import { trackCheckout } from "@/lib/analytics-events";

import CheckoutShell from "../components/checkout-shell";
import {
  formatAmount,
  getSavedCheckoutAddressId,
  getSavedCheckoutPaymentMethod,
  saveCheckoutAddressId,
} from "../components/checkout-utils";

type CheckoutAddress = {
  _id: string;
  full_name: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  line1?: string;
  line2?: string;
  is_default?: boolean;
};

export default function CheckoutBagPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const token = useSelector((state: RootState) => state.customerAuth.token);
  const user = useSelector((state: RootState) => state.customerAuth.user);
  const cart = useSelector((state: RootState) => state.customerCart.cart);
  const cartLoading = useSelector((state: RootState) => state.customerCart.loading);
  const addresses = useSelector(
    (state: RootState) => state.customerAddress.addresses as CheckoutAddress[],
  );

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    dispatch(fetchCart());
    dispatch(fetchAddresses());
  }, [dispatch, token, router]);

  useEffect(() => {
    if (!token || !cart) return;
    trackCheckout({
      userId: user?._id || user?.id || "",
      cartTotal: cart.subtotal,
      metadata: {
        items: cart.items?.map((item: any) => ({
          name: item.product_name,
          quantity: item.quantity,
          total_price: item.total_price,
        })),
      },
    });
  }, [token, cart, user]);

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

  const fetchShippingQuote = async (addressId: string) => {
    if (!addressId) {
      setShippingFee(0);
      return;
    }
    try {
      setShippingLoading(true);
      setShippingError("");
      const paymentMethod = getSavedCheckoutPaymentMethod();
      const response = await userApi.post("/orders/borzo/calculate", {
        address_id: addressId,
        payment_method: paymentMethod,
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
    fetchShippingQuote(selectedAddressId);
  }, [selectedAddressId]);

  const selectedAddress = useMemo(
    () => addresses.find((item) => item._id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  const subtotal = Number(cart?.subtotal || 0);
  const totalAmount = subtotal + shippingFee;

  const updateItemQty = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await dispatch(updateCartItem({ itemId, quantity })).unwrap();
      toastSuccess("Cart updated");
    } catch (error: any) {
      toastError(error || "Failed to update cart");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await dispatch(removeCartItem({ itemId })).unwrap();
      toastSuccess("Item removed");
    } catch (error: any) {
      toastError(error || "Failed to remove item");
    }
  };

  const getItemImage = (item: any) =>
    item?.image_url || item?.image || item?.product?.image_url || "/placeholder.png";

  const getItemCategory = (item: any) =>
    item?.product_category ||
    item?.productCategory ||
    item?.product?.productCategory ||
    "unknown";

  const getItemId = (item: any) =>
    item?.product_id || item?.productId || item?.product?._id || item?._id;

  if (!token) return null;

  if (!cart || cart.items?.length === 0) {
    return (
      <CheckoutShell activeStep="bag">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6 text-center">
              <p>{cartLoading ? "Loading bag..." : "Your bag is empty."}</p>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </CheckoutShell>
    );
  }

  return (
    <CheckoutShell activeStep="bag">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          <div className="rounded-md border border-[#f1e0df] bg-[#fff7f7] px-4 py-4">
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
                    ? `${selectedAddress.line1 || ""} ${selectedAddress.city}, ${selectedAddress.state}`
                    : "Choose delivery address in next step."}
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10 border-[#ff3f6c] px-5 text-[#ff3f6c] hover:bg-[#fff1f5]"
                onClick={() => router.push("/checkout/address")}
              >
                CHANGE ADDRESS
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-4">
            <p className="text-lg font-semibold text-slate-900">
              {cart.items.length}/{cart.items.length} ITEMS SELECTED
            </p>
          </div>

          <div className="space-y-3">
            {cart.items.map((item: any) => {
              const productCategory = getItemCategory(item);
              const productId = getItemId(item);
              const productUrl = `/product/${productCategory}/${productId}`;
              const variantText =
                Object.values(item.variant_attributes || {}).join(" / ") ||
                "Default variant";

              return (
                <div
                  key={item._id}
                  className="rounded-md border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      href={productUrl}
                      className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-md bg-slate-100"
                    >
                      <Image
                        src={getItemImage(item)}
                        alt={item.product_name || "Product"}
                        fill
                        className="object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={productUrl}
                          className="block text-lg font-semibold text-slate-900 hover:text-[#ff3f6c]"
                        >
                          {item.product_name}
                        </Link>
                        <p className="mt-1 text-sm text-slate-500">{variantText}</p>
                        <div className="mt-4 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 px-0"
                            onClick={() =>
                              updateItemQty(item._id, Math.max(1, item.quantity - 1))
                            }
                          >
                            -
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 px-0"
                            onClick={() => updateItemQty(item._id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-900">
                          {formatAmount(item.total_price || 0)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 text-rose-600 hover:text-rose-700"
                          onClick={() => removeItem(item._id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          REMOVE
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
            PRICE DETAILS ({cart.items.length} ITEM{cart.items.length > 1 ? "S" : ""})
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
          <Button
            className="mt-5 h-11 w-full bg-[#ff3f6c] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#e93861]"
            onClick={() => router.push("/checkout/address")}
          >
            PLACE ORDER
          </Button>
        </aside>
      </div>
    </CheckoutShell>
  );
}
