"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useSelector } from "react-redux";
import {
  Minus,
  Plus,
  Star,
  Truck,
  RefreshCw,
  Shield,
  Zap,
  Check,
  Heart,
  MessageSquareMore,
} from "lucide-react";

import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import {
  getTemplateAuth,
  templateApiFetch,
} from "@/app/template/components/templateAuth";
import { trackAddToCart } from "@/lib/analytics-events";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import {
  buildTemplateProductPath,
  buildTemplateScopedPath,
  getTemplateCityFromPath,
} from "@/lib/template-route";
import ProductEnquiryDialog from "@/app/template/components/pages/ProductEnquiryDialog";
import ProductReviewsSection, {
  ProductReviewSummary,
} from "@/components/reviews/ProductReviewsSection";
import RichTextContent from "@/components/RichTextContent";
import {
  readPocoFoodWishlist,
  writePocoFoodWishlist,
  type PocoFoodWishlistItem,
} from "@/app/template/components/pocofood/pocofood-wishlist";

type VariantImage =
  | {
      url?: string;
    }
  | string;

type ProductVariant = {
  _id: string;
  variantDisplayName?: string;
  variantSku?: string;
  variantAttributes?: Record<string, string>;
  actualPrice?: number;
  salePrice?: number;
  sale_price?: number;
  salePriceV2?: number;
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

type DraftPreviewImage = {
  url?: string;
};

type DraftPreviewVariant = {
  _id?: string;
  variantDisplayName?: string;
  variantAttributes?: Record<string, string>;
  actualPrice?: number;
  finalPrice?: number;
  stockQuantity?: number;
  variantsImageUrls?: DraftPreviewImage[];
  isActive?: boolean;
  variantMetaDescription?: string;
};

type DraftPreviewFormData = {
  productName?: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  defaultImages?: DraftPreviewImage[];
  variants?: DraftPreviewVariant[];
  actualPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
  specifications?: Array<Record<string, string>>;
  faqs?: ProductFaq[];
};

type TemplateProductPreviewMessage = {
  type?: string;
  sessionId?: string;
  payload?: {
    savedAt?: number;
    expiresAt?: number;
    formData?: DraftPreviewFormData;
  };
};

const PRODUCT_PREVIEW_MESSAGE_TYPE = "template-product-preview-draft";

const readWindowNamePreviewMessage = (
  previewSessionId: string,
): TemplateProductPreviewMessage | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.name;
    if (!raw || raw.length < 2) return null;

    const parsed = JSON.parse(raw) as TemplateProductPreviewMessage | null;
    if (!parsed || parsed.type !== PRODUCT_PREVIEW_MESSAGE_TYPE) return null;
    if (String(parsed.sessionId || "").trim() !== previewSessionId) return null;

    const expiresAt = Number(parsed.payload?.expiresAt || 0);
    if (expiresAt && Date.now() > expiresAt) return null;

    return parsed.payload?.formData ? parsed : null;
  } catch {
    return null;
  }
};

const writeWindowNamePreviewMessage = (
  message: TemplateProductPreviewMessage,
) => {
  if (typeof window === "undefined") return;

  try {
    window.name = JSON.stringify(message);
  } catch {
    // The localStorage cache remains as a fallback if window.name is unavailable.
  }
};

type Product = {
  _id: string;
  slug?: string;
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
  productSubCategory?:
    | Array<{ name?: string; title?: string } | string>
    | { name?: string; title?: string }
    | string;
  actualPrice?: number;
  salePrice?: number;
  stockQuantity?: number;
};

type ProductTab = "description" | "specifications" | "faqs" | "reviews";

type FoodAddonOption = {
  name?: string;
  price?: number;
  is_free?: boolean;
};

type FoodVariantOption = {
  name?: string;
  price?: number;
  offer_price?: number;
  is_default?: boolean;
  is_available?: boolean;
};

type FoodMenuItem = {
  _id?: string;
  item_name?: string;
  category?: string;
  description?: string;
  image_url?: string;
  gallery_images?: string[];
  food_type?: string;
  is_available?: boolean;
  price?: number;
  offer_price?: number;
  prep_time_minutes?: number;
  addons?: FoodAddonOption[];
  variants?: FoodVariantOption[];
  slug?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  service_areas?: string[];
};

type FoodRestaurantProfile = {
  restaurant_name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  service_areas?: string[];
  minimum_order_amount?: number;
  average_preparation_time?: number;
  delivery_radius_km?: number;
};

type FoodOffer = {
  offer_title?: string;
  offer_type?: string;
  discount_percent?: number;
  flat_discount?: number;
  combo_price?: number;
  free_item_name?: string;
};

const RETAIL_BENEFITS = [
  { icon: Truck, text: "Free shipping over Rs. 75" },
  { icon: RefreshCw, text: "30-day easy returns" },
  { icon: Shield, text: "1-year warranty" },
  { icon: Zap, text: "Fast delivery in 3-7 days" },
];

const resolveRetailBenefits = (templateData: any) => {
  const config = templateData?.components?.social_page?.product_benefits;
  const configuredItems = Array.isArray(config?.items) ? config.items : [];
  const items = RETAIL_BENEFITS.map((fallback, index) => {
    const current = configuredItems[index] || {};
    return {
      ...fallback,
      text: String(current?.text || fallback.text).trim() || fallback.text,
      enabled:
        typeof current?.enabled === "boolean" ? Boolean(current.enabled) : true,
    };
  }).filter((item) => item.enabled && item.text);

  return {
    enabled: config?.enabled !== false,
    items,
  };
};

const extractProductBenefitsConfig = (payload: any) =>
  payload?.components?.social_page?.product_benefits ||
  payload?.social_page?.product_benefits ||
  null;

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatCurrency = (value: number) =>
  `Rs. ${toNumber(value).toLocaleString()}`;
const API_BASE_URL = String(NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const API_BASE = API_BASE_URL.endsWith("/v1")
  ? API_BASE_URL
  : `${API_BASE_URL}/v1`;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const getImageUrl = (image: VariantImage | null | undefined) => {
  if (isNonEmptyString(image)) return image.trim();
  if (!image || typeof image !== "object") return "";
  const url = (image as { url?: unknown }).url;
  return isNonEmptyString(url) ? url.trim() : "";
};

const getVariantLabel = (variant: ProductVariant) => {
  if (isNonEmptyString(variant?.variantDisplayName)) {
    return variant.variantDisplayName.trim();
  }

  const attrs =
    variant?.variantAttributes && typeof variant.variantAttributes === "object"
      ? variant.variantAttributes
      : {};

  const joinedAttributes = Object.values(attrs)
    .filter((value): value is string => isNonEmptyString(value))
    .map((value) => value.trim())
    .join(" / ");

  if (isNonEmptyString(joinedAttributes)) {
    return joinedAttributes;
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
      .filter((url): url is string => Boolean(url)),
  );

  return Array.from(new Set([...defaultUrls, ...variantUrls]));
};

const getPrimaryVariant = (product: Product | null | undefined) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return (
    variants.find((variant) => variant?.isActive !== false) ||
    variants[0] ||
    null
  );
};

