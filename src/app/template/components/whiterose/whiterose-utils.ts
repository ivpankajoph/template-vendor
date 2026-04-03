"use client";

export const WHITE_ROSE_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export type WhiteRoseVariantImage = {
  url?: string;
} | string;

export type WhiteRoseProductVariant = {
  _id?: string;
  actualPrice?: number;
  finalPrice?: number;
  discountPercent?: number;
  stockQuantity?: number;
  isActive?: boolean;
  variantsImageUrls?: WhiteRoseVariantImage[];
};

export type WhiteRoseProduct = {
  _id?: string;
  slug?: string;
  productName?: string;
  shortDescription?: string;
  averageRating?: number;
  ratingsCount?: number;
  defaultImages?: WhiteRoseVariantImage[];
  variants?: WhiteRoseProductVariant[];
  productCategory?:
    | {
        _id?: string;
        name?: string;
        title?: string;
        categoryName?: string;
      }
    | string;
  productCategoryName?: string;
};

export const normalizeWhiteRoseText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const toWhiteRoseSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const whiteRoseFormatCurrency = (value: unknown) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

export const whiteRoseGetImageUrl = (
  image: WhiteRoseVariantImage | null | undefined
) => {
  if (typeof image === "string") return image.trim();
  if (!image || typeof image !== "object") return "";
  return normalizeWhiteRoseText(image.url);
};

export const whiteRoseGetPrimaryVariant = (
  product: WhiteRoseProduct | null | undefined
) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return (
    variants.find((variant) => variant?._id && variant?.isActive !== false) ||
    variants[0] ||
    null
  );
};

export const whiteRoseGetPricing = (
  product: WhiteRoseProduct | null | undefined
) => {
  const variant = whiteRoseGetPrimaryVariant(product);
  const finalPrice = Number(variant?.finalPrice || 0);
  const actualPrice = Number(variant?.actualPrice || 0);
  let discountPercent = Number(variant?.discountPercent || 0);

  if (!discountPercent && actualPrice > finalPrice && actualPrice > 0) {
    discountPercent = Math.round(((actualPrice - finalPrice) / actualPrice) * 100);
  }

  return {
    variantId: normalizeWhiteRoseText(variant?._id),
    finalPrice,
    actualPrice,
    discountPercent,
    stockQuantity: Number(variant?.stockQuantity || 0),
  };
};

export const whiteRoseGetLeadImage = (
  product: WhiteRoseProduct | null | undefined
) => {
  const defaultImage = (Array.isArray(product?.defaultImages) ? product.defaultImages : [])
    .map((image) => whiteRoseGetImageUrl(image))
    .find(Boolean);

  if (defaultImage) return defaultImage;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  for (const variant of variants) {
    const variantImage = (
      Array.isArray(variant?.variantsImageUrls) ? variant.variantsImageUrls : []
    )
      .map((image) => whiteRoseGetImageUrl(image))
      .find(Boolean);
    if (variantImage) return variantImage;
  }

  return "";
};

export const whiteRoseGetCategoryDetails = (
  product: WhiteRoseProduct | null | undefined,
  categoryMap: Record<string, string> = {}
) => {
  const categoryObject =
    typeof product?.productCategory === "string" ? undefined : product?.productCategory;

  const rawId =
    normalizeWhiteRoseText(categoryObject?._id) ||
    normalizeWhiteRoseText(
      typeof product?.productCategory === "string" ? product.productCategory : ""
    );

  const explicitLabel =
    normalizeWhiteRoseText(product?.productCategoryName) ||
    normalizeWhiteRoseText(categoryObject?.name) ||
    normalizeWhiteRoseText(categoryObject?.title) ||
    normalizeWhiteRoseText(categoryObject?.categoryName);

  const mappedLabel = rawId ? normalizeWhiteRoseText(categoryMap[rawId]) : "";
  const fallbackLabel =
    rawId && !WHITE_ROSE_OBJECT_ID_REGEX.test(rawId) ? rawId : "";

  return {
    id: rawId,
    label: explicitLabel || mappedLabel || fallbackLabel,
  };
};

export const whiteRoseGetRating = (
  product: WhiteRoseProduct | null | undefined,
  fallback = 4.4
) => {
  const value = Number(product?.averageRating || fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(5, value));
};

