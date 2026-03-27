"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useSelector } from "react-redux";

import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import {
  getTemplateBlogParagraphs,
  getTemplateBlogPost,
} from "@/app/template/components/blog-page";
import { buildTemplateScopedPath } from "@/lib/template-route";

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

export default function BlogDetailPageClient() {
  const variant = useTemplateVariant();
  const params = useParams();
  const pathname = usePathname();
  const vendorId = String((params as any)?.vendor_id || "");
  const slug = String((params as any)?.slug || "");
  const template = useSelector((state: any) => state?.alltemplatepage?.data);

  const blog = useMemo(() => getTemplateBlogPost(template, slug), [slug, template]);
  const paragraphs = getTemplateBlogParagraphs(blog?.content || "");
  const pageClass =
    variant.key === "studio"
      ? "min-h-full bg-slate-950 text-slate-100"
      : "min-h-full bg-[#f7f7fb] text-slate-900";
  const cardClass =
    variant.key === "studio"
      ? "border border-white/10 bg-white/5"
      : "border border-slate-200 bg-white";
  const mutedClass = variant.key === "studio" ? "text-slate-300" : "text-slate-600";
  const backHref = buildTemplateScopedPath({
    vendorId,
    pathname: pathname || undefined,
    suffix: "blog",
  });

  if (!blog) {
    return (
      <div className={pageClass}>
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className={`rounded-[32px] p-8 shadow-sm ${cardClass}`}>
            <h1 className="text-3xl font-bold">Blog not found</h1>
            <p className={`mt-3 text-base ${mutedClass}`}>
              This blog post is not available right now.
            </p>
            <Link
              href={backHref}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className={`overflow-hidden rounded-[32px] shadow-sm ${cardClass}`}>
          {blog.coverImage ? (
            <div className="aspect-[16/8] bg-slate-100">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : null}

          <div className="p-6 sm:p-8">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              <span data-template-path={`components.social_page.blogs.${blog.sourceIndex}.title`}>
                {blog.title}
              </span>
            </h1>

            {blog.publishedAt ? (
              <p
                className={`mt-3 inline-flex items-center gap-2 text-sm ${mutedClass}`}
                data-template-path={`components.social_page.blogs.${blog.sourceIndex}.published_at`}
              >
                <CalendarDays className="h-4 w-4" />
                {formatDate(blog.publishedAt)}
              </p>
            ) : null}

            {blog.excerpt ? (
              <p
                className={`mt-4 text-base leading-7 ${mutedClass}`}
                data-template-path={`components.social_page.blogs.${blog.sourceIndex}.excerpt`}
              >
                {blog.excerpt}
              </p>
            ) : null}

            <div className="mt-8">
              <div
                className={`whitespace-pre-line text-base leading-8 ${mutedClass}`}
                data-template-path={`components.social_page.blogs.${blog.sourceIndex}.content`}
              >
                {blog.content || paragraphs.join("\n\n")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
