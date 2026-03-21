const HTML_TAG_REGEX = /<([a-z][\w-]*)\b[^>]*>/i;
const MARKDOWN_LINK_REGEX = /\[([^[\]\r\n]+)\]\((https?:\/\/[^\s)]+)\)/gi;
const ENCODED_HTML_TAG_REGEX = /&lt;\/?[a-z][^&]*&gt;/i;
const PSEUDO_TAG_PREFIX_REGEX =
  /^\s*\/?(?:p|div|li|ul|ol|h[1-6]|blockquote|br|hr)\b(?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*=(?:"[^"]*"|'[^']*'|[^\s"'>]+))*\s*/i;
const PSEUDO_TAG_ONLY_LINE_REGEX =
  /^\s*\/?(?:p|div|li|ul|ol|h[1-6]|blockquote|br|hr)\s*$/i;
const PSEUDO_TAG_SUFFIX_REGEX =
  /\s*\/(?:p|div|li|ul|ol|h[1-6]|blockquote|br|hr)\s*$/i;
const BLOCKED_TAG_REGEX =
  /<(script|style|object|embed|form|input|button|textarea|select)[^>]*>[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_BLOCKED_TAG_REGEX = /<(meta|link|base|frame|frameset)[^>]*>/gi;

const escapeHtml = (value: string) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const decodeHtmlEntities = (value: string) =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

const stripPseudoRichTextArtifacts = (value: string) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => {
      const withoutPrefix = line.replace(PSEUDO_TAG_PREFIX_REGEX, "");
      const withoutSuffix = withoutPrefix.replace(PSEUDO_TAG_SUFFIX_REGEX, "").trim();
      return PSEUDO_TAG_ONLY_LINE_REGEX.test(withoutSuffix) ? "" : withoutSuffix;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const normalizeSafeUrl = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString();
  } catch {
    return "";
  }
};

const extractAttribute = (source: string, attribute: string) => {
  const pattern = new RegExp(
    `\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = source.match(pattern);
  return match?.[1] || match?.[2] || match?.[3] || "";
};

const normalizeCssColor = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^rgba?\(\s*[\d.%\s,]+\)$/i.test(trimmed)) return trimmed;
  if (/^hsla?\(\s*[\d.%\s,]+\)$/i.test(trimmed)) return trimmed;
  if (/^[a-z]{3,24}$/i.test(trimmed)) return trimmed.toLowerCase();
  return "";
};

const buildSafeInlineStyle = (styleValue: string) => {
  const styles: string[] = [];

  const colorMatch = styleValue.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  const backgroundColorMatch = styleValue.match(
    /(?:^|;)\s*background-color\s*:\s*([^;]+)/i
  );

  const safeColor = normalizeCssColor(colorMatch?.[1] || "");
  const safeBackgroundColor = normalizeCssColor(backgroundColorMatch?.[1] || "");

  if (safeColor) styles.push(`color: ${safeColor}`);
  if (safeBackgroundColor) styles.push(`background-color: ${safeBackgroundColor}`);

  return styles.join("; ");
};

const getYouTubeId = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      if (url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] || "";
      }
      if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.split("/").filter(Boolean)[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
};

const getVimeoId = (value: string) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return "";

    return (
      url.pathname
        .split("/")
        .filter(Boolean)
        .find((part) => /^\d+$/.test(part)) || ""
    );
  } catch {
    return "";
  }
};

const normalizeVideoEmbedUrl = (value: string) => {
  const safeUrl = normalizeSafeUrl(value);
  if (!safeUrl) return "";

  const youTubeId = getYouTubeId(safeUrl);
  if (youTubeId) return `https://www.youtube.com/embed/${youTubeId}`;

  const vimeoId = getVimeoId(safeUrl);
  if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}`;

  return "";
};

const markdownLinksToHtml = (value: string) =>
  String(value || "").replace(MARKDOWN_LINK_REGEX, (_, text: string, url: string) => {
    const safeUrl = normalizeSafeUrl(url);
    if (!safeUrl) return escapeHtml(text);
    return `<a href="${escapeHtml(
      safeUrl
    )}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
  });

export const isLikelyRichTextHtml = (value: string) =>
  HTML_TAG_REGEX.test(String(value || ""));

