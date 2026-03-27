import { buildTemplateScopedPath } from "@/lib/template-route";

export type TemplateBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  isPublished: boolean;
  publishedAt: string;
  sourceIndex: number;
};

const slugify = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toSummary = (value: string) => {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  return `${clean.slice(0, 177).trim()}...`;
};

export const isExternalBlogHref = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

export const resolveTemplateBlogHref = ({
  value,
  vendorId,
  pathname,
  fallback = "/blog",
}: {
  value?: unknown;
  vendorId: string;
  pathname?: string;
  fallback?: string;
}) => {
  const href = typeof value === "string" ? value.trim() : "";
  const finalValue = href || fallback;

  if (
    finalValue.startsWith("#") ||
    finalValue.startsWith("/template/") ||
    isExternalBlogHref(finalValue)
  ) {
    return finalValue;
  }

  if (finalValue === "/") {
    return buildTemplateScopedPath({
      vendorId,
      pathname,
      suffix: "",
    });
  }

  if (finalValue.startsWith("/")) {
    return buildTemplateScopedPath({
      vendorId,
      pathname,
      suffix: finalValue.replace(/^\/+/, ""),
    });
  }

  return buildTemplateScopedPath({
    vendorId,
    pathname,
    suffix: finalValue,
  });
};

const normalizeBlog = (item: any, index: number): TemplateBlogPost | null => {
  const title = String(item?.title || "").trim();
  const content = String(item?.content || "").trim();
  const slug = slugify(item?.slug || item?.title || `blog-${index + 1}`);

  if (!slug || (!title && !content)) return null;

  return {
    id: String(item?.id || slug || `blog-${index + 1}`),
    title: title || "Blog Post",
    slug,
    excerpt:
      String(item?.excerpt || "").trim() || toSummary(content || title || "Read more"),
    coverImage: String(item?.cover_image || "").trim(),
    content,
    isPublished: item?.isPublished !== false,
    publishedAt: String(item?.published_at || "").trim(),
    sourceIndex: index,
  };
};

export const getTemplateBlogs = (template: any): TemplateBlogPost[] => {
  const list = Array.isArray(template?.components?.social_page?.blogs)
    ? template.components.social_page.blogs
    : [];

  return list
    .map((item: any, index: number) => normalizeBlog(item, index))
    .filter((item: TemplateBlogPost | null): item is TemplateBlogPost => Boolean(item))
    .filter((item: TemplateBlogPost) => item.isPublished);
};

export const getTemplateBlogPost = (template: any, slug: string) => {
  const normalizedSlug = slugify(slug);
  return (
    getTemplateBlogs(template).find(
      (item) => item.slug === normalizedSlug || item.id === normalizedSlug
    ) || null
  );
};

export const getTemplateBlogFooterLink = (template: any) => {
  const footer = template?.components?.social_page?.footer || {};
  return {
    label: String(footer?.blog_label || "").trim() || "Blog",
    href: String(footer?.blog_href || "").trim() || "/blog",
  };
};

export const getTemplateBlogParagraphs = (content: unknown) => {
  const raw = String(content || "").trim();
  const paragraphs = raw
    .split(/\r?\n\s*\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return paragraphs.length > 0
    ? paragraphs
    : ["This vendor has not published blog content yet."];
};
