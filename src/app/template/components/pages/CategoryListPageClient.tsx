"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import axios from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

type CategoryCard = {
  id: string;
  name: string;
  count: number;
  image?: string;
  isObjectId: boolean;
};

const slugify = (value: string) =>
  encodeURIComponent(value.toLowerCase().replace(/\s+/g, "-"));

export default function ShopCategoriesPage() {
  const variant = useTemplateVariant();
  const [searchTerm, setSearchTerm] = useState("");

  const products = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const params = useParams();
  const vendor_id = params.vendor_id as string;
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

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

  const categories = useMemo(() => {
    const map = new Map<string, CategoryCard>();
    let unnamedCount = 0;

    const normalize = (value: unknown) => (typeof value === "string" ? value.trim() : "");

    products.forEach((product: any) => {
      const categoryObject =
        typeof product?.productCategory === "string" ? undefined : product?.productCategory;

      const rawId =
        normalize(categoryObject?._id) ||
        normalize(typeof product?.productCategory === "string" ? product.productCategory : "") ||
        normalize(product?.productCategoryName) ||
        normalize(categoryObject?.name) ||
        normalize(categoryObject?.title) ||
        normalize(categoryObject?.categoryName);

      if (!rawId) return;

      const guessedName =
        normalize(product?.productCategoryName) ||
        normalize(categoryObject?.name) ||
        normalize(categoryObject?.title) ||
        normalize(categoryObject?.categoryName) ||
        normalize(categoryMap[rawId]);

      const isObjectId = /^[a-f\d]{24}$/i.test(rawId);
      const safeName = guessedName || (isObjectId ? "" : rawId);
      const image = product?.defaultImages?.[0]?.url || product?.images?.[0];
      const key = rawId;

      if (map.has(key)) {
        const current = map.get(key)!;
        current.count += 1;
        if (!current.image && image) current.image = image;
      } else {
        if (!safeName) unnamedCount += 1;
        map.set(key, {
          id: rawId,
          name: safeName || `Category ${unnamedCount}`,
          count: 1,
          image,
          isObjectId,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, categoryMap]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(term));
  }, [categories, searchTerm]);

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
        : "min-h-screen bg-gray-50";
  const panelClass = isStudio
    ? "bg-slate-900/70 border border-slate-800 rounded-md"
    : isTrend
      ? "bg-white border border-rose-200 rounded-[1.7rem]"
    : isMinimal
      ? "bg-white border border-slate-200 rounded-xl"
      : "bg-white border border-slate-200 rounded-2xl";
  const gridClass = isStudio
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    : isTrend
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      : isMinimal
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <div className={`${pageClass} template-page-shell template-category-page`}>
      <div
        className={`template-page-hero relative ${isMinimal ? "h-64" : "h-72"} bg-cover bg-center`}
        style={{
          backgroundImage:
            isTrend
              ? "linear-gradient(rgba(244, 63, 94, 0.55), rgba(236, 72, 153, 0.45)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80')"
              : "linear-gradient(color-mix(in srgb, var(--template-banner-color) 60%, transparent), color-mix(in srgb, var(--template-banner-color) 60%, transparent)), url('https://images.unsplash.com/photo-1466781783364-36c955e42a7f?w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6">
            <h1 className="template-section-title text-4xl lg:text-5xl font-bold mb-3">Shop by Category</h1>
            <p className="text-base lg:text-xl">Explore collections from this storefront</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className={`template-surface-card rounded-2xl p-4 sm:p-5 mb-6 ${panelClass}`}>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <p className={isStudio ? "text-slate-300" : isTrend ? "text-slate-700" : "text-slate-600"}>
              Showing <span className="font-semibold">{filteredCategories.length}</span> categories
            </p>
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg pl-10 pr-4 py-2.5 template-focus-accent ${
                  isStudio
                    ? "border border-slate-700 bg-slate-950 text-slate-100"
                    : isTrend
                      ? "border border-rose-200 bg-white"
                      : "border border-slate-300 bg-white"
                }`}
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <div className={gridClass}>
            {filteredCategories.map((category) => {
              const categoryPath = category.isObjectId ? category.id : slugify(category.name);
              return (
                <Link
                  key={category.id}
                  href={`/template/${vendor_id}/category/${categoryPath}`}
                  className={`template-product-card group overflow-hidden shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${panelClass}`}
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {category.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400">
                        Category
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <p className="absolute left-4 bottom-4 text-white text-lg font-semibold line-clamp-1">
                      {category.name}
                    </p>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className={isStudio ? "text-slate-300 text-sm" : isTrend ? "text-slate-700 text-sm" : "text-slate-600 text-sm"}>
                      {category.count} {category.count === 1 ? "product" : "products"}
                    </span>
                    <span className={`text-sm font-semibold ${isTrend ? "text-rose-600" : "template-accent"}`}>View</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed p-12 text-center ${
              isStudio
                ? "border-slate-800 bg-slate-900/70 text-slate-400"
                : isTrend
                  ? "border-rose-200 bg-white text-slate-600"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            No categories found.
          </div>
        )}
      </div>
    </div>
  );
}
