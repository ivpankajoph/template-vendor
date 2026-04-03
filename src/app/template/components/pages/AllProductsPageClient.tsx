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
import { buildTemplateProductPath, buildTemplateScopedPath } from "@/lib/template-route";
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

export default function AllProducts() {
  const variant = useTemplateVariant();
  const products = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const templateData = useSelector((state: any) => state?.alltemplatepage?.data);
  const templateCitySlug = String(
    templateData?.components?.vendor_profile?.default_city_slug || ""
  ).trim();
  const params = useParams();
  const pathname = usePathname();
  const vendor_id = params.vendor_id as string;
  const vendorId = String(vendor_id || "");
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
  const [addingById, setAddingById] = useState<Record<string, boolean>>({});
  
  // New Filter states
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [minRating, setMinRating] = useState<number>(0);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync state with URL params
  useEffect(() => {
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const rating = searchParams.get("rating");
    const discount = searchParams.get("discount");
    const brandsParam = searchParams.get("brands");

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

  const normalizedProducts = useMemo<NormalizedProduct[]>(
    () =>
      products.map((product: any) => ({
        product,
        category: getProductCategoryDetails(product, categoryMap),
      })),
    [products, categoryMap]
  );

  const categories = useMemo(() => {
    const list = new Set<string>();
    normalizedProducts.forEach(({ category }) => {
      if (category.label) list.add(category.label);
    });
    return ["All", ...Array.from(list).sort((a, b) => a.localeCompare(b))];
  }, [normalizedProducts]);

  const brands = useMemo(() => {
    const list = new Set<string>();
    normalizedProducts.forEach(({ product }) => {
      if (product.brand) list.add(product.brand);
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [normalizedProducts]);


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
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-slate-50";

  const searchClass = isStudio
    ? "border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-400"
    : isTrend
      ? "border border-rose-200 bg-white"
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
      ? "bg-white border border-rose-100 hover:border-rose-300 rounded-[1.7rem]"
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
      ? "mb-7 rounded-[2rem] border border-rose-200 bg-gradient-to-r from-rose-100 via-white to-pink-100 p-6"
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

  const filteredProducts = normalizedProducts.filter(({ product, category }) => {
    const name = normalizeText(product?.productName).toLowerCase();
    const categoryLabel = category.label.toLowerCase();
    const term = searchTerm.toLowerCase();
    const pricing = getProductPricing(product);

    const matchesSearch = name.includes(term) || categoryLabel.includes(term);
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
          <h2 className={`template-section-title text-3xl lg:text-4xl font-bold text-left ${heroTitleClass}`}>All Products</h2>
          <p className={`mt-2 text-sm ${heroSubtextClass}`}>
            Explore {visibleProductCount} {visibleProductWord} and add items to cart directly from this page.
          </p>
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
              <aside className={`fixed inset-y-0 left-0 z-[101] w-72 transform bg-white p-6 transition-transform duration-300 lg:static lg:block lg:w-64 lg:translate-x-0 lg:bg-transparent lg:p-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <h3 className="text-lg font-bold">Filters</h3>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8 sticky top-24">
                  {/* Category Filter */}
                  <div className="border-b border-slate-200 pb-6">
                    <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Categories</h4>
                    <div className="space-y-2.5">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex w-full items-center justify-between text-[14px] font-bold transition-colors ${selectedCategory === cat ? 'text-pink-600' : 'text-slate-600 hover:text-pink-500'}`}
                        >
                          <span>{cat}</span>
                          {selectedCategory === cat && <ChevronRight size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div className="border-b border-slate-200 pb-6">
                    <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Customer Ratings</h4>
                    <div className="space-y-3">
                      {[4, 3, 2, 1].map((star) => (
                        <label key={star} className="flex cursor-pointer items-center gap-3 group">
                          <input 
                            type="radio" 
                            name="rating" 
                            className="h-4 w-4 border-slate-300 text-pink-600 focus:ring-pink-500" 
                            checked={minRating === star}
                            onChange={() => setMinRating(star)}
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[14px] font-bold text-slate-700">{star}★ & above</span>
                          </div>
                        </label>
                      ))}
                      <button 
                         onClick={() => setMinRating(0)}
                         className="text-[11px] font-black uppercase tracking-tight text-pink-600 hover:text-pink-700"
                      >
                        Reset Rating
                      </button>
                    </div>
                  </div>

                  {/* Brand Filter */}
                  {brands.length > 0 && (
                    <div className="border-b border-slate-200 pb-6">
                      <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Brand</h4>
                      <div className="max-h-48 space-y-2.5 overflow-y-auto pr-2 no-scrollbar">
                        {brands.map((brand) => (
                          <label key={brand} className="flex cursor-pointer items-center gap-3">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" 
                              checked={selectedBrands.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBrands([...selectedBrands, brand]);
                                else setSelectedBrands(selectedBrands.filter(b => b !== brand));
                              }}
                            />
                            <span className="text-[14px] font-bold text-slate-700">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Filter */}
                  <div className="border-b border-slate-200 pb-6">
                    <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Price Range</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Min</span>
                          <input 
                            type="number" 
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: toNumber(e.target.value) })}
                            className="w-full rounded-md border border-slate-200 p-2 text-xs font-bold focus:border-pink-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Max</span>
                          <input 
                            type="number" 
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: toNumber(e.target.value) })}
                            className="w-full rounded-md border border-slate-200 p-2 text-xs font-bold focus:border-pink-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discount Filter */}
                  <div>
                    <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Discount</h4>
                    <div className="space-y-2.5">
                      {[50, 40, 30, 20, 10].map((disc) => (
                        <label key={disc} className="flex cursor-pointer items-center gap-3">
                          <input 
                            type="radio" 
                            name="discount" 
                            className="h-4 w-4 border-slate-300 text-pink-600 focus:ring-pink-500" 
                            checked={minDiscount === disc}
                            onChange={() => setMinDiscount(disc)}
                          />
                          <span className="text-[14px] font-bold text-slate-700">{disc}% and above</span>
                        </label>
                      ))}
                      <button 
                         onClick={() => setMinDiscount(0)}
                         className="text-[11px] font-black uppercase tracking-tight text-pink-600 hover:text-pink-700"
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
              className={`mb-8 flex flex-col gap-4 lg:flex-row lg:items-center ${
                singleProductLayout ? "lg:justify-center" : "lg:justify-between"
              }`}
            >
              <div className={`relative w-full ${singleProductLayout ? "lg:max-w-md" : "lg:w-1/2"}`}>
                <input
                  type="text"
                  placeholder="Search products..."
                  className={`w-full rounded-xl pl-11 pr-4 py-2.5 template-focus-accent ${searchClass}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
              </div>

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

            {filteredProducts.length > 0 ? (
              <div className={productsLayoutClass}>
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
                        <div className="relative overflow-hidden rounded-t-2xl border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
                          <div className={imageHeightClass}>
                            {productImageUrl ? (
                              <img
                                src={productImageUrl}
                                alt={product.productName || "Product image"}
                                className="h-full w-full bg-white object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                                No Image
                              </div>
                            )}
                          </div>

                          {pricing.discountPercent > 0 ? (
                            <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">
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
                                ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
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
                                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
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
                      ? "border-rose-200 bg-white"
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
