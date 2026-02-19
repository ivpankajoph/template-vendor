"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { getImageUrl } from "@/components/main/Index";
import { User2Icon } from "lucide-react";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";

// Hide scrollbar styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(style);
}

// Define the correct type for params
type VendorCatalogPageProps = {
  params: Promise<{ id: string }>;
};

export default function VendorCatalogPage({ params }: VendorCatalogPageProps) {
  // Await the params promise
  const resolvedParams = params;
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    // Resolve the params promise
    const resolveParams = async () => {
      const resolved = await resolvedParams;
      setVendorId(resolved.id);
    };

    resolveParams();
  }, [resolvedParams]);

  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [subcategories, setSubcategories] = useState<
    Array<{ _id?: string; name?: string; category_id?: { _id?: string } | string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  const isObjectId = (value?: string) => !!value && /^[a-f\d]{24}$/i.test(value);

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const getCategoryLabel = (product: any) => {
    if (product?.productCategoryName) return product.productCategoryName;
    if (typeof product?.productCategory === "string") {
      return categoryMap[product.productCategory] || product.productCategory;
    }
    return product?.productCategory?.name || "Uncategorized";
  };

  const getCategoryKey = (product: any) => {
    const raw = product?.productCategory;
    if (typeof raw === "string") {
      if (categoryMap[raw] || isObjectId(raw)) return raw;
      return toSlug(raw);
    }
    const id = raw?._id;
    if (id) return id;
    const label = getCategoryLabel(product);
    return label ? toSlug(label) : "uncategorized";
  };

  const getProductCategoryPath = (product: any) => {
    const key = getCategoryKey(product);
    if (isObjectId(key)) return key;
    const label = getCategoryLabel(product);
    return label ? toSlug(label) : "uncategorized";
  };

  const getProductSubcategoryIds = (product: any) => {
    const raw =
      product?.productSubCategories ??
      product?.productSubCategory ??
      product?.subCategory ??
      product?.subcategory;
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string") return [raw];
    return [];
  };

  useEffect(() => {
    if (!vendorId) return;

    const fetchVendor = async () => {
      try {
        setLoading(true);
        const [vendorRes, categoriesRes, subcategoriesRes] = await Promise.all([
          fetch(`${NEXT_PUBLIC_API_URL}/vendors/catalog/${vendorId}`),
          fetch(`${NEXT_PUBLIC_API_URL}/categories/getall`),
          fetch(`${NEXT_PUBLIC_API_URL}/subcategories/getall`),
        ]);

        if (!vendorRes.ok) throw new Error("Failed to fetch vendor products");
        const data = await vendorRes.json();
        setVendor(data.vendor);
        setProducts(data.products || []);

        if (Array.isArray(data.categories)) {
          const map: Record<string, string> = {};
          data.categories.forEach((item: any) => {
            const key = item?._id || item?.id;
            const value =
              item?.name || item?.title || item?.categoryName || item?.label;
            if (key && value) map[key] = value;
          });
          setCategoryMap(map);
        } else if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const list =
            categoriesData?.data ||
            categoriesData?.categories ||
            categoriesData?.category ||
            [];
          if (Array.isArray(list)) {
            const map: Record<string, string> = {};
            list.forEach((item: any) => {
              const key = item?._id || item?.id;
              const value =
                item?.name || item?.title || item?.categoryName || item?.label;
              if (key && value) map[key] = value;
            });
            setCategoryMap(map);
          }
        }

        if (Array.isArray(data.subcategories)) {
          setSubcategories(data.subcategories);
        } else if (subcategoriesRes.ok) {
          const subData = await subcategoriesRes.json();
          const list = subData?.data || subData?.subcategories || [];
          if (Array.isArray(list)) {
            setSubcategories(list);
          }
        }
      } catch (err) {
        console.error("Error fetching vendor:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [vendorId]);

  const categoryItems = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; count: number; isId: boolean }
    >();
    products.forEach((product) => {
      const label = getCategoryLabel(product) || "Uncategorized";
      const key = getCategoryKey(product);
      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          count: 1,
          isId: isObjectId(key),
        });
      } else {
        const existing = map.get(key)!;
        existing.count += 1;
        if (!existing.label && label) existing.label = label;
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [products, categoryMap]);

  const categoryFilteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(
      (product) => getCategoryKey(product) === selectedCategory
    );
  }, [products, selectedCategory]);

  const subcategoryItems = useMemo(() => {
    const pool = categoryFilteredProducts.length
      ? categoryFilteredProducts
      : products;
    const availableIds = new Set<string>();
    pool.forEach((product) => {
      getProductSubcategoryIds(product).forEach((id) => availableIds.add(id));
    });
    return subcategories
      .filter((sub) => sub?._id && availableIds.has(String(sub._id)))
      .map((sub) => ({
        id: String(sub._id),
        label: sub.name || "Subcategory",
        categoryId:
          typeof sub.category_id === "string"
            ? sub.category_id
            : sub.category_id?._id || "",
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categoryFilteredProducts, products, subcategories]);

  const filteredAndSorted = useMemo(() => {
    let result = [...products];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((p) => p.productName.toLowerCase().includes(q));
    }

    if (selectedCategory !== "all") {
      result = result.filter(
        (product) => getCategoryKey(product) === selectedCategory
      );
    }

    if (selectedSubcategory !== "all") {
      result = result.filter((product) =>
        getProductSubcategoryIds(product).includes(selectedSubcategory)
      );
    }

    if (sort === "price_low_high") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "price_high_low") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [products, query, sort, selectedCategory, selectedSubcategory]);

  if (loading) return <VendorSkeleton />;

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Vendor Header */}
        <motion.header
          className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Avatar Area: Image or Lottie */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 shadow-md flex items-center justify-center">
            {vendor?.logo ? (
              <Image
                src={getImageUrl(vendor.logo)}
                alt={vendor?.name || "Vendor"}
                fill
                className="object-cover"
              />
            ) : (
              <User2Icon />
            )}
          </div>

          <div className="text-center sm:text-left max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {vendor?.name || "Vendor"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{vendor?.email}</p>
            <p className="text-gray-700 mt-3 text-sm sm:text-base">
              {vendor?.description ||
                "Premium vendor offering exclusive quality products."}
            </p>
          </div>
        </motion.header>

        {/* Filters Bar */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 py-4 px-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between max-w-7xl mx-auto w-full">
            <div className="w-full sm:w-[280px]">
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="w-full sm:w-[200px]">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low_high">
                    Price: Low → High
                  </SelectItem>
                  <SelectItem value="price_high_low">
                    Price: High → Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedSubcategory("all");
                }}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === "all"
                    ? "border-indigo-500 bg-indigo-500 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                All Categories
              </button>
              {categoryItems.map((category) => (
                <button
                  key={category.key}
                  onClick={() => {
                    setSelectedCategory(category.key);
                    setSelectedSubcategory("all");
                  }}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === category.key
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
              {categoryItems.length === 0 && (
                <span className="rounded-full border border-dashed border-gray-300 px-4 py-1.5 text-xs text-gray-500">
                  No categories yet
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedSubcategory("all")}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                  selectedSubcategory === "all"
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                All Subcategories
              </button>
              {subcategoryItems.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    selectedSubcategory === sub.id
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
              {subcategoryItems.length === 0 && (
                <span className="rounded-full border border-dashed border-gray-300 px-4 py-1.5 text-xs text-gray-500">
                  No subcategories yet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Product Carousel */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
          {filteredAndSorted.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="relative w-48 h-48 mb-6">
                <Image
                  src="/empty-state.svg"
                  alt="No products found"
                  fill
                  className="opacity-80"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 max-w-md">
                {query
                  ? `No products match your search for "${query}".`
                  : "This vendor hasn't listed any products yet."}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-800 px-1">
                Products ({filteredAndSorted.length})
              </h2>
              <div className="relative">
                <div
                  className="flex overflow-x-auto hide-scrollbar pb-4 space-x-5"
                  style={{ scrollSnapType: "x mandatory" }}
                >
                  {filteredAndSorted.map((product) => (
                    <motion.div
                      key={product._id}
                      className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
                      style={{ scrollSnapAlign: "start" }}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={`/product/${getProductCategoryPath(product)}/${product._id}`}
                        className="block h-full"
                      >
                        <Card className="h-full flex flex-col overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 rounded-xl">
                          <div className="relative w-full h-48 bg-gray-100">
                            <Image
                              src={getImageUrl(product.defaultImages?.[0]?.url || product.defaultImages?.[0])}
                              alt={product.productName}
                              fill
                              className="object-cover transition-transform duration-300"
                            />
                          </div>
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 h-12">
                              {product.productName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-xs text-gray-500">
                              {getCategoryLabel(product) || "Uncategorized"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}

// Skeleton Loader
function VendorSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 mb-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-3 w-full">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-8 px-2">
          <Skeleton className="h-10 w-full sm:w-[280px]" />
          <Skeleton className="h-10 w-full sm:w-[200px]" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="flex overflow-x-auto hide-scrollbar pb-4 space-x-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] sm:w-[300px]">
                <Card className="overflow-hidden border border-gray-200 rounded-xl">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
