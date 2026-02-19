"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { applyTemplatePreviewUpdate } from "@/store/slices/alltemplateslice";

type TemplatePreviewMessage = {
  type?: string;
  vendorId?: string;
  payload?: unknown;
  sectionOrder?: string[];
};

type Props = {
  vendorId?: string;
};

export function TemplatePreviewRealtimeSync({ vendorId }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as TemplatePreviewMessage | null;
      if (!data || data.type !== "template-preview-update") return;
      if (typeof data.vendorId !== "string" || !data.vendorId) return;
      if (vendorId && data.vendorId !== vendorId) return;
      if (!data.payload || typeof data.payload !== "object") return;

      dispatch(
        applyTemplatePreviewUpdate({
          vendorId: data.vendorId,
          payload: data.payload,
          sectionOrder: Array.isArray(data.sectionOrder)
            ? data.sectionOrder
            : undefined,
        })
      );
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [dispatch, vendorId]);

  return null;
}
