import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
// @ts-ignore - CSS global import has no type declarations
import "./globals.css";
import ReduxProvider from "@/providers/ReduxProvider";
import VendorProvider from "@/providers/VendorProvider";
import GoogleAnalytics from "@/components/google-analytics/GoogleAnalytics";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import SeoRuntime from "@/components/seo/seo-runtime";
import PageTransitionLoader from "@/components/navigation/PageTransitionLoader";
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

const DEFAULT_METADATA: Metadata = {
  title: "OPH-mart",
  description: "design and developed by ivpankaj",
};
const SEO_LOOKUP_TIMEOUT_MS = 450;

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <VendorProvider>
          <GoogleAnalytics />
          <ReduxProvider>
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
