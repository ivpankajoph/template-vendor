"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

export default function CategoryProductsPage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendor_id = params.vendor_id as string;
  const categoryId = params.category_id as string;
  const products = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
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

  const { label, filteredProducts } = useMemo(() => {
    const normalize = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";
    const normalizedParam = decodeURIComponent(categoryId || "").toLowerCase();

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

    const searched = list.filter((product: any) => {
      const name = normalize(product?.productName).toLowerCase();
      const desc = normalize(product?.shortDescription).toLowerCase();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || desc.includes(term);
    });

    return { label: displayLabel, filteredProducts: searched };
  }, [categoryId, products, searchTerm, categoryMap]);

  return (
    <div className={`${pageClass} template-page-shell template-category-detail-page py-16 lg:py-20`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`template-page-hero mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${heroShellClass}`}>
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

        {filteredProducts.length > 0 ? (
          <div className={gridClass}>
            {filteredProducts.map((product: any) => (
              <Link
                key={product._id}
                href={`/template/${vendor_id}/product/${product._id}`}
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
                  {product.shortDescription || "No description"}
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
