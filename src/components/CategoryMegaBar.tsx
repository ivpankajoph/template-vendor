"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MainCategory = {
  _id?: string;
  name?: string;
  slug?: string;
  image_url?: string;
  categories?: Array<{
    _id?: string;
    name?: string;
    slug?: string;
    subcategories?: Array<{
      _id?: string;
      name?: string;
      slug?: string;
    }>;
  }>;
};

const ImageThumb = ({
  src,
  alt,
  size = 56,
}: {
  src?: string | null;
  alt?: string;
  size?: number;
}) => {
  if (!src) {
    return (
      <div
        className="rounded-full border border-gray-200 bg-gray-100"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      width={size}
      height={size}
      className="rounded-full border border-gray-200 object-cover"
      style={{ width: size, height: size }}
    />
  );
};

export default function CategoryMegaBar() {
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [activeMainId, setActiveMainId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchMainCategories = async () => {
      try {
        const params = new URLSearchParams({
          page: "1",
          limit: "50",
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/maincategories/getall?${params.toString()}`
        );
        const data = await res.json();
        if (!isMounted) return;
        const list = data?.data || [];
        setMainCategories(list);
        if (list.length) {
          setActiveMainId(list[0]?._id || null);
        }
      } catch (error) {
        console.error("Failed to fetch main categories", error);
        if (isMounted) {
          setMainCategories([]);
          setActiveMainId(null);
        }
      }
    };

    fetchMainCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeMain = useMemo(() => {
    return (
      mainCategories.find((item) => item._id === activeMainId) ||
      mainCategories[0] ||
      null
    );
  }, [mainCategories, activeMainId]);

  return (
    <div className="relative z-30 border-y border-orange-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="relative group">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
            {mainCategories.map((main) => {
              const isActive = main._id === activeMain?._id;
              const href = main.slug
                ? `/main-categories/${main.slug}`
                : main._id
                  ? `/main-categories/${main._id}`
                  : "#";
              return (
                <Link
                  key={main._id || main.slug || main.name}
                  href={href}
                  onMouseEnter={() => setActiveMainId(main._id || null)}
                  onFocus={() => setActiveMainId(main._id || null)}
                  className={`flex min-w-[92px] flex-col items-center gap-2 rounded-xl px-3 py-2 text-center text-xs font-semibold transition ${
                    isActive
                      ? "text-orange-600"
                      : "text-gray-700 hover:text-orange-600"
                  }`}
                >
                  <div className="rounded-full bg-white p-0.5 shadow-sm ring-1 ring-orange-100">
                    <ImageThumb
                      src={main.image_url}
                      alt={main.name || "Category"}
                      size={56}
                    />
                  </div>
                  <span className="line-clamp-2">{main.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="absolute left-0 top-full hidden w-full pt-2 group-hover:block">
            <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="grid grid-cols-[220px_1fr]">
                <div className="max-h-[520px] overflow-auto border-r border-gray-100 bg-gray-50">
                  <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Main categories
                  </div>
                  {mainCategories.map((main) => {
                    const isActive = main._id === activeMain?._id;
                    const href = main.slug
                      ? `/main-categories/${main.slug}`
                      : main._id
                        ? `/main-categories/${main._id}`
                        : "#";
                    return (
                      <Link
                        key={main._id || main.slug || main.name}
                        href={href}
                        onMouseEnter={() => setActiveMainId(main._id || null)}
                        onFocus={() => setActiveMainId(main._id || null)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                          isActive
                            ? "bg-white font-semibold text-gray-900"
                            : "text-gray-600 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        <ImageThumb
                          src={main.image_url}
                          alt={main.name || "Category"}
                          size={32}
                        />
                        <span>{main.name || "Unassigned"}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="max-h-[520px] overflow-auto p-6">
                  <div className="mb-4 text-lg font-semibold text-gray-900">
                    {activeMain?.name || "Categories"}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(activeMain?.categories || []).map((category) => (
                      <div key={category._id || category.slug || category.name}>
                        <Link
                          href={`/categories/${category.slug}`}
                          className="text-sm font-semibold text-gray-900 hover:text-orange-600"
                        >
                          {category.name}
                        </Link>
                        <div className="mt-3 flex flex-col gap-1 text-sm text-gray-500">
                          {(category.subcategories || []).length ? (
                            category.subcategories?.map((sub) => (
                              <Link
                                key={sub._id || sub.slug || sub.name}
                                href={`/sub-categories/${sub.slug}`}
                                className="hover:text-orange-600"
                              >
                                {sub.name}
                              </Link>
                            ))
                          ) : (
                            <span className="text-gray-400">
                              No subcategories
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {!activeMain?.categories?.length && (
                      <div className="text-sm text-gray-500">
                        No categories available yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
