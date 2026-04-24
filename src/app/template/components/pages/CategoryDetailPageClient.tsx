"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Beef,
  ChevronRight,
  Coffee,
  CupSoda,
  Drumstick,
  Grid2X2,
  Heart,
  LayoutGrid,
  Pizza,
  Search,
  ShoppingBasket,
  Soup,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateProductPath, buildTemplateScopedPath } from "@/lib/template-route";
import { getRichTextPreview, stripRichTextToPlainText } from "@/lib/rich-text";
import { WhiteRoseProductCard } from "@/app/template/components/whiterose/WhiteRoseProductCard";
import { whiteRoseGetCategoryDetails } from "@/app/template/components/whiterose/whiterose-utils";
import { getTemplateAuth, templateApiFetch } from "@/app/template/components/templateAuth";
import {
  normalizePocoFoodWishlist,
  readPocoFoodWishlist,
  writePocoFoodWishlist,
  type PocoFoodWishlistItem,
} from "@/app/template/components/pocofood/pocofood-wishlist";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

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
  price?: number;
  offer_price?: number;
  description?: string;
  image_url?: string;
  gallery_images?: string[];
  addons?: FoodAddonOption[];
  variants?: FoodVariantOption[];
  food_type?: string;
  prep_time_minutes?: number;
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const getFoodPrimaryVariant = (item?: FoodMenuItem | null) => {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  return (
    variants.find((variant) => variant?.is_available !== false && variant?.is_default) ||
    variants.find((variant) => variant?.is_available !== false) ||
    variants.find((variant) => variant?.is_default) ||
    variants[0] ||
    null
  );
};

const getFoodPricing = (item?: FoodMenuItem | null) => {
  const variant = getFoodPrimaryVariant(item);
  const variantPrice = toNumber(variant?.price);
  const variantOfferPrice = toNumber(variant?.offer_price);
  const itemPrice = toNumber(item?.price);
  const itemOfferPrice = toNumber(item?.offer_price);
  const enteredPrice = itemPrice || variantPrice;
  const enteredOfferPrice = itemOfferPrice || itemPrice || variantOfferPrice || variantPrice;
  const hasTwoPrices = enteredPrice > 0 && enteredOfferPrice > 0 && enteredPrice !== enteredOfferPrice;
  const finalPrice = hasTwoPrices
    ? Math.min(enteredPrice, enteredOfferPrice)
    : enteredOfferPrice || enteredPrice;
  const actualPrice = hasTwoPrices
    ? Math.max(enteredPrice, enteredOfferPrice)
    : enteredPrice || finalPrice;
  const discountPercent =
    actualPrice > finalPrice && actualPrice > 0
      ? Math.round(((actualPrice - finalPrice) / actualPrice) * 100)
      : 0;

  return {
    variantId: String(variant?.name || ""),
    finalPrice,
    actualPrice,
    discountPercent,
    stockQuantity: 999,
  };
};

const getFoodSelectionPricing = (
  item?: FoodMenuItem | null,
  variantName?: string,
  selectedAddonNames: string[] = [],
) => {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  const normalizedName = String(variantName || "").trim().toLowerCase();
  const selectedVariant =
    variants.find((variant) => String(variant?.name || "").trim().toLowerCase() === normalizedName) ||
    getFoodPrimaryVariant(item);
  const primaryVariant = getFoodPrimaryVariant(item);
  const isPrimaryVariant =
    String(selectedVariant?.name || "").trim().toLowerCase() ===
    String(primaryVariant?.name || "").trim().toLowerCase();
  const variantPrice = toNumber(selectedVariant?.price);
  const variantOfferPrice = toNumber(selectedVariant?.offer_price);
  const itemPrice = toNumber(item?.price);
  const itemOfferPrice = toNumber(item?.offer_price);
  const variantHasTwoPrices =
    variantPrice > 0 && variantOfferPrice > 0 && variantPrice !== variantOfferPrice;
  const enteredPrice = isPrimaryVariant || !variantPrice ? itemPrice || variantPrice : variantPrice || itemPrice;
  const enteredOfferPrice = isPrimaryVariant || !variantHasTwoPrices
    ? itemOfferPrice || itemPrice || variantOfferPrice || variantPrice
    : variantOfferPrice || variantPrice || itemOfferPrice || itemPrice;
  const hasTwoPrices = enteredPrice > 0 && enteredOfferPrice > 0 && enteredPrice !== enteredOfferPrice;
  const baseFinal = hasTwoPrices
    ? Math.min(enteredPrice, enteredOfferPrice)
    : enteredOfferPrice || enteredPrice;
  const baseActual = hasTwoPrices
    ? Math.max(enteredPrice, enteredOfferPrice)
    : enteredPrice || baseFinal;
  const addonTotal = (Array.isArray(item?.addons) ? item.addons : []).reduce((sum, addon) => {
    const addonName = String(addon?.name || "").trim();
    if (!selectedAddonNames.includes(addonName) || addon?.is_free) return sum;
    return sum + toNumber(addon?.price);
  }, 0);

  return {
    finalPrice: baseFinal + addonTotal,
    actualPrice: baseActual + addonTotal,
  };
};

const getFoodMenuImage = (item?: FoodMenuItem | null) => {
  const primary = normalizeText(item?.image_url);
  if (primary) return primary;
  const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : [];
  return gallery.map((image) => normalizeText(image)).find(Boolean) || "";
};

const isFoodMenuRecord = (product: any) => Boolean(product?.__foodMenuItem);

