import type { Metadata } from "next";
import { cache } from "react";
import {
  fetchSeoOverride,
  mergeMetadataWithSeoOverride,
  type SeoAppSource,
} from "@/lib/admin-seo";

type UnknownRecord = Record<string, any>;

type TemplatePreviewPayload = {
  template: UnknownRecord | null;
  products: UnknownRecord[];
};

type TemplateMetadataPage =
  | "home"
  | "about"
  | "contact"
  | "all-products"
  | "product-list"
  | "product-detail"
  | "category-list"
  | "category-detail"
  | "custom-page"
  | "cart"
  | "checkout"
  | "orders"
  | "profile"
  | "login"
  | "register";

type BuildTemplateMetadataOptions = {
  vendorId: string;
  page: TemplateMetadataPage;
  productId?: string;
  categoryId?: string;
  slug?: string;
};

const DEFAULT_SITE_TITLE = "OPH-mart";
const DEFAULT_SITE_DESCRIPTION = "Discover products from trusted stores on OPH-mart.";
const DEFAULT_KEYWORDS = ["oph-mart", "online shopping", "vendor store"];
const TEMPLATE_NOT_FOUND_COOLDOWN_MS = 60 * 1000;
const metadataNotFoundByVendor = new Map<string, number>();
const metadataEndpointPreference = new Map<string, "preview" | "fallback">();

const getApiBase = () => {
  const value = process.env.NEXT_PUBLIC_API_URL || "";
  return value.replace(/\/+$/, "");
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const normalizeKeyword = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, " ")
    .replace(/\s+/g, " ");

const parseKeywords = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value !== "string") return [];
  return value
    .split(/[|,]/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

const uniqueKeywords = (...keywordLists: string[][]) => {
  const map = new Map<string, string>();
  for (const list of keywordLists) {
    for (const keyword of list) {
      const normalized = normalizeKeyword(keyword);
      if (!normalized || map.has(normalized)) continue;
      map.set(normalized, keyword.trim());
    }
  }
  return Array.from(map.values());
};

const makeMetadata = ({
  title,
  description,
  keywords,
}: {
  title?: string;
  description?: string;
  keywords?: string[];
}): Metadata => {
  const cleanTitle = pickString(title) || DEFAULT_SITE_TITLE;
  const cleanDescription = pickString(description) || DEFAULT_SITE_DESCRIPTION;
  const cleanKeywords = uniqueKeywords(DEFAULT_KEYWORDS, keywords || []);

  return {
    title: cleanTitle,
    description: cleanDescription,
    keywords: cleanKeywords,
  };
};

const readMetaFromObject = (source?: UnknownRecord | null) => {
  if (!source || typeof source !== "object") {
    return { title: "", description: "", keywords: [] as string[] };
  }

  const seo = source?.seo || source?.meta || source?.metadata || {};
  return {
    title: pickString(
      source?.metaTitle,
      source?.meta_title,
      source?.title,
      source?.name,
      seo?.title,
      seo?.metaTitle,
      seo?.meta_title
    ),
    description: pickString(
      source?.metaDescription,
      source?.meta_description,
      source?.description,
      source?.subtitle,
      seo?.description,
      seo?.metaDescription,
      seo?.meta_description
    ),
    keywords: uniqueKeywords(
      parseKeywords(source?.metaKeywords),
      parseKeywords(source?.meta_keywords),
      parseKeywords(source?.keywords),
      parseKeywords(seo?.keywords),
      parseKeywords(seo?.metaKeywords),
      parseKeywords(seo?.meta_keywords)
    ),
  };
};

const toSlug = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s+/g, "-")
    : "";

type FetchJsonResult = {
  ok: boolean;
  status: number;
  data: any;
};

