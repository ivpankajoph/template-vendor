import type { Metadata } from "next";

import PolicyPageClient from "@/app/template/components/pages/PolicyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return <PolicyPageClient kind="privacy" />;
}
