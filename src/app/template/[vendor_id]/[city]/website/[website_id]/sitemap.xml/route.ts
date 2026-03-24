import { buildTemplateSitemapXml } from "@/lib/template-sitemap";

type RouteContext = {
  params: Promise<{ vendor_id: string; city: string; website_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { vendor_id, city, website_id } = await context.params;

  const xml = await buildTemplateSitemapXml({
    vendorId: vendor_id,
    citySlug: city,
    websiteId: website_id,
    basePath: `template/${vendor_id}/${city}/website/${website_id}`,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
