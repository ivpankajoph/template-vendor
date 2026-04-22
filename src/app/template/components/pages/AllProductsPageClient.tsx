"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Star, Search, Filter, X, ChevronDown, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

import { trackAddToCart } from "@/lib/analytics-events";
import { toastError, toastSuccess } from "@/lib/toast";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { getTemplateAuth, templateApiFetch } from "@/app/template/components/templateAuth";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import {
  buildTemplateProductPath,
  buildTemplateScopedPath,
  getTemplateCityFromPath,
  getTemplateWebsiteFromPath,
} from "@/lib/template-route";
import { fetchTemplateProducts, type TemplateProductFacet } from "@/lib/template-products-api";
import { WhiteRoseProductCard } from "@/app/template/components/whiterose/WhiteRoseProductCard";
import { whiteRoseGetCategoryDetails } from "@/app/template/components/whiterose/whiterose-utils";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getImageUrl = (image: unknown) => {
  if (typeof image === "string") return image.trim();
  if (!image || typeof image !== "object") return "";
  const url = (image as { url?: unknown }).url;
  return typeof url === "string" ? url.trim() : "";
};

const normalizeCategoryLabel = (value: unknown) => {
  const text = normalizeText(value);
  if (!text || OBJECT_ID_REGEX.test(text)) return "";
  return text;
};

const getProductCategoryDetails = (
  product: any,
  categoryMap: Record<string, string>
) => {
  const categoryObject =
    typeof product?.productCategory === "string"
      ? undefined
      : product?.productCategory;

  const rawCategoryId =
    normalizeText(categoryObject?._id) ||
    normalizeText(
      typeof product?.productCategory === "string" ? product.productCategory : ""
    );

  const explicitLabel =
    normalizeCategoryLabel(product?.productCategoryName) ||
    normalizeCategoryLabel(categoryObject?.name) ||
    normalizeCategoryLabel(categoryObject?.title) ||
    normalizeCategoryLabel(categoryObject?.categoryName);

  const mappedLabel = rawCategoryId
    ? normalizeCategoryLabel(categoryMap[rawCategoryId])
    : "";

  const fallbackLabel = normalizeCategoryLabel(rawCategoryId);

  return {
    id: rawCategoryId,
    label: explicitLabel || mappedLabel || fallbackLabel,
  };
};

type ProductCategoryDetails = {
  id: string;
  label: string;
};

