"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSelector } from "react-redux";

type PageKey = "home" | "about" | "contact";

type CandidateKind = "text" | "image";

type EditableCandidate = {
  path: string[];
  sectionId: string;
  kind: CandidateKind;
  value: string;
};

const textFromValue = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const normalizeText = (value: unknown) =>
  textFromValue(value).replace(/\s+/g, " ").toLowerCase();

const normalizeUrl = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const trimmed = value.trim();
  try {
    const parsed = new URL(trimmed, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return trimmed.split("?")[0].toLowerCase();
  }
};

const inferPage = (pathname: string | null): PageKey | null => {
  if (!pathname) return null;
  const cleanPath = pathname.split("?")[0];
  const segments = cleanPath.split("/").filter(Boolean);
  if (segments[0] !== "template") return null;
  if (segments.length === 2) return "home";

  // Supports both:
  // 1) /template/:vendor_id/:page?
  // 2) /template/:vendor_id/preview/:template_key/:page?
  const isPreviewPath = segments[2] === "preview" && Boolean(segments[3]);
  const pageSegment = isPreviewPath ? segments[4] : segments[2];

  if (!pageSegment) return "home";
  if (pageSegment === "about") return "about";
  if (pageSegment === "contact") return "contact";
  if (pageSegment === "home") return "home";
  return null;
};

const inferSectionFromPath = (page: PageKey, path: string[]) => {
  const joined = path.join(".");
  if (joined.includes("vendor_profile")) return "vendor";
  if (page === "home") {
    if (
      joined === "components.logo" ||
      joined.includes("home_page.backgroundImage")
    ) {
      return "branding";
    }
    if (joined.includes("home_page.description")) return "description";
    if (joined.includes("home_page.products_")) return "products";
    return "hero";
  }
  if (page === "about") {
    if (joined.includes("about_page.hero")) return "hero";
    if (joined.includes("about_page.story")) return "story";
    if (joined.includes("about_page.values")) return "values";
    if (joined.includes("about_page.team")) return "team";
    if (joined.includes("about_page.stats")) return "stats";
  }
  if (page === "contact") {
    if (joined.includes("contact_page.hero")) return "hero";
    if (joined.includes("contact_page.section_2.lat")) return "map";
    if (joined.includes("contact_page.section_2.long")) return "map";
    if (joined.includes("contact_page.section_2")) return "details";
  }
  return "";
};

const addTextCandidate = (
  list: EditableCandidate[],
  sectionId: string,
  path: string[],
  value: unknown
) => {
  const text = textFromValue(value);
  if (!text) return;
  list.push({ sectionId, path, kind: "text", value: text });
};

const addImageCandidate = (
  list: EditableCandidate[],
  sectionId: string,
  path: string[],
  value: unknown
) => {
  if (typeof value !== "string" || !value.trim()) return;
  list.push({ sectionId, path, kind: "image", value: value.trim() });
};

