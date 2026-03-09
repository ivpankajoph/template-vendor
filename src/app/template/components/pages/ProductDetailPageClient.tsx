"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Minus, Plus, Star, Truck, RefreshCw, Shield, Zap, Check } from "lucide-react";

import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { getTemplateAuth, templateApiFetch } from "@/app/template/components/templateAuth";
import { trackAddToCart } from "@/lib/analytics-events";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateScopedPath, getTemplateCityFromPath } from "@/lib/template-route";
import ProductReviewsSection, {
  ProductReviewSummary,
} from "@/components/reviews/ProductReviewsSection";
import HyperlinkText from "@/components/HyperlinkText";

type VariantImage = {
  url?: string;
} | string;

type ProductVariant = {
  _id: string;
  variantSku?: string;
  variantAttributes?: Record<string, string>;
  actualPrice?: number;
  finalPrice?: number;
  discountPercent?: number;
  stockQuantity?: number;
  isActive?: boolean;
  variantsImageUrls?: VariantImage[];
  variantMetaDescription?: string;
};

type ProductFaq = {
  question?: string;
  answer?: string;
};

type Product = {
  _id: string;
  productName?: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  mainCategoryData?: { name?: string };
  productCategoryData?: { name?: string };
  productSubCategoryData?: Array<{ name?: string }>;
  defaultImages?: VariantImage[];
  variants?: ProductVariant[];
  specifications?: Array<Record<string, string>>;
  faqs?: ProductFaq[];
  averageRating?: number;
  ratingsCount?: number;
  mainCategory?: { name?: string } | string;
  mainCategoryName?: string;
  productCategory?: { name?: string; title?: string } | string;
  productCategoryName?: string;
  productSubCategory?: Array<{ name?: string; title?: string } | string> | { name?: string; title?: string } | string;
};

type ProductTab = "description" | "specifications" | "faqs" | "reviews";

const RETAIL_BENEFITS = [
  { icon: Truck, text: "Free shipping over Rs. 75" },
  { icon: RefreshCw, text: "30-day easy returns" },
  { icon: Shield, text: "1-year warranty" },
  { icon: Zap, text: "Fast delivery in 3-7 days" },
];

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (value: number) => `Rs. ${toNumber(value).toLocaleString()}`;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getImageUrl = (image: VariantImage | null | undefined) => {
  if (isNonEmptyString(image)) return image.trim();
  if (!image || typeof image !== "object") return "";
  const url = (image as { url?: unknown }).url;
  return isNonEmptyString(url) ? url.trim() : "";
};

const getVariantLabel = (variant: ProductVariant) => {
  const attrs =
    variant?.variantAttributes && typeof variant.variantAttributes === "object"
      ? variant.variantAttributes
      : {};

  if (isNonEmptyString(attrs.color)) {
    return attrs.color;
  }

  const firstValue = Object.values(attrs).find((value) => isNonEmptyString(value));
  if (isNonEmptyString(firstValue)) {
    return firstValue;
  }

  return variant.variantSku || "Variant";
};

const getUniqueImages = (product: Product | null) => {
  if (!product) return [] as string[];

  const defaultUrls = (product.defaultImages || [])
    .map((image) => getImageUrl(image))
    .filter((url): url is string => Boolean(url));

  const variantUrls = (product.variants || []).flatMap((variant) =>
    (variant.variantsImageUrls || [])
      .map((image) => getImageUrl(image))
      .filter((url): url is string => Boolean(url))
  );

  return Array.from(new Set([...defaultUrls, ...variantUrls]));
};

const getPrimaryVariant = (product: Product | null | undefined) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find((variant) => variant?.isActive !== false) || variants[0] || null;
};

const getProductLeadImage = (product: Product | null | undefined) => {
  if (!product) return "";

  const defaultImage = (product.defaultImages || [])
    .map((image) => getImageUrl(image))
    .find((url) => Boolean(url));
  if (defaultImage) return defaultImage;

  const primaryVariant = getPrimaryVariant(product);
  const primaryVariantImage = (primaryVariant?.variantsImageUrls || [])
    .map((image) => getImageUrl(image))
    .find((url) => Boolean(url));
  if (primaryVariantImage) return primaryVariantImage;

  for (const variant of product.variants || []) {
    const variantImage = (variant?.variantsImageUrls || [])
      .map((image) => getImageUrl(image))
      .find((url) => Boolean(url));
    if (variantImage) return variantImage;
  }

  return "";
};

