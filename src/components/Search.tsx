"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Image,
  Sparkles,
  TrendingUp,
  Package,
  Zap,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import useDebounce from "@/hooks/useDebounce";

type TabType = "category" | "subcategory" | "wholesale" | "retail";
type SearchResult = {
  type: "product" | "category";
  id: string;
  name: string;
  slug?: string | null;
  categorySlug?: string | null;
  imageUrl?: string | null;
};

export default function EcommerceSearchUI() {
  const router = useRouter();
  const [activeTab] = useState<TabType>("category");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchEnabled, setAiSearchEnabled] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "", []);
  const debouncedQuery = useDebounce(searchQuery, 350);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchResults = async (query: string) => {
    if (!query || !apiBase) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiBase}/search?query=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      if (!response.ok) {
        throw new Error("Search request failed");
      }
      const data = await response.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Search error:", error);
        setResults([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;
    fetchResults(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (!query) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    fetchResults(query);
  }, [debouncedQuery]);

  const handleResultClick = (result: SearchResult) => {
    const targetSlug =
      result.type === "product" ? result.categorySlug : result.slug;
    if (targetSlug) {
      router.push(`/categories/${targetSlug}`);
    }
    setSearchQuery("");
    setResults([]);
  };

  const showResults = searchQuery.trim().length > 0;

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#fde68a_35%,_#fce7f3_70%)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
       

        <div className="text-center space-y-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold tracking-wide text-orange-700 shadow-sm">
            <Sparkles className="h-4 w-4" /> Smart catalog search
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900">
            Find products and categories in seconds
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Type a product name, brand, or category. We’ll show the best matches instantly.
          </p>
        </div>

        <div className="mt-10 sm:mt-12 bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-orange-200 overflow-visible relative z-10">
          <div className="p-5 sm:p-8">
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-[1fr_auto] items-start">
              <div className="relative z-20">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Search ${
                      activeTab === "wholesale"
                        ? "wholesale"
                        : activeTab === "retail"
                        ? "retail"
                        : ""
                    } products or categories...`}
                    className="w-full h-14 rounded-2xl border-2 border-orange-200 bg-white pl-12 pr-12 text-base sm:text-lg shadow-sm focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-orange-600"
                      aria-label="Clear search"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  ) : (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-orange-600">
                      <Image className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {showResults && (
                  <div className="absolute left-0 right-0 top-full mt-3 rounded-2xl border border-orange-100 bg-white shadow-xl z-50 overflow-hidden">
                    {isLoading ? (
                      <div className="p-4 text-sm text-gray-500">Searching...</div>
                    ) : results.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto">
                        {results.map((result) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            type="button"
                            onClick={() => handleResultClick(result)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 text-left"
                          >
                            {result.imageUrl ? (
                              <NextImage
                                src={result.imageUrl}
                                alt={result.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-semibold">
                                IMG
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm sm:text-base font-semibold text-gray-800">
                                {result.name}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {result.type}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-gray-500">
                        No results found. Try a different keyword.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleSearch}
                className="w-full sm:w-auto h-14 px-7 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>

            {/* AI Search Toggle & Features */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="flex items-center gap-2 text-orange-600 font-semibold">
                  <Sparkles className="w-5 h-5" />
                  <span>AI Smart Search</span>
                </div>
                <div
                  onClick={() => setAiSearchEnabled(!aiSearchEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    aiSearchEnabled ? "bg-orange-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      aiSearchEnabled ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-500">Free</span>
              </label>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span>Top Ranking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>Quick Quote</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-lg">
            Welcome to{" "}
            <span className="font-semibold text-orange-600">OPH-mart</span>, Your
            Premium E-Commerce Platform
          </p>
        </div>
      </div>
    </section>
  );
}