export const normalizeRichTextInput = (value: string) => {
  const source = String(value || "");
  if (!source.trim()) return "";

  const decoded =
    ENCODED_HTML_TAG_REGEX.test(source) || source.includes("&nbsp;")
      ? decodeHtmlEntities(source)
      : source;
  const normalizedSource = stripPseudoRichTextArtifacts(decoded);
  if (!normalizedSource) return "";
  if (isLikelyRichTextHtml(normalizedSource)) return normalizedSource;

  const escapedSource = markdownLinksToHtml(escapeHtml(normalizedSource));
  const paragraphs = escapedSource
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${chunk.replace(/\n/g, "<br />")}</p>`);

  return paragraphs.join("");
};

export const stripRichTextToPlainText = (value: string) =>
  String(value || "")
    .replace(MARKDOWN_LINK_REGEX, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const sanitizeRichTextHtml = (value: string) => {
  let html = normalizeRichTextInput(value);
  if (!html) return "";

  html = html
    .replace(BLOCKED_TAG_REGEX, "")
    .replace(SELF_CLOSING_BLOCKED_TAG_REGEX, "")
    .replace(/<font\b[^>]*color\s*=\s*(['"]?)([^'">\s]+)\1[^>]*>/gi, (_, _quote, color) => {
      const safeStyle = buildSafeInlineStyle(`color:${color}`);
      return safeStyle ? `<span style="${safeStyle}">` : "<span>";
    })
    .replace(/<\/font>/gi, "</span>");

  const safeNodes: string[] = [];
  const storeSafeNode = (safeHtml: string) => {
    const placeholder = `__RICH_TEXT_SAFE_NODE_${safeNodes.length}__`;
    safeNodes.push(safeHtml);
    return placeholder;
  };

  html = html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (fullMatch) => {
    const safeUrl = normalizeSafeUrl(extractAttribute(fullMatch, "href"));
    const innerHtml = fullMatch.replace(/^<a\b[^>]*>/i, "").replace(/<\/a>$/i, "");
    const linkLabel = stripRichTextToPlainText(innerHtml);

    if (!safeUrl || !linkLabel) return escapeHtml(linkLabel);

    return storeSafeNode(
      `<a href="${escapeHtml(
        safeUrl
      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkLabel)}</a>`
    );
  });

  html = html.replace(/<img\b[^>]*>/gi, (fullMatch) => {
    const safeUrl = normalizeSafeUrl(extractAttribute(fullMatch, "src"));
    if (!safeUrl) return "";

    return storeSafeNode(
      `<img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(
        extractAttribute(fullMatch, "alt") || "Inserted image"
      )}" loading="lazy" />`
    );
  });

  html = html.replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, (fullMatch) => {
    const safeUrl =
      normalizeSafeUrl(extractAttribute(fullMatch, "src")) ||
      normalizeSafeUrl(
        (fullMatch.match(/<source\b[^>]*src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)?.[1] ||
          fullMatch.match(/<source\b[^>]*src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)?.[2] ||
          fullMatch.match(/<source\b[^>]*src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)?.[3] ||
          "")
      );

    if (!safeUrl || !/\.(mp4|webm|ogg)(\?.*)?$/i.test(safeUrl)) return "";

    return storeSafeNode(
      `<video controls preload="metadata" src="${escapeHtml(safeUrl)}"></video>`
    );
  });

  html = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (fullMatch) => {
    const safeEmbedUrl = normalizeVideoEmbedUrl(extractAttribute(fullMatch, "src"));
    if (!safeEmbedUrl) return "";

    return storeSafeNode(
      `<iframe src="${escapeHtml(
        safeEmbedUrl
      )}" title="Embedded video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
    );
  });

  html = html
    .replace(/<div\b[^>]*>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>")
    .replace(/<span\b([^>]*)>/gi, (_, attrs: string) => {
      const styleValue = extractAttribute(attrs || "", "style");
      const safeStyle = buildSafeInlineStyle(styleValue);
      return safeStyle ? `<span style="${safeStyle}">` : "<span>";
    })
    .replace(/<br\s*\/?>/gi, "<br />")
    .replace(
      /<(p|strong|b|em|i|u|s|ul|ol|li|blockquote|h1|h2|h3|h4|h5|h6|span)\b[^>]*>/gi,
      "<$1>"
    )
    .replace(
      /<\/(p|strong|b|em|i|u|s|ul|ol|li|blockquote|h1|h2|h3|h4|h5|h6|span)>/gi,
      "</$1>"
    )
    .replace(
      /<(?!\/?(?:p|br|strong|b|em|i|u|s|ul|ol|li|blockquote|h1|h2|h3|h4|h5|h6|span)\b)[^>]+>/gi,
      ""
    )
    .replace(/&nbsp;/gi, " ");

  safeNodes.forEach((safeHtml, index) => {
    html = html.replaceAll(`__RICH_TEXT_SAFE_NODE_${index}__`, safeHtml);
  });

  return html.trim();
};

export const getRichTextPreview = (value: string, maxLength = 180) => {
  const plainText = stripRichTextToPlainText(value);
  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength).trimEnd()}...`;
};