const fetchJson = async (url: string): Promise<FetchJsonResult> => {
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

const fetchTemplatePreview = cache(
  async (vendorId: string): Promise<TemplatePreviewPayload> => {
    const apiBase = getApiBase();
    if (!apiBase || !vendorId) {
      return { template: null, products: [] };
    }
    const now = Date.now();
    const blockedUntil = metadataNotFoundByVendor.get(vendorId) || 0;
    if (blockedUntil > now) {
      return { template: null, products: [] };
    }

    const previewUrl = `${apiBase}/templates/${encodeURIComponent(vendorId)}/preview`;
    const fallbackUrl = `${apiBase}/templates/template-all?vendor_id=${encodeURIComponent(vendorId)}`;
    const preferredEndpoint = metadataEndpointPreference.get(vendorId);
    const endpointOrder =
      preferredEndpoint === "fallback"
        ? (["fallback", "preview"] as const)
        : (["preview", "fallback"] as const);

    let notFoundResponses = 0;

    for (const endpoint of endpointOrder) {
      const response = await fetchJson(endpoint === "preview" ? previewUrl : fallbackUrl);
      if (!response.ok) {
        if (response.status === 404) {
          notFoundResponses += 1;
        }
        continue;
      }

      const payload = response.data;
      const template =
        payload?.data?.template ||
        payload?.data ||
        payload?.template ||
        null;
      const products = Array.isArray(payload?.data?.products)
        ? payload.data.products
        : [];

      if (template || products.length > 0) {
        metadataEndpointPreference.set(vendorId, endpoint);
        metadataNotFoundByVendor.delete(vendorId);
        return { template, products };
      }
    }

    if (notFoundResponses === endpointOrder.length) {
      metadataNotFoundByVendor.set(vendorId, now + TEMPLATE_NOT_FOUND_COOLDOWN_MS);
    }

    return {
      template: null,
      products: [],
    };
  }
);

const fetchProductById = cache(async (productId: string) => {
  const apiBase = getApiBase();
  if (!apiBase || !productId) return null;

  const response = await fetchJson(`${apiBase}/products/${encodeURIComponent(productId)}`);
  if (!response.ok || !response.data) return null;
  const payload = response.data;
  return payload?.product || payload?.data?.product || payload?.data || null;
});

const getStoreName = (template: UnknownRecord | null) =>
  pickString(
    template?.business_name,
    template?.name,
    template?.components?.home_page?.header_text,
    template?.template_name
  ) || "Store";

const getPageKeywordsFromProducts = (products: UnknownRecord[]) => {
  const names = products
    .map((item) =>
      pickString(
        item?.productCategoryName,
        item?.productCategory?.name,
        item?.productCategory?.title,
        item?.productCategory?.categoryName
      )
    )
    .filter(Boolean);

  return uniqueKeywords(names.slice(0, 8));
};

const matchCategory = (product: UnknownRecord, categoryId: string) => {
  const target = decodeURIComponent(categoryId || "").toLowerCase();
  if (!target) return false;

  const rawId = pickString(product?.productCategory?._id, product?.productCategory);
  const label = pickString(
    product?.productCategoryName,
    product?.productCategory?.name,
    product?.productCategory?.title,
    product?.productCategory?.categoryName
  );

  return rawId.toLowerCase() === target || toSlug(label) === target;
};

const findCustomPage = (template: UnknownRecord | null, slug?: string) => {
  if (!slug) return null;
  const pages = template?.components?.custom_pages;
  if (!Array.isArray(pages)) return null;
  return (
    pages.find((item: UnknownRecord) => pickString(item?.slug) === slug) ||
    pages.find((item: UnknownRecord) => pickString(item?.id) === slug) ||
    null
  );
};

const buildTemplatePath = (options: BuildTemplateMetadataOptions) => {
  const base = `/template/${encodeURIComponent(options.vendorId)}`;
  switch (options.page) {
    case "home":
      return base;
    case "about":
      return `${base}/about`;
    case "contact":
      return `${base}/contact`;
    case "all-products":
      return `${base}/all-products`;
    case "product-list":
      return `${base}/product`;
    case "product-detail":
      return `${base}/product/${encodeURIComponent(options.productId || "")}`;
    case "category-list":
      return `${base}/category`;
    case "category-detail":
      return `${base}/category/${encodeURIComponent(options.categoryId || "")}`;
    case "custom-page":
      return `${base}/page/${encodeURIComponent(options.slug || "")}`;
    case "cart":
      return `${base}/cart`;
    case "checkout":
      return `${base}/checkout`;
    case "orders":
      return `${base}/orders`;
    case "profile":
      return `${base}/profile`;
    case "login":
      return `${base}/login`;
    case "register":
      return `${base}/register`;
    default:
      return base;
  }
};

export async function buildTemplateMetadata(
  options: BuildTemplateMetadataOptions
): Promise<Metadata> {
  const { vendorId, page, productId, categoryId, slug } = options;
  const pagePath = buildTemplatePath(options);
  const applyAdminSeo = async (metadata: Metadata) => {
    const override = await fetchSeoOverride({
      appSource: "vendor_template_frontend" as SeoAppSource,
      path: pagePath,
    });
    return mergeMetadataWithSeoOverride(metadata, override);
  };
  const { template, products } = await fetchTemplatePreview(vendorId);
  const storeName = getStoreName(template);
  const homePage = template?.components?.home_page;
  const aboutPage = template?.components?.about_page;
  const contactPage = template?.components?.contact_page;

  const defaultTitle = `${storeName} | ${DEFAULT_SITE_TITLE}`;
  const defaultDescription =
    pickString(homePage?.header_text_small, homePage?.description?.summary) ||
    `Browse products from ${storeName} on OPH-mart.`;

  if (page === "home") {
    const homeMeta = readMetaFromObject(homePage);
    return applyAdminSeo(makeMetadata({
      title: pickString(homeMeta.title, homePage?.header_text, defaultTitle),
      description: pickString(
        homeMeta.description,
        homePage?.header_text_small,
        homePage?.description?.summary,
        defaultDescription
      ),
      keywords: uniqueKeywords(homeMeta.keywords, getPageKeywordsFromProducts(products)),
    }));
  }

  if (page === "about") {
    const aboutMeta = readMetaFromObject(aboutPage);
    return applyAdminSeo(makeMetadata({
      title: pickString(aboutMeta.title, aboutPage?.hero?.title, `About ${storeName}`),
      description: pickString(
        aboutMeta.description,
        aboutPage?.hero?.subtitle,
        aboutPage?.story?.paragraphs?.[0],
        defaultDescription
      ),
      keywords: aboutMeta.keywords,
    }));
  }

  if (page === "contact") {
    const contactMeta = readMetaFromObject(contactPage);
    return applyAdminSeo(makeMetadata({
      title: pickString(
        contactMeta.title,
        contactPage?.hero?.title,
        `Contact ${storeName}`
      ),
      description: pickString(
        contactMeta.description,
        contactPage?.hero?.subtitle,
        defaultDescription
      ),
      keywords: contactMeta.keywords,
    }));
  }

  if (page === "product-detail" && productId) {
    const productFromCatalog = products.find((product) => product?._id === productId) || null;
    const fetchedProduct = productFromCatalog ? null : await fetchProductById(productId);
    const product = fetchedProduct || productFromCatalog;
    const productMeta = readMetaFromObject(product);
    return applyAdminSeo(makeMetadata({
      title: pickString(
        productMeta.title,
        product?.productName,
        product?.name,
        `Product | ${storeName}`
      ),
      description: pickString(
        productMeta.description,
        product?.shortDescription,
        product?.description,
        defaultDescription
      ),
      keywords: uniqueKeywords(
        productMeta.keywords,
        parseKeywords(product?.productTags),
        parseKeywords(product?.tags)
      ),
    }));
  }

  if (page === "category-detail" && categoryId) {
    const categoryProducts = products.filter((product) => matchCategory(product, categoryId));
    const sampleProduct = categoryProducts[0];
    const categorySource =
      sampleProduct?.productCategory && typeof sampleProduct.productCategory === "object"
        ? sampleProduct.productCategory
        : null;
    const categoryMeta = readMetaFromObject(categorySource);
    const categoryName =
      pickString(
        sampleProduct?.productCategoryName,
        sampleProduct?.productCategory?.name,
        sampleProduct?.productCategory?.title,
        sampleProduct?.productCategory?.categoryName
      ) || decodeURIComponent(categoryId).replace(/-/g, " ");

    return applyAdminSeo(makeMetadata({
      title: pickString(categoryMeta.title, `${categoryName} | ${storeName}`),
      description: pickString(
        categoryMeta.description,
        `Browse ${categoryName} products from ${storeName}.`,
        defaultDescription
      ),
      keywords: uniqueKeywords(categoryMeta.keywords, [categoryName], getPageKeywordsFromProducts(products)),
    }));
  }

  if (page === "custom-page") {
    const customPage = findCustomPage(template, slug);
    const customMeta = readMetaFromObject(customPage);
    const firstSection = Array.isArray(customPage?.sections)
      ? customPage.sections[0]
      : null;
    return applyAdminSeo(makeMetadata({
      title: pickString(customMeta.title, customPage?.title, `Page | ${storeName}`),
      description: pickString(
        customMeta.description,
        customPage?.subtitle,
        firstSection?.data?.subtitle,
        defaultDescription
      ),
      keywords: customMeta.keywords,
    }));
  }

  if (page === "all-products" || page === "product-list") {
    return applyAdminSeo(makeMetadata({
      title: `Products | ${storeName}`,
      description: `Explore all products available in ${storeName}.`,
      keywords: getPageKeywordsFromProducts(products),
    }));
  }

  if (page === "category-list") {
    return applyAdminSeo(makeMetadata({
      title: `Categories | ${storeName}`,
      description: `Browse product categories in ${storeName}.`,
      keywords: getPageKeywordsFromProducts(products),
    }));
  }

  const fallbackMap: Record<TemplateMetadataPage, { title: string; description: string }> = {
    home: { title: defaultTitle, description: defaultDescription },
    about: { title: `About ${storeName}`, description: defaultDescription },
    contact: { title: `Contact ${storeName}`, description: defaultDescription },
    "all-products": {
      title: `Products | ${storeName}`,
      description: `Explore all products available in ${storeName}.`,
    },
    "product-list": {
      title: `Product | ${storeName}`,
      description: defaultDescription,
    },
    "product-detail": {
      title: `Product | ${storeName}`,
      description: defaultDescription,
    },
    "category-list": {
      title: `Categories | ${storeName}`,
      description: defaultDescription,
    },
    "category-detail": {
      title: `Category | ${storeName}`,
      description: defaultDescription,
    },
    "custom-page": {
      title: `Page | ${storeName}`,
      description: defaultDescription,
    },
    cart: {
      title: `Cart | ${storeName}`,
      description: `Review products in your cart from ${storeName}.`,
    },
    checkout: {
      title: `Checkout | ${storeName}`,
      description: `Complete your purchase from ${storeName}.`,
    },
    orders: {
      title: `Orders | ${storeName}`,
      description: `Track your orders from ${storeName}.`,
    },
    profile: {
      title: `Profile | ${storeName}`,
      description: `Manage your profile and addresses in ${storeName}.`,
    },
    login: {
      title: `Login | ${storeName}`,
      description: `Sign in to your shopper account for ${storeName}.`,
    },
    register: {
      title: `Register | ${storeName}`,
      description: `Create your shopper account for ${storeName}.`,
    },
  };

  return applyAdminSeo(makeMetadata(fallbackMap[page]));
}
