"use client";

import { useMemo } from "react";

import { sanitizeRichTextHtml } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type RichTextContentProps = {
  text?: string | null;
  className?: string;
};

export default function RichTextContent({
  text,
  className,
}: RichTextContentProps) {
  const html = useMemo(() => sanitizeRichTextHtml(String(text || "")), [text]);

  if (!html) return null;

  return (
    <div
      className={cn(
        "rich-text-content whitespace-normal [&_a]:font-medium [&_a]:text-cyan-600 [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-500/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_h5]:mb-2 [&_h5]:mt-3 [&_h5]:text-base [&_h5]:font-semibold [&_h6]:mb-2 [&_h6]:mt-3 [&_h6]:text-sm [&_h6]:font-semibold [&_iframe]:my-4 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-2xl [&_img]:my-4 [&_img]:max-h-[520px] [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_li]:ml-5 [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:mb-3 [&_ul]:list-disc [&_video]:my-4 [&_video]:w-full [&_video]:rounded-2xl",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
