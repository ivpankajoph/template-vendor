"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllProducts } from "@/store/slices/productSlice";
import { useRouter } from "next/navigation";
import { NEXT_PUBLIC_API_URL_BANNERS } from "@/config/variables";
import { AppDispatch } from "@/store";

const BASE_URL = NEXT_PUBLIC_API_URL_BANNERS;

export const getImageUrl = (path?: string) => {
  if (!path) return "/placeholder.jpg";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}/${path.replace(/^\//, "")}`;
};

export default function EcommerceHeroPage() {
  const [active, setActive] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  // Import AppDispatch from your store

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const handleCardClick = (p: any) => {
    try {
      const categoryName = p.productCategory || p.category?.name || "unknown";
      router.push(`/product/${encodeURIComponent(categoryName)}/${p._id}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Select state from Redux store with safe defaults
  const { products = [], loading = false, error = null } = useSelector(
    (state: any) => state.product || {}
  );

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const child = container.children[index] as HTMLElement | undefined;
    if (!child) return;
    
    try {
      child.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setActive(index);
    } catch (error) {
      console.error("Scroll error:", error);
    }
  };

  // Safely get featured products
  const featured = Array.isArray(products) ? products.slice(0, 6) : [];
  const hasProducts = Array.isArray(products) && products.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-16 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Hero Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="mb-6 text-5xl font-bold leading-tight text-neutral-900 lg:text-6xl">
                Discover stylish gear for every day
              </h1>
              <p className="mb-8 text-lg text-neutral-600">
                Curated collections, fast shipping and hassle-free returns. Shop
                top-rated products across categories — clothes, bags, tech and
                more.
              </p>

              <div className="mb-8 flex flex-wrap gap-2">
                {["All", "Clothing", "Bags", "Electronics", "Footwear", "Home"].map(
                  (c) => (
                    <Badge
                      key={c}
                      variant="outline"
                      className="cursor-pointer px-4 py-2 hover:bg-indigo-50"
                    >
                      {c}
                    </Badge>
                  )
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-indigo-100 p-2">
                    <svg
                      className="h-5 w-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Fast Delivery</p>
                    <p className="text-neutral-500">Most orders in 2 days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">Easy Returns</p>
                    <p className="text-neutral-500">30 days money back</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Hero Right Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-[500px] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-8 shadow-2xl">
                <div className="absolute right-8 top-8 rounded-2xl bg-white p-6 shadow-lg">
                  <p className="mb-1 text-sm font-semibold text-indigo-600">
                    Spring Sale
                  </p>
                  <p className="text-2xl font-bold text-neutral-900">
                    Up to 40% off
                  </p>
                  <p className="text-sm text-neutral-500">on selected items</p>
                </div>
                <div className="absolute bottom-8 left-8 flex gap-3">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-neutral-50">
                    Shop Sale
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white bg-transparent text-white hover:bg-white/10"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Small Product Carousel */}
              <div className="mt-6">
                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide"
                >
                  {loading ? (
                    <div className="flex w-full items-center justify-center py-8">
                      <p className="text-neutral-500">Loading...</p>
                    </div>
                  ) : error ? (
                    <div className="flex w-full items-center justify-center py-8">
                      <p className="text-red-500">Error: {error}</p>
                    </div>
                  ) : !hasProducts ? (
                    <div className="flex w-full items-center justify-center py-8">
                      <p className="text-neutral-500">No products available</p>
                    </div>
                  ) : (
                    featured.map((p: any, i: number) => (
                      <Card
                        key={p._id || i}
                        className={`min-w-[180px] flex-shrink-0 cursor-pointer transition-all ${
                          i === active ? "ring-2 ring-indigo-600" : ""
                        }`}
                        onClick={() => scrollToIndex(i)}
                      >
                        <CardContent className="p-3">
                          <div className="relative mb-2 h-32 w-full overflow-hidden rounded-lg bg-neutral-100">
                            {p.images?.[0] ? (
                              <Image
                                src={getImageUrl(p.images[0])}
                                alt={p.productName || "Product"}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/placeholder.jpg";
                                }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-neutral-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <p className="mb-1 truncate text-sm font-medium">
                            {p.productName || "Unnamed Product"}
                          </p>
                          <p className="text-sm font-bold text-indigo-600">
                            ₹{p.variants?.[0]?.final_price || 0}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                {hasProducts && featured.length > 0 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {featured.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => scrollToIndex(i)}
                        className={`h-2 w-8 rounded-full transition-colors ${
                          i === active ? "bg-indigo-600" : "bg-neutral-200"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-neutral-900">Trending Now</h2>
            <Button variant="ghost" className="text-indigo-600">
              View all →
            </Button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {loading ? (
              <div className="flex w-full items-center justify-center py-12">
                <p className="text-neutral-500">Loading products...</p>
              </div>
            ) : error ? (
              <div className="flex w-full items-center justify-center py-12">
                <p className="text-red-500">Failed to load products: {error}</p>
              </div>
            ) : !hasProducts ? (
              <div className="flex w-full items-center justify-center py-12">
                <p className="text-neutral-500">No trending products available</p>
              </div>
            ) : (
              products.map((p: any) => (
                <Card
                  key={p._id}
                  onClick={() => handleCardClick(p)}
                  className="min-w-[220px] flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                >
                  <CardContent className="p-4">
                    <div className="relative mb-3 h-48 w-full overflow-hidden rounded-lg bg-neutral-100">
                      {p.images?.[0] ? (
                        <Image
                          src={getImageUrl(p.images[0])}
                          alt={p.productName || "Product"}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.jpg";
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <p className="mb-2 truncate font-semibold text-neutral-900">
                      {p.productName || "Unnamed Product"}
                    </p>
                    <p className="mb-2 text-lg font-bold text-indigo-600">
                      ₹{p.variants?.[0]?.final_price || 0}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>4.5</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Picks */}
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-neutral-900">Popular Picks</h2>
            <p className="text-neutral-600">Curated for you</p>
          </div>

          {loading ? (
            <div className="flex w-full items-center justify-center py-12">
              <p className="text-neutral-500">Loading products...</p>
            </div>
          ) : error ? (
            <div className="flex w-full items-center justify-center py-12">
              <p className="text-red-500">Failed to load products: {error}</p>
            </div>
          ) : !hasProducts ? (
            <div className="flex w-full items-center justify-center py-12">
              <p className="text-neutral-500">No popular products available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p: any) => (
                <div
                  key={p._id}
                  onClick={() => handleCardClick(p)}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-xl shadow transition-transform hover:scale-[1.02]"
                >
                  <div className="relative h-56 w-full bg-neutral-100">
                    {p.images?.[0] ? (
                      <Image
                        src={getImageUrl(p.images[0])}
                        alt={p.productName || "Product"}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.jpg";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-white">
                    <p className="mb-1 truncate text-lg font-bold">
                      {p.productName || "Unnamed Product"}
                    </p>
                    <p className="mb-2 text-sm">
                      ₹{p.variants?.[0]?.final_price || 0}
                    </p>
                    <Badge className="w-fit bg-white/20 backdrop-blur-sm">
                      {p.brand || "Unknown Brand"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-400 to-pink-500 p-12 text-center text-white shadow-xl">
            <h2 className="mb-4 text-4xl font-bold">Bundle & Save</h2>
            <p className="mb-6 text-lg">
              Mix and match items and save up to 20% on bundles.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-white text-orange-500 hover:bg-neutral-50">
                Build bundle
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white bg-transparent text-white hover:bg-white/10"
              >
                See bundles
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}