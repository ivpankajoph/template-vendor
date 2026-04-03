const KNOWN_TEMPLATE_SEGMENTS = new Set([
  "",
  "about",
  "all-products",
  "blog",
  "cart",
  "category",
  "checkout",
  "contact",
  "login",
  "orders",
  "page",
  "privacy",
  "preview",
  "product",
  "profile",
  "register",
  "shipping-return-policy",
  "subcategory",
  "terms",
  "website",
]);

const normalizeSegment = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeOptionalCitySlug = (value?: string) => {
  const slug = normalizeSegment(value)
  return slug && slug !== 'all' ? slug : ''
}

const getCustomDomainCityFromPath = (pathname?: string) => {
  const segments = String(pathname || '/').split('/').filter(Boolean)
  const candidateCity = normalizeSegment(segments[0])
  return candidateCity && !KNOWN_TEMPLATE_SEGMENTS.has(candidateCity) ? candidateCity : ''
}

export type TemplateRouteContext = {
  isPreview: boolean;
  templateKey?: string;
  citySlug: string;
  websiteSlug?: string;
};

export const getTemplateRouteContext = (
  pathname: string,
  vendorId?: string
): TemplateRouteContext => {
  const segments = String(pathname || "/").split("/").filter(Boolean);
  const targetVendorId = String(vendorId || "");

  if (segments[0] !== "template" || !segments[1] || (targetVendorId && segments[1] !== targetVendorId)) {
    return { isPreview: false, citySlug: "all", websiteSlug: "" };
  }

  if (segments[2] === "preview" && segments[3]) {
    let index = 4;
    const candidateCity = normalizeSegment(segments[index]);
    const hasCity = candidateCity && !KNOWN_TEMPLATE_SEGMENTS.has(candidateCity);
    const citySlug = hasCity ? candidateCity : "all";
    if (hasCity) index += 1;

    const websiteSlug =
      segments[index] === "website" && segments[index + 1]
        ? normalizeSegment(segments[index + 1])
        : "";

    return {
      isPreview: true,
      templateKey: segments[3],
      citySlug,
      websiteSlug,
    };
  }

  let index = 2;
  const candidateCity = normalizeSegment(segments[index]);
  const hasCity = candidateCity && !KNOWN_TEMPLATE_SEGMENTS.has(candidateCity);
  const citySlug = hasCity ? candidateCity : "all";
  if (hasCity) index += 1;

  const websiteSlug =
    segments[index] === "website" && segments[index + 1]
      ? normalizeSegment(segments[index + 1])
      : "";

  return { isPreview: false, citySlug, websiteSlug };
};

export const buildTemplateScopedPath = ({
  vendorId,
  pathname,
  suffix = "",
}: {
  vendorId: string;
  pathname?: string;
  suffix?: string;
}) => {
  const activePathname =
    String(pathname || "").trim() ||
    (typeof window !== "undefined" ? window.location.pathname || "/" : "/");
  const context = getTemplateRouteContext(activePathname, vendorId);
  const normalizedSuffix = String(suffix || "").replace(/^\/+/, "");
  const suffixPart = normalizedSuffix ? `/${normalizedSuffix}` : "";

  if (!isPlatformTemplatePath(activePathname, vendorId)) {
    return suffixPart || "/";
  }

  const cityPart = context.citySlug ? `/${context.citySlug}` : "/all";
  const websitePart = context.websiteSlug
    ? `/website/${encodeURIComponent(context.websiteSlug)}`
    : "";

  if (context.isPreview && context.templateKey) {
    return `/template/${vendorId}/preview/${context.templateKey}${cityPart}${websitePart}${suffixPart}`;
  }

  return `/template/${vendorId}${cityPart}${websitePart}${suffixPart}`;
};

export const isPlatformTemplatePath = (pathname: string, vendorId?: string) => {
  const normalizedVendorId = String(vendorId || '').trim()
  const normalizedPathname = String(pathname || '').trim()
  if (!normalizedVendorId || !normalizedPathname) return false
  return normalizedPathname.startsWith(`/template/${normalizedVendorId}`)
}

export const buildStorefrontScopedPath = ({
  vendorId,
  pathname,
  suffix = '',
}: {
  vendorId: string
  pathname?: string
  suffix?: string
}) =>
  buildTemplateScopedPath({
    vendorId,
    pathname,
    suffix,
  })

export const buildTemplateProductPath = ({
  vendorId,
  pathname,
  productId,
  productSlug,
  citySlug,
}: {
  vendorId: string
  pathname?: string
  productId?: string
  productSlug?: string
  citySlug?: string
}) => {
  const resolvedSlug = String(productSlug || productId || '').trim()
  if (!resolvedSlug) return '#'

  const activePathname =
    String(pathname || '').trim() ||
    (typeof window !== 'undefined' ? window.location.pathname || '/' : '/')

  if (isPlatformTemplatePath(activePathname, vendorId)) {
    return buildTemplateScopedPath({
      vendorId,
      pathname: activePathname,
      suffix: resolvedSlug,
    })
  }

  const resolvedCity =
    normalizeOptionalCitySlug(citySlug) || getCustomDomainCityFromPath(activePathname)

  const suffix = resolvedCity ? `/${resolvedCity}/${resolvedSlug}` : `/${resolvedSlug}`
  return suffix
}

export const getTemplateCityFromPath = (pathname: string, vendorId?: string) =>
  getTemplateRouteContext(pathname, vendorId).citySlug || "all";

export const getTemplateWebsiteFromPath = (pathname: string, vendorId?: string) =>
  getTemplateRouteContext(pathname, vendorId).websiteSlug || "";