const collectProductCategoryLabels = (product: Product | null | undefined) => {
  const labels = new Set<string>();
  if (!product) return [] as string[];

  const push = (value: unknown) => {
    if (isNonEmptyString(value)) labels.add(value.trim());
  };

  push(product.mainCategoryData?.name);
  push(product.productCategoryData?.name);
  push(product.mainCategoryName);
  push(product.productCategoryName);

  const mainCategory = product.mainCategory;
  if (mainCategory && typeof mainCategory === "object") {
    push(mainCategory.name);
  } else {
    push(mainCategory);
  }

  const productCategory = product.productCategory;
  if (productCategory && typeof productCategory === "object") {
    push(productCategory.name);
    push(productCategory.title);
  } else {
    push(productCategory);
  }

  (product.productSubCategoryData || []).forEach((item) => {
    push(item?.name);
  });

  const rawSubCategory = product.productSubCategory;
  if (Array.isArray(rawSubCategory)) {
    rawSubCategory.forEach((item) => {
      if (item && typeof item === "object") {
        push(item.name);
        push(item.title);
      } else {
        push(item);
      }
    });
  } else if (rawSubCategory && typeof rawSubCategory === "object") {
    push(rawSubCategory.name);
    push(rawSubCategory.title);
  } else {
    push(rawSubCategory);
  }

  return Array.from(labels);
};

