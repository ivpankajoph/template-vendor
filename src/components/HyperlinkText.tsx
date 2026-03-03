import React, { useMemo } from "react";

import { cn } from "@/lib/utils";

type HyperlinkTextProps = {
  text?: string | null;
  className?: string;
  linkClassName?: string;
};

const TOKEN_REGEX =
  /\[([^[\]\r\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION_REGEX = /[.,!?;:]+$/;

const normalizeSafeUrl = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
};

const splitTrailingPunctuation = (value: string) => {
  const raw = String(value || "");
  const stripped = raw.replace(TRAILING_PUNCTUATION_REGEX, "");
  const trailing = raw.slice(stripped.length);
  return { stripped, trailing };
};

export default function HyperlinkText({
  text,
  className,
  linkClassName,
}: HyperlinkTextProps) {
  const content = useMemo(() => {
    const source = String(text || "");
    if (!source) return null;

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null = null;
    let keyIndex = 0;

    while ((match = TOKEN_REGEX.exec(source)) !== null) {
      const [fullMatch, markdownText, markdownUrl, plainUrl] = match;
      const matchStart = match.index;
      const matchEnd = matchStart + fullMatch.length;

      if (matchStart > lastIndex) {
        nodes.push(source.slice(lastIndex, matchStart));
      }

      if (markdownText && markdownUrl) {
        const safeUrl = normalizeSafeUrl(markdownUrl);
        if (safeUrl) {
          nodes.push(
            <a
              key={`link-${keyIndex}`}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700",
                linkClassName
              )}
            >
              {markdownText}
            </a>
          );
        } else {
          nodes.push(fullMatch);
        }
      } else if (plainUrl) {
        const { stripped, trailing } = splitTrailingPunctuation(plainUrl);
        const safeUrl = normalizeSafeUrl(stripped);
        if (safeUrl) {
          nodes.push(
            <a
              key={`link-${keyIndex}`}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700",
                linkClassName
              )}
            >
              {stripped}
            </a>
          );
          if (trailing) nodes.push(trailing);
        } else {
          nodes.push(fullMatch);
        }
      } else {
        nodes.push(fullMatch);
      }

      lastIndex = matchEnd;
      keyIndex += 1;
    }

    if (lastIndex < source.length) {
      nodes.push(source.slice(lastIndex));
    }

    return nodes;
  }, [text, linkClassName]);

  return <div className={cn("whitespace-pre-line", className)}>{content}</div>;
}
