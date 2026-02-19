"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

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
  createdAt: string;
};

export default function TemplateProfilePage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const auth = getTemplateAuth(vendorId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [profileRes, addressRes, ordersRes] = await Promise.all([
          templateApiFetch(vendorId, "/me"),
          templateApiFetch(vendorId, "/addresses"),
          templateApiFetch(vendorId, "/orders"),
        ]);
        setProfile(profileRes.user || null);
        setAddresses(addressRes.addresses || []);
        setOrders(ordersRes.orders || []);
      } catch {
        setProfile(null);
        setAddresses([]);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId]);

  if (!auth) {
    return (
      <div className={pageClass}>
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Login required
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to view your profile.
            </p>
            <button
              onClick={() =>
                router.push(`/template/${vendorId}/login?next=/template/${vendorId}/profile`)
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
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">My Profile</h1>
        <div className="h-1 mb-6 template-accent-bg"></div>

        {loading ? (
          <div className="rounded-lg bg-white p-6 text-center text-gray-500">
            Loading profile...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                  Account details
                </h2>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">Name:</span>{" "}
                    {profile?.name || "Not provided"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Email:</span>{" "}
                    {profile?.email || "Not provided"}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Phone:</span>{" "}
                    {profile?.phone || "Not provided"}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                  Saved addresses
                </h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {addresses.length ? (
                    addresses.map((address) => (
                      <div
                        key={address._id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-semibold text-slate-900">
                          {address.label || "Address"}
                        </p>
                        <p>
                          {address.full_name} • {address.phone}
                        </p>
                        <p>
                          {address.line1}{" "}
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
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Orders history
              </h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {orders.length ? (
                  orders.map((order) => (
                    <div
                      key={order._id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {order.order_number}
                      </p>
                      <p>
                        {new Date(order.createdAt).toLocaleDateString()} •{" "}
                        {order.status}
                      </p>
                      <p className="font-semibold text-slate-900">
                        ₹{order.total.toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No orders yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
