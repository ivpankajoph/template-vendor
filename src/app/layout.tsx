import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Sora } from "next/font/google";
import { headers } from "next/headers";
// @ts-ignore - CSS global import has no type declarations
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import VendorProvider from "@/providers/VendorProvider";
import GoogleAnalytics from "@/components/google-analytics/GoogleAnalytics";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import SeoRuntime from "@/components/seo/seo-runtime";
import PageTransitionLoader from "@/components/navigation/PageTransitionLoader";
import { getTemplateCityFromPath } from "@/lib/template-route";
import {
  fetchSeoOverride,
  mergeMetadataWithSeoOverride,
  normalizeSeoPath,
  resolveSeoAppSourceFromPath,
} from "@/lib/admin-seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const DEFAULT_METADATA: Metadata = {
  title: "OPH-mart",
  description: "design and developed by ivpankaj",
};
const SEO_LOOKUP_TIMEOUT_MS = 450;
const TEMPLATE_FETCH_TIMEOUT_MS = 5000;

const fetchTemplatePreloadedState = async ({
  vendorId,
  websiteId,
  currentPath,
}: {
  vendorId: string;
  websiteId?: string;
  currentPath?: string;
}) => {
  const apiBase = String(process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!apiBase || !vendorId) return undefined;

  const citySlug = getTemplateCityFromPath(currentPath || "/", vendorId);
  const previewUrl = new URL(`${apiBase}/templates/${vendorId}/preview`);
  previewUrl.searchParams.set("city", citySlug || "all");
  if (websiteId) {
    previewUrl.searchParams.set("website_id", websiteId);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TEMPLATE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(previewUrl.toString(), {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return undefined;

    const payload = await response.json();
    const template =
      payload?.data?.template || payload?.data || payload?.template || null;
    const products = Array.isArray(payload?.data?.products)
      ? payload.data.products
      : Array.isArray(payload?.products)
        ? payload.products
        : [];

    if (!template) return undefined;

    return {
      alltemplatepage: {
        data: template,
        products,
        loading: false,
        error: null,
        errorStatus: null,
        lastErrorAt: null,
        currentVendorId: vendorId,
        currentCitySlug: citySlug || "all",
        currentWebsiteId: websiteId || null,
        lastFetchedAt: Date.now(),
      },
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const headerStore = await headers();
    const currentPath = normalizeSeoPath(headerStore.get("x-current-path") || "/");
    const appSource = resolveSeoAppSourceFromPath(currentPath);
    const override = await Promise.race([
      fetchSeoOverride({
        appSource,
        path: currentPath,
      }),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), SEO_LOOKUP_TIMEOUT_MS),
      ),
    ]);
    return mergeMetadataWithSeoOverride(DEFAULT_METADATA, override);
  } catch {
    return DEFAULT_METADATA;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const templateVendorId = String(headerStore.get("x-template-vendor") || "").trim();
  const templateWebsiteId = String(headerStore.get("x-template-website") || "").trim();
  const currentPath = String(headerStore.get("x-current-path") || "/").trim();
  const preloadedState = templateVendorId
    ? await fetchTemplatePreloadedState({
        vendorId: templateVendorId,
        websiteId: templateWebsiteId || undefined,
        currentPath,
      })
    : undefined;
  return (
    <html lang="en">
      <body
        data-template-vendor={templateVendorId}
        data-template-website={templateWebsiteId}
        className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${sora.variable} antialiased`}
      >
        <VendorProvider>
          <GoogleAnalytics />
          <ReduxProvider preloadedState={preloadedState}>
            <AnalyticsTracker />
            <SeoRuntime />
            <PageTransitionLoader />
            {children}
          </ReduxProvider>
        </VendorProvider>
      </body>
    </html>
  );
}
