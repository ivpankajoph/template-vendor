import type { Metadata } from "next";

import PolicyPageClient from "@/app/template/components/pages/PolicyPageClient";

export const metadata: Metadata = {
  title: "Shipping & Return Policy",
};

export default function ShippingReturnPolicyPage() {
  return <PolicyPageClient kind="shipping" />;
}