type NormalizedProduct = {
  product: any;
  category: ProductCategoryDetails;
};

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString()}`;
const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const getPrimaryVariant = (product: any) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find((variant: any) => variant?._id && variant?.isActive !== false) || variants[0] || null;
};

const getProductPricing = (product: any) => {
  const variant = getPrimaryVariant(product);
  const finalPrice = toNumber(variant?.finalPrice);
  const actualPrice = toNumber(variant?.actualPrice);
  let discountPercent = toNumber(variant?.discountPercent);

  if (!discountPercent && actualPrice > finalPrice && actualPrice > 0) {
    discountPercent = Math.round(((actualPrice - finalPrice) / actualPrice) * 100);
  }

  return {
    variantId: variant?._id || "",
    finalPrice,
    actualPrice,
    discountPercent,
    stockQuantity: toNumber(variant?.stockQuantity),
  };
};

const getProductImageUrl = (product: any) => {
  const defaultImages = Array.isArray(product?.defaultImages)
    ? product.defaultImages
    : [];
  const defaultImage = defaultImages
    .map((image: unknown) => getImageUrl(image))
    .find((url: string) => Boolean(url));
  if (defaultImage) return defaultImage;

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  for (const variant of variants) {
    const variantImage = (Array.isArray(variant?.variantsImageUrls)
      ? variant.variantsImageUrls
      : []
    )
      .map((image: unknown) => getImageUrl(image))
      .find((url: string) => Boolean(url));
    if (variantImage) return variantImage;
  }
  return "";
};

type FoodMenuVariant = {
  _id?: string;
  name?: string;
  price?: number;
  offer_price?: number;
  is_default?: boolean;
  is_available?: boolean;
};

type FoodMenuAddon = {
  name?: string;
  price?: number;
  is_free?: boolean;
};

type FoodMenuItem = {
  _id: string;
  item_name?: string;
  category?: string;
  image_url?: string;
  gallery_images?: string[];
  description?: string;
  food_type?: string;
  is_available?: boolean;
  price?: number;
  offer_price?: number;
  prep_time_minutes?: number;
  addons?: FoodMenuAddon[];
  variants?: FoodMenuVariant[];
};

type FoodOffer = {
  _id?: string;
  offer_title?: string;
  offer_type?: string;
  discount_percent?: number;
  flat_discount?: number;
  combo_price?: number;
  free_item_name?: string;
  min_cart_value?: number;
  max_discount?: number;
  coupon_code?: string;
  is_active?: boolean;
};

const getFoodMenuImageUrl = (item: FoodMenuItem) => {
  const primary = normalizeText(item?.image_url);
  if (primary) return primary;
  const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : [];
  return gallery.map((image) => normalizeText(image)).find(Boolean) || "";
};

const getFoodPrimaryVariant = (item: FoodMenuItem) => {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  return (
    variants.find((variant) => variant?.is_available && variant?.is_default) ||
    variants.find((variant) => variant?.is_available) ||
    variants.find((variant) => variant?.is_default) ||
    variants[0] ||
    null
  );
};

const getFoodPricing = (item: FoodMenuItem) => {
  const variant = getFoodPrimaryVariant(item);
  const actualPrice = toNumber(variant?.price ?? item?.price);
  const finalPrice = toNumber(
    variant?.offer_price ?? item?.offer_price ?? variant?.price ?? item?.price
  );
  let discountPercent = 0;

  if (actualPrice > finalPrice && actualPrice > 0) {
    discountPercent = Math.round(((actualPrice - finalPrice) / actualPrice) * 100);
  }

  return {
    actualPrice,
    finalPrice,
    discountPercent,
    variantName: normalizeText(variant?.name),
  };
};

const getFoodOfferValueLabel = (offer?: FoodOffer | null) => {
  if (!offer) return "Live offer";
  if (toNumber(offer.discount_percent) > 0) return `${toNumber(offer.discount_percent)}% OFF`;
  if (toNumber(offer.flat_discount) > 0) return `Save ${formatPrice(offer.flat_discount)}`;
  if (toNumber(offer.combo_price) > 0) return `Combo ${formatPrice(offer.combo_price)}`;
  if (offer.free_item_name) return `${offer.free_item_name} free`;
  if (offer.coupon_code) return `Use ${offer.coupon_code}`;
  return "Live offer";
};

const getFoodOfferFinePrint = (offer?: FoodOffer | null) => {
  if (!offer) return "Available for a limited time.";
  const parts = [
    offer.coupon_code ? `Coupon ${offer.coupon_code}` : "",
    toNumber(offer.min_cart_value) > 0 ? `Min order ${formatPrice(offer.min_cart_value)}` : "",
    toNumber(offer.max_discount) > 0 ? `Max discount ${formatPrice(offer.max_discount)}` : "",
  ].filter(Boolean);
  return parts.join(" • ") || "Available on eligible food orders.";
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

export default function AllProducts() {
  const variant = useTemplateVariant();
  const initialProducts = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const templateData = useSelector((state: any) => state?.alltemplatepage?.data);
  const isPocoFood = variant.key === "pocofood";
  const templateCitySlug = String(
    templateData?.components?.vendor_profile?.default_city_slug || ""
  ).trim();
  const params = useParams();
  const pathname = usePathname();
  const vendor_id = params.vendor_id as string;
  const vendorId = String(vendor_id || "");
  const routeCitySlug = getTemplateCityFromPath(pathname || "/", vendorId);
  const routeWebsiteId = getTemplateWebsiteFromPath(pathname || "/", vendorId);
  const toTemplatePath = (suffix = "") =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || "/",
      suffix,
    });
  const allProductsPath = buildTemplateScopedPath({
    vendorId,
    pathname: pathname || "/",
    suffix: "all-products",
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [foodMenuItems, setFoodMenuItems] = useState<FoodMenuItem[]>([]);
  const [foodOffers, setFoodOffers] = useState<FoodOffer[]>([]);
  const [addingById, setAddingById] = useState<Record<string, boolean>>({});
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [productFacets, setProductFacets] = useState<{
    categories: TemplateProductFacet[];
    brands: TemplateProductFacet[];
  }>({ categories: [], brands: [] });
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState("");
  const [hasLoadedProductQuery, setHasLoadedProductQuery] = useState(false);
  
  // New Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [minRating, setMinRating] = useState<number>(0);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const products = hasLoadedProductQuery ? apiProducts : initialProducts;

  // Sync state with URL params
  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");
    const discount = searchParams.get("discount");
    const brandsParam = searchParams.get("brands");
    const sort = searchParams.get("sort");

    if (search !== null) setSearchTerm(search);
    if (category !== null) setSelectedCategory(category);
    if (minPrice !== null || maxPrice !== null) {
      setPriceRange({
        min: minPrice !== null ? toNumber(minPrice) : 0,
        max: maxPrice !== null ? toNumber(maxPrice) : 100000,
      });
    }
    if (rating !== null) setMinRating(toNumber(rating));
    if (discount !== null) setMinDiscount(toNumber(discount));
    if (sort !== null) setSortBy(sort || "newest");
    if (brandsParam !== null) {
      setSelectedBrands(brandsParam.split(",").filter(Boolean));
    }
  }, [searchParams]);

  // Update URL when filters change (optional but good for syncing)
  // For now, let listeners from Navbar drive the navigation, 
  // and we just read them. 
  // But updating the URL makes it shareable.
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!vendorId || isPocoFood) {
      setApiProducts([]);
      setHasLoadedProductQuery(false);
      return;
    }

    let cancelled = false;
    setProductLoading(true);
    setProductError("");

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchTemplateProducts({
          vendorId,
          websiteId: routeWebsiteId,
          city: routeCitySlug || "all",
          search: searchTerm,
          category: selectedCategory,
          brands: selectedBrands,
          minPrice: priceRange.min,
          maxPrice: priceRange.max,
          rating: minRating,
          discount: minDiscount,
          sort: sortBy,
          page: 1,
          limit: 60,
        });

        if (cancelled) return;
        setApiProducts(response.products);
        setProductFacets({
          categories: response.facets?.categories || [],
          brands: response.facets?.brands || [],
        });
        setHasLoadedProductQuery(true);
      } catch (error: any) {
        if (cancelled) return;
        setApiProducts([]);
        setProductError(error?.message || "Failed to load products");
        setHasLoadedProductQuery(true);
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isPocoFood,
    minDiscount,
    minRating,
    priceRange.max,
    priceRange.min,
    routeCitySlug,
    routeWebsiteId,
    searchTerm,
    selectedBrands,
    selectedCategory,
    sortBy,
    vendorId,
  ]);



  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const res = await axios.get(`${NEXT_PUBLIC_API_URL}/categories/getall`);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const map = list.reduce((acc: Record<string, string>, item: any) => {
          const id = normalizeText(item?._id);
          const name = normalizeCategoryLabel(
            item?.name || item?.title || item?.categoryName
          );
          if (id && name) acc[id] = name;
          return acc;
        }, {});
        if (mounted) setCategoryMap(map);
      } catch {
        if (mounted) setCategoryMap({});
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadFoodStorefront = async () => {
      if (!isPocoFood || !vendorId) {
        if (mounted) {
          setFoodMenuItems([]);
          setFoodOffers([]);
        }
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/vendors/${vendorId}/food-storefront`, {
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);
        const items = Array.isArray(result?.data?.menu_items)
          ? result.data.menu_items.filter((item: FoodMenuItem) => Boolean(item?._id))
          : [];
        const offers = Array.isArray(result?.data?.offers)
          ? result.data.offers.filter((offer: FoodOffer) => offer?.is_active !== false)
          : [];
        if (mounted) {
          setFoodMenuItems(items);
          setFoodOffers(offers);
        }
      } catch {
        if (mounted) {
          setFoodMenuItems([]);
          setFoodOffers([]);
        }
      }
    };

    loadFoodStorefront();
    return () => {
      mounted = false;
    };
  }, [isPocoFood, vendorId]);

  const normalizedProducts = useMemo<NormalizedProduct[]>(
    () =>
      products.map((product: any) => ({
        product,
        category: getProductCategoryDetails(product, categoryMap),
      })),
    [products, categoryMap]
  );

  const categories = useMemo(() => {
    if (isPocoFood) {
      const list = new Set<string>();
      foodMenuItems.forEach((item) => {
        const label = normalizeCategoryLabel(item?.category);
        if (label) list.add(label);
      });
      return ["All", ...Array.from(list).sort((a, b) => a.localeCompare(b))];
    }
    const list = new Set<string>();
    productFacets.categories.forEach((category) => {
      const label = normalizeCategoryLabel(category.label);
      if (label) list.add(label);
    });
    initialProducts.forEach((product: any) => {
      const category = getProductCategoryDetails(product, categoryMap);
      if (category.label) list.add(category.label);
    });
    normalizedProducts.forEach(({ category }) => {
      if (category.label) list.add(category.label);
    });
    return ["All", ...Array.from(list).sort((a, b) => a.localeCompare(b))];
  }, [categoryMap, foodMenuItems, initialProducts, isPocoFood, normalizedProducts, productFacets.categories]);

  const brands = useMemo(() => {
    const list = new Set<string>();
    productFacets.brands.forEach((brand) => {
      const label = normalizeText(brand.label);
      if (label) list.add(label);
    });
    initialProducts.forEach((product: any) => {
      if (product.brand) list.add(product.brand);
    });
    normalizedProducts.forEach(({ product }) => {
      if (product.brand) list.add(product.brand);
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [initialProducts, normalizedProducts, productFacets.brands]);


  const isStudio = variant.key === "studio";
  const isWhiteRose = variant.key === "whiterose";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isMquiq = variant.key === "mquiq";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-[#f8f7f4] font-sans text-slate-950"
        : "min-h-screen bg-slate-50";

  const searchClass = isStudio
    ? "border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400"
    : isTrend
      ? "border border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm"
    : isMinimal
      ? "border border-slate-300 bg-white"
      : "border border-slate-300 bg-white";

  const chipActiveClass = isStudio
    ? "bg-sky-500 text-slate-950"
    : isTrend
      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
    : "bg-indigo-600 text-white";

  const chipInactiveClass = isStudio
    ? "bg-slate-900 text-slate-200 hover:bg-slate-800"
    : isTrend
      ? "bg-white text-slate-700 hover:bg-rose-50 border border-rose-100"
    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200";

  const cardClass = isStudio
    ? "bg-slate-900 border border-slate-800 hover:border-sky-400/40 rounded-md"
    : isTrend
      ? "overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-emerald-300"
    : isMquiq
      ? "bg-white border border-slate-200 hover:border-indigo-300 rounded-[1.35rem]"
    : isMinimal
      ? "bg-white border border-slate-200 hover:border-slate-300 rounded-xl"
      : "bg-white border border-slate-200 hover:border-indigo-200 rounded-3xl";

  const subtleTextClass = isStudio ? "text-slate-300" : isTrend ? "text-slate-600" : "text-slate-500";
  const titleTextClass = isStudio ? "text-slate-100" : "text-slate-900";
  const heroClass = isStudio
    ? "mb-7 rounded-md border border-slate-800 bg-slate-900/80 p-6"
    : isTrend
      ? "mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      : isMinimal
        ? "mb-8 rounded-2xl border border-slate-200 bg-white p-7"
        : "mb-7 rounded-3xl border border-slate-200 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-6";
  const heroTitleClass = isStudio ? "text-slate-100" : "text-slate-900";
  const heroSubtextClass = isStudio ? "text-slate-300" : isTrend ? "text-slate-700" : "text-slate-600";
  const gridClass = isStudio
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
    : isTrend
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      : isMquiq
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center"
      : isMinimal
        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7"
        : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6";

  const handleAddToCart = async (product: any) => {
    if (!vendor_id || !product?._id) return;

    const auth = getTemplateAuth(vendor_id);
    if (!auth) {
      const loginPath = buildTemplateScopedPath({
        vendorId,
        pathname: pathname || "/",
        suffix: "login",
      });
      window.location.href = `${loginPath}?next=${encodeURIComponent(allProductsPath)}`;
      return;
    }

    const pricing = getProductPricing(product);
    if (!pricing.variantId) {
      toastError("Variant not available for this product");
      return;
    }

    if (pricing.stockQuantity <= 0) {
      toastError("This product is out of stock");
      return;
    }

    setAddingById((prev) => ({ ...prev, [product._id]: true }));
    try {
      await templateApiFetch(vendor_id, "/cart", {
        method: "POST",
        body: JSON.stringify({
          product_id: product._id,
          variant_id: pricing.variantId,
          quantity: 1,
        }),
      });

      trackAddToCart({
        vendorId: vendor_id,
        userId: auth?.user?.id,
        productId: product._id,
        productName: product?.productName,
        productPrice: pricing.finalPrice,
        quantity: 1,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("template-cart-updated"));
      }
      toastSuccess("Added to cart");
    } catch (error: any) {
      toastError(error?.message || "Failed to add to cart");
    } finally {
      setAddingById((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  const handleAddFoodToCart = async (item: FoodMenuItem) => {
    if (!vendor_id || !item?._id) return;

    const auth = getTemplateAuth(vendor_id);
    if (!auth) {
      const loginPath = buildTemplateScopedPath({
        vendorId,
        pathname: pathname || "/",
        suffix: "login",
      });
      window.location.href = `${loginPath}?next=${encodeURIComponent(allProductsPath)}`;
      return;
    }

    if (item?.is_available === false) {
      toastError("This food item is currently unavailable");
      return;
    }

    const primaryVariant = getFoodPrimaryVariant(item);
    const selectedAddons = Array.isArray(item?.addons)
      ? item.addons
          .filter((addon) => normalizeText(addon?.name))
          .filter((addon) => addon?.is_free)
          .map((addon) => ({
            name: normalizeText(addon?.name),
            price: toNumber(addon?.price),
            is_free: Boolean(addon?.is_free),
          }))
      : [];

    setAddingById((prev) => ({ ...prev, [item._id]: true }));
    try {
      const pricing = getFoodPricing(item);
      await templateApiFetch(vendor_id, "/cart", {
        method: "POST",
        body: JSON.stringify({
          item_type: "food",
          food_menu_item_id: item._id,
          quantity: 1,
          variant_name: normalizeText(primaryVariant?.name) || undefined,
          selected_addons: selectedAddons,
        }),
      });

      trackAddToCart({
        vendorId: vendor_id,
        userId: auth?.user?.id,
        productId: item._id,
        productName: item?.item_name,
        productPrice: pricing.finalPrice,
        quantity: 1,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("template-cart-updated"));
      }

      toastSuccess("Food item added to cart");
    } catch (error: any) {
      toastError(error?.message || "Failed to add food item to cart");
    } finally {
      setAddingById((prev) => ({ ...prev, [item._id]: false }));
    }
  };

  const filteredProducts = normalizedProducts.filter(({ product, category }) => {
    const name = normalizeText(product?.productName).toLowerCase();
    const brand = normalizeText(product?.brand).toLowerCase();
    const categoryLabel = category.label.toLowerCase();
    const description = normalizeText(product?.description).toLowerCase();
    const shortDescription = normalizeText(product?.shortDescription).toLowerCase();
    const sku = normalizeText(product?.baseSku).toLowerCase();
    const term = searchTerm.toLowerCase();
    const pricing = getProductPricing(product);

    const matchesSearch =
      !term ||
      name.includes(term) ||
      brand.includes(term) ||
      categoryLabel.includes(term) ||
      description.includes(term) ||
      shortDescription.includes(term) ||
      sku.includes(term);
    const matchesCategory =
      selectedCategory === "All" || category.label === selectedCategory;
    
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchesPrice = pricing.finalPrice >= priceRange.min && pricing.finalPrice <= priceRange.max;
    const matchesRating = (product.rating || 4.2) >= minRating;
    const matchesDiscount = pricing.discountPercent >= minDiscount;

    return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesRating && matchesDiscount;
  });

  const singleProductLayout = filteredProducts.length === 1;
  const productsLayoutClass = singleProductLayout
    ? "mx-auto flex w-full justify-center"
    : gridClass;
  const visibleProductCount = filteredProducts.length;
  const visibleProductWord = visibleProductCount === 1 ? "product" : "products";
  const filteredFoodItems = foodMenuItems.filter((item) => {
    const name = normalizeText(item?.item_name).toLowerCase();
    const category = normalizeCategoryLabel(item?.category).toLowerCase();
    const description = normalizeText(item?.description).toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !term || name.includes(term) || category.includes(term) || description.includes(term);
    const matchesCategory =
      selectedCategory === "All" ||
      normalizeCategoryLabel(item?.category) === selectedCategory;

    return matchesSearch && matchesCategory;
  });
  const visibleFoodCount = filteredFoodItems.length;
  const visibleFoodWord = visibleFoodCount === 1 ? "item" : "items";
  const featuredFoodOffer = foodOffers[0] || null;

  if (isPocoFood) {
    return (
      <div className="min-h-screen bg-[#fcf8f1] py-10 text-[#1f1720] lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 rounded-[2rem] border border-[#eadfce] bg-gradient-to-r from-[#fff6e7] via-white to-[#fff0f0] p-6 shadow-[0_18px_40px_rgba(83,45,27,0.07)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#b46a2d]">
                  PocoFood Menu
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                  All food items
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6a5a51]">
                  Yahan sirf aapke Food Hub ke menu items show honge. Ecommerce products is page par nahi aayenge.
                </p>
              </div>

              <div className="rounded-2xl border border-[#eadfce] bg-white px-5 py-4 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9f8471]">
                  Live Menu
                </p>
                <p className="mt-1 text-3xl font-bold text-[#1f1720]">{visibleFoodCount}</p>
                <p className="text-xs text-[#8d786a]">{visibleFoodWord} found</p>
              </div>
            </div>
          </div>

          {foodOffers.length ? (
            <div className="mb-8 rounded-[1.75rem] border border-[#eadfce] bg-[#1f1720] p-5 text-white shadow-[0_18px_40px_rgba(83,45,27,0.14)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffc222]">
                    Active offers
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                    {featuredFoodOffer?.offer_title || "Food offers are live"}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {getFoodOfferFinePrint(featuredFoodOffer)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
                  {foodOffers.slice(0, 2).map((offer, index) => (
                    <div
                      key={offer?._id || `${offer?.offer_title || "offer"}-${index}`}
                      className="rounded-[1.2rem] border border-white/10 bg-white/10 p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                        {String(offer?.offer_type || "offer").replace(/_/g, " ")}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[#ffc222]">
                        {getFoodOfferValueLabel(offer)}
                      </p>
                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">
                        {offer?.offer_title || "Live food deal"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-8 flex flex-col gap-4 rounded-[1.75rem] border border-[#eadfce] bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <input
                type="text"
                placeholder="Search food items, categories, dishes..."
                className="w-full rounded-2xl border border-[#e7d7c4] bg-[#fffdf9] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#c97b38]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3.5 top-3.5 text-[#ad8c72]" size={18} />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === cat
                      ? "bg-[#1f1720] text-white"
                      : "border border-[#e7d7c4] bg-[#fffaf3] text-[#5d4c40] hover:border-[#c97b38] hover:text-[#c97b38]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredFoodItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredFoodItems.map((item) => {
                const pricing = getFoodPricing(item);
                const imageUrl = getFoodMenuImageUrl(item);
                const isAdding = Boolean(addingById[item._id]);
                const primaryVariant = getFoodPrimaryVariant(item);
                const foodProductPath = buildTemplateScopedPath({
                  vendorId,
                  pathname: pathname || "/",
                  suffix: `product/${item._id}`,
                });
                return (
                  <div
                    key={item._id}
                    className="overflow-hidden rounded-[1.75rem] border border-[#eadfce] bg-white shadow-[0_18px_40px_rgba(83,45,27,0.06)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(83,45,27,0.1)]"
                  >
                    <Link href={foodProductPath} className="relative block h-64 overflow-hidden bg-[#fff8ef] p-4">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item?.item_name || "Food item"}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-[#b39a87]">
                          No Image
                        </div>
                      )}

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#5d4c40] shadow-sm">
                          {normalizeCategoryLabel(item?.category) || "Menu"}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#5d4c40] shadow-sm">
                          <FoodTypeMark type={item?.food_type} />
                          {item?.food_type === "non_veg" ? "Non veg" : "Veg"}
                        </span>
                      </div>

                      {pricing.discountPercent > 0 ? (
                        <span className="absolute right-4 top-4 rounded-full bg-[#c97b38] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          {pricing.discountPercent}% OFF
                        </span>
                      ) : featuredFoodOffer ? (
                        <span className="absolute right-4 top-4 rounded-full bg-[#1f1720] px-3 py-1 text-xs font-semibold text-[#ffc222] shadow-sm">
                          Offer available
                        </span>
                      ) : null}
                    </Link>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={foodProductPath} className="block">
                            <h3 className="text-xl font-semibold text-[#1f1720]">
                              {item?.item_name || "Untitled food item"}
                            </h3>
                          </Link>
                          <p className="mt-1 text-sm text-[#7f6c5f]">
                            {primaryVariant?.name
                              ? `Variant: ${primaryVariant.name}`
                              : "Standard serving"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item?.is_available === false
                              ? "bg-slate-100 text-slate-500"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {item?.is_available === false ? "Unavailable" : "Available"}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6a5a51]">
                        {normalizeText(item?.description) || "Freshly prepared food item from your menu."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#8f7869]">
                        <span className="rounded-full bg-[#f8efe3] px-3 py-1">
                          Prep: {toNumber(item?.prep_time_minutes) || 15} mins
                        </span>
                        <span className="rounded-full bg-[#f8efe3] px-3 py-1">
                          Addons: {Array.isArray(item?.addons) ? item.addons.length : 0}
                        </span>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div className="flex items-end gap-2">
                          <p className="text-2xl font-bold text-[#1f1720]">
                            {formatPrice(pricing.finalPrice)}
                          </p>
                          {pricing.actualPrice > pricing.finalPrice ? (
                            <p className="pb-0.5 text-sm text-[#a28d7d] line-through">
                              {formatPrice(pricing.actualPrice)}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          disabled={isAdding || item?.is_available === false}
                          onClick={() => handleAddFoodToCart(item)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f1720] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a2932] disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <ShoppingBag size={15} />
                          {isAdding ? "Adding..." : "Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[#e2cfb6] bg-white px-6 py-16 text-center">
              <h3 className="text-xl font-semibold text-[#1f1720]">No food items found</h3>
              <p className="mt-2 text-sm text-[#7f6c5f]">
                Food Hub me menu items add karo, phir yahan sirf wahi items show honge.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isWhiteRose) {
    return (
      <div className="template-page-shell min-h-screen bg-[#f1f3f6] py-8 text-[#172337] lg:py-10">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8">
          <div className="rounded-[28px] border border-[#dfe3eb] bg-gradient-to-r from-[#e7f0ff] via-white to-[#fff3d1] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.07)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2874f0]">
                  Full catalog
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-[#172337] sm:text-5xl">
                  Marketplace product listing
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f6c7b] sm:text-base">
                  Explore {visibleProductCount} {visibleProductWord} and use the existing backend cart flow inside the new whiterose storefront.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#5f6c7b]">
                    Live products
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#172337]">{visibleProductCount}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#5f6c7b]">
                    Departments
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#172337]">{Math.max(categories.length - 1, 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#dfe3eb] bg-white p-5 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-lg">
                <input
                  type="text"
                  placeholder="Search products, categories, and offers"
                  className="w-full rounded-2xl border border-[#dfe3eb] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-[#172337] outline-none transition focus:border-[#2874f0]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3.5 top-3.5 text-[#7a8797]" size={18} />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedCategory === cat
                        ? "bg-[#2874f0] text-white"
                        : "border border-[#dfe3eb] bg-[#f8fafc] text-[#172337] hover:border-[#2874f0] hover:text-[#2874f0]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map(({ product, category }, index) => (
                <WhiteRoseProductCard
                  key={product._id || `product-${index}`}
                  product={product}
                  href={buildTemplateProductPath({
                    vendorId,
                    pathname: pathname || undefined,
                    productId: product._id,
                    productSlug: product.slug,
                    citySlug: templateCitySlug,
                  })}
                  categoryLabel={category.label || whiteRoseGetCategoryDetails(product, categoryMap).label || "Top category"}
                  badgeLabel={index < 2 ? "Featured deal" : undefined}
                  onAddToCart={() => handleAddToCart(product)}
                  isAdding={Boolean(addingById[product._id])}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#d6deed] bg-white p-12 text-center text-sm text-[#5f6c7b]">
              No products found matching your filters.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${pageClass} template-page-shell template-products-page py-10 lg:py-14`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`${heroClass} template-page-hero`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Product catalog
              </p>
              <h2 className={`mt-2 text-3xl font-semibold tracking-normal lg:text-4xl ${heroTitleClass}`}>
                All Products
              </h2>
              <p className={`mt-2 text-sm leading-6 ${heroSubtextClass}`}>
                Explore {visibleProductCount} {visibleProductWord} with live search, filters, ratings, and price sorting.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {productLoading ? "Updating catalog..." : `${visibleProductCount} visible`}
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        {isTrend && (
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            >
              <Filter size={16} /> Filters
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{visibleProductCount} Items</span>
          </div>
        )}

        <div className={`flex flex-col lg:flex-row gap-8`}>
          {/* Sidebar Filter for Oragze */}
          {isTrend && (
            <>
              {/* Overlay for mobile */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 z-[100] bg-black/50 lg:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}
              <aside className={`fixed inset-y-0 left-0 z-[101] w-80 transform bg-white p-5 transition-transform duration-300 lg:static lg:block lg:w-64 lg:translate-x-0 lg:bg-transparent lg:p-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="text-lg font-bold">Filters</h3>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="sticky top-24 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {/* Category Filter */}
                  <div className="border-b border-slate-200 pb-6">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categories</h4>
                    <div className="space-y-2.5">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors ${selectedCategory === cat ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700'}`}
                        >
                          <span>{cat}</span>
                          {selectedCategory === cat && <ChevronRight size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="border-b border-slate-200 pb-6">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer Ratings</h4>
                    <div className="space-y-3">
                      {[4, 3, 2, 1].map((star) => (
                        <label key={star} className="flex cursor-pointer items-center gap-3 group">
                          <input 
                            type="radio" 
                            name="rating" 
                            className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                            checked={minRating === star}
                            onChange={() => setMinRating(star)}
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-slate-700">{star} star & above</span>
                          </div>
                        </label>
                      ))}
                      <button 
                         onClick={() => setMinRating(0)}
                         className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 hover:text-emerald-800"
                      >
                        Reset Rating
                      </button>
                    </div>
                  </div>

                  {/* Brand Filter */}
                  {brands.length > 0 && (
                    <div className="border-b border-slate-200 pb-6">
                      <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Brand</h4>
                      <div className="max-h-48 space-y-2.5 overflow-y-auto pr-2 no-scrollbar">
                        {brands.map((brand) => (
                          <label key={brand} className="flex cursor-pointer items-center gap-3">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                              checked={selectedBrands.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                                else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                              }}
                            />
                            <span className="text-sm font-semibold text-slate-700">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Filter */}
                  <div className="border-b border-slate-200 pb-6">
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Price Range</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">Min</span>
                          <input 
                            type="number" 
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: toNumber(e.target.value) })}
                            className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">Max</span>
                          <input 
                            type="number" 
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: toNumber(e.target.value) })}
                            className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discount Filter */}
                  <div>
                    <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Discount</h4>
                    <div className="space-y-2.5">
                      {[50, 40, 30, 20, 10].map((disc) => (
                        <label key={disc} className="flex cursor-pointer items-center gap-3">
                          <input 
                            type="radio" 
                            name="discount" 
                            className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                            checked={minDiscount === disc}
                            onChange={() => setMinDiscount(disc)}
                          />
                          <span className="text-sm font-semibold text-slate-700">{disc}% and above</span>
                        </label>
                      ))}
                      <button 
                         onClick={() => setMinDiscount(0)}
                         className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 hover:text-emerald-800"
                      >
                        Reset Discount
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          )}

          <div className="flex-1">
            <div
              className={`mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-center ${
                singleProductLayout ? "lg:justify-center" : "lg:justify-between"
              }`}
            >
              <div className={`relative w-full ${singleProductLayout ? "lg:max-w-md" : "lg:w-1/2"}`}>
                <input
                  type="text"
                  placeholder="Search products, categories, or brand"
                  className={`w-full rounded-xl py-3 pl-11 pr-4 text-sm outline-none template-focus-accent ${searchClass}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
              </div>

              {isTrend ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                    <option value="rating">Top rated</option>
                    <option value="discount">Best discount</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All");
                      setSelectedBrands([]);
                      setPriceRange({ min: 0, max: 100000 });
                      setMinRating(0);
                      setMinDiscount(0);
                      setSortBy("newest");
                    }}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              {!isTrend && (
                <div className={`flex flex-wrap gap-2 ${singleProductLayout ? "lg:justify-center" : ""}`}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        selectedCategory === cat
                          ? chipActiveClass
                          : chipInactiveClass
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {productError ? (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {productError}
              </div>
            ) : null}

            {filteredProducts.length > 0 ? (
              <div className={`${productsLayoutClass} ${productLoading ? "opacity-60" : ""}`}>
                {filteredProducts.map(({ product, category }) => {
                  const pricing = getProductPricing(product);
                  const rating = Math.max(0, Math.min(5, toNumber(product?.rating || 4.2)));
                  const isAdding = Boolean(addingById[product._id]);
                  const productImageUrl = getProductImageUrl(product);
                  const cardWidthClass = singleProductLayout
                    ? "max-w-xs sm:max-w-sm"
                    : isMquiq
                      ? "max-w-sm"
                      : "";
                  const imageHeightClass = singleProductLayout
                    ? "h-44 sm:h-48"
                    : isMquiq
                      ? "h-56 sm:h-60"
                      : isTrend
                        ? "h-52 sm:h-56"
                        : "h-64 sm:h-72";

                  return (
                    <div
                      key={product._id}
                      className={`template-product-card group w-full ${cardWidthClass} shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${cardClass}`}
                    >
                      <Link
                        href={buildTemplateProductPath({
                          vendorId,
                          pathname: pathname || "/",
                          productId: product._id,
                          productSlug: product.slug,
                          citySlug: templateCitySlug,
                        })}
                        className="block"
                      >
                        <div className="relative overflow-hidden border-b border-slate-100 bg-slate-50">
                          <div className={imageHeightClass}>
                            {productImageUrl ? (
                              <img
                                src={productImageUrl}
                                alt={product.productName || "Product image"}
                                className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                                No Image
                              </div>
                            )}
                          </div>

                          {pricing.discountPercent > 0 ? (
                            <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                              {pricing.discountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </Link>

                      <div className="p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            <Star size={12} className="fill-current" />
                            {rating.toFixed(1)}
                          </div>
                          <span className={`text-xs ${subtleTextClass}`}>
                            {pricing.stockQuantity > 0 ? `${pricing.stockQuantity} in stock` : "Out of stock"}
                          </span>
                        </div>

                        <Link
                          href={buildTemplateProductPath({
                            vendorId,
                            pathname: pathname || "/",
                            productId: product._id,
                            productSlug: product.slug,
                            citySlug: templateCitySlug,
                          })}
                          className="block"
                        >
                          <h3 className={`line-clamp-2 text-base font-semibold ${titleTextClass}`}>
                            {product?.productName || "Untitled Product"}
                          </h3>
                        </Link>

                        <p className={`mt-1 text-sm ${subtleTextClass}`}>
                          {category.label || "Category"}
                        </p>

                        <div className="mt-3 flex items-end gap-2">
                          <p className={`text-lg font-bold ${titleTextClass}`}>{formatPrice(pricing.finalPrice)}</p>
                          {pricing.actualPrice > pricing.finalPrice ? (
                            <p className="text-sm text-slate-400 line-through">
                              {formatPrice(pricing.actualPrice)}
                            </p>
                          ) : null}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isAdding || pricing.stockQuantity <= 0}
                            onClick={() => handleAddToCart(product)}
                            className={`template-primary-button inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 ${
                              isTrend
                                ? "bg-emerald-700 hover:bg-emerald-800"
                                : "bg-slate-900 hover:bg-slate-800"
                            }`}
                          >
                            <ShoppingBag size={15} />
                            {isAdding ? "Adding..." : "Add to Cart"}
                          </button>

                          <Link
                            href={buildTemplateProductPath({
                              vendorId,
                              pathname: pathname || "/",
                              productId: product._id,
                              productSlug: product.slug,
                              citySlug: templateCitySlug,
                            })}
                            className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition ${
                              isStudio
                                ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                                : isTrend
                                  ? "border-slate-200 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                : "border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className={`mt-10 rounded-xl border border-dashed p-10 text-center ${
                  isStudio
                    ? "border-slate-700 bg-slate-900"
                    : isTrend
                      ? "border-slate-200 bg-white"
                      : "border-slate-300 bg-white"
                }`}
              >
                <p className={subtleTextClass}>No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
