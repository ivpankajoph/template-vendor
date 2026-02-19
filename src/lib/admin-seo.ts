import type { Metadata } from "next";

export type SeoAppSource = "ophmate_frontend" | "vendor_template_frontend";

type SeoOverride = {
  app_source?: SeoAppSource;
  route_pattern?: string;
  match_type?: "exact" | "pattern";
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  is_active?: boolean;
};

type SeoCacheEntry = {
  expiresAt: number;
  value: SeoOverride | null;
};

const SEO_CACHE = new Map<string, SeoCacheEntry>();
const SEO_CACHE_TTL_MS = 30_000;
const SEO_FETCH_TIMEOUT_MS = 1_200;

const normalizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const normalizeSeoPath = (value: string) => {
  const source = normalizeString(value).split(/[?#]/)[0] || "/";
  const withLeadingSlash = source.startsWith("/") ? source : `/${source}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash || "/";
};

const parseKeywords = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const readSeoOverride = (input: any): SeoOverride | null => {
  if (!input || typeof input !== "object") return null;
  return {
    app_source: input.app_source,
    route_pattern: normalizeString(input.route_pattern),
    match_type: input.match_type,
    meta_title: normalizeString(input.meta_title),
    meta_description: normalizeString(input.meta_description),
    meta_keywords: parseKeywords(input.meta_keywords),
    is_active: Boolean(input.is_active),
  };
};

const getApiBase = () => (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export const resolveSeoAppSourceFromPath = (pathname: string): SeoAppSource => {
  const normalizedPath = normalizeSeoPath(pathname);
  if (normalizedPath.startsWith("/template/")) {
    return "vendor_template_frontend";
  }
  return "ophmate_frontend";
};

export const fetchSeoOverride = async ({
  appSource,
  path,
  force = false,
}: {
  appSource: SeoAppSource;
  path: string;
  force?: boolean;
}): Promise<SeoOverride | null> => {
  const normalizedPath = normalizeSeoPath(path);
  const cacheKey = `${appSource}:${normalizedPath}`;
  const now = Date.now();
  const cached = SEO_CACHE.get(cacheKey);
  if (!force && cached && cached.expiresAt > now) {
    return cached.value;
  }

  const apiBase = getApiBase();
  if (!apiBase) {
    SEO_CACHE.set(cacheKey, {
      expiresAt: now + SEO_CACHE_TTL_MS,
      value: null,
    });
    return null;
  }

  const url = `${apiBase}/seo/resolve?app_source=${encodeURIComponent(
    appSource,
  )}&path=${encodeURIComponent(normalizedPath)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEO_FETCH_TIMEOUT_MS);
    const requestOptions: any = {
      cache: force ? "no-store" : "force-cache",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    };
    if (!force) {
      requestOptions.next = { revalidate: 120 };
    }
    const response = await fetch(url, requestOptions).finally(() => {
      clearTimeout(timeout);
    });
    if (!response.ok) {
      SEO_CACHE.set(cacheKey, {
        expiresAt: Date.now() + SEO_CACHE_TTL_MS,
        value: null,
      });
      return null;
    }
    const payload = await response.json();
    const parsed = readSeoOverride(payload?.data);
    SEO_CACHE.set(cacheKey, {
      expiresAt: Date.now() + SEO_CACHE_TTL_MS,
      value: parsed,
    });
    return parsed;
  } catch {
    SEO_CACHE.set(cacheKey, {
      expiresAt: Date.now() + SEO_CACHE_TTL_MS,
      value: null,
    });
    return null;
  }
};

const toKeywordList = (value: Metadata["keywords"]) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const mergeMetadataWithSeoOverride = (
  metadata: Metadata,
  override: SeoOverride | null,
): Metadata => {
  if (!override) return metadata;
  const nextTitle = normalizeString(override.meta_title) || metadata.title;
  const nextDescription =
    normalizeString(override.meta_description) || metadata.description;
  const nextKeywords = override.meta_keywords?.length
    ? override.meta_keywords
    : toKeywordList(metadata.keywords);

  return {
    ...metadata,
    title: nextTitle,
    description: nextDescription,
    keywords: nextKeywords,
  };
};

const getMetaTag = ({ name, property }: { name?: string; property?: string }) => {
  if (typeof document === "undefined") return null;
  if (name) return document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (property) {
    return document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  }
  return null;
};

const upsertMetaTag = ({
  name,
  property,
  content,
}: {
  name?: string;
  property?: string;
  content: string;
}) => {
  if (typeof document === "undefined" || !content) return;
  let tag = getMetaTag({ name, property });
  if (!tag) {
    tag = document.createElement("meta");
    if (name) tag.name = name;
    if (property) tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

export const applySeoOverrideToDocument = (override: SeoOverride | null) => {
  if (typeof document === "undefined" || !override) return;

  const title = normalizeString(override.meta_title);
  const description = normalizeString(override.meta_description);
  const keywords = parseKeywords(override.meta_keywords).join(", ");

  if (title) {
    document.title = title;
    upsertMetaTag({ property: "og:title", content: title });
    upsertMetaTag({ name: "twitter:title", content: title });
  }
  if (description) {
    upsertMetaTag({ name: "description", content: description });
    upsertMetaTag({ property: "og:description", content: description });
    upsertMetaTag({ name: "twitter:description", content: description });
  }
  if (keywords) {
    upsertMetaTag({ name: "keywords", content: keywords });
  }
};
