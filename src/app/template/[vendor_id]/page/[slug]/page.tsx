import type { Metadata } from "next";

import CustomPageClient from "@/app/template/components/pages/CustomPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id,
    slug
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'custom-page', slug });
}

export default function Page() {
  return <CustomPageClient />;
}