const getFoodPrimaryVariant = (item: FoodMenuItem | null | undefined) => {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  return (
    variants.find((variant) => variant?.is_available && variant?.is_default) ||
    variants.find((variant) => variant?.is_available) ||
    variants.find((variant) => variant?.is_default) ||
    variants[0] ||
    null
  );
};

const getFoodFinalPrice = (
  item: FoodMenuItem | null | undefined,
  variantName?: string,
  selectedAddons: FoodAddonOption[] = [],
) => {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  const normalizedName = String(variantName || "")
    .trim()
    .toLowerCase();
  const selectedVariant =
    variants.find(
      (variant) =>
        String(variant?.name || "")
          .trim()
          .toLowerCase() === normalizedName,
    ) || getFoodPrimaryVariant(item);
  const primaryVariant = getFoodPrimaryVariant(item);
  const isPrimaryVariant =
    String(selectedVariant?.name || "")
      .trim()
      .toLowerCase() ===
    String(primaryVariant?.name || "")
      .trim()
      .toLowerCase();

  const variantPrice = toNumber(selectedVariant?.price);
  const variantOfferPrice = toNumber(selectedVariant?.offer_price);
  const itemPrice = toNumber(item?.price);
  const itemOfferPrice = toNumber(item?.offer_price);
  const variantHasTwoPrices =
    variantPrice > 0 &&
    variantOfferPrice > 0 &&
    variantPrice !== variantOfferPrice;
  const enteredPrice =
    isPrimaryVariant || !variantPrice ? itemPrice || variantPrice : variantPrice || itemPrice;
  const enteredOfferPrice =
    isPrimaryVariant || !variantHasTwoPrices
      ? itemOfferPrice || itemPrice || variantOfferPrice || variantPrice
      : variantOfferPrice || variantPrice || itemOfferPrice || itemPrice;
  const hasTwoPrices =
    enteredPrice > 0 &&
    enteredOfferPrice > 0 &&
    enteredPrice !== enteredOfferPrice;
  const baseFinal = hasTwoPrices
    ? Math.min(enteredPrice, enteredOfferPrice)
    : enteredOfferPrice || enteredPrice;
  const baseActual = hasTwoPrices
    ? Math.max(enteredPrice, enteredOfferPrice)
    : enteredPrice || baseFinal;
  const addonTotal = selectedAddons.reduce((sum, addon) => {
    if (addon?.is_free) return sum;
    return sum + toNumber(addon?.price);
  }, 0);

  return {
    actualPrice: baseActual + addonTotal,
    finalPrice: baseFinal + addonTotal,
  };
};

const getFoodMenuImages = (item: FoodMenuItem | null | undefined) => {
  const primary = String(item?.image_url || "").trim();
  const gallery = Array.isArray(item?.gallery_images)
    ? item.gallery_images
    : [];
  return Array.from(
    new Set(
      [primary, ...gallery.map((image) => String(image || "").trim())].filter(
        Boolean,
      ),
    ),
  );
};

