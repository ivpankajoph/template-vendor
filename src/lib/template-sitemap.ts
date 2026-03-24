import type { MetadataRoute } from "next";
import { headers } from "next/headers";

type UnknownRecord = Record<string, any>;

type TemplatePreviewPayload = {
  template: UnknownRecord | null;
  products: UnknownRecord[];
};

type BuildTemplateSitemapOptions = {
  vendorId: string;
  citySlug?: string;
  websiteId?: string;
  basePath?: string;
  hostname?: string;
};

const DEFAULT_PROTOCOL = "https";
const DEFAULT_CHANGE_FREQUENCY: MetadataRoute.Sitemap[number]["changeFrequency"] = "daily";
const DEFAULT_PRIORITY = 0.7;

const getApiBase = () => {
  const value = process.env.NEXT_PUBLIC_API_URL || "";
  return value.replace(/\/+$/, "");
};

const normalizeSegment = (value?: string) =>
  String(value || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

const normalizeCitySlug = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all";

const normalizeWebsiteId = (value?: string) => String(value || "").trim();

const getRequestProtocol = async () => {
  try {
    const headerStore = await headers();
    const forwardedProto = String(headerStore.get("x-forwarded-proto") || "").trim();
    return forwardedProto || DEFAULT_PROTOCOL;
  } catch {
    return DEFAULT_PROTOCOL;
  }
};

const getRequestHostname = async () => {
  try {
    const headerStore = await headers();
    const customDomainHost = String(
      headerStore.get("x-template-domain-host") || ""
    ).trim();
    if (customDomainHost) return customDomainHost;

    const forwardedHost = String(headerStore.get("x-forwarded-host") || "").trim();
    if (forwardedHost) return forwardedHost;

    return String(headerStore.get("host") || "").trim();
  } catch {
    return "";
  }
};

const resolveOrigin = async (hostname?: string) => {
  const requestHostname = normalizeSegment(hostname) || (await getRequestHostname());
  const protocol = await getRequestProtocol();

  if (requestHostname) {
    return `${protocol}://${requestHostname}`;
  }

  const envBase =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    "";

  return envBase.replace(/\/+$/, "") || "http://localhost:3001";
};

const fetchJson = async (url: string) => {
  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: { "Content-Type": "application/json" },
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
    };
  }
};

const fetchTemplatePreview = async (
  vendorId: string,
  citySlug: string,
  websiteId?: string
): Promise<TemplatePreviewPayload> => {
  const apiBase = getApiBase();
  if (!apiBase || !vendorId) {
    return { template: null, products: [] };
  }

  const resolvedCity = normalizeCitySlug(citySlug);
  const resolvedWebsiteId = normalizeWebsiteId(websiteId);
  const cityQuery = `city=${encodeURIComponent(resolvedCity)}`;
  const websiteQuery = resolvedWebsiteId
    ? `&website_id=${encodeURIComponent(resolvedWebsiteId)}`
    : "";

  const endpoints = [
    `${apiBase}/templates/${encodeURIComponent(vendorId)}/preview?${cityQuery}${websiteQuery}`,
    `${apiBase}/templates/template-all?vendor_id=${encodeURIComponent(vendorId)}&${cityQuery}${websiteQuery}`,
  ];

  for (const endpoint of endpoints) {
    const response = await fetchJson(endpoint);
    if (!response.ok) continue;

    const payload = response.data;
    const template = payload?.data?.template || payload?.data || payload?.template || null;
    const products = Array.isArray(payload?.data?.products) ? payload.data.products : [];

    if (template || products.length) {
      return { template, products };
    }
  }

  return { template: null, products: [] };
};

const toSlug = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildUrl = (origin: string, basePath: string, suffix = "") => {
  const normalizedBase = normalizeSegment(basePath);
  const normalizedSuffix = normalizeSegment(suffix);
  const pathname = [normalizedBase, normalizedSuffix].filter(Boolean).join("/");
  return new URL(pathname ? `/${pathname}` : "/", origin).toString();
};

const createEntry = (
  url: string,
  lastModified?: string,
  priority = DEFAULT_PRIORITY
): MetadataRoute.Sitemap[number] => ({
  url,
  lastModified: lastModified || new Date().toISOString(),
  changeFrequency: DEFAULT_CHANGE_FREQUENCY,
  priority,
});

export async function buildTemplateSitemap(
  options: BuildTemplateSitemapOptions
): Promise<MetadataRoute.Sitemap> {
  const vendorId = normalizeSegment(options.vendorId);
  const citySlug = normalizeCitySlug(options.citySlug);
  const websiteId = normalizeWebsiteId(options.websiteId);
  const basePath = normalizeSegment(options.basePath);
  const origin = await resolveOrigin(options.hostname);
  const { template, products } = await fetchTemplatePreview(vendorId, citySlug, websiteId);
  const lastModified =
    String(template?.updatedAt || template?.createdAt || "").trim() ||
    new Date().toISOString();

  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  const addEntry = (suffix = "", priority?: number) => {
    const url = buildUrl(origin, basePath, suffix);
    if (entries.has(url)) return;
    entries.set(url, createEntry(url, lastModified, priority));
  };

  addEntry("", 1);
  addEntry("about", 0.8);
  addEntry("contact", 0.8);
  addEntry("all-products", 0.9);
  addEntry("category", 0.8);

  const customPages = Array.isArray(template?.components?.custom_pages)
    ? template.components.custom_pages
    : [];

  customPages
    .filter((page: UnknownRecord) => page?.isPublished !== false)
    .forEach((page: UnknownRecord) => {
      const slug = normalizeSegment(page?.slug || page?.id);
      if (!slug) return;
      addEntry(`page/${slug}`, 0.7);
    });

  const categorySlugs = new Set<string>();
  products.forEach((product: UnknownRecord) => {
    const productId = normalizeSegment(product?._id);
    if (productId) {
      addEntry(`product/${productId}`, 0.8);
    }

    const rawCategory =
      product?.productCategory?._id ||
      product?.productCategory ||
      product?.productCategoryName ||
      product?.productCategory?.name ||
      product?.productCategory?.title ||
      product?.productCategory?.categoryName;

    const categorySlug =
      /^[a-f\d]{24}$/i.test(String(rawCategory || "").trim())
        ? String(rawCategory).trim()
        : toSlug(
            product?.productCategoryName ||
              product?.productCategory?.name ||
              product?.productCategory?.title ||
              product?.productCategory?.categoryName ||
              rawCategory
          );

    if (categorySlug) {
      categorySlugs.add(categorySlug);
    }
  });

  categorySlugs.forEach((slug) => addEntry(`category/${slug}`, 0.7));

  return Array.from(entries.values());
}

const escapeXml = (value: string) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildTemplateSitemapXml = async (
  options: BuildTemplateSitemapOptions
) => {
  const entries = await buildTemplateSitemap(options);

  const body = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(
            entry.lastModified instanceof Date
              ? entry.lastModified.toISOString()
              : String(entry.lastModified)
          )}</lastmod>`
        : "";
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${escapeXml(String(entry.changeFrequency))}</changefreq>`
        : "";
      const priority =
        typeof entry.priority === "number"
          ? `<priority>${entry.priority.toFixed(1)}</priority>`
          : "";

      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${changeFrequency}${priority}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
};
