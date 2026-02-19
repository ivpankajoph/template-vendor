import type { Metadata } from "next";

import OrdersPageClient from "@/app/template/components/pages/OrdersPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'orders' });
}

export default function Page() {
  return <OrdersPageClient />;
}