function FoodTypeMark({ type }: { type?: string }) {
  const normalized = String(type || "veg").toLowerCase().replace(/[\s-]+/g, "_");
  const isNonVeg = normalized === "non_veg" || normalized === "nonveg";

  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border bg-white ${
        isNonVeg ? "border-[#d93025]" : "border-[#229a45]"
      }`}
      title={isNonVeg ? "Non veg" : "Veg"}
      aria-label={isNonVeg ? "Non veg" : "Veg"}
    >
      <span className={`h-2 w-2 rounded-full ${isNonVeg ? "bg-[#d93025]" : "bg-[#229a45]"}`} />
    </span>
  );
}

const mapDraftPreviewToProduct = (
  formData: DraftPreviewFormData | null | undefined,
  fallbackProductId: string,
) => {
  const variants = Array.isArray(formData?.variants) ? formData?.variants : [];
  const defaultImages = Array.isArray(formData?.defaultImages)
    ? formData.defaultImages
    : [];
  const faqs = Array.isArray(formData?.faqs) ? formData.faqs : [];

  return {
    _id: fallbackProductId || "preview-product",
    productName:
      String(formData?.productName || "Untitled Product").trim() ||
      "Untitled Product",
    shortDescription: String(formData?.shortDescription || "").trim(),
    description: String(formData?.description || "").trim(),
    brand: String(formData?.brand || "").trim(),
    defaultImages: defaultImages.map((image) => ({
      url: String(image?.url || "").trim(),
    })),
    variants: variants.map((variant, index) => ({
      _id: String(variant?._id || `preview-variant-${index + 1}`),
      variantDisplayName: String(variant?.variantDisplayName || "").trim(),
      variantAttributes:
        variant?.variantAttributes &&
        typeof variant.variantAttributes === "object"
          ? variant.variantAttributes
          : {},
      stockQuantity: toNumber(variant?.stockQuantity),
      isActive: variant?.isActive !== false,
      actualPrice: toNumber(variant?.actualPrice),
      finalPrice: toNumber(variant?.finalPrice),
      variantsImageUrls: Array.isArray(variant?.variantsImageUrls)
        ? variant.variantsImageUrls.map((image: any) => ({
            url: String(image?.url || "").trim(),
          }))
        : [],
      variantMetaDescription: String(
        variant?.variantMetaDescription || "",
      ).trim(),
    })),
    actualPrice: toNumber(formData?.actualPrice),
    salePrice: toNumber(formData?.salePrice),
    stockQuantity: toNumber(formData?.stockQuantity),
    faqs: faqs.map((faq) => ({
      question: String(faq?.question || "").trim(),
      answer: String(faq?.answer || "").trim(),
    })),
    specifications: Array.isArray(formData?.specifications)
      ? formData.specifications
      : [],
  } as Product;
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
  const isPocoFood = variantTheme.key === "pocofood";
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateProducts = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[],
  );
  const templateData = useSelector(
    (state: any) => state?.alltemplatepage?.data,
  );
  const [remoteBenefitsConfig, setRemoteBenefitsConfig] = useState<any>(null);
  const retailBenefits = useMemo(
    () =>
      resolveRetailBenefits({
        components: {
          social_page: {
            product_benefits:
              remoteBenefitsConfig ||
              templateData?.components?.social_page?.product_benefits,
          },
        },
      }),
    [remoteBenefitsConfig, templateData],
  );

  const productId = ((params as any).product_id ||
    (params as any).product_slug) as string;
  const vendorId = params.vendor_id as string;
  const isDraftPreview = searchParams.get("previewDraft") === "1";
  const previewSessionId = String(
    searchParams.get("previewSessionId") || "",
  ).trim();
  const citySlug = getTemplateCityFromPath(pathname || "/", vendorId);
  const fallbackCitySlug = String(
    templateData?.components?.vendor_profile?.default_city_slug || "",
  ).trim();
  const effectiveCitySlug =
    citySlug && citySlug !== "all" ? citySlug : fallbackCitySlug || "all";
  const websiteIdFromPath = useMemo(() => {
    const segments = String(pathname || "/")
      .split("/")
      .filter(Boolean);
    const websiteIndex = segments.indexOf("website");
    if (websiteIndex >= 0 && websiteIndex + 1 < segments.length) {
      return String(segments[websiteIndex + 1] || "").trim();
    }
    return "";
  }, [pathname]);
  const loginPath = buildTemplateScopedPath({
    vendorId,
    pathname: pathname || "/",
    suffix: "login",
  });

  useEffect(() => {
    if (!vendorId) return;

    const query = websiteIdFromPath
      ? `?website_id=${encodeURIComponent(websiteIdFromPath)}`
      : "";

    const loadBenefits = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/templates/${vendorId}/social${query}`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok) return;
        const json = await res.json().catch(() => null);
        const config = extractProductBenefitsConfig(json?.data || json);
        if (config) setRemoteBenefitsConfig(config);
      } catch {
        return;
      }
    };

    void loadBenefits();
  }, [vendorId, websiteIdFromPath]);

  useEffect(() => {
    if (!isPocoFood || !vendorId) return;
    let active = true;

    const loadFoodMenu = async () => {
      if (active) {
        setFoodLoading(true);
        setFoodLoadError("");
      }

      try {
        const response = await fetch(
          `${API_BASE}/vendors/${vendorId}/food-storefront`,
          {
            cache: "no-store",
          },
        );
        const data = await response.json().catch(() => null);

        if (!active) return;

        const items = Array.isArray(data?.data?.menu_items)
          ? data.data.menu_items
          : [];
        const offers = Array.isArray(data?.data?.offers)
          ? data.data.offers
          : [];
        const restaurant =
          data?.data?.restaurant && typeof data.data.restaurant === "object"
            ? data.data.restaurant
            : null;
        setFoodRestaurant(restaurant);
        setFoodOffers(offers);
        setFoodMenuItems(items);
        if (
          !items.some(
            (item: FoodMenuItem) =>
              String(item?._id || "") === String(productId || ""),
          )
        ) {
          setFoodLoadError("Food item not found.");
        }
      } catch {
        if (active) {
          setFoodRestaurant(null);
          setFoodOffers([]);
          setFoodMenuItems([]);
          setFoodLoadError("Food item not found.");
        }
      } finally {
        if (active) setFoodLoading(false);
      }
    };

    void loadFoodMenu();
    return () => {
      active = false;
    };
  }, [isPocoFood, productId, vendorId]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("specifications");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [templateToken, setTemplateToken] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary>({
    averageRating: 0,
    ratingsCount: 0,
  });
  const [foodMenuItems, setFoodMenuItems] = useState<FoodMenuItem[]>([]);
  const [foodRestaurant, setFoodRestaurant] =
    useState<FoodRestaurantProfile | null>(null);
  const [foodOffers, setFoodOffers] = useState<FoodOffer[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodLoadError, setFoodLoadError] = useState("");
  const [selectedFoodVariantName, setSelectedFoodVariantName] = useState("");
  const [selectedFoodAddons, setSelectedFoodAddons] = useState<string[]>([]);
  const [selectedFoodImage, setSelectedFoodImage] = useState("");
  const [foodWishlistIds, setFoodWishlistIds] = useState<string[]>([]);

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
  const accentButtonClass = isWhiteRose
    ? "bg-[#2874f0]"
    : isTrend
      ? "bg-rose-500"
      : "bg-indigo-500";
  const subtleTextClass = isWhiteRose
    ? "text-[#5f6c7b]"
    : isStudio
      ? "text-slate-300"
      : "text-slate-600";
  const softPanelClass = isWhiteRose
    ? "bg-[#f8fafc]"
    : isTrend
      ? "bg-rose-50"
      : "bg-slate-50";
  const enquiryTriggerClass =
    variantTheme.key === "mquiq"
      ? "fixed bottom-16 right-6 z-[60] h-12 rounded-full border border-[#e7c565] bg-[#f4b400] px-4 text-sm font-semibold text-[#1f2937] shadow-[0_18px_45px_rgba(244,180,0,0.32)] transition hover:-translate-y-0.5 hover:bg-[#f6bf1f] md:right-8"
      : isStudio
        ? "fixed bottom-8 right-6 z-[60] h-12 rounded-full border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:bg-slate-800 md:right-8"
        : isWhiteRose
          ? "fixed bottom-8 right-6 z-[60] h-12 rounded-full border border-[#dfe3eb] bg-white px-4 text-sm font-semibold text-[#174ea6] shadow-[0_18px_45px_rgba(40,116,240,0.18)] transition hover:-translate-y-0.5 hover:bg-[#f8fbff] md:right-8"
          : isTrend
            ? "fixed bottom-8 right-6 z-[60] h-12 rounded-full border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-600 shadow-[0_18px_45px_rgba(244,63,94,0.16)] transition hover:-translate-y-0.5 hover:bg-rose-50 md:right-8"
            : "fixed bottom-8 right-6 z-[60] h-12 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-50 md:right-8";

  useEffect(() => {
    if (isPocoFood) {
      setLoading(false);
      setProduct(null);
      return;
    }
    if (isDraftPreview) return;
    if (!productId) return;
    let active = true;
    const notFoundMessage =
      effectiveCitySlug && effectiveCitySlug !== "all"
        ? "Product not found in this city."
        : "Product not found.";

    const load = async () => {
      if (active) {
        setLoading(true);
        setLoadError("");
      }

      try {
        const cityQuery =
          effectiveCitySlug && effectiveCitySlug !== "all"
            ? `?city=${encodeURIComponent(effectiveCitySlug)}`
            : "";
        const response = await fetch(
          `${NEXT_PUBLIC_API_URL}/products/${productId}${cityQuery}`,
        );
        const data = await response.json().catch(() => null);

        if (!active) return;

        const nextProduct = (data?.product || null) as Product | null;
        if (!response.ok || !nextProduct) {
          setProduct(null);
          setLoadError(
            typeof data?.message === "string" && data.message.trim()
              ? data.message.trim()
              : notFoundMessage,
          );
          return;
        }

        setProduct(nextProduct);
        setLoadError("");
      } catch {
        if (active) {
          setProduct(null);
          setLoadError(notFoundMessage);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [effectiveCitySlug, isDraftPreview, isPocoFood, productId]);

  useEffect(() => {
    if (isPocoFood) return;
    if (!isDraftPreview) return;
    if (!previewSessionId) {
      setLoading(false);
      setProduct(null);
      setLoadError(
        "Preview data was not found. Please reopen the product preview.",
      );
      return;
    }

    setLoading(true);
    setLoadError("");
    let receivedDraft = false;

    // 1. Try to load from cache immediately for fast refresh
    const cacheKey = `preview_cache_${previewSessionId}`;
    try {
      const windowNameMessage = readWindowNamePreviewMessage(previewSessionId);
      const cached = windowNameMessage
        ? JSON.stringify(windowNameMessage.payload)
        : localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.formData) {
          receivedDraft = true;
          setProduct(mapDraftPreviewToProduct(parsed.formData, productId));
          setLoading(false);
          setLoadError("");
        }
      }
    } catch (e) {
      console.warn("Failed to load preview cache", e);
    }

    const signalReady = () => {
      if (typeof window === "undefined" || !window.opener) return;
      window.opener.postMessage(
        { type: "preview-window-ready", sessionId: previewSessionId },
        "*",
      );
    };

    // Signal more than once so refreshes do not get stuck if the admin tab is
    // still rendering when the preview page first loads.
    signalReady();
    let readyAttempts = 0;
    const readyIntervalId = window.setInterval(() => {
      readyAttempts += 1;
      signalReady();
      if (readyAttempts >= 12) {
        window.clearInterval(readyIntervalId);
      }
    }, 700);

    let timeoutId: number | null = null;
    const startTimeout = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (receivedDraft) return;
        setLoading(false);
        setProduct(null);
        setLoadError(
          "Waiting for the latest product draft. Keep the product form open and click Preview again if this does not update.",
        );
      }, 2500);
    };

    startTimeout();

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as TemplateProductPreviewMessage | null;
      if (!data || data.type !== PRODUCT_PREVIEW_MESSAGE_TYPE) return;
      if (String(data.sessionId || "").trim() !== previewSessionId) return;

      const nextFormData = data.payload?.formData;
      if (!nextFormData || typeof nextFormData !== "object") return;

      // Update cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data.payload));
      } catch (e) {}
      writeWindowNamePreviewMessage(data);

      window.clearInterval(readyIntervalId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      receivedDraft = true;
      setProduct(mapDraftPreviewToProduct(nextFormData, productId));
      setLoadError("");
      setLoading(false);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.clearInterval(readyIntervalId);
      window.removeEventListener("message", handleMessage);
    };
  }, [isDraftPreview, isPocoFood, previewSessionId, productId]);

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
    return (
      (selectedVariant.variantsImageUrls || [])
        .map((image) => getImageUrl(image))
        .find((url) => Boolean(url)) || ""
    );
  }, [selectedVariant]);

  useEffect(() => {
    if (!variants.length) {
      setSelectedVariantId("");
      return;
    }

    const firstActive = variants.find((item) => item.isActive) || variants[0];
    setSelectedVariantId((current) =>
      current && variants.some((item) => item._id === current)
        ? current
        : firstActive?._id || "",
    );
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
      current && allImageUrls.includes(current) ? current : allImageUrls[0],
    );
  }, [selectedVariantId, selectedVariantLeadImage, allImageUrls]);

  const basePrice = selectedVariant
    ? toNumber(selectedVariant?.finalPrice)
    : toNumber(product?.salePrice);
  const actualPrice = selectedVariant
    ? toNumber(selectedVariant?.actualPrice)
    : toNumber(product?.actualPrice);
  const discountPercent =
    toNumber(selectedVariant?.discountPercent) > 0
      ? toNumber(selectedVariant?.discountPercent)
      : actualPrice > basePrice && actualPrice > 0
        ? Math.round(((actualPrice - basePrice) / actualPrice) * 100)
        : 0;

  const stockQuantity = selectedVariant
    ? toNumber(selectedVariant?.stockQuantity)
    : toNumber(product?.stockQuantity);
  const selectedVariantLabel = selectedVariant
    ? getVariantLabel(selectedVariant)
    : "";
  const productTitle =
    product?.productName || selectedVariantLabel || "Untitled Product";

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isDraftPreview || !productTitle) return;
    document.title = `Product | ${productTitle}`;
  }, [isDraftPreview, productTitle]);

  const productDescription =
    product?.description ||
    selectedVariant?.variantMetaDescription ||
    product?.shortDescription ||
    "No description available.";
  const productShortDescription = String(
    product?.shortDescription || "",
  ).trim();

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
      collectProductCategoryLabels(product).map((label) => label.toLowerCase()),
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

  const productRecordId = String(product?._id || "").trim();
  const productSlug = String(product?.slug || productId || "").trim();
  const productPath = buildTemplateProductPath({
    vendorId,
    pathname: pathname || "/",
    productId,
    productSlug,
    citySlug: effectiveCitySlug,
  });
  const checkoutBagPath = buildTemplateScopedPath({
    vendorId,
    pathname: pathname || "/",
    suffix: "checkout/bag",
  });
  const foodProduct = useMemo(
    () =>
      foodMenuItems.find(
        (item) =>
          String(item?._id || "").trim() === String(productId || "").trim(),
      ) || null,
    [foodMenuItems, productId],
  );
  const selectedFoodVariant = useMemo(() => {
    if (!foodProduct) return null;
    const variants = Array.isArray(foodProduct.variants)
      ? foodProduct.variants
      : [];
    return (
      variants.find(
        (variant) =>
          String(variant?.name || "")
            .trim()
            .toLowerCase() ===
          String(selectedFoodVariantName || "")
            .trim()
            .toLowerCase(),
      ) || getFoodPrimaryVariant(foodProduct)
    );
  }, [foodProduct, selectedFoodVariantName]);
  const selectedFoodAddonRecords = useMemo(() => {
    const addons = Array.isArray(foodProduct?.addons) ? foodProduct.addons : [];
    return addons.filter((addon) =>
      selectedFoodAddons.includes(String(addon?.name || "").trim()),
    );
  }, [foodProduct, selectedFoodAddons]);
  const foodPricing = useMemo(
    () =>
      getFoodFinalPrice(
        foodProduct,
        selectedFoodVariant?.name,
        selectedFoodAddonRecords,
      ),
    [foodProduct, selectedFoodAddonRecords, selectedFoodVariant?.name],
  );
  const foodImageUrls = useMemo(
    () => getFoodMenuImages(foodProduct),
    [foodProduct],
  );
  const relatedFoodProducts = useMemo(() => {
    if (!foodProduct?._id) return [] as FoodMenuItem[];
    const category = String(foodProduct?.category || "")
      .trim()
      .toLowerCase();
    const items = foodMenuItems.filter(
      (item) => String(item?._id || "") !== String(foodProduct._id),
    );
    const sameCategory = items.filter(
      (item) =>
        String(item?.category || "")
          .trim()
          .toLowerCase() === category,
    );
    return (sameCategory.length ? sameCategory : items).slice(0, 4);
  }, [foodMenuItems, foodProduct]);
  const foodOfferBadge = useMemo(() => {
    const offer = foodOffers[0];
    if (!offer) return "";
    if (toNumber(offer.discount_percent) > 0)
      return `${toNumber(offer.discount_percent)}% OFF`;
    if (toNumber(offer.flat_discount) > 0)
      return `Save Rs. ${toNumber(offer.flat_discount)}`;
    if (offer.free_item_name) return `${offer.free_item_name} Free`;
    if (offer.offer_title) return String(offer.offer_title).trim();
    return "";
  }, [foodOffers]);
  const foodEstimatedDelivery = useMemo(() => {
    const prep = toNumber(
      foodRestaurant?.average_preparation_time ||
        foodProduct?.prep_time_minutes,
    );
    const min = Math.max(prep + 10, 20);
    const max = Math.max(min + 10, 30);
    return `${min}-${max} mins`;
  }, [
    foodProduct?.prep_time_minutes,
    foodRestaurant?.average_preparation_time,
  ]);
  const foodSavings = Math.max(
    0,
    toNumber(foodPricing.actualPrice) - toNumber(foodPricing.finalPrice),
  );

  useEffect(() => {
    if (!foodProduct) {
      setSelectedFoodVariantName("");
      setSelectedFoodAddons([]);
      setSelectedFoodImage("");
      setQuantity(1);
      return;
    }

    const primary = getFoodPrimaryVariant(foodProduct);
    setSelectedFoodVariantName(String(primary?.name || "").trim());
    setSelectedFoodAddons([]);
    setSelectedFoodImage(getFoodMenuImages(foodProduct)[0] || "");
    setQuantity(1);
  }, [foodProduct?._id]);

  useEffect(() => {
    if (!isPocoFood || typeof window === "undefined") return;

    const syncWishlist = () => {
      setFoodWishlistIds(
        readPocoFoodWishlist(vendorId).map((item) => item.product_id),
      );
    };

    syncWishlist();
    window.addEventListener("pocofood-wishlist-updated", syncWishlist);
    window.addEventListener("storage", syncWishlist);

    return () => {
      window.removeEventListener("pocofood-wishlist-updated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
    };
  }, [isPocoFood, vendorId]);

  const toggleFoodWishlist = () => {
    if (!foodProduct?._id) return;
    const nextProductId = String(foodProduct._id);
    const currentItems = readPocoFoodWishlist(vendorId);
    const exists = currentItems.some(
      (item) => item.product_id === nextProductId,
    );
    const href = buildTemplateScopedPath({
      vendorId,
      pathname: pathname || "/",
      suffix: `product/${nextProductId}`,
    });
    const nextItems = exists
      ? currentItems.filter((item) => item.product_id !== nextProductId)
      : [
          {
            product_id: nextProductId,
            product_name: String(foodProduct.item_name || "Food item"),
            category: String(foodProduct.category || ""),
            image_url:
              selectedFoodImage || getFoodMenuImages(foodProduct)[0] || "",
            price: foodPricing.finalPrice,
            href,
            added_at: new Date().toISOString(),
          } satisfies PocoFoodWishlistItem,
          ...currentItems.filter((item) => item.product_id !== nextProductId),
        ];

    writePocoFoodWishlist(vendorId, nextItems);
    setFoodWishlistIds(nextItems.map((item) => item.product_id));
    setMessage(exists ? "Removed from wishlist." : "Added to wishlist.");
  };

  const handleFoodAddonToggle = (addonName: string) => {
    setSelectedFoodAddons((current) =>
      current.includes(addonName)
        ? current.filter((item) => item !== addonName)
        : [...current, addonName],
    );
  };

  const handleAddFoodToCart = async () => {
    if (!vendorId || !foodProduct?._id) return;

    const auth = getTemplateAuth(vendorId);
    if (!auth) {
      router.push(
        `${loginPath}?next=${encodeURIComponent(pathname || productPath)}`,
      );
      return;
    }

    setAdding(true);
    setMessage("");
    try {
      await templateApiFetch(vendorId, "/cart", {
        method: "POST",
        body: JSON.stringify({
          item_type: "food",
          food_menu_item_id: foodProduct._id,
          quantity,
          variant_name:
            String(selectedFoodVariant?.name || "").trim() || undefined,
          selected_addons: selectedFoodAddonRecords.map((addon) => ({
            name: String(addon?.name || "").trim(),
            price: toNumber(addon?.price),
            is_free: Boolean(addon?.is_free),
          })),
        }),
      });

      trackAddToCart({
        vendorId,
        userId: auth?.user?.id,
        productId: String(foodProduct._id),
        productName: foodProduct.item_name,
        productPrice: foodPricing.finalPrice,
        quantity,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("template-cart-updated"));
      }

      setMessage("Food item added to cart");
    } catch (error: any) {
      setMessage(error?.message || "Failed to add food item");
    } finally {
      setAdding(false);
    }
  };

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

    if (isDraftPreview) {
      setMessage("Preview mode only. Save the product to enable cart actions.");
      return;
    }

    const auth = getTemplateAuth(vendorId);
    if (!auth) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(productPath)}`;
      return;
    }

    if (!selectedVariant?._id) {
      setMessage("Variant not available");
      return;
    }

    if (!productRecordId) {
      setMessage("Product not available");
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
          product_id: productRecordId,
          variant_id: selectedVariant._id,
          quantity,
        }),
      });

      trackAddToCart({
        vendorId,
        userId: auth?.user?.id,
        productId: productRecordId,
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

  const handleBuyNow = async () => {
    setMessage("");

    if (isDraftPreview) {
      setMessage("Preview mode only. Save the product to enable checkout.");
      return;
    }

    const auth = getTemplateAuth(vendorId);
    if (!auth) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(checkoutBagPath)}`;
      return;
    }

    if (!selectedVariant?._id) {
      setMessage("Variant not available");
      return;
    }

    if (!productRecordId) {
      setMessage("Product not available");
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
          product_id: productRecordId,
          variant_id: selectedVariant._id,
          quantity,
        }),
      });

      trackAddToCart({
        vendorId,
        userId: auth?.user?.id,
        productId: productRecordId,
        productName: product?.productName,
        productPrice: basePrice,
        quantity,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("template-cart-updated"));
      }

      setMessage("Proceeding to checkout");
      router.push(checkoutBagPath);
    } catch (error: any) {
      setMessage(error?.message || "Failed to proceed to checkout");
    } finally {
      setAdding(false);
    }
  };

  if (isPocoFood) {
    if (foodLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Loading food item...</div>
        </div>
      );
    }

    if (!foodProduct) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">
            {foodLoadError || "Food item not found."}
          </div>
        </div>
      );
    }

    const isFoodWishlisted = foodWishlistIds.includes(
      String(foodProduct._id || ""),
    );
    const foodSchema = {
      "@context": "https://schema.org",
      "@type": "MenuItem",
      name: foodProduct.item_name || "Food item",
      description:
        foodProduct.seo_description ||
        foodProduct.description ||
        "Freshly prepared restaurant menu item.",
      image: foodImages,
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: foodPricing.finalPrice,
        availability:
          foodProduct.is_available === false
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
      },
      provider: {
        "@type": "Restaurant",
        name: foodRestaurant?.restaurant_name || "Restaurant",
        telephone: foodRestaurant?.mobile || "",
        address: {
          "@type": "PostalAddress",
          streetAddress: foodRestaurant?.address || "",
          addressLocality: foodRestaurant?.city || "",
          addressRegion: foodRestaurant?.state || "",
          postalCode: foodRestaurant?.pincode || "",
          addressCountry: "IN",
        },
        areaServed:
          foodProduct.service_areas?.length
            ? foodProduct.service_areas
            : foodRestaurant?.service_areas || [],
      },
    };

    return (
      <div className="min-h-screen bg-[#faf7f1] pb-24 text-[#1f1720] lg:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(foodSchema) }}
        />
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6d58]">
            <Link
              href={buildTemplateScopedPath({
                vendorId,
                pathname: pathname || "/",
                suffix: "menu",
              })}
            >
              Menu
            </Link>
            <span>/</span>
            <span className="text-[#c06f22]">
              {foodProduct.category || "Food item"}
            </span>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.92fr)_420px] xl:grid-cols-[minmax(0,0.9fr)_440px]">
            <div className="self-start overflow-hidden rounded-3xl border border-[#eadfce] bg-white shadow-[0_18px_45px_rgba(80,47,22,0.08)]">
              <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#fffaf2] sm:aspect-[16/9] lg:h-[340px] lg:aspect-auto">
                <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(245,182,56,0.26),transparent_72%)]" />
                {foodOfferBadge ? (
                  <span className="absolute left-5 top-5 z-10 rounded-full bg-[#1f1720] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg">
                    {foodOfferBadge}
                  </span>
                ) : null}
                {selectedFoodImage ? (
                  <img
                    src={selectedFoodImage}
                    alt={foodProduct.item_name || "Food item"}
                    className="relative z-[1] h-full w-full object-contain p-4 sm:p-6"
                  />
                ) : (
                  <div className="text-sm uppercase tracking-[0.28em] text-[#b39a87]">
                    No Image
                  </div>
                )}
              </div>

              {foodImageUrls.length > 1 ? (
                <div className="flex gap-3 overflow-x-auto border-t border-[#f0e3d3] bg-white p-4">
                  {foodImageUrls.slice(0, 4).map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedFoodImage(image)}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border transition ${
                        selectedFoodImage === image
                          ? "border-[#1f1720] ring-2 ring-[#f5d493]"
                          : "border-[#eadfce] hover:border-[#c97b38]"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${foodProduct.item_name || "Food item"} ${index + 1}`}
                        className="h-full w-full object-contain bg-[#fffaf2] p-2"
                      />
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="border-t border-[#f0e3d3] bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#f0e3d3] bg-[#fffaf2] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b7d68]">
                      Estimated delivery
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#1f1720]">
                      {foodEstimatedDelivery}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#7b685b]">
                      Prep plus nearby rider dispatch included.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#f0e3d3] bg-[#fffaf2] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b7d68]">
                      Your savings
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-[#1f1720]">
                      {foodSavings > 0
                        ? formatCurrency(foodSavings)
                        : "Fresh price"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#7b685b]">
                      {foodSavings > 0
                        ? "Discount already included in this dish."
                        : "No active discount on this dish."}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-[#f0e3d3] bg-[linear-gradient(135deg,#fffaf2,#ffffff)] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b7d68]">
                        Restaurant
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-[#1f1720]">
                        {String(
                          foodRestaurant?.restaurant_name || "Your restaurant",
                        ).trim()}
                      </h3>
                      <p className="mt-1 text-sm text-[#7b685b]">
                        Call{" "}
                        {String(foodRestaurant?.mobile || "").trim() ||
                          "for live order support"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-white px-3 py-1 text-[#6b584a] shadow-sm">
                        Fast kitchen prep
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[#6b584a] shadow-sm">
                        Secure checkout
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#f3e7d9] bg-[linear-gradient(135deg,#fff9f0,#ffffff)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b7d68]">
                      Dish Notes
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#6e5a4c]">
                      {String(foodProduct.description || "").trim() ||
                        "Freshly prepared dish with your selected customization options."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#f3e7d9] bg-[linear-gradient(135deg,#fff9f0,#ffffff)] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9b7d68]">
                      Order info
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-xs font-medium text-[#8f5b31]">
                        Min{" "}
                        {formatCurrency(
                          toNumber(foodRestaurant?.minimum_order_amount) ||
                            foodPricing.finalPrice,
                        )}
                      </span>
                      <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-xs font-medium text-[#8f5b31]">
                        {toNumber(foodRestaurant?.delivery_radius_km) || 5} km
                        radius
                      </span>
                      <span className="rounded-full bg-[#fff3e2] px-3 py-1 text-xs font-medium text-[#8f5b31]">
                        Easy checkout
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#eadfce] bg-white p-5 shadow-[0_18px_45px_rgba(80,47,22,0.1)] lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b46a2d]">
                {foodProduct.category || "Menu item"}
              </p>
              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[#111827] sm:text-3xl">
                {foodProduct.item_name || "Untitled food item"}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#fff3e2] px-3 py-1 text-[#8f5b31]">
                  <FoodTypeMark type={foodProduct.food_type} />
                  {foodProduct.food_type === "non_veg" ? "Non veg" : "Veg"}
                </span>
                <span className="rounded-full bg-[#f8efe3] px-3 py-1 text-[#735c4b]">
                  Prep {toNumber(foodProduct.prep_time_minutes) || 15} mins
                </span>
                <span className="rounded-full bg-[#f8efe3] px-3 py-1 text-[#735c4b]">
                  {foodProduct.is_available === false
                    ? "Currently unavailable"
                    : "Available now"}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#5f534e]">
                {String(foodProduct.description || "").trim() ||
                  "Freshly prepared menu item from your restaurant."}
              </p>

              <div className="mt-5 flex items-end gap-3 border-b border-[#f0e3d3] pb-5">
                <p className="text-3xl font-extrabold text-[#1f1720]">
                  {formatCurrency(foodPricing.finalPrice)}
                </p>
                {foodPricing.actualPrice > foodPricing.finalPrice ? (
                  <p className="pb-1 text-lg text-[#ab9482] line-through">
                    {formatCurrency(foodPricing.actualPrice)}
                  </p>
                ) : null}
              </div>

              {Array.isArray(foodProduct.variants) &&
              foodProduct.variants.length > 0 ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#907a69]">
                    Choose variant
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {foodProduct.variants.map((variant, index) => {
                      const name = String(
                        variant?.name || `Variant ${index + 1}`,
                      ).trim();
                      const isSelected =
                        name.toLowerCase() ===
                        String(selectedFoodVariant?.name || "")
                          .trim()
                          .toLowerCase();
                      const variantPricing = getFoodFinalPrice(
                        foodProduct,
                        name,
                      );

                      return (
                        <button
                          key={`${name}-${index}`}
                          type="button"
                          onClick={() => setSelectedFoodVariantName(name)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            isSelected
                              ? "border-[#1f1720] bg-[#fff7eb]"
                              : "border-[#eadfce] bg-white hover:border-[#c97b38]"
                          }`}
                        >
                          <p className="font-semibold text-[#1f1720]">{name}</p>
                          <p className="mt-1 text-sm text-[#7b685b]">
                            {formatCurrency(variantPricing.finalPrice)}
                            {variantPricing.actualPrice >
                            variantPricing.finalPrice ? (
                              <span className="ml-2 text-[#ab9482] line-through">
                                {formatCurrency(variantPricing.actualPrice)}
                              </span>
                            ) : null}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {Array.isArray(foodProduct.addons) &&
              foodProduct.addons.length > 0 ? (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#907a69]">
                    Add extras
                  </h2>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {foodProduct.addons.map((addon, index) => {
                      const addonName = String(
                        addon?.name || `Addon ${index + 1}`,
                      ).trim();
                      const checked = selectedFoodAddons.includes(addonName);
                      return (
                        <label
                          key={`${addonName}-${index}`}
                          className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#eadfce] bg-[#fffdf9] px-4 py-3"
                        >
                          <div>
                            <p className="font-medium text-[#1f1720]">
                              {addonName}
                            </p>
                            <p className="text-sm text-[#7b685b]">
                              {addon?.is_free
                                ? "Free"
                                : formatCurrency(toNumber(addon?.price))}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleFoodAddonToggle(addonName)}
                            className="h-4 w-4 rounded border-[#d7c2ac] text-[#c97b38] focus:ring-[#c97b38]"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex h-12 items-center rounded-full border border-[#eadfce] bg-[#fffdf9]">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-full text-[#1f1720]"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="min-w-[42px] text-center text-lg font-extrabold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => current + 1)}
                      className="flex h-12 w-12 items-center justify-center rounded-full text-[#1f1720]"
                      aria-label="Increase quantity"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b7d68]">
                      Total
                    </p>
                    <p className="text-2xl font-extrabold text-[#1f1720]">
                      {formatCurrency(foodPricing.finalPrice * quantity)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={adding || foodProduct.is_available === false}
                  onClick={handleAddFoodToCart}
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#f5b638] px-6 py-4 text-sm font-extrabold uppercase tracking-[0.12em] text-[#1f1720] transition hover:bg-[#efad24] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {adding
                    ? "Adding..."
                    : foodProduct.is_available === false
                      ? "Unavailable"
                      : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={toggleFoodWishlist}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] transition ${
                    isFoodWishlisted
                      ? "border-[#d94b2b] bg-[#fff3e2] text-[#d94b2b]"
                      : "border-[#eadfce] bg-white text-[#1f1720] hover:border-[#d94b2b] hover:text-[#d94b2b]"
                  }`}
                >
                  <Heart
                    className={`h-4 w-4 ${isFoodWishlisted ? "fill-current" : ""}`}
                  />
                  {isFoodWishlisted ? "Saved" : "Wishlist"}
                </button>
              </div>

              {message ? (
                <p className="mt-4 text-sm text-[#7b685b]">{message}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-12">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b46a2d]">
                  Same category
                </p>
                <h2 className="mt-2 text-2xl font-bold">Related food items</h2>
              </div>
            </div>

            {relatedFoodProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {relatedFoodProducts.map((item, index) => {
                  const pricing = getFoodFinalPrice(
                    item,
                    getFoodPrimaryVariant(item)?.name,
                  );
                  const relatedPath = buildTemplateScopedPath({
                    vendorId,
                    pathname: pathname || "/",
                    suffix: `product/${item._id}`,
                  });

                  return (
                    <Link
                      key={String(item?._id || `related-food-${index}`)}
                      href={relatedPath}
                      className="overflow-hidden rounded-[1.6rem] border border-[#eadfce] bg-white shadow-[0_14px_32px_rgba(83,45,27,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(83,45,27,0.08)]"
                    >
                      <div className="h-52 overflow-hidden bg-[#fff8ef] p-4">
                        {getFoodMenuImages(item)[0] ? (
                          <img
                            src={getFoodMenuImages(item)[0]}
                            alt={item.item_name || "Food item"}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-[#b39a87]">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9a7d67]">
                          {item.category || "Menu"}
                        </p>
                        <h3 className="line-clamp-2 text-lg font-semibold text-[#1f1720]">
                          {item.item_name || "Untitled item"}
                        </h3>
                        <p className="text-lg font-bold text-[#1f1720]">
                          {formatCurrency(pricing.finalPrice)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.6rem] border border-dashed border-[#eadfce] bg-white p-6 text-sm text-[#7b685b]">
                No other food items are available in this category yet.
              </div>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eadfce] bg-white/95 px-4 py-3 shadow-[0_-12px_35px_rgba(31,23,32,0.12)] backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#111827]">
                  {foodProduct.item_name || "Food item"}
                </p>
                <p className="text-xs font-semibold text-[#6f5b4b]">
                  {quantity} qty -{" "}
                  {formatCurrency(foodPricing.finalPrice * quantity)}
                </p>
              </div>

              <button
                type="button"
                disabled={adding || foodProduct.is_available === false}
                onClick={handleAddFoodToCart}
                className="shrink-0 rounded-full bg-[#1f1720] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-[#32252d] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="text-gray-500">{loadError || "Product not found."}</div>
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
    <div
      className={`${pageClass} template-page-shell template-product-detail-page`}
    >
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

              <div
                className={`order-1 flex-1 overflow-hidden rounded-3xl p-4 `}
              >
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
            {isDraftPreview ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  isStudio
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                Preview only. This product is shown temporarily on the
                storefront template and is not live until the vendor saves it.
              </div>
            ) : null}
            <div>
              <h1 className="text-4xl font-extrabold lg:text-5xl">
                {productTitle}
              </h1>
              {product?.productName &&
              selectedVariantLabel &&
              selectedVariantLabel !== product.productName ? (
                <p className={`mt-2 text-base font-medium ${subtleTextClass}`}>
                  {product.productName}
                </p>
              ) : null}
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
                <RichTextContent
                  text={productShortDescription}
                  className={`mt-3 text-sm leading-relaxed ${subtleTextClass}`}
                />
              ) : null}
            </div>

            <div className={`rounded-2xl p-5 ${panelClass}`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p
                    className={
                      isStudio
                        ? "text-slate-400 text-sm"
                        : isWhiteRose
                          ? "text-[#5f6c7b] text-sm"
                          : "text-slate-500 text-sm"
                    }
                  >
                    Item Price
                  </p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <p className={`text-4xl font-bold ${accentTextClass}`}>
                      {formatCurrency(basePrice)}
                    </p>
                    {actualPrice > basePrice && (
                      <p
                        className={
                          isStudio
                            ? "text-slate-400 line-through"
                            : "text-slate-500 line-through"
                        }
                      >
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

              {retailBenefits.enabled && retailBenefits.items.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {retailBenefits.items.map((benefit) => (
                    <div
                      key={benefit.text}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isStudio ? "bg-slate-800 text-slate-200" : isWhiteRose ? "bg-[#eef4ff] text-[#174ea6]" : "bg-blue-50 text-blue-900"}`}
                    >
                      <benefit.icon className="h-4 w-4 text-blue-500" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {variants.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold">Select Variant</p>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((item, index) => {
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
                            <p className="text-sm font-semibold">
                              {getVariantLabel(item)}
                            </p>
                            {!inStock && (
                              <p className="text-xs text-red-500">
                                Out of stock
                              </p>
                            )}
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
              )}

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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={
                    adding ||
                    !selectedVariant ||
                    stockQuantity <= 0 ||
                    isDraftPreview
                  }
                  className="h-12 w-full rounded-lg font-semibold text-white transition template-accent-bg template-accent-bg-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adding ? "Adding..." : "Add to cart"}
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={
                    adding ||
                    !selectedVariant ||
                    stockQuantity <= 0 ||
                    isDraftPreview
                  }
                  className={`h-12 w-full rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isStudio
                      ? "border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-900"
                      : isWhiteRose
                        ? "border-[#2874f0] bg-white text-[#2874f0] hover:bg-[#eef4ff]"
                        : isTrend
                          ? "border-rose-300 bg-white text-rose-600 hover:bg-rose-50"
                          : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {adding ? "Processing..." : "Buy now"}
                </button>
              </div>

              {message && (
                <p
                  className={`mt-3 text-sm ${isWhiteRose ? "text-[#5f6c7b]" : "text-slate-500"}`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div
            className={`border-b ${isStudio ? "border-slate-800" : "border-slate-200"}`}
          >
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
                <RichTextContent
                  text={productDescription}
                  className={`${isStudio ? "text-slate-300" : "text-slate-700"} leading-relaxed`}
                />
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="space-y-4">
                {detailedSpecs.length > 0 ? (
                  <div className={`rounded-2xl p-5 ${panelClass}`}>
                    <h3 className="mb-4 text-lg font-semibold">
                      Detailed Specifications
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {detailedSpecs.map(([label, value], index) => (
                        <div
                          key={`${label}-${value}-${index}`}
                          className={`rounded-lg px-3 py-2 ${isStudio ? "bg-slate-800" : "bg-slate-50"}`}
                        >
                          <p
                            className={
                              isStudio
                                ? "text-xs text-slate-400"
                                : "text-xs text-slate-500"
                            }
                          >
                            {label}
                          </p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-2xl p-5 ${panelClass}`}>
                    <p
                      className={isStudio ? "text-slate-400" : "text-slate-500"}
                    >
                      No specifications available for this product.
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === "faqs" && (
              <div className={`rounded-2xl p-5 ${panelClass}`}>
                <h3 className="mb-4 text-lg font-semibold">
                  Frequently Asked Questions
                </h3>
                {hasFaqs ? (
                  <div className="space-y-3">
                    {product.faqs?.map((faq, index) => (
                      <div
                        key={`${faq.question || "faq"}-${index}`}
                        className={`rounded-lg px-4 py-3 ${isStudio ? "bg-slate-800" : "bg-slate-50"}`}
                      >
                        <p className="font-semibold">
                          {faq.question || "Question"}
                        </p>
                        <p
                          className={`mt-1 text-sm ${isStudio ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {faq.answer || "Answer not available."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={isStudio ? "text-slate-400" : "text-slate-500"}>
                    No FAQs available for this product yet.
                  </p>
                )}
              </div>
            )}

            {activeTab === "reviews" &&
              (isDraftPreview ? (
                <div className={`rounded-2xl p-5 ${panelClass}`}>
                  <p className={isStudio ? "text-slate-300" : "text-slate-600"}>
                    Reviews are unavailable in draft preview. Save the product
                    to view the live storefront review section.
                  </p>
                </div>
              ) : (
                <ProductReviewsSection
                  productId={productRecordId}
                  token={templateToken}
                  loginPath={`${loginPath}?next=${encodeURIComponent(pathname || productPath)}`}
                  onSummaryChange={setReviewSummary}
                  theme={isStudio ? "studio" : "default"}
                />
              ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p
                className={`text-xs uppercase tracking-[0.2em] ${isStudio ? "text-slate-400" : "text-slate-500"}`}
              >
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
                const productCategoryLabel =
                  collectProductCategoryLabels(item)[0] || "Category";
                const relatedPath = buildTemplateProductPath({
                  vendorId,
                  pathname: pathname || "/",
                  productId: item._id,
                  productSlug: item.slug,
                  citySlug: effectiveCitySlug,
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
                    <div
                      className={`h-44 overflow-hidden ${isStudio ? "bg-slate-950" : "bg-slate-50"}`}
                    >
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
                      <p
                        className={`text-xs uppercase tracking-[0.2em] ${isStudio ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {productCategoryLabel}
                      </p>
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {item.productName || "Untitled Product"}
                      </h3>
                      <div className="flex items-end gap-2">
                        <p
                          className={`text-lg font-bold ${isTrend ? "text-rose-600" : "text-indigo-600"}`}
                        >
                          {formatCurrency(displayPrice)}
                        </p>
                        {actualPrice > finalPrice && finalPrice > 0 && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(actualPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className={`rounded-2xl border p-5 text-sm ${isStudio ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}
            >
              No related products available right now.
            </div>
          )}
        </div>
      </div>

      <ProductEnquiryDialog
        vendorId={vendorId}
        productId={productRecordId}
        productName={product.productName}
        triggerClassName={enquiryTriggerClass}
        triggerContent={
          <>
            <MessageSquareMore className="h-4 w-4" />
            <span>Send enquiry</span>
          </>
        }
      />
    </div>
  );
}
