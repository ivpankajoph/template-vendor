"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_DELAY_MS = 120;
const AUTO_HIDE_MS = 3000;
const MIN_VISIBLE_MS = 150;

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);

  const visibleRef = useRef(false);
  const startedAtRef = useRef(0);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setVisible = useCallback((next: boolean) => {
    visibleRef.current = next;
    setIsVisible(next);
  }, []);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const beginNavigation = useCallback(() => {
    if (visibleRef.current || showTimerRef.current) return;
    clearTimers();
    showTimerRef.current = setTimeout(() => {
      showTimerRef.current = null;
      startedAtRef.current = Date.now();
      setVisible(true);
      autoHideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, AUTO_HIDE_MS);
    }, START_DELAY_MS);
  }, [clearTimers, setVisible]);

  const finishNavigation = useCallback(() => {
    if (!visibleRef.current) {
      clearTimers();
      return;
    }
    const elapsed = Date.now() - startedAtRef.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, delay);
  }, [clearTimers, setVisible]);

  useEffect(() => {
    const willChangeUrl = (nextUrlLike: string | URL | null | undefined) => {
      if (!nextUrlLike) return false;
      try {
        const nextUrl = new URL(String(nextUrlLike), window.location.href);
        return (
          nextUrl.pathname !== window.location.pathname ||
          nextUrl.search !== window.location.search
        );
      } catch {
        return false;
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as Element | null;
      if (!target) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const interactiveChild = target.closest(
        "button, input, select, textarea, [role='button']",
      );
      if (interactiveChild && interactiveChild !== anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;

      if (
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search
      ) {
        return;
      }

      beginNavigation();
    };

    const handlePopState = () => {
      beginNavigation();
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      if (willChangeUrl(args[2] as string | URL | null | undefined)) {
        beginNavigation();
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      if (willChangeUrl(args[2] as string | URL | null | undefined)) {
        beginNavigation();
      }
      return originalReplaceState.apply(this, args);
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearTimers();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [beginNavigation, clearTimers]);

  useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams, finishNavigation]);

  return (
    <>
      <div
        aria-hidden={!isVisible}
        className={`pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-150 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute left-0 top-0 h-[3px] w-full overflow-hidden bg-orange-500/15">
          <span className="block h-full w-1/3 animate-[page-loader-slide_1.05s_ease-in-out_infinite] bg-orange-500/90" />
        </div>
        <span className="absolute right-4 top-4 h-6 w-6 animate-spin rounded-full border-2 border-slate-300/70 border-t-orange-500" />
      </div>
      <style jsx global>{`
        @keyframes page-loader-slide {
          0% {
            transform: translateX(-110%);
          }
          50% {
            transform: translateX(125%);
          }
          100% {
            transform: translateX(310%);
          }
        }
      `}</style>
    </>
  );
}
