"use client";

import { useSelector } from "react-redux";
import { ShieldCheck, ScrollText, Truck } from "lucide-react";

import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";
import {
  getPolicyPageContent,
  type PolicyPageKind,
} from "@/app/template/components/policy-page";

export default function PolicyPageClient({
  kind,
}: {
  kind: PolicyPageKind;
}) {
  const variant = useTemplateVariant();
  const template = useSelector((state: any) => state?.alltemplatepage?.data);
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {});
  const policy = getPolicyPageContent(template, kind);
  const Icon =
    kind === "privacy" ? ShieldCheck : kind === "terms" ? ScrollText : Truck;
  const businessName =
    template?.business_name ||
    vendor?.name ||
    vendor?.registrar_name ||
    "This business";

  const pageClass =
    variant.key === "studio"
      ? "min-h-full bg-slate-950 text-slate-100"
      : "min-h-full bg-[#f7f7fb] text-slate-900";
  const cardClass =
    variant.key === "studio"
      ? "border border-white/10 bg-white/5"
      : "border border-slate-200 bg-white";
  const mutedClass = variant.key === "studio" ? "text-slate-300" : "text-slate-600";
  const accentClass = variant.key === "studio" ? "bg-emerald-500/15" : "bg-emerald-50";
  const isSectionHeading = (value: string) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return false;
    if (/^#{1,3}\s+/.test(trimmed)) return true;
    if (trimmed.endsWith(":")) return true;
    if (trimmed.length > 72) return false;
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    return wordCount <= 5 && !/[.!?]$/.test(trimmed);
  };

  const parseContent = (value: string) => {
    const lines = String(value || "").split(/\r?\n/);
    const blocks: Array<
      | { type: "heading"; content: string }
      | { type: "paragraph"; content: string }
      | { type: "list"; items: string[] }
    > = [];

    let paragraphBuffer: string[] = [];
    let listBuffer: string[] = [];

    const flushParagraph = () => {
      const content = paragraphBuffer.join(" ").trim();
      if (content) {
        blocks.push({ type: "paragraph", content });
      }
      paragraphBuffer = [];
    };

    const flushList = () => {
      const items = listBuffer.map((item) => item.trim()).filter(Boolean);
      if (items.length) {
        blocks.push({ type: "list", items });
      }
      listBuffer = [];
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const listMatch = line.match(/^[-*•]\s+(.*)$/);
      if (listMatch) {
        flushParagraph();
        listBuffer.push(listMatch[1]);
        return;
      }

      const markdownHeading = line.match(/^#{1,3}\s+(.*)$/);
      if (markdownHeading) {
        flushParagraph();
        flushList();
        blocks.push({ type: "heading", content: markdownHeading[1].trim() });
        return;
      }

      if (isSectionHeading(line)) {
        flushParagraph();
        flushList();
        blocks.push({ type: "heading", content: line.replace(/:$/, "") });
        return;
      }

      flushList();
      paragraphBuffer.push(line);
    });

    flushParagraph();
    flushList();

    return blocks.length
      ? blocks
      : policy.paragraphs.map((item) => ({ type: "paragraph" as const, content: item }));
  };

  const contentBlocks = parseContent(policy.content || "");

  return (
    <div className={pageClass}>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className={`rounded-[32px] p-6 shadow-sm sm:p-8 ${cardClass}`}>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${accentClass}`}
          >
            <Icon className="h-4 w-4" />
            {businessName}
          </div>

          <h1
            className="mt-5 font-bold tracking-tight"
            style={{
              fontSize: `${policy.style.titleSize}px`,
              lineHeight: 1.08,
              color: policy.style.titleColor,
            }}
          >
            <span data-template-path={`components.social_page.legal_pages.${kind}.title`}>
              {policy.title}
            </span>
          </h1>

          {policy.subtitle ? (
            <p
              className={`mt-3 text-base leading-7 ${mutedClass}`}
              data-template-path={`components.social_page.legal_pages.${kind}.subtitle`}
              style={{
                fontSize: `${policy.style.subtitleSize}px`,
                color: policy.style.subtitleColor,
              }}
            >
              {policy.subtitle}
            </p>
          ) : null}

          <div className="mt-8">
            <div
              className={`space-y-5 ${mutedClass}`}
              data-template-path={`components.social_page.legal_pages.${kind}.content`}
            >
              {contentBlocks.map((block, index) =>
                block.type === "heading" ? (
                    <h2
                      key={`${kind}-block-${index}`}
                      className="font-semibold"
                      style={{
                        fontSize: `${policy.style.sectionHeadingSize}px`,
                        lineHeight: 1.2,
                        color: policy.style.sectionHeadingColor,
                      }}
                    >
                      {block.content}
                    </h2>
                  ) : block.type === "list" ? (
                    <ul
                      key={`${kind}-block-${index}`}
                      className="list-disc space-y-2 pl-6"
                      style={{
                        fontSize: `${policy.style.bodySize}px`,
                        lineHeight: 1.8,
                        color: policy.style.bodyColor,
                      }}
                    >
                      {block.items.map((item, itemIndex) => (
                        <li key={`${kind}-block-${index}-item-${itemIndex}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      key={`${kind}-block-${index}`}
                      className="whitespace-pre-line"
                      style={{
                        fontSize: `${policy.style.bodySize}px`,
                        lineHeight: 1.8,
                        color: policy.style.bodyColor,
                      }}
                    >
                      {block.content}
                    </p>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
