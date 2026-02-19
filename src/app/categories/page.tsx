"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package, Sparkles, TrendingUp } from "lucide-react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";
import Pagination from "@/components/ui/Pagination";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_LIMIT = 12;

const fetchCategories = async (page: number, limit: number) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/categories/getall?page=${page}&limit=${limit}`
    );
    const data = await res.json();
    return data.success
      ? {
          data: data.data || [],
          totalPages: data.pagination?.totalPages || 1,
        }
      : { data: [], totalPages: 1 };
  } catch (error) {
    console.error("Failed to fetch categories", error);
    return { data: [], totalPages: 1 };
  }
};

const CategoryCard = ({ category }: { category: Category }) => (
  <Link href={`/categories/${category.slug}`} className="block">
    <div className="group relative h-72 overflow-hidden rounded-2xl">
      <div className="absolute inset-0">
        <img
          src={category.image_url}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
      </div>
      <div className="relative flex h-full flex-col justify-end p-6">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase text-yellow-300">
          <Sparkles className="h-4 w-4" />
          <span>Featured</span>
        </div>
        <h3 className="mt-2 text-2xl font-bold text-white">
          {category.name}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-gray-100">
          {category.description}
        </p>
        <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white">
          Explore collection
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
      <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur">
        <TrendingUp className="h-4 w-4 text-white" />
      </div>
    </div>
  </Link>
);

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchCategories(page, DEFAULT_LIMIT)
      .then((result) => {
        setCategories(result.data);
        setTotalPages(result.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              All categories
            </h1>
            <p className="mt-3 text-base text-gray-600">
              Dive into every collection we have curated for your shoppers.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              Loading categories...
            </div>
          ) : categories.length ? (
            <>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <CategoryCard key={category._id} category={category} />
                ))}
              </div>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                isLoading={loading}
              />
            </>
          ) : (
            <div className="py-16 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-semibold text-gray-900">
                No categories found
              </p>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
