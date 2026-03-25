import { NEXT_PUBLIC_API_URL } from "@/config/variables";

type FetchTemplateMetaPixelOptions = {
  vendorId?: string;
  websiteId?: string;
};

const getApiBase = () => {
  const baseUrl = String(NEXT_PUBLIC_API_URL || "").trim();
  if (!baseUrl) return "";
  return baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
};

const extractMetaPixelId = (value: unknown) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const initMatch = rawValue.match(
    /fbq\(\s*['"]init['"]\s*,\s*['"]?(\d{5,25})['"]?\s*\)/i
  );
  if (initMatch?.[1]) return initMatch[1];

  const directMatch = rawValue.match(/^(\d{5,25})$/);
  if (directMatch?.[1]) return directMatch[1];

  const fallbackMatch = rawValue.match(/\b(\d{8,25})\b/);
  return fallbackMatch?.[1] || "";
};

export const fetchTemplateMetaPixel = async ({
  vendorId,
  websiteId,
}: FetchTemplateMetaPixelOptions) => {
  const apiBase = getApiBase();
  const normalizedVendorId = String(vendorId || "").trim();
  const normalizedWebsiteId = String(websiteId || "").trim();

  if (!apiBase || !normalizedVendorId) return null;

  try {
    const url = new URL(
      `${apiBase}/templates/${encodeURIComponent(normalizedVendorId)}`
    );
    if (normalizedWebsiteId) {
      url.searchParams.set("website_id", normalizedWebsiteId);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const metaPixel = payload?.data?.meta_pixel || null;
    const pixelId = extractMetaPixelId(metaPixel?.pixel_id);

    if (!pixelId || metaPixel?.is_active === false) return null;

    return {
      pixelId,
    };
  } catch {
    return null;
  }
};