const getImageUrl = (image: unknown) => {
  if (typeof image === "string") return image.trim();
  if (!image || typeof image !== "object") return "";
  const record = image as {
    url?: unknown;
    src?: unknown;
    secure_url?: unknown;
    image?: unknown;
  };
  const direct =
    (typeof record.url === "string" && record.url.trim()) ||
    (typeof record.src === "string" && record.src.trim()) ||
    (typeof record.secure_url === "string" && record.secure_url.trim()) ||
    (typeof record.image === "string" && record.image.trim()) ||
    "";
  return direct;
};

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString("en-IN")}`;

const getPrimaryVariant = (product: any) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find((variant: any) => variant?._id && variant?.isActive !== false) || variants[0] || null;
};

const getProductPricing = (product: any) => {
  if (isFoodMenuRecord(product)) {
    return getFoodPricing(product.__foodMenuItem);
  }
  const variant = getPrimaryVariant(product);
  const finalPrice =
    toNumber(variant?.finalPrice) ||
    toNumber(product?.finalPrice) ||
    toNumber(product?.price);
  const actualPrice =
    toNumber(variant?.actualPrice) ||
    toNumber(product?.actualPrice) ||
    toNumber(product?.mrp) ||
    toNumber(product?.compareAtPrice);
  let discountPercent = toNumber(variant?.discountPercent);

  if (!discountPercent && actualPrice > finalPrice && actualPrice > 0) {
    discountPercent = Math.round(((actualPrice - finalPrice) / actualPrice) * 100);
  }

  return {
    variantId: String(variant?._id || ""),
    finalPrice,
    actualPrice,
    discountPercent,
    stockQuantity: toNumber(variant?.stockQuantity),
  };
};

const getProductImageUrl = (product: any) => {
  if (isFoodMenuRecord(product)) {
    return getFoodMenuImage(product.__foodMenuItem);
  }
  const defaultImages = Array.isArray(product?.defaultImages) ? product.defaultImages : [];
  const defaultImage = defaultImages
    .map((image: unknown) => getImageUrl(image))
    .find((url: string) => Boolean(url));
  if (defaultImage) return defaultImage;

  const directProductImages = [
    getImageUrl(product?.image),
    getImageUrl(product?.thumbnail),
    getImageUrl(product?.featuredImage),
    getImageUrl(product?.featured_image),
  ].find((url) => Boolean(url));
  if (directProductImages) return directProductImages;

  const variant = getPrimaryVariant(product);
  const variantImage = (Array.isArray(variant?.variantsImageUrls) ? variant.variantsImageUrls : [])
    .map((image: unknown) => getImageUrl(image))
    .find((url: string) => Boolean(url));
  if (variantImage) return variantImage;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  for (const item of variants) {
    const urls = [
      ...(Array.isArray(item?.variantsImageUrls) ? item.variantsImageUrls : []),
      ...(Array.isArray(item?.images) ? item.images : []),
      item?.image,
      item?.thumbnail,
    ]
      .map((image: unknown) => getImageUrl(image))
      .filter(Boolean);
    if (urls[0]) return urls[0];
  }

  return "";
};

const getCategoryIcon = (label: string) => {
  const value = label.trim().toLowerCase();
  if (value.includes("burger")) return Beef;
  if (value.includes("drink") || value.includes("soda") || value.includes("juice")) return CupSoda || ShoppingBasket;
  if (value.includes("coffee") || value.includes("tea")) return Coffee || ShoppingBasket;
  if (value.includes("pizza")) return Pizza || ShoppingBasket;
  if (value.includes("pasta") || value.includes("noodle")) return Soup || ShoppingBasket;
  if (value.includes("chicken")) return Drumstick || ShoppingBasket;
  if (value.includes("meat")) return Beef || ShoppingBasket;
  return UtensilsCrossed || ShoppingBasket;
};

export default function CategoryProductsPage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const pathname = usePathname();
  const vendor_id = params.vendor_id as string;
  const categoryId = params.category_id as string;
  const vendorId = String(vendor_id || "");
  const products = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const templateData = useSelector((state: any) => state?.alltemplatepage?.data);
  const [foodMenuItems, setFoodMenuItems] = useState<FoodMenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [productDetailsById, setProductDetailsById] = useState<Record<string, any>>({});
  const [customizingProduct, setCustomizingProduct] = useState<any | null>(null);
  const [customizingVariantName, setCustomizingVariantName] = useState("");
  const [customizingAddons, setCustomizingAddons] = useState<string[]>([]);
  const [customizingQuantity, setCustomizingQuantity] = useState(1);
  const isStudio = variant.key === "studio";
  const isWhiteRose = variant.key === "whiterose";
  const isPocoFood = variant.key === "pocofood";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-white";
  const heroShellClass = isStudio
    ? "rounded-md border border-slate-800 bg-slate-900/80 p-6"
    : isTrend
      ? "rounded-[1.8rem] border border-rose-200 bg-gradient-to-r from-rose-100 via-white to-pink-100 p-6"
      : isMinimal
        ? "rounded-xl border border-slate-200 bg-white p-6"
        : "rounded-3xl border border-slate-200 bg-slate-50 p-6";
  const gridClass = isStudio
    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
    : isTrend
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      : isMinimal
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-9"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10";
  const cardClass = isStudio
    ? "rounded-md border border-slate-800 bg-slate-900/75 p-4"
    : isTrend
      ? "rounded-[1.4rem] border border-rose-200 bg-white p-4"
      : isMinimal
        ? "rounded-xl border border-slate-200 bg-white p-4"
        : "rounded-2xl border border-slate-200 bg-white p-4";
  const toTemplatePath = (suffix = "") =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || undefined,
      suffix,
    });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${NEXT_PUBLIC_API_URL}/categories/getall`);
        const list = res.data?.data || [];
    const map = list.reduce((acc: Record<string, string>, item: any) => {
      if (item?._id && item?.name) acc[item._id] = item.name;
      return acc;
        }, {});
        setCategoryMap(map);
      } catch {
        setCategoryMap({});
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!isPocoFood || !vendorId) {
      setFoodMenuItems([]);
      return;
    }

    let cancelled = false;

    const loadFoodStorefront = async () => {
      try {
        const response = await fetch(`${API_BASE}/vendors/${vendorId}/food-storefront`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        setFoodMenuItems(Array.isArray(payload?.data?.menu_items) ? payload.data.menu_items : []);
      } catch {
        if (!cancelled) {
          setFoodMenuItems([]);
        }
      }
    };

    void loadFoodStorefront();

    return () => {
      cancelled = true;
    };
  }, [isPocoFood, vendorId]);

  const { label, categoryProducts } = useMemo(() => {
    const normalize = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";
    const decodedParam = decodeURIComponent(categoryId || "");
    const normalizedParam = decodedParam.toLowerCase();

    if (isPocoFood) {
      const list = foodMenuItems
        .filter((item) => {
          const categoryLabel = normalize(item?.category);
          if (!categoryLabel) return false;
          return toSlug(categoryLabel) === normalizedParam;
        })
        .map((item) => ({
          _id: String(item?._id || ""),
          slug: "",
          productName: item?.item_name || "Untitled food item",
          shortDescription: item?.description || "",
          productCategoryName: item?.category || "",
          __foodMenuItem: item,
        }));

      const displayLabel =
        normalize(list[0]?.productCategoryName) ||
        decodedParam.replace(/-/g, " ") ||
        "Category";

      return { label: displayLabel, categoryProducts: list };
    }

    const matchesCategory = (product: any) => {
      const id =
        normalize(product?.productCategory?._id) ||
        normalize(product?.productCategory);
      const name =
        normalize(product?.productCategoryName) ||
        normalize(product?.productCategory?.name) ||
        normalize(product?.productCategory?.title) ||
        normalize(product?.productCategory?.categoryName) ||
        (id && categoryMap[id]) ||
        "";

      if (id && id.toLowerCase() === normalizedParam) return true;
      if (name && name.toLowerCase().replace(/\s+/g, "-") === normalizedParam) {
        return true;
      }
      return false;
    };

    const list = products.filter(matchesCategory);
    const displayLabel =
      list[0]?.productCategoryName ||
      list[0]?.productCategory?.name ||
      list[0]?.productCategory?.title ||
      list[0]?.productCategory?.categoryName ||
      (list[0]?.productCategory?._id &&
        categoryMap[list[0].productCategory._id]) ||
      (categoryMap[decodeURIComponent(categoryId || "")] ||
        (/^[a-f\d]{24}$/i.test(decodeURIComponent(categoryId || ""))
          ? "Category"
          : decodeURIComponent(categoryId || "").replace(/-/g, " ")));

    return { label: displayLabel, categoryProducts: list };
  }, [categoryId, products, categoryMap, isPocoFood, foodMenuItems]);

  const processedCategoryProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const searched = categoryProducts.filter((product: any) => {
      const name = normalizeText(product?.productName).toLowerCase();
      const desc = normalizeText(stripRichTextToPlainText(product?.shortDescription || "")).toLowerCase();
      return name.includes(term) || desc.includes(term);
    });

    const priced = searched.filter((product: any) => {
      const pricing = getProductPricing(product);
      return !pricing.finalPrice || (pricing.finalPrice >= minPrice && pricing.finalPrice <= maxPrice);
    });

    const sorted = [...priced].sort((a: any, b: any) => {
      const pricingA = getProductPricing(a);
      const pricingB = getProductPricing(b);
      switch (sortBy) {
        case "price-low":
          return pricingA.finalPrice - pricingB.finalPrice;
        case "price-high":
          return pricingB.finalPrice - pricingA.finalPrice;
        case "name":
          return String(a?.productName || "").localeCompare(String(b?.productName || ""));
        case "discount":
          return pricingB.discountPercent - pricingA.discountPercent;
        default:
          return 0;
      }
    });

    return sorted;
  }, [categoryProducts, maxPrice, minPrice, searchTerm, sortBy]);

  useEffect(() => {
    if (!isPocoFood) return;

    const missingProducts = categoryProducts.filter((product: any) => {
      if (isFoodMenuRecord(product)) return false;
      const productId = String(product?._id || "").trim();
      if (!productId || productDetailsById[productId]) return false;
      const pricing = getProductPricing(product);
      const imageUrl = getProductImageUrl(product);
      return !imageUrl || pricing.finalPrice <= 0;
    });

    if (!missingProducts.length) return;

    let active = true;

    const loadProducts = async () => {
      const results = await Promise.all(
        missingProducts.map(async (product: any) => {
          const productId = String(product?._id || "").trim();
          if (!productId) return null;
          try {
            const response = await fetch(`${NEXT_PUBLIC_API_URL}/products/${productId}`, {
              cache: "no-store",
            });
            const data = await response.json().catch(() => null);
            const fullProduct = data?.product || data?.data?.product || data?.data || null;
            if (!fullProduct) return null;
            return [productId, fullProduct] as const;
          } catch {
            return null;
          }
        })
      );

      if (!active) return;

      const resolvedEntries = results.filter(Boolean) as Array<readonly [string, any]>;
      if (!resolvedEntries.length) return;

      setProductDetailsById((current) => {
        const next = { ...current };
        resolvedEntries.forEach(([productId, fullProduct]) => {
          next[productId] = fullProduct;
        });
        return next;
      });
    };

    void loadProducts();

    return () => {
      active = false;
    };
  }, [categoryProducts, isPocoFood, productDetailsById]);

  const categoryEntries = useMemo(() => {
    const categoryLookup = new Map<string, { label: string; href: string; count: number }>();

    if (isPocoFood) {
      foodMenuItems.forEach((item) => {
        const labelValue = normalizeText(item?.category);
        if (!labelValue) return;
        const href = toTemplatePath(`category/${encodeURIComponent(toSlug(labelValue))}`);
        const key = labelValue.toLowerCase();
        const current = categoryLookup.get(key);
        categoryLookup.set(key, {
          label: labelValue,
          href,
          count: (current?.count || 0) + 1,
        });
      });

      return Array.from(categoryLookup.values()).sort((a, b) => a.label.localeCompare(b.label));
    }

    products.forEach((product: any) => {
      const rawId = normalizeText(product?.productCategory?._id) || normalizeText(product?.productCategory);
      const rawLabel =
        normalizeText(product?.productCategoryName) ||
        normalizeText(product?.productCategory?.name) ||
        normalizeText(product?.productCategory?.title) ||
        normalizeText(product?.productCategory?.categoryName) ||
        (rawId ? normalizeText(categoryMap[rawId]) : "");
      const labelValue = rawLabel || (!OBJECT_ID_REGEX.test(rawId) ? rawId : "");
      if (!labelValue) return;
      const path = rawId && OBJECT_ID_REGEX.test(rawId)
        ? rawId
        : encodeURIComponent(labelValue.toLowerCase().replace(/\s+/g, "-"));
      const href = toTemplatePath(`category/${path}`);
      const key = rawId || labelValue.toLowerCase();
      const current = categoryLookup.get(key);
      categoryLookup.set(key, {
        label: labelValue,
        href,
        count: (current?.count || 0) + 1,
      });
    });
    return Array.from(categoryLookup.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [categoryMap, products, pathname, vendorId, isPocoFood, foodMenuItems]);

  const bestDeals = useMemo(() => {
    return [...categoryProducts]
      .sort((a: any, b: any) => {
        const pricingA = getProductPricing(a);
        const pricingB = getProductPricing(b);
        return pricingB.discountPercent - pricingA.discountPercent || pricingA.finalPrice - pricingB.finalPrice;
      })
      .slice(0, 3);
  }, [categoryProducts]);

  const maxAvailablePrice = useMemo(() => {
    const highest = categoryProducts.reduce((acc: number, product: any) => {
      const pricing = getProductPricing(product);
      return Math.max(acc, pricing.finalPrice || pricing.actualPrice || 0);
    }, 0);
    return highest > 0 ? highest : 100000;
  }, [categoryProducts]);
  const customizingFoodItem = isFoodMenuRecord(customizingProduct)
    ? (customizingProduct.__foodMenuItem as FoodMenuItem)
    : null;
  const customizingImageUrl = getProductImageUrl(customizingProduct || {});
  const customizingPricing = getFoodSelectionPricing(
    customizingFoodItem,
    customizingVariantName,
    customizingAddons,
  );

  useEffect(() => {
    setMinPrice(0);
    setMaxPrice(maxAvailablePrice);
  }, [maxAvailablePrice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setWishlistIds(readPocoFoodWishlist(vendorId).map((item) => item.product_id));
    } catch {
      setWishlistIds([]);
    }
  }, [vendorId]);

  useEffect(() => {
    if (typeof document === "undefined" || !customizingFoodItem) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [customizingFoodItem]);

  const openFoodCustomizer = (product: any) => {
    if (!isFoodMenuRecord(product)) {
      void handleAddToCart(product);
      return;
    }
    const foodItem = product.__foodMenuItem as FoodMenuItem;
    const primaryVariant = getFoodPrimaryVariant(foodItem);
    setActionMessage("");
    setCustomizingProduct(product);
    setCustomizingVariantName(String(primaryVariant?.name || "").trim());
    setCustomizingAddons([]);
    setCustomizingQuantity(1);
  };

  const closeFoodCustomizer = () => {
    setCustomizingProduct(null);
    setCustomizingVariantName("");
    setCustomizingAddons([]);
    setCustomizingQuantity(1);
  };

  const toggleCustomizingAddon = (addonName: string) => {
    setCustomizingAddons((current) =>
      current.includes(addonName)
        ? current.filter((item) => item !== addonName)
        : [...current, addonName],
    );
  };

  const addCustomizedFoodToCart = async () => {
    if (!vendorId || !customizingProduct?._id || !customizingFoodItem) return;
    const auth = getTemplateAuth(vendorId);
    if (!auth?.token) {
      window.location.href = `${toTemplatePath("login")}?next=${encodeURIComponent(pathname || toTemplatePath(`category/${categoryId}`))}`;
      return;
    }

    setAddingId(String(customizingProduct._id));
    setActionMessage("");
    try {
      await templateApiFetch(vendorId, "/cart", {
        method: "POST",
        body: JSON.stringify({
          item_type: "food",
          food_menu_item_id: customizingProduct._id,
          quantity: customizingQuantity,
          variant_name: customizingVariantName || undefined,
          selected_addons: customizingAddons,
        }),
      });
      setActionMessage("Food item added to cart.");
      closeFoodCustomizer();
    } catch (error: any) {
      setActionMessage(error?.message || "Failed to add dish.");
    } finally {
      setAddingId(null);
    }
  };

  const handleAddToCart = async (product: any) => {
    setActionMessage("");
    if (!vendorId || !product?._id) return;
    const auth = getTemplateAuth(vendorId);
    if (!auth?.token) {
      window.location.href = `${toTemplatePath("login")}?next=${encodeURIComponent(pathname || toTemplatePath(`category/${categoryId}`))}`;
      return;
    }

    setAddingId(String(product._id));
    try {
      if (isFoodMenuRecord(product)) {
        const foodItem = product.__foodMenuItem as FoodMenuItem;
        const primaryVariant = getFoodPrimaryVariant(foodItem);
        await templateApiFetch(vendorId, "/cart", {
          method: "POST",
          body: JSON.stringify({
            item_type: "food",
            food_menu_item_id: product._id,
            quantity: 1,
            variant_name: String(primaryVariant?.name || "").trim() || undefined,
            selected_addons: [],
          }),
        });
        setActionMessage("Food item added to cart.");
      } else {
        const pricing = getProductPricing(product);
        if (!pricing.variantId) {
          setActionMessage("Variant not available.");
          return;
        }
        await templateApiFetch(vendorId, "/cart", {
          method: "POST",
          body: JSON.stringify({
            product_id: product._id,
            variant_id: pricing.variantId,
            quantity: 1,
          }),
        });
        setActionMessage("Dish added to cart.");
      }
    } catch (error: any) {
      setActionMessage(error?.message || "Failed to add dish.");
    } finally {
      setAddingId(null);
    }
  };

  const toggleWishlist = (product: any, href: string) => {
    const productId = String(product?._id || "").trim();
    if (!productId) return;

    const currentItems = normalizePocoFoodWishlist(readPocoFoodWishlist(vendorId));
    const exists = currentItems.some((item) => item.product_id === productId);
    const pricing = getProductPricing(product);
    const nextItems = exists
      ? currentItems.filter((item) => item.product_id !== productId)
      : [
          {
            product_id: productId,
            product_name: String(product?.productName || "Untitled Product"),
            category: String(product?.productCategoryName || product?.category || label || ""),
            image_url: getProductImageUrl(product),
            price: pricing.finalPrice,
            href,
            added_at: new Date().toISOString(),
          } satisfies PocoFoodWishlistItem,
          ...currentItems.filter((item) => item.product_id !== productId),
        ];

    writePocoFoodWishlist(vendorId, nextItems);
    setWishlistIds(nextItems.map((item) => item.product_id));
  };

  if (isWhiteRose) {
    return (
      <div className="template-page-shell min-h-screen bg-[#f1f3f6] py-8 text-[#172337]">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="rounded-[28px] border border-[#dfe3eb] bg-gradient-to-r from-[#e7f0ff] via-white to-[#fff3d1] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2874f0]">
                  Category view
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-[#172337] sm:text-5xl">
                  {label}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6c7b] sm:text-base">
                  Filter the selected department and push buyers into product detail pages without changing the existing backend flows.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <input
                  type="text"
                  placeholder="Search in this category"
                  className="w-full rounded-2xl border border-white/70 bg-white/85 py-3 pl-10 pr-4 text-sm text-[#172337] outline-none transition focus:border-[#2874f0]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-3.5 text-[#7a8797]" size={18} />
              </div>
            </div>
          </div>

          {processedCategoryProducts.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {processedCategoryProducts.map((product: any, index: number) => (
                <WhiteRoseProductCard
                  key={product._id || `product-${index}`}
                  product={product}
                  href={buildTemplateProductPath({
                    vendorId,
                    pathname: pathname || undefined,
                    productId: product._id,
                    productSlug: product.slug,
                  })}
                  categoryLabel={whiteRoseGetCategoryDetails(product, categoryMap).label || label}
                  showAddToCart={false}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[24px] border border-dashed border-[#d6deed] bg-white p-12 text-center text-sm text-[#5f6c7b]">
              No products found for this category.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isPocoFood) {
    return (
      <div className="min-h-screen bg-white text-[#171717]">
        <section className="border-y border-[#f2ead4] bg-[#fbf7ec]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#8d8d8d]">
                <Link href={toTemplatePath("")} className="transition hover:text-[#d94b2b]">
                  Home
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-[#171717]">{label}</span>
              </div>
              <h1 className="mt-2 text-[30px] font-black leading-tight tracking-[-0.035em] text-[#171717] sm:text-[38px]">
                {label}
              </h1>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadfb7] bg-white px-4 py-2 text-sm font-semibold text-[#5f6368] shadow-[0_10px_24px_rgba(23,23,23,0.04)]">
              <ShoppingBasket className="h-4 w-4 text-[#d94b2b]" />
              {processedCategoryProducts.length} {processedCategoryProducts.length === 1 ? "item" : "items"}
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-10">
            <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div>
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <p className="text-base text-[#7a7a7a]">
                    Showing all {processedCategoryProducts.length} results
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 text-[#171717]">
                      <button
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`rounded-md p-1.5 ${viewMode === "grid" ? "text-[#171717]" : "text-[#9ca3af]"}`}
                      >
                        <Grid2X2 className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`rounded-md p-1.5 ${viewMode === "list" ? "text-[#171717]" : "text-[#9ca3af]"}`}
                      >
                        <LayoutGrid className="h-5 w-5" />
                      </button>
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-2xl border border-[#efe7ca] bg-[#fbf4de] px-5 py-3 text-base text-[#171717] outline-none"
                    >
                      <option value="default">Default sorting</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="name">Sort by name</option>
                      <option value="discount">Best discount</option>
                    </select>
                  </div>
                </div>

                {processedCategoryProducts.length ? (
                  <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2" : "flex flex-col gap-5"}>
                    {processedCategoryProducts.map((product: any, index: number) => {
                      const productId = String(product._id || `category-product-${index}`);
                      const resolvedProduct = productDetailsById[productId] || product;
                      const pricing = getProductPricing(resolvedProduct);
                      const imageUrl = getProductImageUrl(resolvedProduct);
                      const isWishlisted = wishlistIds.includes(productId);
                      const productHref = isFoodMenuRecord(resolvedProduct)
                        ? toTemplatePath(`product/${resolvedProduct._id}`)
                        : buildTemplateProductPath({
                            vendorId,
                            pathname: pathname || undefined,
                            productId: resolvedProduct._id,
                            productSlug: resolvedProduct.slug,
                            citySlug: String(templateData?.components?.vendor_profile?.default_city_slug || "").trim(),
                          });

                      return (
                        <article
                          key={productId}
                          className={`group overflow-hidden rounded-md bg-white shadow-[0_8px_24px_rgba(23,23,23,0.08)] transition hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(23,23,23,0.12)] ${
                            viewMode === "list" ? "grid gap-0 sm:grid-cols-[220px_1fr]" : ""
                          }`}
                        >
                          <Link href={productHref} className="block">
                            <div className={`relative flex items-center justify-center bg-white ${
                              viewMode === "list" ? "h-full min-h-[190px]" : "h-[175px] sm:h-[190px]"
                            }`}>
                              {pricing.discountPercent > 0 ? (
                                <span className="absolute left-4 top-4 z-20 rounded-full bg-[#4a241c] px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                                  {pricing.discountPercent}% OFF
                                </span>
                              ) : null}
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={resolvedProduct?.productName || "Product"}
                                  className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                                />
                              ) : (
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
                                  No image
                                </div>
                              )}
                            </div>
                          </Link>

                          <div className="flex min-h-[205px] flex-col p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                              <Link href={productHref} className="min-w-0">
                                <h3 className="line-clamp-2 text-[22px] font-black leading-[1.12] tracking-[-0.03em] text-[#111111] sm:text-[24px]">
                                  {resolvedProduct?.productName || "Untitled Product"}
                                </h3>
                              </Link>
                              <div className={`mt-1 flex h-[15px] w-[15px] shrink-0 items-center justify-center border ${
                                resolvedProduct?.food_type === "non_veg"
                                  ? "border-[#7b3127] text-[#7b3127]"
                                  : "border-[#72b51b] text-[#72b51b]"
                              }`}>
                                <span className="h-[7px] w-[7px] rounded-full bg-current" />
                              </div>
                            </div>

                            <p className="mt-3 line-clamp-2 text-[15px] font-semibold leading-6 text-[#686868] sm:text-[16px]">
                              {getRichTextPreview(
                                resolvedProduct?.shortDescription ||
                                  resolvedProduct?.description ||
                                  "Freshly prepared bestseller from the category menu.",
                                105
                              )}
                            </p>

                            <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                              <div className="flex flex-wrap items-baseline gap-3">
                                <p className="text-[24px] font-black leading-none text-[#111111]">
                                  {formatPrice(pricing.finalPrice).replace("Rs.", "₹").replace(".00", "")}/-
                                </p>
                                {pricing.actualPrice > pricing.finalPrice ? (
                                  <p className="text-[16px] font-black text-[#777] line-through">
                                    {formatPrice(pricing.actualPrice).replace("Rs.", "₹").replace(".00", "")}/-
                                  </p>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => openFoodCustomizer(resolvedProduct)}
                                disabled={
                                  (!isFoodMenuRecord(resolvedProduct) && !pricing.variantId) ||
                                  addingId === String(resolvedProduct._id)
                                }
                                className="inline-flex min-w-[124px] items-center justify-center rounded-full border border-[#7b3127] bg-white px-6 py-2.5 text-[15px] font-black uppercase tracking-[0.04em] text-[#6d382f] transition hover:bg-[#7b3127] hover:text-white disabled:cursor-not-allowed disabled:border-[#efe7ca] disabled:text-[#b8aa90]"
                              >
                                {addingId === String(resolvedProduct._id) ? "Adding" : "Add +"}
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleWishlist(resolvedProduct, productHref)}
                              className={`mt-3 inline-flex w-fit items-center gap-2 text-sm font-bold transition ${
                                isWishlisted ? "text-[#d94b2b]" : "text-[#7d7d7d] hover:text-[#d94b2b]"
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
                              {isWishlisted ? "Saved" : "Wishlist"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-[#eadfb7] bg-[#fffdf6] p-12 text-center text-[#7d7d7d]">
                    No products found for this category.
                  </div>
                )}
              </div>

              <aside className="space-y-8">
                <div className="rounded-[32px] border border-[#efe7ca] bg-white p-5 shadow-[0_14px_28px_rgba(23,23,23,0.03)]">
                  <h2 className="text-[22px] font-black tracking-[-0.03em] text-[#171717]">
                    Categories
                  </h2>
                  <div className="mt-4 overflow-hidden rounded-[24px] border border-[#f3ead1] bg-[#fff9ea]">
                    {categoryEntries.map((category) => {
                      const isActive = category.label.toLowerCase() === label.toLowerCase();
                      const Icon = getCategoryIcon(category.label) || ShoppingBasket;
                      return (
                        <Link
                          key={category.href}
                          href={category.href}
                          className={`flex items-center justify-between gap-4 border-b border-dashed border-[#eadfb7] px-5 py-4 last:border-b-0 ${
                            isActive ? "bg-[#ffc222] text-[#171717]" : "text-[#5f6368]"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Icon className="h-6 w-6 shrink-0" />
                            <span className="truncate text-[16px]">{category.label}</span>
                          </div>
                          <span className="text-[16px] font-semibold">({category.count})</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[28px] border border-[#f0c85f] bg-white p-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-full border border-[#f0c85f] px-6 py-4 pr-14 text-base text-[#171717] outline-none"
                    />
                    <Search className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#171717]" />
                  </div>
                </div>

                <div>
                  <h3 className="text-[22px] font-black tracking-[-0.03em] text-[#171717]">
                    Filter by price
                  </h3>
                  <div className="mt-4 rounded-[28px] border border-[#efe7ca] bg-white p-5">
                    <div className="relative h-10">
                      <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-[#f8efd8]" />
                      <div
                        className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#ffc222]"
                        style={{
                          left: `${(Math.min(minPrice, maxAvailablePrice) / maxAvailablePrice) * 100}%`,
                          right: `${100 - (Math.min(maxPrice, maxAvailablePrice) / maxAvailablePrice) * 100}%`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={maxAvailablePrice}
                        value={Math.min(minPrice, maxAvailablePrice)}
                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                        className="pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[5px] [&::-webkit-slider-thumb]:border-[#ffc222] [&::-webkit-slider-thumb]:bg-white"
                      />
                      <input
                        type="range"
                        min={0}
                        max={maxAvailablePrice}
                        value={Math.min(maxPrice, maxAvailablePrice)}
                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                        className="pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[5px] [&::-webkit-slider-thumb]:border-[#ffc222] [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                    <div className="mt-3 h-[2px] w-full border-t border-dashed border-[#e5dcc0]" />
                    <div className="mt-4 flex items-center justify-between text-[18px] text-[#7d7d7d]">
                      <span>Price: Rs. {Math.min(minPrice, maxAvailablePrice).toLocaleString("en-IN")}</span>
                      <span>Rs. {Math.min(maxPrice, maxAvailablePrice).toLocaleString("en-IN")}</span>
                    </div>
                    <button
                      type="button"
                      className="mt-8 rounded-[16px] bg-[#ffc222] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.06em] text-[#171717]"
                    >
                      Filter
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-[22px] font-black tracking-[-0.03em] text-[#171717]">
                    Best Deals
                  </h3>
                  <div className="mt-8 space-y-4">
                    {bestDeals.map((product: any, index: number) => {
                      const productId = String(product?._id || `deal-${index}`);
                      const resolvedProduct = productDetailsById[productId] || product;
                      const pricing = getProductPricing(resolvedProduct);
                      const imageUrl = getProductImageUrl(resolvedProduct);
                      return (
                        <Link
                          key={productId}
                          href={
                            isFoodMenuRecord(resolvedProduct)
                              ? toTemplatePath(`product/${resolvedProduct._id}`)
                              : buildTemplateProductPath({
                                  vendorId,
                                  pathname: pathname || undefined,
                                  productId: resolvedProduct._id,
                                  productSlug: resolvedProduct.slug,
                                })
                          }
                          className="flex items-center gap-4 rounded-[28px] border border-[#efe7ca] bg-white p-4"
                        >
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[22px] bg-[#fff8e8]">
                            {imageUrl ? (
                              <img src={imageUrl} alt={resolvedProduct?.productName || "Deal"} className="h-20 w-20 object-contain" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-[#ffc222]">
                              {Array.from({ length: 5 }).map((_, ratingIndex) => (
                                <Star
                                  key={ratingIndex}
                                  className={`h-4 w-4 ${ratingIndex < 4 ? "fill-current" : "text-[#e5e7eb]"}`}
                                />
                              ))}
                            </div>
                            <p className="mt-2 line-clamp-2 text-[18px] font-extrabold leading-tight text-[#171717]">
                              {resolvedProduct?.productName || "Untitled Product"}
                            </p>
                            <p className="mt-2 text-[18px] font-extrabold text-[#ffb81c]">
                              {formatPrice(pricing.finalPrice)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>

            {customizingFoodItem ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 px-3 py-4 sm:px-6">
                <div className="relative flex max-h-[84dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:max-h-[82vh]">
                  <div className="flex flex-none items-center justify-between bg-white px-4 py-3 sm:px-5">
                    <button
                      type="button"
                      onClick={closeFoodCustomizer}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6d382f] transition hover:bg-[#f8efe3]"
                      aria-label="Close customization popup"
                    >
                      <span className="text-2xl leading-none">&larr;</span>
                    </button>
                    <button
                      type="button"
                      onClick={closeFoodCustomizer}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-[#6d382f] transition hover:bg-[#f8efe3]"
                      aria-label="Close"
                    >
                      x
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6 [scrollbar-gutter:stable]">
                    <div className="mx-auto flex h-32 max-w-sm items-center justify-center bg-white sm:h-36">
                      {customizingImageUrl ? (
                        <img
                          src={customizingImageUrl}
                          alt={customizingFoodItem.item_name || "Food item"}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3a3a3]">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-center">
                      <h2 className="text-2xl font-black uppercase leading-tight tracking-[-0.03em] text-black sm:text-[28px]">
                        {customizingFoodItem.item_name || "Food item"}
                      </h2>
                      <p className="mt-1.5 text-sm font-bold text-black">
                        Energy - {toNumber(customizingFoodItem.prep_time_minutes) || 20} mins prep
                      </p>
                    </div>

                    {Array.isArray(customizingFoodItem.variants) && customizingFoodItem.variants.length > 0 ? (
                      <div className="mt-5">
                        <h3 className="text-lg font-black text-black">Choose Variant</h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {customizingFoodItem.variants.map((variant, index) => {
                            const name = String(variant?.name || `Variant ${index + 1}`).trim();
                            const isSelected =
                              name.toLowerCase() === customizingVariantName.trim().toLowerCase();
                            const variantPricing = getFoodSelectionPricing(
                              customizingFoodItem,
                              name,
                              customizingAddons,
                            );
                            return (
                              <button
                                key={`${name}-${index}`}
                                type="button"
                                onClick={() => setCustomizingVariantName(name)}
                                className={`rounded-[16px] border-2 px-4 py-3 text-left transition ${
                                  isSelected
                                    ? "border-[#7b3127] bg-[#fff8ec]"
                                    : "border-[#d9d9d9] bg-white hover:border-[#7b3127]"
                                }`}
                              >
                                <p className="text-base font-black text-black">{name}</p>
                                <p className="mt-1 text-sm text-[#555]">
                                  {formatPrice(variantPricing.finalPrice)}
                                  {variantPricing.actualPrice > variantPricing.finalPrice ? (
                                    <span className="ml-2 text-[#777] line-through">
                                      {formatPrice(variantPricing.actualPrice)}
                                    </span>
                                  ) : null}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {Array.isArray(customizingFoodItem.addons) && customizingFoodItem.addons.length > 0 ? (
                      <div className="mt-5">
                        <h3 className="text-lg font-black text-black">Add Extras</h3>
                        <div className="mt-3 space-y-3">
                          {customizingFoodItem.addons.map((addon, index) => {
                            const addonName = String(addon?.name || `Addon ${index + 1}`).trim();
                            const isSelected = customizingAddons.includes(addonName);
                            return (
                              <div
                                key={`${addonName}-${index}`}
                                className="flex items-center justify-between gap-4 rounded-[16px] border border-[#e3e3e3] bg-white px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-base font-bold text-black">{addonName}</p>
                                  <p className="mt-1 text-sm text-black">
                                    {addon?.is_free ? "Free" : `${formatPrice(addon?.price)} /-`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleCustomizingAddon(addonName)}
                                  className={`min-w-[92px] rounded-full px-5 py-2.5 text-sm font-black uppercase text-white transition ${
                                    isSelected
                                      ? "bg-[#4a241c] hover:bg-[#321713]"
                                      : "bg-[#f27a00] hover:bg-[#da6d00]"
                                  }`}
                                >
                                  {isSelected ? "Added" : "Add"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-none border-t border-[#ededed] bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center justify-between gap-4 sm:justify-start">
                        <div className="inline-flex items-center rounded-full border border-[#d9d9d9]">
                          <button
                            type="button"
                            onClick={() => setCustomizingQuantity((current) => Math.max(1, current - 1))}
                            className="h-10 w-11 text-2xl font-bold text-black"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="min-w-9 text-center text-lg font-black text-black">
                            {customizingQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomizingQuantity((current) => current + 1)}
                            className="h-10 w-11 text-2xl font-bold text-black"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-black">
                            {formatPrice(customizingPricing.finalPrice * customizingQuantity)}
                          </p>
                          {customizingPricing.actualPrice > customizingPricing.finalPrice ? (
                            <p className="text-sm font-black text-red-600 line-through">
                              {formatPrice(customizingPricing.actualPrice * customizingQuantity)}
                            </p>
                          ) : null}
                          <p className="text-sm text-black">Price Before Tax</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={addingId === String(customizingProduct?._id)}
                        onClick={() => void addCustomizedFoodToCart()}
                        className="w-full rounded-full bg-[#f27a00] px-8 py-3.5 text-base font-black uppercase tracking-[0.04em] text-white transition hover:bg-[#da6d00] disabled:cursor-not-allowed disabled:bg-[#d7c1a9] sm:w-auto sm:min-w-[220px]"
                      >
                        {addingId === String(customizingProduct?._id) ? "Adding..." : "Add to cart"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {actionMessage ? (
              <p className="mt-6 rounded-2xl bg-[#fff7e4] px-4 py-3 text-sm font-semibold text-[#171717]">
                {actionMessage}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`${pageClass} template-page-shell template-category-detail-page py-16 lg:py-20`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`template-page-hero mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${heroShellClass}`}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Category
            </p>
            <h1 className="template-section-title text-3xl sm:text-4xl font-bold">
              {label}
            </h1>
          </div>
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search products..."
              className={`w-full rounded-lg pl-10 pr-4 py-2 template-focus-accent ${
                isStudio
                  ? "border border-slate-700 bg-slate-950 text-slate-100"
                  : isTrend
                    ? "border border-rose-200 bg-white"
                    : "border border-gray-300"
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {processedCategoryProducts.length > 0 ? (
          <div className={gridClass}>
            {processedCategoryProducts.map((product: any) => (
              <Link
                key={product._id}
                href={buildTemplateProductPath({
                  vendorId,
                  pathname: pathname || undefined,
                  productId: product._id,
                  productSlug: product.slug,
                })}
                className={`template-product-card group cursor-pointer ${cardClass}`}
              >
                <div
                  className={`relative mb-4 aspect-square overflow-hidden rounded-xl ${
                    isStudio ? "bg-slate-900" : isTrend ? "bg-rose-50" : "bg-gray-100"
                  }`}
                >
                  {product?.defaultImages?.[0]?.url ? (
                    <img
                      src={product.defaultImages[0].url}
                      alt={product.productName}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-1">
                  {product.productName || "Untitled Product"}
                </h3>
                <p
                  className={`${isStudio ? "text-slate-400" : isTrend ? "text-slate-600" : "text-gray-500"} text-sm mb-2 line-clamp-2`}
                >
                  {getRichTextPreview(product.shortDescription || "No description", 120)}
                </p>
                <p className="text-lg font-semibold">
                  ₹{product?.variants?.[0]?.finalPrice || product?.finalPrice || "--"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed p-12 text-center ${
              isStudio
                ? "border-slate-800 bg-slate-900/70 text-slate-400"
                : isTrend
                  ? "border-rose-200 bg-white text-slate-500"
                  : "border-gray-200 bg-gray-50 text-gray-500"
            }`}
          >
            No products found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
