"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";

import TemplateCheckoutShell from "./template-checkout-shell";
import {
  formatAmount,
  getTemplateCheckoutAddressId,
  getTemplateCheckoutPaymentMethod,
  INDIAN_STATES,
  saveTemplateCheckoutAddressId,
} from "./template-checkout-utils";

type TemplateCartItem = {
  _id: string;
  image_url?: string;
};

type TemplateCart = {
  items: TemplateCartItem[];
  subtotal: number;
};

type TemplateAddress = {
  _id: string;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
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

export default function TemplateCheckoutAddressPageClient() {
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);

  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<TemplateCart | null>(null);
  const [addresses, setAddresses] = useState<TemplateAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const [form, setForm] = useState<AddressForm>(DEFAULT_FORM);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [error, setError] = useState("");

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
    } catch (err: any) {
      setError(err?.message || "Failed to load address data");
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

  const fetchShippingQuote = async (addressId: string) => {
    if (!addressId) return;
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

  const subtotal = Number(cart?.subtotal || 0);
  const totalAmount = subtotal + shippingFee;
  const estimateDate = getEstimateDate();

  const onFormChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingAddressId(null);
  };

  const openAddAddress = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditAddress = (address: TemplateAddress) => {
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

  const saveAddress = async () => {
    if (
      !form.full_name ||
      !form.phone ||
      !form.line1 ||
      !form.city ||
      !form.state ||
      !form.pincode
    ) {
      setError("Please fill all required address fields.");
      return;
    }

    try {
      setSavingAddress(true);
      setError("");
      const payload = { ...form, country: "India" };
      let response: any;
      if (editingAddressId) {
        response = await templateApiFetch(
          vendorId,
          `/addresses/${editingAddressId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      } else {
        response = await templateApiFetch(vendorId, "/addresses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const nextAddressId = response?.address?._id || "";
      if (nextAddressId) {
        setSelectedAddressId(nextAddressId);
        saveTemplateCheckoutAddressId(vendorId, nextAddressId);
      }
      setIsFormOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (addressId: string) => {
    try {
      setError("");
      await templateApiFetch(vendorId, `/addresses/${addressId}`, {
        method: "DELETE",
      });
      if (selectedAddressId === addressId) {
        setSelectedAddressId("");
        saveTemplateCheckoutAddressId(vendorId, "");
      }
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to remove address");
    }
  };

  if (!auth) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="address">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-slate-900">Login required</p>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to continue checkout.
            </p>
            <button
              onClick={() =>
                router.push(
                  `/template/${vendorId}/login?next=/template/${vendorId}/checkout/address`,
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

  const bagItems = cart?.items || [];

  if (!loading && bagItems.length === 0) {
    return (
      <TemplateCheckoutShell vendorId={vendorId} activeStep="address">
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

  return (
    <TemplateCheckoutShell vendorId={vendorId} activeStep="address">
      <div className="template-checkout-page grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-4">
          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="template-checkout-card rounded-md border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <h2 className="text-3xl font-semibold text-slate-900">
                Select Delivery Address
              </h2>
              <button
                onClick={openAddAddress}
                className="template-checkout-accent-outline h-11 rounded-md border border-slate-400 px-6 text-sm font-semibold text-slate-900"
              >
                Add New Address
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address._id;
                return (
                  <label
                    key={address._id}
                    className={`block cursor-pointer rounded-md border p-4 transition ${
                      isSelected
                        ? "template-checkout-accent-border border-[#ff3f6c] bg-[#fff7fa]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="selected_address"
                        className="template-checkout-accent-input mt-1 h-4 w-4 accent-[#ff3f6c]"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedAddressId(address._id);
                          saveTemplateCheckoutAddressId(vendorId, address._id);
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
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              openEditAddress(address);
                            }}
                            className="template-checkout-accent-outline h-9 rounded-md border border-slate-400 px-4 text-sm font-semibold text-slate-900"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              removeAddress(address._id);
                            }}
                            className="template-checkout-accent-outline h-9 rounded-md border border-slate-400 px-4 text-sm font-semibold text-slate-900"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}

              {!loading && addresses.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No saved address found. Add your first delivery address.
                </p>
              ) : null}
            </div>
          </div>

          {isFormOpen ? (
            <div className="template-checkout-card rounded-md border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <h3 className="text-2xl font-semibold text-slate-900">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-800">Address Type</label>
                  <select
                    name="label"
                    value={form.label}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">Full Name</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-800">
                    Address Line 1
                  </label>
                  <input
                    name="line1"
                    value={form.line1}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-800">
                    Address Line 2
                  </label>
                  <input
                    name="line2"
                    value={form.line2}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">City</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-800">State</label>
                  <select
                    name="state"
                    value={form.state}
                    onChange={onFormChange}
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
                  <label className="text-sm font-medium text-slate-800">Pincode</label>
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={onFormChange}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={saveAddress}
                disabled={savingAddress}
                className="template-checkout-accent mt-5 h-11 rounded-md bg-[#ff3f6c] px-8 text-sm font-semibold text-white hover:bg-[#e93861] disabled:opacity-60"
              >
                {savingAddress ? "Saving..." : "Save Address"}
              </button>
            </div>
          ) : null}
        </section>

        <aside className="template-checkout-card h-fit rounded-md border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-700">
            DELIVERY ESTIMATES
          </h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-16 w-14 overflow-hidden rounded-md bg-slate-100">
              <Image
                src={bagItems[0]?.image_url || "/placeholder.png"}
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
            PRICE DETAILS ({bagItems.length} ITEM{bagItems.length > 1 ? "S" : ""})
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
          <button
            disabled={!selectedAddress}
            onClick={() => router.push(`/template/${vendorId}/checkout/payment`)}
            className="template-checkout-accent mt-5 h-11 w-full rounded-md bg-[#ff3f6c] text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#e93861] disabled:opacity-50"
          >
            CONTINUE
          </button>
          {!selectedAddress ? (
            <p className="mt-2 text-xs text-rose-600">
              Please choose a delivery address to continue.
            </p>
          ) : null}
        </aside>
      </div>
    </TemplateCheckoutShell>
  );
}
