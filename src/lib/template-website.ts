export const TEMPLATE_WEBSITE_QUERY_PARAM = "website";

export const getTemplateWebsiteIdFromSearch = (searchParams?: URLSearchParams | null) => {
  const value =
    searchParams?.get(TEMPLATE_WEBSITE_QUERY_PARAM) ||
    searchParams?.get("website_id") ||
    "";

  return value.trim() || undefined;
};