export default function ProductDetailPage() {
  const variantTheme = useTemplateVariant();
  const params = useParams();
  const pathname = usePathname();
  const templateProducts = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  );

  const productId = params.product_id as string;
  const vendorId = params.vendor_id as string;
  const citySlug = getTemplateCityFromPath(pathname || "/", vendorId);
  const productPath = buildTemplateScopedPath({
    vendorId,
    pathname: pathname || "/",
    suffix: `product/${productId}`,
  });
  const loginPath = buildTemplateScopedPath({
    vendorId,
    pathname: pathname || "/",
    suffix: "login",
  });

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("specifications");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [templateToken, setTemplateToken] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary>({
    averageRating: 0,
    ratingsCount: 0,
  });

  const isStudio = variantTheme.key === "studio";
  const isWhiteRose = variantTheme.key === "whiterose";
  const isMinimal =
    variantTheme.key === "minimal" ||
    variantTheme.key === "mquiq" ||
    variantTheme.key === "poupqz" ||
    variantTheme.key === "whiterose";
  const isTrend = variantTheme.key === "trend" || variantTheme.key === "oragze";
  const pageClass = isWhiteRose
    ? "min-h-screen bg-[#f1f3f6] text-[#172337]"
    : isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-gray-50 text-slate-900";

  const panelClass = isWhiteRose
    ? "template-surface-card border border-[#dfe3eb] bg-white rounded-[24px] shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
    : isStudio
    ? "template-surface-card border border-slate-800 bg-slate-900/70 rounded-md"
    : isTrend
      ? "template-surface-card border border-rose-200 bg-white rounded-[1.8rem]"
    : isMinimal
      ? "template-surface-card border border-slate-200 bg-white rounded-xl"
      : "template-surface-card border border-slate-200 bg-white rounded-3xl";
  const accentTextClass = isWhiteRose
    ? "text-[#2874f0]"
    : isTrend
      ? "text-rose-600"
      : "text-indigo-600";
  const accentActiveVariantClass = isWhiteRose
    ? "border-[#2874f0] bg-[#eef4ff]"
    : isTrend
      ? "border-rose-400 bg-rose-50"
      : "border-indigo-500 bg-indigo-50";
  const accentIdleVariantClass = isWhiteRose
    ? "border-[#dfe3eb] bg-white"
    : isTrend
      ? "border-rose-200 bg-white"
      : "border-slate-200 bg-white";
  const accentBadgeClass = isWhiteRose
    ? "bg-[#eef4ff] text-[#174ea6]"
    : isTrend
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-100 text-slate-700";
  const accentButtonClass = isWhiteRose ? "bg-[#2874f0]" : isTrend ? "bg-rose-500" : "bg-indigo-500";
  const subtleTextClass = isWhiteRose
    ? "text-[#5f6c7b]"
    : isStudio
      ? "text-slate-300"
      : "text-slate-600";
  const softPanelClass = isWhiteRose ? "bg-[#f8fafc]" : isTrend ? "bg-rose-50" : "bg-slate-50";

  useEffect(() => {
    if (!productId) return;
    let active = true;

    const load = async () => {
      try {
        const cityQuery =
          citySlug && citySlug !== "all"
            ? `?city=${encodeURIComponent(citySlug)}`
            : "";
        const response = await fetch(`${NEXT_PUBLIC_API_URL}/products/${productId}${cityQuery}`);
        const data = await response.json();
        if (active) setProduct((data?.product || null) as Product | null);
      } catch {
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [productId, citySlug]);

  useEffect(() => {
    setActiveTab("specifications");
  }, [productId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncAuth = () => {
      const auth = getTemplateAuth(vendorId);
      setTemplateToken(auth?.token || null);
    };

    syncAuth();
    window.addEventListener("template-auth-updated", syncAuth);
    return () => {
      window.removeEventListener("template-auth-updated", syncAuth);
    };
  }, [vendorId]);

  const variants = useMemo(() => product?.variants || [], [product]);

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    const byId = variants.find((item) => item._id === selectedVariantId);
    if (byId) return byId;

    return variants.find((item) => item.isActive) || variants[0] || null;
  }, [variants, selectedVariantId]);

  const allImageUrls = useMemo(() => getUniqueImages(product), [product]);
  const selectedVariantLeadImage = useMemo(() => {
    if (!selectedVariant) return "";
    return (selectedVariant.variantsImageUrls || [])
      .map((image) => getImageUrl(image))
      .find((url) => Boolean(url)) || "";
  }, [selectedVariant]);

  useEffect(() => {
    if (!variants.length) {
      setSelectedVariantId("");
      return;
    }

    const firstActive = variants.find((item) => item.isActive) || variants[0];
    setSelectedVariantId((current) => current || firstActive?._id || "");
  }, [variants]);

  useEffect(() => {
    if (selectedVariantLeadImage) {
      setSelectedImage(selectedVariantLeadImage);
      return;
    }

    if (!allImageUrls.length) {
      setSelectedImage("");
      return;
    }

    setSelectedImage((current) =>
      current && allImageUrls.includes(current) ? current : allImageUrls[0]
    );
  }, [selectedVariantId, selectedVariantLeadImage, allImageUrls]);

  const basePrice = toNumber(selectedVariant?.finalPrice);
  const actualPrice = toNumber(selectedVariant?.actualPrice);
  const discountPercent =
    toNumber(selectedVariant?.discountPercent) > 0
      ? toNumber(selectedVariant?.discountPercent)
      : actualPrice > basePrice && actualPrice > 0
        ? Math.round(((actualPrice - basePrice) / actualPrice) * 100)
        : 0;

  const stockQuantity = toNumber(selectedVariant?.stockQuantity);
  const subtotal = basePrice * quantity;

  const productDescription =
    selectedVariant?.variantMetaDescription ||
    product?.description ||
    product?.shortDescription ||
    "No description available.";
  const productShortDescription = String(product?.shortDescription || "").trim();

  const detailedSpecs = useMemo(() => {
    const list: Array<[string, string]> = [];
    const rawSpecifications = Array.isArray(product?.specifications)
      ? product.specifications
      : [];

    rawSpecifications.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;
      Object.entries(entry).forEach(([key, value]) => {
        if (!isNonEmptyString(key)) return;
        if (!isNonEmptyString(value)) return;
        list.push([key.trim(), value.trim()]);
      });
    });

    return list;
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product?._id) return [] as Product[];

    const currentCategorySet = new Set(
      collectProductCategoryLabels(product).map((label) => label.toLowerCase())
    );

    const candidates = templateProducts
      .filter((item) => item?._id && item._id !== product._id)
      .map((item) => {
        const labels = collectProductCategoryLabels(item);
        const score = labels.reduce((total, label) => {
          return total + (currentCategorySet.has(label.toLowerCase()) ? 1 : 0);
        }, 0);

        return { item, score };
      });

    const byScore = [...candidates]
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.item);

    if (byScore.length > 0) return byScore;

    return candidates.slice(0, 4).map((entry) => entry.item);
  }, [product, templateProducts]);

  const summarySpecs = useMemo(() => {
    const rows: Array<[string, string]> = [];

    if (isNonEmptyString(product?.brand)) {
      rows.push(["Brand", product.brand]);
    }

    const mainCategory = product?.mainCategoryData?.name;
    if (isNonEmptyString(mainCategory)) {
      rows.push(["Main Category", mainCategory]);
    }

    const category = product?.productCategoryData?.name;
    if (isNonEmptyString(category)) {
      rows.push(["Category", category]);
    }

    const subCategoryLabel = (product?.productSubCategoryData || [])
      .map((item) => item?.name)
      .filter((name): name is string => isNonEmptyString(name))
      .join(", ");

    if (isNonEmptyString(subCategoryLabel)) {
      rows.push(["Subcategories", subCategoryLabel]);
    }

    if (selectedVariant?.variantSku) {
      rows.push(["SKU", selectedVariant.variantSku]);
    }

    rows.push(["Stock Available", String(Math.max(0, stockQuantity))]);
    rows.push(["Price", formatCurrency(basePrice)]);

    const attrs =
      selectedVariant?.variantAttributes &&
      typeof selectedVariant.variantAttributes === "object"
        ? selectedVariant.variantAttributes
        : {};

    Object.entries(attrs).forEach(([key, value]) => {
      if (isNonEmptyString(key) && isNonEmptyString(value)) {
        rows.push([key, value]);
      }
    });

    return rows;
  }, [product, selectedVariant, stockQuantity, basePrice]);

  const handleAddToCart = async () => {
    setMessage("");

    const auth = getTemplateAuth(vendorId);
    if (!auth) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(productPath)}`;
      return;
    }

    if (!selectedVariant?._id) {
      setMessage("Variant not available");
      return;
    }

    if (stockQuantity <= 0) {
      setMessage("This variant is out of stock");
      return;
    }

    setAdding(true);
    try {
      await templateApiFetch(vendorId, "/cart", {
        method: "POST",
        body: JSON.stringify({
          product_id: productId,
          variant_id: selectedVariant._id,
          quantity,
        }),
      });

      trackAddToCart({
        vendorId,
        userId: auth?.user?.id,
        productId,
        productName: product?.productName,
        productPrice: basePrice,
        quantity,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("template-cart-updated"));
      }

      setMessage("Added to cart");
    } catch (error: any) {
      setMessage(error?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Product not found.</div>
      </div>
    );
  }

  const hasFaqs = Array.isArray(product.faqs) && product.faqs.length > 0;
  const productAverageRating = toNumber(product.averageRating);
  const productRatingsCount = toNumber(product.ratingsCount);
  const displayRating =
    reviewSummary.ratingsCount > 0
      ? reviewSummary.averageRating
      : productAverageRating;
  const displayReviewsCount =
    reviewSummary.ratingsCount > 0
      ? reviewSummary.ratingsCount
      : productRatingsCount;

  return (
    <div className={`${pageClass} template-page-shell template-product-detail-page`}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="self-start lg:sticky lg:top-8">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
                {allImageUrls.length > 0 ? (
                  allImageUrls.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`template-product-card h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                        selectedImage === img
                          ? isWhiteRose
                            ? "border-[#2874f0]"
                            : "border-indigo-500"
                          : isStudio
                            ? "border-slate-700"
                            : isTrend
                              ? "border-rose-200"
                              : isWhiteRose
                                ? "border-[#dfe3eb]"
                                : "border-slate-200"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full bg-white object-contain p-1"
                      />
                    </button>
                  ))
                ) : (
                  <div className={`h-20 w-20 rounded-xl ${panelClass}`} />
                )}
              </div>

              <div className={`order-1 flex-1 overflow-hidden rounded-3xl p-4 `}>
                <div
                  className={`template-product-card relative h-[420px] overflow-hidden rounded-2xl sm:h-[520px] ${
                    softPanelClass
                  }`}
                >
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.productName || "Product"}
                      className="h-full w-full bg-white object-contain p-2 sm:p-3"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                      No Image
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        stockQuantity > 0
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                    {discountPercent > 0 && (
                      <span className="rounded-full bg-pink-500 px-3 py-1 text-xs font-semibold text-white">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold lg:text-5xl">
                {product.productName || "Untitled Product"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div
                  className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm ${
                    isStudio
                      ? "bg-slate-800 text-slate-100"
                      : isTrend
                        ? "bg-rose-100 text-rose-700"
                        : isWhiteRose
                          ? "bg-[#fff3d1] text-[#8a5a00]"
                          : "bg-amber-50 text-amber-900"
                  }`}
                >
                  <Star className="h-4 w-4 fill-current text-amber-500" />
                  <span className="font-semibold">
                    {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
                  </span>
                  <span>({displayReviewsCount} reviews)</span>
                </div>
                <div
                  className={`rounded px-3 py-1 font-mono text-sm ${
                    isStudio
                      ? "bg-slate-800 text-slate-200"
                      : isTrend
                        ? "bg-rose-50 text-rose-700"
                        : isWhiteRose
                          ? "bg-[#eef4ff] text-[#174ea6]"
                          : "bg-slate-100 text-slate-700"
                  }`}
                >
                  SKU: {selectedVariant?.variantSku || "N/A"}
                </div>
              </div>
              {productShortDescription ? (
                <HyperlinkText
                  text={productShortDescription}
                  className={`mt-3 text-sm leading-relaxed ${
                    subtleTextClass
                  }`}
                />
              ) : null}
            </div>

            <div className={`rounded-2xl p-5 ${panelClass}`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className={isStudio ? "text-slate-400 text-sm" : isWhiteRose ? "text-[#5f6c7b] text-sm" : "text-slate-500 text-sm"}>Item Price</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <p className={`text-4xl font-bold ${accentTextClass}`}>
                      {formatCurrency(basePrice)}
                    </p>
                    {actualPrice > basePrice && (
                      <p className={isStudio ? "text-slate-400 line-through" : "text-slate-500 line-through"}>
                        {formatCurrency(actualPrice)}
                      </p>
                    )}
                  </div>
                </div>
                {discountPercent > 0 && (
                  <span className="rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {RETAIL_BENEFITS.map((benefit) => (
                  <div
                    key={benefit.text}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isStudio ? "bg-slate-800 text-slate-200" : isWhiteRose ? "bg-[#eef4ff] text-[#174ea6]" : "bg-blue-50 text-blue-900"}`}
                  >
                    <benefit.icon className="h-4 w-4 text-blue-500" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-semibold">Select Variant</p>
                <div className="flex flex-wrap gap-3">
                  {variants.map((item) => {
                    const variantImage = (item?.variantsImageUrls || [])
                      .map((image) => getImageUrl(image))
                      .find((url) => Boolean(url));
                    const active = selectedVariant?._id === item._id;
                    const inStock = toNumber(item.stockQuantity) > 0;
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(item._id);
                          if (variantImage) {
                            setSelectedImage(variantImage);
                          }
                        }}
                        className={`template-product-card relative flex min-w-[180px] items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition ${
                          active
                            ? accentActiveVariantClass
                            : isStudio
                              ? "border-slate-700 bg-slate-900"
                              : accentIdleVariantClass
                        } ${!inStock ? "opacity-60" : ""}`}
                      >
                        {variantImage ? (
                          <img
                            src={variantImage}
                            alt={getVariantLabel(item)}
                            className="h-10 w-10 rounded-lg bg-white object-contain"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-200" />
                        )}

                        <div>
                          <p className="text-sm font-semibold">{getVariantLabel(item)}</p>
                          {!inStock && <p className="text-xs text-red-500">Out of stock</p>}
                        </div>

                        {active && (
                          <span
                            className={`absolute -right-1 -top-1 rounded-full p-1 text-white ${
                              accentButtonClass
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className={`h-12 w-12 rounded-xl border text-xl ${
                      isStudio
                        ? "border-slate-700 hover:bg-slate-800"
                        : isWhiteRose
                          ? "border-[#dfe3eb] hover:bg-[#eef4ff]"
                          : isTrend
                            ? "border-rose-200 hover:bg-rose-50"
                            : "border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Minus className="mx-auto h-5 w-5" />
                  </button>
                  <input
                    value={quantity}
                    onChange={(event) => {
                      const next = Math.max(1, Number(event.target.value) || 1);
                      setQuantity(next);
                    }}
                    className={`h-12 w-24 rounded-xl border text-center text-lg font-bold ${
                      isStudio
                        ? "border-slate-700 bg-slate-950 text-slate-100"
                        : isWhiteRose
                          ? "border-[#dfe3eb] bg-white"
                          : isTrend
                            ? "border-rose-200 bg-white"
                            : "border-slate-300 bg-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className={`h-12 w-12 rounded-xl border text-xl ${
                      isStudio
                        ? "border-slate-700 hover:bg-slate-800"
                        : isWhiteRose
                          ? "border-[#dfe3eb] hover:bg-[#eef4ff]"
                          : isTrend
                            ? "border-rose-200 hover:bg-rose-50"
                            : "border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Plus className="mx-auto h-5 w-5" />
                  </button>
                </div>

                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      stockQuantity > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-5 ${panelClass}`}>
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className={isStudio ? "text-slate-400 text-sm" : isWhiteRose ? "text-[#5f6c7b] text-sm" : "text-slate-500 text-sm"}>Total Amount</p>
                  <p className={`text-4xl font-bold ${accentTextClass}`}>
                    {formatCurrency(subtotal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={isStudio ? "text-slate-400 text-sm" : isWhiteRose ? "text-[#5f6c7b] text-sm" : "text-slate-500 text-sm"}>Quantity</p>
                  <p className="text-3xl font-bold">{quantity} pcs</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || !selectedVariant || stockQuantity <= 0}
                className="h-12 w-full rounded-lg font-semibold text-white transition template-accent-bg template-accent-bg-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? "Adding..." : "Add to cart"}
              </button>

              {message && <p className={`mt-3 text-sm ${isWhiteRose ? "text-[#5f6c7b]" : "text-slate-500"}`}>{message}</p>}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className={`border-b ${isStudio ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                className={`pb-3 text-sm font-semibold transition ${
                  activeTab === "description"
                    ? isStudio
                      ? "border-b-2 border-slate-100 text-slate-100"
                      : "border-b-2 border-slate-900 text-slate-900"
                    : isStudio
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Description
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("specifications")}
                className={`pb-3 text-sm font-semibold transition ${
                  activeTab === "specifications"
                    ? isStudio
                      ? "border-b-2 border-slate-100 text-slate-100"
                      : "border-b-2 border-slate-900 text-slate-900"
                    : isStudio
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("faqs")}
                className={`pb-3 text-sm font-semibold transition ${
                  activeTab === "faqs"
                    ? isStudio
                      ? "border-b-2 border-slate-100 text-slate-100"
                      : "border-b-2 border-slate-900 text-slate-900"
                    : isStudio
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                FAQs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`pb-3 text-sm font-semibold transition ${
                  activeTab === "reviews"
                    ? isStudio
                      ? "border-b-2 border-slate-100 text-slate-100"
                      : "border-b-2 border-slate-900 text-slate-900"
                    : isStudio
                      ? "text-slate-400 hover:text-white"
                      : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Reviews
              </button>
            </div>
          </div>

          <div className="py-6">
            {activeTab === "description" && (
              <div className={`rounded-2xl p-5 ${panelClass}`}>
                <HyperlinkText
                  text={productDescription}
                  className={`${isStudio ? "text-slate-300" : "text-slate-700"} leading-relaxed`}
                />
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="space-y-4">
                <div className={`rounded-2xl p-5 ${panelClass}`}>
                  <h3 className="mb-4 text-lg font-semibold">Product Specifications</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {summarySpecs.map(([label, value]) => (
                      <div
                        key={`${label}-${value}`}
                        className={`rounded-lg px-3 py-2 ${isStudio ? "bg-slate-800" : "bg-slate-50"}`}
                      >
                        <p className={isStudio ? "text-xs text-slate-400" : "text-xs text-slate-500"}>{label}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {detailedSpecs.length > 0 && (
                  <div className={`rounded-2xl p-5 ${panelClass}`}>
                    <h3 className="mb-4 text-lg font-semibold">Detailed Specifications</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {detailedSpecs.map(([label, value], index) => (
                        <div
                          key={`${label}-${value}-${index}`}
                          className={`rounded-lg px-3 py-2 ${isStudio ? "bg-slate-800" : "bg-slate-50"}`}
                        >
                          <p className={isStudio ? "text-xs text-slate-400" : "text-xs text-slate-500"}>{label}</p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "faqs" && (
              <div className={`rounded-2xl p-5 ${panelClass}`}>
                <h3 className="mb-4 text-lg font-semibold">Frequently Asked Questions</h3>
                {hasFaqs ? (
                  <div className="space-y-3">
                    {product.faqs?.map((faq, index) => (
                      <div
                        key={`${faq.question || "faq"}-${index}`}
                        className={`rounded-lg px-4 py-3 ${isStudio ? "bg-slate-800" : "bg-slate-50"}`}
                      >
                        <p className="font-semibold">{faq.question || "Question"}</p>
                        <p className={`mt-1 text-sm ${isStudio ? "text-slate-300" : "text-slate-600"}`}>
                          {faq.answer || "Answer not available."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={isStudio ? "text-slate-400" : "text-slate-500"}>No FAQs available for this product yet.</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <ProductReviewsSection
                productId={productId}
                token={templateToken}
                loginPath={`${loginPath}?next=${encodeURIComponent(pathname || productPath)}`}
                onSummaryChange={setReviewSummary}
                theme={isStudio ? "studio" : "default"}
              />
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className={`text-xs uppercase tracking-[0.2em] ${isStudio ? "text-slate-400" : "text-slate-500"}`}>
                Similar picks
              </p>
              <h2 className="text-2xl font-bold">Related Products</h2>
            </div>
          </div>

          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => {
                const variant = getPrimaryVariant(item);
                const finalPrice = toNumber(variant?.finalPrice);
                const actualPrice = toNumber(variant?.actualPrice);
                const displayPrice = finalPrice > 0 ? finalPrice : actualPrice;
                const imageUrl = getProductLeadImage(item);
                const productCategoryLabel = collectProductCategoryLabels(item)[0] || "Category";
                const relatedPath = buildTemplateScopedPath({
                  vendorId,
                  pathname: pathname || "/",
                  suffix: `product/${item._id}`,
                });

                return (
                  <Link
                    key={item._id}
                    href={relatedPath}
                    className={`template-product-card group overflow-hidden rounded-2xl border transition hover:-translate-y-1 ${
                      isStudio
                        ? "border-slate-800 bg-slate-900 hover:border-slate-700"
                        : isTrend
                          ? "border-rose-200 bg-white hover:border-rose-300"
                          : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`h-44 overflow-hidden ${isStudio ? "bg-slate-950" : "bg-slate-50"}`}>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.productName || "Related product"}
                          className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 p-3">
                      <p className={`text-xs uppercase tracking-[0.2em] ${isStudio ? "text-slate-400" : "text-slate-500"}`}>
                        {productCategoryLabel}
                      </p>
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {item.productName || "Untitled Product"}
                      </h3>
                      <div className="flex items-end gap-2">
                        <p className={`text-lg font-bold ${isTrend ? "text-rose-600" : "text-indigo-600"}`}>
                          {formatCurrency(displayPrice)}
                        </p>
                        {actualPrice > finalPrice && finalPrice > 0 && (
                          <p className="text-xs text-slate-400 line-through">{formatCurrency(actualPrice)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className={`rounded-2xl border p-5 text-sm ${isStudio ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
              No related products available right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
