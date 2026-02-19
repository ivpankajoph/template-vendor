"use client";

import { useEffect } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTemplateVariant } from "./useTemplateVariant";

export function TemplateVariantParamEnforcer() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const variant = useTemplateVariant();

  const vendorId =
    typeof (params as any)?.vendor_id === "string"
      ? ((params as any).vendor_id as string)
      : "";

  useEffect(() => {
    if (!vendorId || !pathname?.startsWith(`/template/${vendorId}`)) return;
    const currentTemplate = searchParams?.get("template");
    if (currentTemplate && currentTemplate.trim()) return;

    const nextSearch = new URLSearchParams(searchParams?.toString() || "");
    nextSearch.set("template", variant.key);
    const nextHref = `${pathname}?${nextSearch.toString()}`;

    router.replace(nextHref, { scroll: false });
  }, [pathname, router, searchParams, variant.key, vendorId]);

  return null;
}
