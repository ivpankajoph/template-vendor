// app/categories/[slug]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Star,
  ChevronDown,
  Filter,
  Grid,
  List,
  ShoppingCart,
  TrendingUp,
  Package,
  Zap,
} from "lucide-react";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";
import Pagination from "@/components/ui/Pagination";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";
import { toggleWishlistItem } from "@/store/slices/customerWishlistSlice";
import { createWishlistItem } from "@/lib/wishlist";
import { toastSuccess } from "@/lib/toast";

interface Variant {
  _id: string;
  variantSku: string;
  variantAttributes: {
    color?: string;
    country?: string;
  };
  actualPrice: number;
  discountPercent: number;
  finalPrice: number;
  stockQuantity: number;
  variantsImageUrls: Array<{
    url: string;
    publicId: string;
  }>;
  isActive: boolean;
}

interface Product {
  _id: string;
  productName: string;
  slug: string;
  brand: string;
  shortDescription: string;
  description: string;
  specifications: any[];
  defaultImages: Array<{
    url: string;
    publicId: string;
  }>;
  variants: Variant[];
  isAvailable: boolean;
  productCategory: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

interface ProductsResponse {
  success: boolean;
  products: Product[];
  category: Category;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoryResponse {
  success: boolean;
  data: Category;
}

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const categorySlug = params.slug as string;
  const wishlistItems = useSelector(
    (state: RootState) => state.customerWishlist?.items || [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const categoryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/categories/slug/${categorySlug}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!categoryResponse.ok) {
          throw new Error(
            `Failed to fetch category: ${categoryResponse.statusText}`
          );
        }

        const categoryData: CategoryResponse = await categoryResponse.json();

        if (!categoryData?.data?._id) {
          throw new Error("Category not found");
        }

        setCategory(categoryData.data);

        const productsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/category/${categoryData.data._id}?page=${page}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!productsResponse.ok) {
          throw new Error(
            `Failed to fetch products: ${productsResponse.statusText}`
          );
        }

