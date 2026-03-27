import { buildTemplateScopedPath } from "@/lib/template-route";

export type PolicyPageKind = "privacy" | "terms" | "shipping";

type PolicyDefaults = {
  title: string;
  label: string;
  fallbackText: string;
};

type PolicyPageStyle = {
  titleSize: number;
  subtitleSize: number;
  sectionHeadingSize: number;
  bodySize: number;
  titleColor: string;
  subtitleColor: string;
  sectionHeadingColor: string;
  bodyColor: string;
};

const POLICY_DEFAULTS: Record<PolicyPageKind, PolicyDefaults> = {
  privacy: {
    title: "Privacy Policy",
    label: "Privacy Policy",
    fallbackText:
      "This vendor has not added a privacy policy yet. Please contact the business for more information.",
  },
  terms: {
    title: "Terms & Condition",
    label: "Terms & Condition",
    fallbackText:
      "This vendor has not added terms and conditions yet. Please contact the business for more information.",
  },
  shipping: {
    title: "Shipping & Return Policy",
    label: "Shipping & Return Policy",
    fallbackText:
      "This vendor has not added shipping and return policy details yet. Please contact the business for more information.",
  },
};

const POLICY_PAGE_FALLBACKS: Record<
  PolicyPageKind,
  { id: string; slug: string }
> = {
  privacy: {
    id: "privacy-policy",
    slug: "privacy",
  },
  terms: {
    id: "terms-condition",
    slug: "terms",
  },
  shipping: {
    id: "shipping-return-policy",
    slug: "shipping-return-policy",
  },
};

export const isExternalPolicyHref = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

export const resolveTemplatePolicyHref = ({
  value,
  vendorId,
  pathname,
  fallback,
}: {
  value?: unknown;
  vendorId: string;
  pathname?: string;
  fallback: string;
}) => {
  const href = typeof value === "string" ? value.trim() : "";
  const finalValue = href || fallback;

  if (
    finalValue.startsWith("#") ||
    finalValue.startsWith("/template/") ||
    isExternalPolicyHref(finalValue)
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

const toParagraphs = (value: unknown, fallbackText: string) => {
  const raw = String(value || "").trim();
  const paragraphs = raw
    .split(/\r?\n\s*\r?\n/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return paragraphs.length > 0 ? paragraphs : [fallbackText];
};

export const getPolicyPageContent = (template: any, kind: PolicyPageKind) => {
  const defaults = POLICY_DEFAULTS[kind];
  const social = template?.components?.social_page || {};
  const footer = social?.footer || {};
  const legalPages = social?.legal_pages || {};
  const page = legalPages?.[kind] || {};
  const customPages = Array.isArray(template?.components?.custom_pages)
    ? template.components.custom_pages
    : [];
  const customPage =
    customPages.find(
      (item: any) =>
        item?.slug === POLICY_PAGE_FALLBACKS[kind].slug ||
        item?.id === POLICY_PAGE_FALLBACKS[kind].id
    ) || null;
  const textSection = Array.isArray(customPage?.sections)
    ? customPage.sections.find((item: any) => item?.type === "text")
    : null;
  const customPageStyle =
    (customPage &&
    typeof customPage === "object" &&
    typeof (customPage as any).style === "object" &&
    (customPage as any).style
      ? (customPage as any).style
      : null) ||
    (textSection &&
    typeof textSection === "object" &&
    typeof (textSection as any)?.data?.style === "object" &&
    (textSection as any).data.style
      ? (textSection as any).data.style
      : null);

  const label = String(
    kind === "privacy"
      ? footer?.policy_primary_label || ""
      : kind === "terms"
        ? footer?.policy_secondary_label || ""
        : ""
  ).trim();
  const href = String(
    kind === "privacy"
      ? footer?.policy_primary_href || ""
      : kind === "terms"
        ? footer?.policy_secondary_href || ""
        : ""
  ).trim();
  const title =
    String(page?.title || "").trim() ||
    String(customPage?.title || "").trim() ||
    String(textSection?.data?.title || "").trim() ||
    defaults.title;
  const subtitle =
    String(page?.subtitle || "").trim() ||
    String(customPage?.subtitle || "").trim();
  const content =
    String(page?.content || "").trim() ||
    String(textSection?.data?.body || "").trim();
  const style = {
    titleSize: Number(page?.style?.titleSize || customPageStyle?.titleSize || 48) || 48,
    subtitleSize: Number(page?.style?.subtitleSize || customPageStyle?.subtitleSize || 18) || 18,
    sectionHeadingSize:
      Number(page?.style?.sectionHeadingSize || customPageStyle?.sectionHeadingSize || 24) || 24,
    bodySize: Number(page?.style?.bodySize || customPageStyle?.bodySize || 16) || 16,
    titleColor: String(page?.style?.titleColor || customPageStyle?.titleColor || "#1d4ed8"),
    subtitleColor: String(
      page?.style?.subtitleColor || customPageStyle?.subtitleColor || "#475569"
    ),
    sectionHeadingColor: String(
      page?.style?.sectionHeadingColor || customPageStyle?.sectionHeadingColor || "#0f172a"
    ),
    bodyColor: String(page?.style?.bodyColor || customPageStyle?.bodyColor || "#475569"),
  } satisfies PolicyPageStyle;

  return {
    title,
    subtitle,
    content,
    style,
    paragraphs: toParagraphs(content, defaults.fallbackText),
    footerLabel: label || defaults.label,
    footerHref:
      href ||
      (kind === "privacy"
        ? "/privacy"
        : kind === "terms"
          ? "/terms"
          : "/shipping-return-policy"),
  };
};
