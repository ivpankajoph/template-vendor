import type { Metadata } from "next";

import ContactPageClient from "@/app/template/components/pages/ContactPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'contact' });
}

export default function Page() {
  return <ContactPageClient />;
}
