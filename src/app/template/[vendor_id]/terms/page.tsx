import type { Metadata } from "next";

import PolicyPageClient from "@/app/template/components/pages/PolicyPageClient";

export const metadata: Metadata = {
  title: "Terms & Condition",
};

export default function TermsPage() {
  return <PolicyPageClient kind="terms" />;
}
