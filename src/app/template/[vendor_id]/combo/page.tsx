import type { Metadata } from "next";

import { PocoFoodComboPage } from "@/app/template/components/pocofood/PocoFoodComboPage";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vendor_id } = await params;
  return buildTemplateMetadata({ vendorId: vendor_id, page: "combo" });
}

export default function Page() {
  return <PocoFoodComboPage />;
}
