import type { Metadata } from "next";

import CategoryDetailPageClient from "@/app/template/components/pages/CategoryDetailPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string; category_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id,
    category_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'category-detail', categoryId: category_id });
}

export default function Page() {
  return <CategoryDetailPageClient />;
}
