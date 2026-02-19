// app/categories/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_LIMIT = 6;

const fetchCategories = async (
  page: number,
  limit: number,
): Promise<{ data: Category[]; totalPages: number }> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/categories/getall?page=${page}&limit=${limit}`,
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
    <div className="group relative overflow-hidden rounded-2xl h-80 cursor-pointer">
      <div className="absolute inset-0">
        <img
          src={category.image_url}
          alt={category.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
      </div>
      <div className="relative h-full flex flex-col justify-end p-6 z-10">
        <div className="transform transition-transform duration-300 group-hover:translate-y-[-8px]">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-semibold uppercase">
              Featured
            </span>
          </div>
          <h3 className="text-white text-3xl font-bold mb-2">
            {category.name}
          </h3>
          <p className="text-gray-200 text-sm mb-4 line-clamp-2">
            {category.description}
          </p>
          <div className="flex items-center text-white font-semibold group-hover:gap-2 gap-1">
            <span>Explore Collection</span>
            <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-white/20 backdrop-blur rounded-full p-2 opacity-0 group-hover:opacity-100">
        <TrendingUp className="w-5 h-5 text-white" />
      </div>
    </div>
  </Link>
);

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetchCategories(1, DEFAULT_LIMIT)
      .then((result) => {
        setCategories(result.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading categories...
      </div>
    );
  }

  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Shop by category
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Explore curated collections tailored for every lifestyle.
          </p>
          <div className="mt-4">
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-full border border-orange-200 px-5 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-700"
            >
              View all categories
            </Link>
          </div>
        </div>

        {categories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((cat) => (
                <CategoryCard key={cat._id} category={cat} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900">
              No Categories Found
            </h3>
          </div>
        )}
      </div>
    </section>
  );
}
