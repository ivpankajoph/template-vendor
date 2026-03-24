import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { TemplateThemeProvider } from "../components/TemplateThemeProvider";
import { TemplateDataLoader } from "../components/TemplateDataLoader";
import { TemplatePreviewRealtimeSync } from "../components/TemplatePreviewRealtimeSync";
import { TemplateInlineEditorBridge } from "../components/TemplateInlineEditorBridge";
import { MetaPixelScript } from "@/components/meta-pixel/MetaPixelScript";
import { buildTemplateMetadata } from "@/lib/template-metadata";
import { fetchTemplateMetaPixel } from "@/lib/meta-pixel";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ vendor_id: string }>;
};

export async function generateMetadata({ params }: Omit<LayoutProps, "children">): Promise<Metadata> {
  const { vendor_id } = await params;
  return buildTemplateMetadata({ vendorId: vendor_id, page: "home" });
}

export default async function VendorLayout({
  children,
  params,
}: LayoutProps) {
  const { vendor_id } = await params;
  const headerStore = await headers();
  const websiteId = String(headerStore.get("x-template-website") || "").trim();
  const metaPixel = await fetchTemplateMetaPixel({
    vendorId: vendor_id,
    websiteId,
  });
  return (
    <TemplateThemeProvider>
      <MetaPixelScript pixelId={metaPixel?.pixelId} />
      <div className="template-site-shell min-h-screen flex flex-col">
        <TemplatePreviewRealtimeSync vendorId={vendor_id} />
        <TemplateDataLoader vendorId={vendor_id} websiteId={websiteId} />
        <TemplateInlineEditorBridge />
        <Navbar />
        <main className="template-site-main flex-grow">{children}</main>
        <Footer />
      </div>
    </TemplateThemeProvider>
  );
}
