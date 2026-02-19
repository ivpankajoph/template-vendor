"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useSelector } from "react-redux";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

type Subcategory = {
  _id?: string;
  name?: string;
  category_id?: { _id?: string; name?: string } | string;
};

type Product = {
  _id?: string;
  productName?: string;
  shortDescription?: string;
  productSubCategories?: string[] | string;
  productSubCategory?: string[] | string;
  subCategory?: string[] | string;
  subcategory?: string[] | string;
  defaultImages?: Array<{ url?: string }>;
  variants?: Array<{ finalPrice?: number }>;
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const getMinPrice = (variants: Array<{ finalPrice?: number }> = []) => {
  const values = variants
    .map((variant) => variant.finalPrice)
    .filter((value): value is number => typeof value === "number");
  return values.length ? Math.min(...values) : 0;
};

const getSubcategoryCategoryId = (sub?: Subcategory) => {
  if (!sub?.category_id) return "";
  return typeof sub.category_id === "string"
    ? sub.category_id
    : sub.category_id?._id || "";
};

const getProductSubcategoryIds = (product: Product) => {
  const raw =
    product.productSubCategories ??
    product.productSubCategory ??
    product.subCategory ??
    product.subcategory;

  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return [raw];
  return [];
};

export default function SubcategoryDetailPageClient() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const subcategoryId = params.subcategory_id as string;
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  );

  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [subcategoriesRes, categoriesRes] = await Promise.all([
          axios.get(`${NEXT_PUBLIC_API_URL}/subcategories/getall`),
          axios.get(`${NEXT_PUBLIC_API_URL}/categories/getall`),
        ]);

        setSubcategories(subcategoriesRes?.data?.data || []);
        const categories = categoriesRes?.data?.data || [];
        const map = categories.reduce((acc: Record<string, string>, item: any) => {
          if (item?._id && item?.name) acc[item._id] = item.name;
          return acc;
        }, {});
        setCategoryMap(map);
      } catch {
        setSubcategories([]);
        setCategoryMap({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const isObjectId = /^[a-f\d]{24}$/i.test(subcategoryId);
  const normalizedSlug = toSlug(decodeURIComponent(subcategoryId || ""));

  const resolvedSubcategory = useMemo(() => {
    if (isObjectId) {
      return subcategories.find((sub) => sub._id === subcategoryId);
    }
    return subcategories.find((sub) => toSlug(sub?.name || "") === normalizedSlug);
  }, [isObjectId, normalizedSlug, subcategories, subcategoryId]);

  const resolvedSubcategoryId = resolvedSubcategory?._id;
  const resolvedLabel =
    resolvedSubcategory?.name || decodeURIComponent(subcategoryId || "").replace(/-/g, " ");
  const parentCategoryId = getSubcategoryCategoryId(resolvedSubcategory);
  const parentCategoryLabel = parentCategoryId ? categoryMap[parentCategoryId] : "";

  const filteredProducts = useMemo(() => {
    if (!resolvedSubcategoryId) return [];
    return products.filter((product) =>
      getProductSubcategoryIds(product).includes(resolvedSubcategoryId)
    );
  }, [products, resolvedSubcategoryId]);

  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "oragze" ||
    variant.key === "whiterose";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f5f5f7] text-slate-900"
      : "min-h-screen bg-white";

  return (
    <div className={`${pageClass} py-16 lg:py-20`}>
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Link
            href={
              parentCategoryId
                ? `/template/${vendorId}/category/${parentCategoryId}`
                : `/template/${vendorId}/category`
            }
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
          >
            Back to {parentCategoryLabel || "category"}
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Subcategory
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{resolvedLabel}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {filteredProducts.length} products available in this subcategory.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading products...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <Link
                key={product._id || `${product.productName}-${index}`}
                href={product._id ? `/template/${vendorId}/product/${product._id}` : "#"}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {product.defaultImages?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.defaultImages[0].url}
                      alt={product.productName || "Product"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {product.productName || "Untitled Product"}
                  </p>
                  <p className="line-clamp-2 text-xs text-slate-500">
                    {product.shortDescription || "No description yet."}
                  </p>
                  <span className="text-sm font-semibold text-slate-900">
                    Rs. {getMinPrice(product.variants).toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No products found for this subcategory yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