        const productsData: ProductsResponse = await productsResponse.json();
        setProducts(productsData?.products || []);
        setTotalPages(productsData?.pagination?.totalPages || 1);
        setTotalProducts(productsData?.pagination?.total || productsData?.count || 0);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load category"
        );
        console.error("Error fetching category products:", err);
        setCategory(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) {
      fetchCategoryProducts();
    }
  }, [categorySlug, page, limit]);

  useEffect(() => {
    setPage(1);
  }, [categorySlug]);

  // Get all unique brands
  const allBrands = React.useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => p.brand && brands.add(p.brand));
    return Array.from(brands);
  }, [products]);

  // Flatten products with their variants for display
  const flattenedProducts = React.useMemo(() => {
    const flattened: Array<{
      product: Product;
      variant: Variant;
      displayPrice: number;
      originalPrice: number;
      discount: number;
      image: string;
    }> = [];

    products.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((variant) => {
          flattened.push({
            product,
            variant,
            displayPrice: variant.finalPrice,
            originalPrice: variant.actualPrice,
            discount: variant.discountPercent,
            image:
              variant.variantsImageUrls?.[0]?.url ||
              product.defaultImages?.[0]?.url ||
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
          });
        });
      }
    });

    return flattened;
  }, [products]);

  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = flattenedProducts.filter((item) => {
      const productName = item.product.productName?.toLowerCase() || "";
      const productDesc = item.product.shortDescription?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      const price = item.displayPrice || 0;

      const matchesSearch =
        productName.includes(search) || productDesc.includes(search);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(item.product.brand);

      return matchesSearch && matchesPrice && matchesBrand;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.displayPrice - b.displayPrice;
        case "price-high":
          return b.displayPrice - a.displayPrice;
        case "discount":
          return b.discount - a.discount;
        case "newest":
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [flattenedProducts, searchTerm, sortBy, priceRange, selectedBrands]);

  const handleProductClick = (categoryId: string, productId: string) => {
    router.push(`/product/${categoryId}/${productId}`);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isWishlisted = (productId: string) =>
    wishlistItems.some((item) => item.product_id === String(productId));

  const handleToggleWishlist = (product: Product, variant: Variant) => {
    const alreadyWishlisted = isWishlisted(product._id);
    dispatch(
      toggleWishlistItem(
        createWishlistItem({
          product_id: product._id,
          product_name: product.productName,
          product_category: product.productCategory || "unknown",
          image_url:
            variant?.variantsImageUrls?.[0]?.url ||
            product.defaultImages?.[0]?.url ||
            "/placeholder.png",
          final_price: variant?.finalPrice || 0,
          actual_price: variant?.actualPrice || variant?.finalPrice || 0,
          brand: product.brand,
          short_description: product.shortDescription || product.description,
          variant_id: variant?._id,
          variant_attributes: variant?.variantAttributes || undefined,
          stock_quantity: variant?.stockQuantity ?? 0,
        }),
      ),
    );
    toastSuccess(alreadyWishlisted ? "Removed from wishlist" : "Added to wishlist");
  };
useEffect(() => {
  if (!category) return;

  const metaTitle =
    category.metaTitle?.trim() || category.name || "Category";

  const metaDescription =
    category.metaDescription?.trim() ||
    category.description ||
    "";

  // ✅ Set browser tab title
  document.title = metaTitle;

  // ✅ Set meta description safely
  let metaTag = document.head.querySelector(
    'meta[name="description"]'
  ) as HTMLMetaElement | null;

  if (!metaTag) {
    metaTag = document.createElement("meta");
    metaTag.name = "description";
    document.head.appendChild(metaTag);
  }

  metaTag.content = metaDescription;

  // ✅ Optional: keywords
  if (category.metaKeywords?.length) {
    let keywordTag = document.head.querySelector(
      'meta[name="keywords"]'
    ) as HTMLMetaElement | null;

    if (!keywordTag) {
      keywordTag = document.createElement("meta");
      keywordTag.name = "keywords";
      document.head.appendChild(keywordTag);
    }

    keywordTag.content = category.metaKeywords.join(",");
  }
}, [category]);


  if (loading) {
    return (
      <>
        <PromotionalBanner />
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 text-lg font-medium">
              Loading amazing products...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !category) {
    return (
      <>
        <PromotionalBanner />
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <Package className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {error || "Category not found"}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Unable to load category details. Let's get you back on track.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  const metaTitle = category?.metaTitle || "Category";
  const metaDescription = category?.metaDescription || "";
  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta
          name="keywords"
          content={category?.metaKeywords?.join(",") || ""}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={category?.image_url} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={category?.image_url} />
      </Head>

      <PromotionalBanner />
      <Navbar />

      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Modern Category Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${category?.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(20px)",
              }}
            ></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="flex items-center gap-3 text-gray-300 text-sm mb-6">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>›</span>
              <span className="text-white font-medium">{category?.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="max-w-2xl">
                <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                  {category?.name}
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  {category?.description}
                </p>
                <div className="flex items-center gap-6 mt-8">
                  <div className="flex items-center gap-2 text-white">
                    <Package className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold">
                      {totalProducts || filteredAndSortedProducts.length}
                    </span>
                    <span className="text-gray-300">Products</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Best Deals</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Filters and Sort Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "grid"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">
                  Sort by:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 bg-gray-100 border-0 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="discount">Discount</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <div
              className={`w-80 flex-shrink-0 ${
                showMobileFilters ? "block" : "hidden lg:block"
              }`}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 sticky top-4 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <h3 className="font-bold text-xl text-gray-900">Filters</h3>
                </div>

                {/* Price Filter */}
                <div className="p-6 border-b border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    💰 Price Range
                  </h4>
                  <div className="space-y-4">
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([0, parseInt(e.target.value)])
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="px-3 py-1.5 bg-gray-100 rounded-lg font-medium">
                        ₹0
                      </span>
                      <span className="text-gray-500">to</span>
                      <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">
                        ₹{priceRange[1].toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Brand Filter */}
                {allBrands.length > 0 && (
                  <div className="p-6 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      🏷️ Brands
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {allBrands.map((brand) => (
                        <label
                          key={brand}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBrands([...selectedBrands, brand]);
                              } else {
                                setSelectedBrands(
                                  selectedBrands.filter((b) => b !== brand)
                                );
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                            {brand}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                {(selectedBrands.length > 0 || priceRange[1] < 200000) && (
                  <div className="p-6">
                    <button
                      onClick={() => {
                        setSelectedBrands([]);
                        setPriceRange([0, 200000]);
                      }}
                      className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid/List */}
            <div className="flex-1">
              {filteredAndSortedProducts.length > 0 ? (
                <>
                  <div className="mb-6">
                    <p className="text-gray-600">
                      Showing{" "}
                      <span className="font-semibold text-gray-900">
                        {totalProducts || filteredAndSortedProducts.length}
                      </span>{" "}
                      results
                    </p>
                  </div>

                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "space-y-6"
                    }
                  >
                    {filteredAndSortedProducts.map((item, index) => {
                      const alreadyWishlisted = isWishlisted(item.product._id);
                      return (
                      <div
                        key={`${item.product._id}-${item.variant._id}`}
                        onClick={() =>
                          handleProductClick(
                            item.product.productCategory,
                            item.product._id
                          )
                        }
                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                      >
                        {/* Product Image */}
                        <div className="relative aspect-square overflow-hidden bg-gray-50">
                          {item.variant.stockQuantity === 0 && (
                            <div className="absolute top-4 left-4 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 backdrop-blur-sm">
                              Out of Stock
                            </div>
                          )}
                          {item.discount > 0 && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                              {item.discount.toFixed(0)}% OFF
                            </div>
                          )}
                          <img
                            src={item.image}
                            alt={item.product.productName}
                            className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e";
                            }}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(item.product, item.variant);
                            }}
                            className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Heart
                              className={`w-5 h-5 transition-colors ${
                                alreadyWishlisted
                                  ? "fill-red-500 text-red-500"
                                  : "text-gray-700 hover:fill-red-500 hover:text-red-500"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-6">
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                              {item.product.brand}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {item.product.productName}
                          </h3>

                          {item.variant?.variantAttributes?.color && (
                            <p className="text-sm text-gray-600 mb-3">
                              Color:{" "}
                              <span className="font-medium capitalize">
                                {item.variant?.variantAttributes?.color}
                              </span>
                            </p>
                          )}

                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {item.product.shortDescription}
                          </p>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  ₹{item.displayPrice.toLocaleString()}
                                </span>
                                {item.discount > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    ₹{item.originalPrice.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {item.discount > 0 && (
                                <p className="text-xs text-green-600 font-medium mt-1">
                                  Save ₹
                                  {(
                                    item.originalPrice - item.displayPrice
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add
                            </button>
                          </div>

                          {item.variant.stockQuantity > 0 &&
                            item.variant.stockQuantity < 10 && (
                              <p className="text-xs text-orange-600 font-medium mt-3 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                Only {item.variant.stockQuantity} left in stock
                              </p>
                            )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    isLoading={loading}
                  />
                </>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                  <Package className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filters or search term
                  </p>
                  <button
                    onClick={() => {
                      setSelectedBrands([]);
                      setPriceRange([0, 200000]);
                      setSearchTerm("");
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}












