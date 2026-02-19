/* eslint-disable @typescript-eslint/no-explicit-any */
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

interface TemplateState {
  data: any | null;
  products: any[];
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
  lastErrorAt: number | null;
  currentVendorId: string | null;
  lastFetchedAt: number | null;
}

const initialState: TemplateState = {
  data: null,
  products: [],
  loading: false,
  error: null,
  errorStatus: null,
  lastErrorAt: null,
  currentVendorId: null,
  lastFetchedAt: null,
};

const BASE_URL = NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 8_000;
const NOT_FOUND_RETRY_MS = 60 * 1000;
const MIN_REQUEST_GAP_MS = 5_000;
const templateLastRequestByVendor = new Map<string, number>();
const templateEndpointPreference = new Map<string, "preview" | "fallback">();

type TemplateApiError = {
  message: string;
  status: number | null;
};

type TemplateThunkState = {
  alltemplatepage: TemplateState;
};

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};

const mergeTemplateDraft = (
  existingTemplate: unknown,
  incomingTemplate: unknown,
  sectionOrder?: string[]
) => {
  const existing = asRecord(existingTemplate);
  const incoming = asRecord(incomingTemplate);

  const merged = {
    ...existing,
    ...incoming,
    components: {
      ...asRecord(existing.components),
      ...asRecord(incoming.components),
    },
  } as Record<string, any>;

  if (Array.isArray(sectionOrder) && sectionOrder.length > 0) {
    merged.section_order = sectionOrder;
    merged.sectionOrder = sectionOrder;
    merged.components = {
      ...asRecord(merged.components),
      section_order: sectionOrder,
    };
  }

  return merged;
};

const fetchTemplatePayload = async (vendorId: string) => {
  const preferredEndpoint = templateEndpointPreference.get(vendorId);
  const previewUrl = `${BASE_URL}/templates/${vendorId}/preview`;
  const fallbackUrl = `${BASE_URL}/templates/template-all?vendor_id=${vendorId}`;

  const fetchPreview = async () => {
    const response = await axios.get(previewUrl, { timeout: REQUEST_TIMEOUT_MS });
    templateEndpointPreference.set(vendorId, "preview");
    return response.data;
  };

  const fetchFallback = async () => {
    const response = await axios.get(fallbackUrl, { timeout: REQUEST_TIMEOUT_MS });
    templateEndpointPreference.set(vendorId, "fallback");
    return response.data;
  };

  if (preferredEndpoint === "fallback") {
    try {
      return await fetchFallback();
    } catch {
      return fetchPreview();
    }
  }

  try {
    return await fetchPreview();
  } catch {
    return fetchFallback();
  }
};

export const fetchAlltemplatepageTemplate = createAsyncThunk<
  any,
  string,
  { state: TemplateThunkState; rejectValue: TemplateApiError }
>(
  "template/fetchAlltemplatepageTemplate",
  async (vendor_id: string, { rejectWithValue }) => {
    try {
      return await fetchTemplatePayload(vendor_id);
    } catch (error: any) {
      const status =
        typeof error?.response?.status === "number"
          ? error.response.status
          : typeof error?.status === "number"
            ? error.status
            : null;
      const rawMessage =
        error?.response?.data?.message ??
        error?.response?.data ??
        error?.message ??
        "Failed to fetch template";
      const message =
        typeof rawMessage === "string" && rawMessage.trim()
          ? rawMessage
          : "Failed to fetch template";
      return rejectWithValue({ message, status });
    }
  },
  {
    condition: (vendor_id, { getState }) => {
      if (!vendor_id) return false;

      const now = Date.now();
      const lastRequestedAt = templateLastRequestByVendor.get(vendor_id) || 0;
      if (now - lastRequestedAt < MIN_REQUEST_GAP_MS) {
        return false;
      }

      const state = getState().alltemplatepage;
      if (state?.loading && state.currentVendorId === vendor_id) {
        return false;
      }

      const inNotFoundCooldown =
        state?.currentVendorId === vendor_id &&
        state.errorStatus === 404 &&
        typeof state.lastErrorAt === "number" &&
        now - state.lastErrorAt < NOT_FOUND_RETRY_MS;

      if (inNotFoundCooldown) {
        return false;
      }

      templateLastRequestByVendor.set(vendor_id, now);
      return true;
    },
    dispatchConditionRejection: false,
  }
);

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    clearTemplate: (state) => {
      state.data = null;
      state.products = [];
      state.loading = false;
      state.error = null;
      state.errorStatus = null;
      state.lastErrorAt = null;
      state.currentVendorId = null;
      state.lastFetchedAt = null;
    },
    applyTemplatePreviewUpdate: (
      state,
      action: PayloadAction<{
        vendorId?: string;
        payload?: unknown;
        sectionOrder?: string[];
      }>
    ) => {
      const { vendorId, payload, sectionOrder } = action.payload;
      if (!payload || typeof payload !== "object") return;

      if (typeof vendorId === "string" && vendorId) {
        state.currentVendorId = vendorId;
      }

      state.data = mergeTemplateDraft(state.data, payload, sectionOrder);
      state.lastFetchedAt = Date.now();
      state.error = null;
      state.errorStatus = null;
      state.lastErrorAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlltemplatepageTemplate.pending, (state, action) => {
        const requestedVendorId = action.meta.arg;
        const hasCachedData =
          state.currentVendorId === requestedVendorId && Boolean(state.data);
        state.loading = !hasCachedData;
        state.error = null;
        state.errorStatus = null;
        state.lastErrorAt = null;
      })
      .addCase(
        fetchAlltemplatepageTemplate.fulfilled,
        (state, action: PayloadAction<any, string, { arg: string }>) => {
          state.loading = false;
          state.currentVendorId = action.meta.arg;
          state.lastFetchedAt = Date.now();
          const payload = action.payload;
          const template =
            payload?.data?.template || payload?.data || payload?.template || null;
          const products = Array.isArray(payload?.data?.products)
            ? payload.data.products
            : [];
          if (template) {
            state.data = template;
            state.products = products;
            state.error = null;
            state.errorStatus = null;
            state.lastErrorAt = null;
          } else {
            state.data = null;
            state.products = [];
            state.error = payload?.message || "Template not found";
            state.errorStatus = 404;
            state.lastErrorAt = Date.now();
          }
        }
      )

      .addCase(
        fetchAlltemplatepageTemplate.rejected,
        (state, action) => {
          const requestedVendorId = action?.meta?.arg;
          const hasCachedData =
            state.currentVendorId === requestedVendorId && Boolean(state.data);
          const payload = action.payload as TemplateApiError | undefined;
          state.loading = false;
          if (!hasCachedData) {
            state.data = null;
            state.products = [];
            state.currentVendorId = requestedVendorId || state.currentVendorId;
          }
          state.error = payload?.message || "Failed to fetch template";
          state.errorStatus = payload?.status ?? null;
          state.lastErrorAt = Date.now();
          if (payload?.status === 404) {
            state.lastFetchedAt = Date.now();
          }
        }
      );
  },
});

export const { clearTemplate, applyTemplatePreviewUpdate } =
  templateSlice.actions;
export default templateSlice.reducer;