const buildCandidates = (templateData: any, page: PageKey): EditableCandidate[] => {
  const list: EditableCandidate[] = [];
  if (!templateData || typeof templateData !== "object") return list;

  if (page === "home") {
    const home = templateData?.components?.home_page || {};
    addImageCandidate(
      list,
      "branding",
      ["components", "home_page", "backgroundImage"],
      home?.backgroundImage
    );
    addImageCandidate(list, "branding", ["components", "logo"], templateData?.components?.logo);
    addTextCandidate(list, "hero", ["components", "home_page", "hero_kicker"], home?.hero_kicker);
    addTextCandidate(list, "hero", ["components", "home_page", "header_text"], home?.header_text);
    addTextCandidate(
      list,
      "hero",
      ["components", "home_page", "header_text_small"],
      home?.header_text_small
    );
    addTextCandidate(
      list,
      "hero",
      ["components", "home_page", "button_header"],
      home?.button_header
    );
    addTextCandidate(
      list,
      "hero",
      ["components", "home_page", "button_secondary"],
      home?.button_secondary
    );
    addTextCandidate(list, "hero", ["components", "home_page", "badge_text"], home?.badge_text);
    addTextCandidate(
      list,
      "description",
      ["components", "home_page", "description", "large_text"],
      home?.description?.large_text
    );
    addTextCandidate(
      list,
      "description",
      ["components", "home_page", "description", "summary"],
      home?.description?.summary
    );
    addTextCandidate(
      list,
      "description",
      [
        "components",
        "home_page",
        "description",
        "percent",
        "percent_in_number",
      ],
      home?.description?.percent?.percent_in_number
    );
    addTextCandidate(
      list,
      "description",
      ["components", "home_page", "description", "percent", "percent_text"],
      home?.description?.percent?.percent_text
    );
    addTextCandidate(
      list,
      "description",
      ["components", "home_page", "description", "sold", "sold_number"],
      home?.description?.sold?.sold_number
    );
    addTextCandidate(
      list,
      "description",
      ["components", "home_page", "description", "sold", "sold_text"],
      home?.description?.sold?.sold_text
    );
    addTextCandidate(
      list,
      "products",
      ["components", "home_page", "products_kicker"],
      home?.products_kicker
    );
    addTextCandidate(
      list,
      "products",
      ["components", "home_page", "products_heading"],
      home?.products_heading
    );
    addTextCandidate(
      list,
      "products",
      ["components", "home_page", "products_subtitle"],
      home?.products_subtitle
    );
    return list;
  }

  if (page === "about") {
    const about = templateData?.components?.about_page || {};
    addTextCandidate(list, "hero", ["components", "about_page", "hero", "title"], about?.hero?.title);
    addTextCandidate(
      list,
      "hero",
      ["components", "about_page", "hero", "subtitle"],
      about?.hero?.subtitle
    );
    addImageCandidate(
      list,
      "hero",
      ["components", "about_page", "hero", "backgroundImage"],
      about?.hero?.backgroundImage
    );
    addTextCandidate(
      list,
      "story",
      ["components", "about_page", "story", "heading"],
      about?.story?.heading
    );
    if (Array.isArray(about?.story?.paragraphs)) {
      about.story.paragraphs.forEach((paragraph: unknown, index: number) => {
        addTextCandidate(
          list,
          "story",
          ["components", "about_page", "story", "paragraphs", String(index)],
          paragraph
        );
      });
    }
    addImageCandidate(
      list,
      "story",
      ["components", "about_page", "story", "image"],
      about?.story?.image
    );
    if (Array.isArray(about?.values)) {
      about.values.forEach((value: any, index: number) => {
        addTextCandidate(
          list,
          "values",
          ["components", "about_page", "values", String(index), "title"],
          value?.title
        );
        addTextCandidate(
          list,
          "values",
          ["components", "about_page", "values", String(index), "description"],
          value?.description
        );
      });
    }
    if (Array.isArray(about?.team)) {
      about.team.forEach((member: any, index: number) => {
        addTextCandidate(
          list,
          "team",
          ["components", "about_page", "team", String(index), "name"],
          member?.name
        );
        addTextCandidate(
          list,
          "team",
          ["components", "about_page", "team", String(index), "role"],
          member?.role
        );
        addImageCandidate(
          list,
          "team",
          ["components", "about_page", "team", String(index), "image"],
          member?.image
        );
      });
    }
    if (Array.isArray(about?.stats)) {
      about.stats.forEach((stat: any, index: number) => {
        addTextCandidate(
          list,
          "stats",
          ["components", "about_page", "stats", String(index), "value"],
          stat?.value
        );
        addTextCandidate(
          list,
          "stats",
          ["components", "about_page", "stats", String(index), "label"],
          stat?.label
        );
      });
    }
    return list;
  }

  const contact = templateData?.components?.contact_page || {};
  addTextCandidate(
    list,
    "hero",
    ["components", "contact_page", "hero", "title"],
    contact?.hero?.title
  );
  addTextCandidate(
    list,
    "hero",
    ["components", "contact_page", "hero", "subtitle"],
    contact?.hero?.subtitle
  );
  addImageCandidate(
    list,
    "hero",
    ["components", "contact_page", "hero", "backgroundImage"],
    contact?.hero?.backgroundImage
  );
  addTextCandidate(
    list,
    "details",
    ["components", "contact_page", "section_2", "hero_title"],
    contact?.section_2?.hero_title
  );
  addTextCandidate(
    list,
    "details",
    ["components", "contact_page", "section_2", "hero_subtitle"],
    contact?.section_2?.hero_subtitle
  );
  addTextCandidate(
    list,
    "details",
    ["components", "contact_page", "section_2", "hero_title2"],
    contact?.section_2?.hero_title2
  );
  addTextCandidate(
    list,
    "details",
    ["components", "contact_page", "section_2", "hero_subtitle2"],
    contact?.section_2?.hero_subtitle2
  );
  addTextCandidate(
    list,
    "map",
    ["components", "contact_page", "section_2", "lat"],
    contact?.section_2?.lat
  );
  addTextCandidate(
    list,
    "map",
    ["components", "contact_page", "section_2", "long"],
    contact?.section_2?.long
  );
  return list;
};

