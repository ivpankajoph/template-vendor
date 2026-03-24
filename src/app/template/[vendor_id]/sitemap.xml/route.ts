import { headers } from "next/headers";
import { buildTemplateSitemapXml } from "@/lib/template-sitemap";

type RouteContext = {
  params: Promise<{ vendor_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { vendor_id } = await context.params;
  const headerStore = await headers();
  const websiteId = String(headerStore.get("x-template-website") || "").trim();
  const customHostname = String(headerStore.get("x-template-domain-host") || "").trim();

  const xml = await buildTemplateSitemapXml({
    vendorId: vendor_id,
    websiteId,
    hostname: customHostname || undefined,
    basePath: customHostname ? "" : `template/${vendor_id}`,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
