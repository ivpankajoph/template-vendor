import type { Metadata } from "next";

import RegisterPageClient from "@/app/template/components/pages/RegisterPageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'register' });
}

export default function Page() {
  return <RegisterPageClient />;
}
