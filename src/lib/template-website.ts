export const TEMPLATE_WEBSITE_QUERY_PARAM = "website";

const normalizeWebsiteIdentifier = (value?: string | null) => String(value || "").trim();

const getTemplateWebsiteIdFromPath = (pathname?: string) => {
  const segments = String(pathname || "/").split("/").filter(Boolean);
  const websiteIndex = segments.findIndex((segment) => segment === "website");
  if (websiteIndex === -1 || !segments[websiteIndex + 1]) return "";
  return normalizeWebsiteIdentifier(segments[websiteIndex + 1]);
};

export const getTemplateWebsiteIdFromSearch = (
  pathname?: string,
  searchParams?: URLSearchParams | null
) => {
  const value =
    getTemplateWebsiteIdFromPath(pathname) ||
    searchParams?.get(TEMPLATE_WEBSITE_QUERY_PARAM) ||
    searchParams?.get("website_id") ||
    "";

  return normalizeWebsiteIdentifier(value) || undefined;
};
