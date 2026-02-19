import type { Metadata } from "next";

import AboutPageClient from "@/app/template/components/pages/AboutPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'about' });
}

export default function Page() {
  return <AboutPageClient />;
}
