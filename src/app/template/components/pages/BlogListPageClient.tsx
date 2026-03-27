"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";

import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import { buildTemplateScopedPath } from "@/lib/template-route";
import { getTemplateBlogs } from "@/app/template/components/blog-page";

const formatDate = (value: string) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function BlogListPageClient() {
  const variant = useTemplateVariant();
  const params = useParams();
  const pathname = usePathname();
  const vendorId = String((params as any)?.vendor_id || "");
  const template = useSelector((state: any) => state?.alltemplatepage?.data);
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {});

  const blogs = useMemo(() => getTemplateBlogs(template), [template]);
  const businessName =
    template?.business_name ||
    vendor?.name ||
    vendor?.registrar_name ||
    "Vendor Blog";
  const pageClass =
    variant.key === "studio"
      ? "min-h-full bg-slate-950 text-slate-100"
      : "min-h-full bg-[#f7f7fb] text-slate-900";
  const cardClass =
    variant.key === "studio"
      ? "border border-white/10 bg-white/5"
      : "border border-slate-200 bg-white";
  const mutedClass = variant.key === "studio" ? "text-slate-300" : "text-slate-600";
  const accentClass = variant.key === "studio" ? "bg-cyan-500/15" : "bg-cyan-50";

  const toBlogPath = (slug: string) =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || undefined,
      suffix: `blog/${slug}`,
    });

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className={`rounded-[32px] p-6 shadow-sm sm:p-8 ${cardClass}`}>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${accentClass}`}
          >
            {businessName}
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Blog
          </h1>
          <p className={`mt-3 max-w-2xl text-base leading-7 ${mutedClass}`}>
            Stories, updates, and helpful articles published by {businessName}.
          </p>

          {blogs.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {blogs.map((blog) => (
                <article
                  key={blog.id}
                  className={`overflow-hidden rounded-[28px] shadow-sm ${cardClass}`}
                >
                  <div className="aspect-[16/10] bg-slate-100">
                    {blog.coverImage ? (
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                        Blog Cover
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {blog.publishedAt ? (
                      <p
                        className={`inline-flex items-center gap-2 text-sm ${mutedClass}`}
                        data-template-path={`components.social_page.blogs.${blog.sourceIndex}.published_at`}
                      >
                        <CalendarDays className="h-4 w-4" />
                        {formatDate(blog.publishedAt)}
                      </p>
                    ) : null}
                    <h2
                      className="mt-3 text-xl font-semibold leading-tight"
                      data-template-path={`components.social_page.blogs.${blog.sourceIndex}.title`}
                    >
                      {blog.title}
                    </h2>
                    <p
                      className={`mt-3 text-sm leading-6 ${mutedClass}`}
                      data-template-path={`components.social_page.blogs.${blog.sourceIndex}.excerpt`}
                    >
                      {blog.excerpt}
                    </p>
                    <Link
                      href={toBlogPath(blog.slug)}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
                    >
                      Read blog
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-10 text-center text-sm text-slate-500">
              No blogs have been published yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
