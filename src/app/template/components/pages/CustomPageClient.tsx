"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

type Section = {
  id?: string;
  type?: string;
  data?: Record<string, any>;
};

export default function CustomTemplatePage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const slug = params.slug as string;

  const customPages =
    useSelector(
      (state: any) => state?.alltemplatepage?.data?.components?.custom_pages
    ) || [];

  const page = useMemo(() => {
    return (
      customPages.find((item: any) => item.slug === slug) ||
      customPages.find((item: any) => item.id === slug)
    );
  }, [customPages, slug]);

  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "oragze" ||
    variant.key === "whiterose";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f5f5f7] text-slate-900"
      : "min-h-screen bg-gray-50";

  return (
    <div className={pageClass}>
      <section
        className="relative h-64 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in srgb, var(--template-banner-color) 60%, transparent), color-mix(in srgb, var(--template-banner-color) 60%, transparent))",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl lg:text-5xl font-bold">
              {page?.title || "Custom Page"}
            </h1>
            <p className="text-lg mt-3">
              {page?.subtitle || "Explore this page from the vendor."}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {(page?.sections || []).map((section: Section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}

        {(page?.sections || []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            No sections yet. Add sections from the template editor.
          </div>
        )}
      </div>
    </div>
  );
}

function SectionRenderer({ section }: { section: Section }) {
  const type = section.type || "text";
  const data = section.data || {};
  const style = data.style || {};
  const textColor = style.textColor || undefined;
  const backgroundColor = style.backgroundColor || undefined;
  const fontSize = Number(style.fontSize || 0) || undefined;
  const buttonColor = style.buttonColor || undefined;

  if (type === "hero") {
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          {data.kicker || "Highlight"}
        </p>
        <h2
          className="mt-3 text-3xl font-semibold template-accent"
          style={{
            color: textColor || undefined,
            fontSize: fontSize ? `${fontSize}px` : undefined,
          }}
        >
          {data.title || "Hero headline"}
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          {data.subtitle || "Describe your page in a few lines."}
        </p>
        {(Array.isArray(data.buttons) && data.buttons.length > 0) ||
          data.buttonLabel ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {(Array.isArray(data.buttons) && data.buttons.length > 0
              ? data.buttons
              : [{ label: data.buttonLabel, href: data.buttonHref }]
            ).map((button: any, index: number) => (
              <a
                key={`${button.label}-${index}`}
                href={button.href || "#"}
                className="inline-flex rounded-full px-6 py-2 text-sm font-semibold text-white"
                style={{
                  backgroundColor: buttonColor || "var(--template-accent)",
                }}
              >
                {button.label || "Button"}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (type === "image") {
    return (
      <div
        className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <div className="aspect-[16/9] bg-gray-100">
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageUrl}
              alt={data.caption || "Section image"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-400">
              Add Image
            </div>
          )}
        </div>
        {data.caption && (
          <div
            className="px-6 py-4 text-sm text-gray-600"
            style={{
              color: textColor || undefined,
              fontSize: fontSize ? `${fontSize}px` : undefined,
            }}
          >
            {data.caption}
          </div>
        )}
      </div>
    );
  }

  if (type === "features") {
    const items = Array.isArray(data.items) ? data.items : [];
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <h3
          className="text-lg font-semibold text-gray-900"
          style={{
            color: textColor || undefined,
            fontSize: fontSize ? `${fontSize}px` : undefined,
          }}
        >
          {data.title || "Key highlights"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {items.map((item: any, index: number) => (
            <div
              key={`${item?.title}-${index}`}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm"
            >
              <p className="font-semibold text-gray-900" style={{ color: textColor || undefined }}>
                {item?.title || "Feature"}
              </p>
              <p className="mt-2 text-gray-600">
                {item?.description || "Describe the benefit."}
              </p>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
              Add feature items
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "cta") {
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-gray-900 p-8 text-white shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <h3
          className="text-2xl font-semibold"
          style={{
            color: textColor || undefined,
            fontSize: fontSize ? `${fontSize}px` : undefined,
          }}
        >
          {data.title || "Call to action"}
        </h3>
        <p className="mt-3 text-sm text-white/80" style={{ color: textColor || undefined }}>
          {data.subtitle || "Encourage visitors to take action."}
        </p>
        {(Array.isArray(data.buttons) && data.buttons.length > 0) ||
          data.buttonLabel ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {(Array.isArray(data.buttons) && data.buttons.length > 0
              ? data.buttons
              : [{ label: data.buttonLabel, href: data.buttonHref }]
            ).map((button: any, index: number) => (
              <a
                key={`${button.label}-${index}`}
                href={button.href || "#"}
                className="inline-flex rounded-full bg-white px-6 py-2 text-sm font-semibold text-gray-900"
                style={{
                  backgroundColor: buttonColor || undefined,
                  color: buttonColor ? "#fff" : undefined,
                }}
              >
                {button.label || "Button"}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (type === "gallery") {
    const images = Array.isArray(data.images) ? data.images : [];
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <h3 className="text-lg font-semibold text-gray-900" style={{ color: textColor || undefined }}>
          {data.title || "Gallery"}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image: string, index: number) => (
            <div
              key={`${image}-${index}`}
              className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100"
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="Gallery"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-gray-400">
                  Add Image
                </div>
              )}
            </div>
          ))}
          {images.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
              Add gallery images
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "pricing") {
    const plans = Array.isArray(data.plans) ? data.plans : [];
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <h3 className="text-lg font-semibold text-gray-900" style={{ color: textColor || undefined }}>
          {data.title || "Pricing Plans"}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {data.subtitle || "Choose the plan that fits your goals."}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plans.map((plan: any, index: number) => (
            <div
              key={`${plan.name}-${index}`}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-5"
            >
              <h4 className="text-lg font-semibold text-gray-900">
                {plan.name || "Plan"}
              </h4>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                Rs. {plan.price || "0"}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {plan.description || ""}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {(plan.features || []).map((feature: string, idx: number) => (
                  <li key={`${feature}-${idx}`}>• {feature}</li>
                ))}
              </ul>
              {plan.ctaLabel && (
                <button
                  type="button"
                  className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white"
                  style={{
                    backgroundColor: buttonColor || "var(--template-accent)",
                  }}
                >
                  {plan.ctaLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "faq") {
    const items = Array.isArray(data.items) ? data.items : [];
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <h3 className="text-lg font-semibold text-gray-900">
          {data.title || "FAQs"}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{data.subtitle || ""}</p>
        <div className="mt-4 space-y-3">
          {items.map((item: any, index: number) => (
            <div
              key={`${item.question}-${index}`}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="font-semibold text-gray-900">
                {item.question || "Question"}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {item.answer || "Answer"}
              </p>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
              Add FAQs
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "testimonials") {
    const items = Array.isArray(data.items) ? data.items : [];
    return (
      <div
        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <h3 className="text-lg font-semibold text-gray-900">
          {data.title || "Testimonials"}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{data.subtitle || ""}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((item: any, index: number) => (
            <div
              key={`${item.name}-${index}`}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <p className="text-sm text-gray-600">
                "{item.quote || "Great experience!"}"
              </p>
              <p className="mt-3 text-sm font-semibold text-gray-900">
                {item.name || "Customer"}
              </p>
              <p className="text-xs text-gray-500">{item.role || ""}</p>
            </div>
          ))}
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-xs text-gray-400">
              Add testimonials
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <h3
        className="text-lg font-semibold text-gray-900"
        style={{
          color: textColor || undefined,
          fontSize: fontSize ? `${fontSize}px` : undefined,
        }}
      >
        {data.title || "Text block"}
      </h3>
      <p className="mt-2 text-sm text-gray-600" style={{ color: textColor || undefined }}>
        {data.body || "Add content for this section."}
      </p>
    </div>
  );
}
