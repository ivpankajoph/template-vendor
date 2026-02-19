import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const {
    vendor_id
  } = await params;
    return buildTemplateMetadata({ vendorId: vendor_id, page: 'checkout' });
}

export default async function Page({ params }: PageProps) {
  const { vendor_id } = await params;
  redirect(`/template/${vendor_id}/checkout/bag`);
}
