"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Star, Search } from "lucide-react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

import { trackAddToCart } from "@/lib/analytics-events";
import { toastError, toastSuccess } from "@/lib/toast";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { getTemplateAuth, templateApiFetch } from "@/app/template/components/templateAuth";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

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

export default function AllProducts() {
  const variant = useTemplateVariant();
  const products = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const params = useParams();
  const vendor_id = params.vendor_id as string;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [addingById, setAddingById] = useState<Record<string, boolean>>({});

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

  const isStudio = variant.key === "studio";
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
      : isMinimal
        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
        : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6";

  const handleAddToCart = async (product: any) => {
    if (!vendor_id || !product?._id) return;

    const auth = getTemplateAuth(vendor_id);
    if (!auth) {
      window.location.href = `/template/${vendor_id}/login?next=/template/${vendor_id}/all-products`;
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

    const matchesSearch = name.includes(term) || categoryLabel.includes(term);
    const matchesCategory =
      selectedCategory === "All" || category.label === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`${pageClass} template-page-shell template-products-page py-10 lg:py-14`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`${heroClass} template-page-hero`}>
          <h2 className={`template-section-title text-3xl lg:text-4xl font-bold text-left ${heroTitleClass}`}>All Products</h2>
          <p className={`mt-2 text-sm ${heroSubtextClass}`}>
            Explore {filteredProducts.length} products and add items to cart directly from this page.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="relative w-full lg:w-1/3">
            <input
              type="text"
              placeholder="Search products..."
              className={`w-full rounded-xl pl-11 pr-4 py-2.5 template-focus-accent ${searchClass}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          </div>

          <div className="flex flex-wrap gap-2">
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
        </div>

        {filteredProducts.length > 0 ? (
          <div className={gridClass}>
            {filteredProducts.map(({ product, category }) => {
              const pricing = getProductPricing(product);
              const rating = Math.max(0, Math.min(5, toNumber(product?.rating || 4.2)));
              const isAdding = Boolean(addingById[product._id]);

              return (
                <div
                  key={product._id}
                  className={`template-product-card group shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${cardClass}`}
                >
                  <Link
                    href={`/template/${vendor_id}/product/${product._id}`}
                    className="block"
                  >
                    <div className="relative overflow-hidden rounded-t-2xl bg-slate-100">
                      <div className="aspect-[4/5]">
                        {product?.defaultImages?.[0]?.url ? (
                          <img
                            src={product.defaultImages[0].url}
                            alt={product.productName || "Product image"}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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

                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        <Star size={12} className="fill-current" />
                        {rating.toFixed(1)}
                      </div>
                      <span className={`text-xs ${subtleTextClass}`}>
                        {pricing.stockQuantity > 0 ? `${pricing.stockQuantity} in stock` : "Out of stock"}
                      </span>
                    </div>

                    <Link href={`/template/${vendor_id}/product/${product._id}`} className="block">
                      <h3 className={`line-clamp-2 text-lg font-semibold ${titleTextClass}`}>
                        {product?.productName || "Untitled Product"}
                      </h3>
                    </Link>

                    <p className={`mt-1 text-sm ${subtleTextClass}`}>
                      {category.label || "Category"}
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                      <p className={`text-xl font-bold ${titleTextClass}`}>{formatPrice(pricing.finalPrice)}</p>
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
                        href={`/template/${vendor_id}/product/${product._id}`}
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
  );
}
