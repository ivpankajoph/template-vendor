"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Props = {
  children: ReactNode;
};

const parseFocusSections = (value: string | null) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const hasFocusedDescendant = (element: HTMLElement, focusSections: string[]) =>
  focusSections.some((sectionId) =>
    Boolean(element.querySelector(`[data-template-section="${sectionId}"]`))
  );

export function TemplatePreviewShell({ children }: Props) {
  const searchParams = useSearchParams();
  const previewChrome = searchParams.get("previewChrome");
  const focusSections = useMemo(
    () => parseFocusSections(searchParams.get("previewFocus")),
    [searchParams]
  );
  const hideNavbar =
    previewChrome === "content-only" || previewChrome === "hide-nav";
  const hideFooter = previewChrome === "content-only";

  useEffect(() => {
    if (!focusSections.length) return;

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-template-section]")
    );
    const cleanupEntries: Array<() => void> = [];

    elements.forEach((element) => {
      const ownSection = String(element.dataset.templateSection || "").trim();
      const closestParentSection = element.parentElement?.closest<HTMLElement>(
        "[data-template-section]"
      );
      const parentSection = String(
        closestParentSection?.dataset.templateSection || ""
      ).trim();
      const shouldShow =
        focusSections.includes(ownSection) ||
        focusSections.includes(parentSection) ||
        hasFocusedDescendant(element, focusSections);

      const previousDisplay = element.style.display;
      const previousVisibility = element.style.visibility;
      const previousPointerEvents = element.style.pointerEvents;

      if (!shouldShow) {
        element.style.display = "none";
      } else {
        element.style.visibility = "visible";
        element.style.pointerEvents = "";
      }

      cleanupEntries.push(() => {
        element.style.display = previousDisplay;
        element.style.visibility = previousVisibility;
        element.style.pointerEvents = previousPointerEvents;
      });
    });

    const firstFocused = focusSections
      .map((sectionId) =>
        document.querySelector<HTMLElement>(
          `[data-template-section="${sectionId}"]`
        )
      )
      .find(Boolean);

    firstFocused?.scrollIntoView({
      block: "start",
      behavior: "auto",
    });

    return () => {
      cleanupEntries.forEach((cleanup) => cleanup());
    };
  }, [focusSections]);

  return (
    <div className="template-site-shell min-h-screen flex flex-col">
      {!hideNavbar ? <Navbar /> : null}
      <main className="template-site-main flex-grow">{children}</main>
      {!hideFooter ? <Footer /> : null}
    </div>
  );
}
