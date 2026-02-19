"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import { ArrowLeft, Package } from "lucide-react";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";

type Subcategory = {
  _id?: string;
  name?: string;
  slug?: string;
};

type Category = {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  subcategories?: Subcategory[];
};

type MainCategory = {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image_url?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  categories?: Category[];
};

type MainCategoryResponse = {
  success?: boolean;
  data?: MainCategory[];
};

export default function MainCategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMainCategory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/maincategories/getall`
        );
        if (!res.ok) {
          throw new Error(`Failed to fetch main categories: ${res.statusText}`);
        }
        const data: MainCategoryResponse = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        const match = list.find(
          (item) => item?.slug === slug || item?._id === slug
        );
        if (!match) {
          throw new Error("Main category not found");
        }
        if (isMounted) {
          setMainCategory(match);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load main category"
          );
          setMainCategory(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (slug) {
      fetchMainCategory();
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!mainCategory) return;
    const metaTitle =
      mainCategory.metaTitle?.trim() || mainCategory.name || "Main category";
    const metaDescription =
      mainCategory.metaDescription?.trim() || mainCategory.description || "";
    document.title = metaTitle;
    let metaTag = document.head.querySelector(
      'meta[name="description"]'
    ) as HTMLMetaElement | null;
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.name = "description";
      document.head.appendChild(metaTag);
    }
    metaTag.content = metaDescription;
    if (mainCategory.metaKeywords?.length) {
      let keywordTag = document.head.querySelector(
        'meta[name="keywords"]'
      ) as HTMLMetaElement | null;
      if (!keywordTag) {
        keywordTag = document.createElement("meta");
        keywordTag.name = "keywords";
        document.head.appendChild(keywordTag);
      }
      keywordTag.content = mainCategory.metaKeywords.join(",");
    }
  }, [mainCategory]);

  const categories = mainCategory?.categories || [];
  const subcategoryCount = useMemo(() => {
    return categories.reduce(
      (total, category) => total + (category.subcategories?.length || 0),
      0
    );
  }, [categories]);

  if (loading) {
    return (
      <>
        <PromotionalBanner />
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-700 text-lg font-medium">
              Loading main category...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !mainCategory) {
    return (
      <>
        <PromotionalBanner />
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-3xl shadow-xl p-12">
              <Package className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {error || "Main category not found"}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Unable to load main category details. Please try again.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-4 rounded-full font-semibold hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

  const metaTitle =
    mainCategory.metaTitle?.trim() || mainCategory.name || "Main category";
  const metaDescription =
    mainCategory.metaDescription?.trim() || mainCategory.description || "";

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta
          name="keywords"
          content={mainCategory.metaKeywords?.join(",") || ""}
        />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={mainCategory.image_url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={mainCategory.image_url} />
      </Head>

      <PromotionalBanner />
      <Navbar />

      <div className="relative min-h-screen bg-[#f4f2ee]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-100 opacity-60 blur-3xl"></div>
          <div className="absolute -bottom-56 -left-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-emerald-100 via-sky-100 to-white opacity-80 blur-3xl"></div>
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#141b2d] to-[#0b1021]">
          <div className="absolute inset-0 opacity-25">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${mainCategory.image_url || ""})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(26px)",
                transform: "scale(1.05)",
              }}
            ></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-amber-400/10 to-rose-500/20"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="flex items-center gap-3 text-gray-300 text-sm mb-6">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>&gt;</span>
              <span className="text-white font-medium">
                {mainCategory.name}
              </span>
            </div>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/80">
                Explore
                <span className="h-1 w-1 rounded-full bg-orange-300"></span>
                {mainCategory.name}
              </div>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
                {mainCategory.name}
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-gray-200/90 leading-relaxed">
                {mainCategory.description || "Explore categories in this group."}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Categories</p>
                    <p className="text-2xl font-semibold text-white">
                      {categories.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-300">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Subcategories</p>
                    <p className="text-2xl font-semibold text-white">
                      {subcategoryCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {categories.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const categoryHref =
                  category.slug || category._id
                    ? `/categories/${category.slug || category._id}`
                    : null;
                const subCount = (category.subcategories || []).length;
                return (
                  <div
                    key={category._id || category.slug || category.name}
                    className="group"
                  >
                    <div className="relative rounded-3xl bg-gradient-to-br from-orange-200/60 via-white to-amber-100 p-[1px] shadow-[0_25px_60px_-40px_rgba(15,23,42,0.7)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_35px_80px_-40px_rgba(15,23,42,0.8)]">
                      <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur">
                        <div className="relative h-48 bg-gray-100">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name || "Category"}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-gray-400">
                              No Image
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                            {subCount || 0} subcats
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="text-xs uppercase tracking-[0.28em] text-white/70">
                              Category
                            </div>
                            {categoryHref ? (
                              <Link
                                href={categoryHref}
                                className="mt-1 block text-xl font-semibold text-white transition-colors hover:text-orange-200"
                              >
                                {category.name || "Category"}
                              </Link>
                            ) : (
                              <div className="mt-1 text-xl font-semibold text-white">
                                {category.name || "Category"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-6 pt-5">
                          {category.description ? (
                            <p className="line-clamp-2 text-sm text-slate-600">
                              {category.description}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400">
                              Curated picks and popular items to explore.
                            </p>
                          )}
                          <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                            {subCount ? (
                              category.subcategories?.map((sub) => {
                                const subHref =
                                  sub.slug || sub._id
                                    ? `/sub-categories/${sub.slug || sub._id}`
                                    : null;
                                return subHref ? (
                                  <Link
                                    key={sub._id || sub.slug || sub.name}
                                    href={subHref}
                                    className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-orange-300 hover:text-orange-700 hover:shadow-sm"
                                  >
                                    {sub.name || "Subcategory"}
                                  </Link>
                                ) : (
                                  <span
                                    key={sub._id || sub.slug || sub.name}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-400"
                                  >
                                    {sub.name || "Subcategory"}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-400">
                                No subcategories
                              </span>
                            )}
                          </div>
                          <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                            <span>Discover</span>
                            {categoryHref ? (
                              <Link
                                href={categoryHref}
                                className="text-slate-700 transition-colors hover:text-orange-600"
                              >
                                Browse
                              </Link>
                            ) : (
                              <span className="text-slate-300">Browse</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/70 bg-white/70 p-10 text-center text-gray-600 shadow-sm backdrop-blur">
              No categories available for this main category yet.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
