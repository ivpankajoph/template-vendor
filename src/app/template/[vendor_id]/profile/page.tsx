import type { Metadata } from "next";

import ProfilePageClient from "@/app/template/components/pages/ProfilePageClient";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'profile' });
}

export default function Page() {
  return <ProfilePageClient />;
}
