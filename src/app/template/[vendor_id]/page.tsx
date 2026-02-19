import type { Metadata } from "next";

import { TemplateHomeRenderer } from "../components/TemplateHomeRenderer";
import { buildTemplateMetadata } from "@/lib/template-metadata";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vendor_id } = await params;
  return buildTemplateMetadata({ vendorId: vendor_id, page: "home" });
}

export default function Page() {
  return (
    <div>
      <TemplateHomeRenderer />
    </div>
  );
}
