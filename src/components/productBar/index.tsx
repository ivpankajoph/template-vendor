"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { getAllCategories } from "@/store/slices/category";

export default function ProductNavbar() {
  const [activeMainKey, setActiveMainKey] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(getAllCategories());
  }, [dispatch]);

  const categories = useSelector(
    (state: RootState) => (state as any).category.categories || []
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        main: any;
        items: any[];
      }
    >();
    categories.forEach((category: any) => {
      const main = category?.mainCategory || {};
      const key = main?._id || main?.name || "unassigned";
      if (!map.has(key)) {
        map.set(key, { key, main, items: [] });
      }
      map.get(key)?.items.push(category);
    });
    return Array.from(map.values()).sort((a, b) => {
      const nameA = a.main?.name || "Unassigned";
      const nameB = b.main?.name || "Unassigned";
      return nameA.localeCompare(nameB);
    });
  }, [categories]);

  useEffect(() => {
    if (!activeMainKey && grouped.length) {
      setActiveMainKey(grouped[0].key);
    }
  }, [activeMainKey, grouped]);

  const activeGroup =
    grouped.find((group) => group.key === activeMainKey) || grouped[0];

  return (
    <nav className="bg-white shadow sticky top-0 z-40">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-orange-400 hover:text-orange-600"
          >
            Browse Categories
            <span className="text-xs text-gray-500">Hover</span>
          </button>

          <div className="absolute left-0 top-full hidden pt-3 group-hover:block">
            <div className="w-[960px] max-w-[95vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
              <div className="grid grid-cols-[240px_1fr]">
                <div className="max-h-[520px] overflow-auto border-r border-gray-100 bg-gray-50">
                  <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Categories for you
                  </div>
                  {grouped.map((group) => {
                    const isActive = group.key === activeGroup?.key;
                    const href = group.main?.slug
                      ? `/main-categories/${group.main.slug}`
                      : group.main?._id
                        ? `/main-categories/${group.main._id}`
                        : "#";
                    return (
                      <Link
                        key={group.key}
                        href={href}
                        onMouseEnter={() => setActiveMainKey(group.key)}
                        onFocus={() => setActiveMainKey(group.key)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                          isActive
                            ? "bg-white font-semibold text-gray-900"
                            : "text-gray-600 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                          {group.main?.image_url ? (
                            <img
                              src={group.main.image_url}
                              alt={group.main?.name || "Category"}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </span>
                        <span>{group.main?.name || "Unassigned"}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="max-h-[520px] overflow-auto p-5">
                  <div className="mb-4 text-lg font-semibold text-gray-900">
                    {activeGroup?.main?.name || "Categories"}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(activeGroup?.items || []).map((category: any) => (
                      <div
                        key={category._id || category.id || category.name}
                        className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
                      >
                        <Link
                          href={`/category/${category.slug}`}
                          className="text-sm font-semibold text-gray-900 hover:text-orange-600"
                        >
                          {category.name}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          {(category.subcategories || []).length ? (
                            category.subcategories.map((sub: any) => (
                              <Link
                                key={sub._id || sub.id || sub.name}
                                href={`/subcategory/${sub.slug}`}
                                className="rounded-full border border-gray-200 px-2 py-1 hover:border-orange-400 hover:text-orange-600"
                              >
                                {sub.name}
                              </Link>
                            ))
                          ) : (
                            <span className="text-gray-400">No subcategories</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden gap-4 text-sm text-gray-500 lg:flex">
          <span className="font-medium text-gray-900">Featured selections</span>
          <span>Order protections</span>
          <span>Buyer Central</span>
        </div>
      </div>
    </nav>
  );
}
