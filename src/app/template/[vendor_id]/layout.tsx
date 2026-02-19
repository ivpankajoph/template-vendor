import React from "react";
import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { TemplateThemeProvider } from "../components/TemplateThemeProvider";
import { TemplateDataLoader } from "../components/TemplateDataLoader";
import { TemplatePreviewRealtimeSync } from "../components/TemplatePreviewRealtimeSync";
import { TemplateInlineEditorBridge } from "../components/TemplateInlineEditorBridge";
import { buildTemplateMetadata } from "@/lib/template-metadata";

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
  return (
    <TemplateThemeProvider>
      <div className="template-site-shell min-h-screen flex flex-col">
        <TemplatePreviewRealtimeSync vendorId={vendor_id} />
        <TemplateDataLoader vendorId={vendor_id} />
        <TemplateInlineEditorBridge />
        <Navbar />
        <main className="template-site-main flex-grow">{children}</main>
        <Footer />
      </div>
    </TemplateThemeProvider>
  );
}
