"use client";

import { useEffect } from "react";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import {
  applySeoOverrideToDocument,
  fetchSeoOverride,
  resolveSeoAppSourceFromPath,
} from "@/lib/admin-seo";

export default function SeoRuntime() {
  const pathname = usePathname() || "/";
  const currentOverrideRef = useRef<Awaited<ReturnType<typeof fetchSeoOverride>>>(null);
  const pathTokenRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    pathTokenRef.current += 1;
    const token = pathTokenRef.current;
    currentOverrideRef.current = null;

    const run = async () => {
      const appSource = resolveSeoAppSourceFromPath(pathname);
      const override = await fetchSeoOverride({
        appSource,
        path: pathname,
      });
      if (cancelled || token !== pathTokenRef.current) return;
      currentOverrideRef.current = override;
      applySeoOverrideToDocument(override);

      if (!override) return;
      window.setTimeout(() => {
        if (token !== pathTokenRef.current) return;
        applySeoOverrideToDocument(override);
      }, 1200);
      window.setTimeout(() => {
        if (token !== pathTokenRef.current) return;
        applySeoOverrideToDocument(override);
      }, 2600);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