const SELECTOR_TEXT_HOST =
  "[data-template-path], h1, h2, h3, h4, h5, h6, p, span, a, button, li, label, strong, em";

export function TemplateInlineEditorBridge() {
  const pathname = usePathname();
  const params = useParams();
  const page = useMemo(() => inferPage(pathname), [pathname]);
  const vendorId =
    typeof (params as any)?.vendor_id === "string"
      ? ((params as any).vendor_id as string)
      : "";
  const templateData = useSelector((state: any) => state?.alltemplatepage?.data);
  const candidates = useMemo(
    () => (page ? buildCandidates(templateData, page) : []),
    [page, templateData]
  );
  const activeElementRef = useRef<HTMLElement | null>(null);
  const activePathRef = useRef<string[] | null>(null);
  const originalValueRef = useRef("");
  const lastSentValueRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.self === window.top || !page) return;

    const postToParent = (payload: Record<string, unknown>) => {
      if (!window.parent || window.parent === window) return;
      window.parent.postMessage(
        {
          ...payload,
          ...(vendorId ? { vendorId } : {}),
        },
        "*"
      );
    };

    const clearActive = () => {
      const active = activeElementRef.current;
      if (!active) return;
      active.removeAttribute("contenteditable");
      active.removeAttribute("spellcheck");
      active.removeAttribute("data-template-inline-active");
      activeElementRef.current = null;
      activePathRef.current = null;
      originalValueRef.current = "";
      lastSentValueRef.current = "";
    };

    const emitInlineUpdate = (path: string[], value: string) => {
      const nextValue = value.trim();
      if (nextValue === lastSentValueRef.current.trim()) return;
      postToParent({
        type: "template-inline-update",
        path,
        value: nextValue,
      });
      lastSentValueRef.current = nextValue;
    };

    const commitActive = () => {
      const active = activeElementRef.current;
      const path = activePathRef.current;
      if (!active || !path?.length) {
        clearActive();
        return;
      }

      const nextValue = (active.innerText || active.textContent || "").trim();
      const previousValue = originalValueRef.current.trim();
      if (nextValue !== previousValue) {
        emitInlineUpdate(path, nextValue);
      }
      clearActive();
    };

    const revertActive = () => {
      const active = activeElementRef.current;
      if (!active) {
        clearActive();
        return;
      }
      active.textContent = originalValueRef.current;
      clearActive();
    };

    const startInlineEdit = (element: HTMLElement, path: string[]) => {
      const currentlyActive = activeElementRef.current;
      if (currentlyActive && currentlyActive !== element) {
        commitActive();
      }

      activeElementRef.current = element;
      activePathRef.current = path;
      originalValueRef.current = element.innerText || element.textContent || "";
      lastSentValueRef.current = originalValueRef.current;

      element.setAttribute("contenteditable", "true");
      element.setAttribute("spellcheck", "true");
      element.setAttribute("data-template-inline-active", "true");
      element.focus();

      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    };

    const handleInput = (event: Event) => {
      const active = activeElementRef.current;
      const path = activePathRef.current;
      if (!active || !path?.length) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!active.contains(target)) return;
      const nextValue = (active.innerText || active.textContent || "").trim();
      emitInlineUpdate(path, nextValue);
    };

    const bestTextCandidate = (rawText: string, sectionId: string) => {
      const normalized = normalizeText(rawText);
      if (!normalized) return null;

      const textCandidates = candidates.filter((item) => item.kind === "text");
      const scoped = sectionId
        ? textCandidates.filter((item) => item.sectionId === sectionId)
        : textCandidates;
      const pool = scoped.length ? scoped : textCandidates;

      const exact = pool
        .filter((item) => normalizeText(item.value) === normalized)
        .sort((a, b) => b.value.length - a.value.length);
      if (exact.length) return exact[0];

      const includes = pool
        .filter((item) => {
          const normalizedValue = normalizeText(item.value);
          return (
            normalizedValue.length > 0 &&
            (normalized.includes(normalizedValue) ||
              normalizedValue.includes(normalized))
          );
        })
        .sort((a, b) => b.value.length - a.value.length);
      return includes[0] || null;
    };

    const bestImageCandidate = (img: HTMLImageElement, sectionId: string) => {
      const normalizedImage = normalizeUrl(img.currentSrc || img.getAttribute("src"));
      if (!normalizedImage) return null;
      const imageCandidates = candidates.filter((item) => item.kind === "image");
      const scoped = sectionId
        ? imageCandidates.filter((item) => item.sectionId === sectionId)
        : imageCandidates;
      const pool = scoped.length ? scoped : imageCandidates;
      return (
        pool.find((item) => normalizeUrl(item.value) === normalizedImage) || null
      );
    };

    const parsePath = (rawPath?: string | null) =>
      (rawPath || "")
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean);

    const resolveSelectionMeta = (target: HTMLElement) => {
      const explicitPathNode = target.closest<HTMLElement>("[data-template-path]");
      const sectionNode = target.closest<HTMLElement>("[data-template-section]");
      const componentNode = target.closest<HTMLElement>("[data-template-component]");
      const sectionFromData = sectionNode?.dataset.templateSection || "";
      const explicitPath = parsePath(explicitPathNode?.dataset.templatePath);
      const textHost = target.closest<HTMLElement>(SELECTOR_TEXT_HOST);
      const imageHost = target.closest("img");

      let selectedPath = explicitPath.length ? explicitPath : null;
      let sectionId = sectionFromData;

      if (!selectedPath && imageHost) {
        const imageCandidate = bestImageCandidate(imageHost, sectionId);
        if (imageCandidate) {
          selectedPath = imageCandidate.path;
          if (!sectionId) sectionId = imageCandidate.sectionId;
        }
      }

      if (!selectedPath && textHost) {
        const textCandidate = bestTextCandidate(
          textHost.innerText || textHost.textContent || "",
          sectionId
        );
        if (textCandidate) {
          selectedPath = textCandidate.path;
          if (!sectionId) sectionId = textCandidate.sectionId;
        }
      }

      if (!sectionId && selectedPath?.length) {
        sectionId = inferSectionFromPath(page, selectedPath);
      }

      const componentId =
        componentNode?.dataset.templateComponent ||
        (selectedPath?.length ? selectedPath.join(".") : "");

      return {
        host: textHost,
        path: selectedPath,
        sectionId,
        componentId,
        isImage: Boolean(imageHost),
      };
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("input, textarea, select")) return;

      const active = activeElementRef.current;
      if (active && !active.contains(target)) {
        commitActive();
      }

      const selectionMeta = resolveSelectionMeta(target);
      if (!selectionMeta.path?.length && !selectionMeta.sectionId) return;

      if (selectionMeta.sectionId) {
        postToParent({
          type: "template-editor-select",
          sectionId: selectionMeta.sectionId,
          componentId: selectionMeta.componentId || undefined,
        });
      }

      if (selectionMeta.isImage) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (!selectionMeta.path?.length || !selectionMeta.host) return;

      event.preventDefault();
      event.stopPropagation();
      startInlineEdit(selectionMeta.host, selectionMeta.path);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeElementRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        revertActive();
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        commitActive();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const active = activeElementRef.current;
      if (!active) return;
      const target = event.target as Node | null;
      if (target && active.contains(target)) return;
      commitActive();
    };

    const styleNode = document.createElement("style");
    styleNode.setAttribute("data-template-inline-style", "true");
    styleNode.textContent = `
      [data-template-inline-active="true"] {
        outline: 2px solid rgba(15, 23, 42, 0.5);
        outline-offset: 2px;
      }
      [data-template-path],
      [data-template-section] img {
        cursor: text;
      }
      [data-template-section] img {
        cursor: pointer;
      }
    `;
    document.head.appendChild(styleNode);

    document.addEventListener("click", handleClick, true);
    document.addEventListener("input", handleInput, true);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("input", handleInput, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      if (styleNode.parentNode) {
        styleNode.parentNode.removeChild(styleNode);
      }
      clearActive();
    };
  }, [candidates, page, vendorId]);

  return null;
}
