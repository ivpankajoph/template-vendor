"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";
import { fetchCart } from "@/store/slices/customerCartSlice";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
} from "@/store/slices/customerAddressSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/toast";
import userApi from "@/lib/userApi";

import CheckoutShell from "../components/checkout-shell";
import {
  formatAmount,
  getSavedCheckoutAddressId,
  getSavedCheckoutPaymentMethod,
  INDIAN_STATES,
  saveCheckoutAddressId,
} from "../components/checkout-utils";

type CheckoutAddress = {
  _id: string;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
};

type AddressForm = {
  label: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
};

const DEFAULT_FORM: AddressForm = {
  label: "Home",
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const getEstimateDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CheckoutAddressPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const token = useSelector((state: RootState) => state.customerAuth.token);
  const cart = useSelector((state: RootState) => state.customerCart.cart);
  const cartLoading = useSelector((state: RootState) => state.customerCart.loading);
  const addresses = useSelector(
    (state: RootState) => state.customerAddress.addresses as CheckoutAddress[],
  );
  const addressLoading = useSelector(
    (state: RootState) => state.customerAddress.loading,
  );

  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [form, setForm] = useState<AddressForm>(DEFAULT_FORM);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    dispatch(fetchCart());
    dispatch(fetchAddresses());
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

  const fetchShippingQuote = async (addressId: string) => {
    if (!addressId) return;
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

  const subtotal = Number(cart?.subtotal || 0);
  const totalAmount = subtotal + shippingFee;
  const estimateDate = getEstimateDate();

  const selectedAddress = useMemo(
    () => addresses.find((item) => item._id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingAddressId(null);
  };

  const openAddAddress = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditAddress = (address: CheckoutAddress) => {
    setEditingAddressId(address._id);
    setForm({
      label: address.label || "Home",
      full_name: address.full_name || "",
      phone: address.phone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    });
    setIsFormOpen(true);
  };

  const onFormValueChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAddress = async () => {
    if (
      !form.full_name ||
      !form.phone ||
      !form.line1 ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      toastError("Please fill all required address fields.");
      return;
    }

    try {
      setSavingAddress(true);
      const payload = {
        ...form,
        country: "India",
        is_default: addresses.length === 0,
      };

      let response: any;
      if (editingAddressId) {
        response = await dispatch(
          updateAddress({ id: editingAddressId, data: payload }),
        ).unwrap();
        toastSuccess("Address updated");
      } else {
        response = await dispatch(createAddress(payload)).unwrap();
        toastSuccess("Address saved");
      }

      const nextAddressId = response?.address?._id || "";
      if (nextAddressId) {
        setSelectedAddressId(nextAddressId);
        saveCheckoutAddressId(nextAddressId);
      }

      setIsFormOpen(false);
      resetForm();
      dispatch(fetchAddresses());
    } catch (error: any) {
      toastError(error || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (addressId: string) => {
    try {
      await dispatch(deleteAddress({ id: addressId })).unwrap();
      toastSuccess("Address removed");
      if (selectedAddressId === addressId) {
        setSelectedAddressId("");
        saveCheckoutAddressId("");
      }
      dispatch(fetchAddresses());
    } catch (error: any) {
      toastError(error || "Failed to remove address");
    }
  };

  if (!token) return null;

  if (!cart || cart.items?.length === 0) {
    return (
      <CheckoutShell activeStep="address">
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
    <CheckoutShell activeStep="address">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          <div className="rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-semibold text-slate-900">
                Select Delivery Address
              </h2>
              <Button
                variant="outline"
                className="h-11 px-6 font-semibold"
                onClick={openAddAddress}
              >
                Add New Address
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address._id;
                return (
                  <label
                    key={address._id}
                    className={`block cursor-pointer rounded-md border p-4 transition ${
                      isSelected
                        ? "border-[#ff3f6c] bg-[#fff7fa]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="selected_address"
                        className="mt-1 h-4 w-4 accent-[#ff3f6c]"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedAddressId(address._id);
                          saveCheckoutAddressId(address._id);
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-semibold text-slate-900">
                          {address.full_name}
                          <span className="ml-2 rounded-full border border-emerald-500 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-600">
                            {address.label || "Home"}
                          </span>
                        </p>
                        <p className="mt-2 text-xl text-slate-700">
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}
                        </p>
                        <p className="text-xl text-slate-700">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="mt-2 text-xl text-slate-900">
                          Mobile: {address.phone}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Pay on Delivery available
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 px-4 font-semibold"
                            onClick={(event) => {
                              event.preventDefault();
                              openEditAddress(address);
                            }}
                          >
                            EDIT
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 px-4 font-semibold"
                            onClick={(event) => {
                              event.preventDefault();
                              removeAddress(address._id);
                            }}
                          >
                            REMOVE
                          </Button>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}

              {!addressLoading && addresses.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No saved address found. Add your first delivery address.
                </p>
              ) : null}
            </div>
          </div>

          {isFormOpen ? (
            <div className="rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h3>
                <Button
                  variant="ghost"
                  className="text-slate-600"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="label">Address Type</Label>
                  <select
                    id="label"
                    name="label"
                    value={form.label}
                    onChange={onFormValueChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={form.full_name}
                    onChange={onFormValueChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={onFormValueChange}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="line1">Address Line 1</Label>
                  <Input
                    id="line1"
                    name="line1"
                    value={form.line1}
                    onChange={onFormValueChange}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="line2">Address Line 2</Label>
                  <Input
                    id="line2"
                    name="line2"
                    value={form.line2}
                    onChange={onFormValueChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={onFormValueChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <select
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={onFormValueChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((stateName) => (
                      <option key={stateName} value={stateName}>
                        {stateName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={form.pincode}
                    onChange={onFormValueChange}
                  />
                </div>
              </div>
              <Button
                className="mt-5 h-11 bg-[#ff3f6c] px-8 text-white hover:bg-[#e93861]"
                onClick={saveAddress}
                disabled={savingAddress}
              >
                {savingAddress ? "Saving..." : "Save Address"}
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
            DELIVERY ESTIMATES
          </h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-16 w-14 overflow-hidden rounded-md bg-slate-100">
              <Image
                src={cart.items?.[0]?.image_url || "/placeholder.png"}
                alt="Product"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-sm text-slate-700">
              Estimated delivery by <span className="font-semibold">{estimateDate}</span>
            </p>
          </div>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
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
            disabled={!selectedAddress}
            onClick={() => router.push("/checkout/payment")}
          >
            CONTINUE
          </Button>
          {!selectedAddress ? (
            <p className="mt-2 text-xs text-rose-600">
              Please choose a delivery address to continue.
            </p>
          ) : null}
        </aside>
      </div>
    </CheckoutShell>
  );
}
