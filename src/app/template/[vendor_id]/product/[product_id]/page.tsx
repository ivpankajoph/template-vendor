import type { Metadata } from "next";

import ProductDetailPageClient from "@/app/template/components/pages/ProductDetailPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string; product_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id,
    product_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'product-detail', productId: product_id });
}

export default function Page() {
  return <ProductDetailPageClient />;
}
