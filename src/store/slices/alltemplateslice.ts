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
  currentCitySlug: string | null;
  currentWebsiteId: string | null;
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
  currentCitySlug: null,
  currentWebsiteId: null,
  lastFetchedAt: null,
};

const API_BASE_URL = String(NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const BASE_URL = API_BASE_URL.endsWith("/v1") ? API_BASE_URL : `${API_BASE_URL}/v1`;
const REQUEST_TIMEOUT_MS = 8_000;
const NOT_FOUND_RETRY_MS = 60 * 1000;
const MIN_REQUEST_GAP_MS = 5_000;
const templateLastRequestByVendorCity = new Map<string, number>();
const templateEndpointPreference = new Map<string, "preview" | "fallback">();

type TemplateApiError = {
  message: string;
  status: number | null;
};

type TemplateThunkState = {
  alltemplatepage: TemplateState;
};

type TemplateFetchArg = {
  vendorId: string;
  citySlug?: string;
  websiteId?: string;
};

const normalizeCitySlug = (value?: string) => {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "all";
};

const normalizeWebsiteId = (value?: string) => String(value || "").trim();

const getRequestKey = (vendorId: string, citySlug?: string, websiteId?: string) =>
  `${vendorId}::${normalizeCitySlug(citySlug)}::${normalizeWebsiteId(websiteId) || "default"}`;

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

const fetchTemplatePayload = async (vendorId: string, citySlug?: string, websiteId?: string) => {
  const requestKey = getRequestKey(vendorId, citySlug, websiteId);
  const preferredEndpoint = templateEndpointPreference.get(requestKey);
  const normalizedCity = normalizeCitySlug(citySlug);
  const normalizedWebsiteId = normalizeWebsiteId(websiteId);
  const websiteQuery = normalizedWebsiteId
    ? `&website_id=${encodeURIComponent(normalizedWebsiteId)}`
    : "";
  const previewUrl = `${BASE_URL}/templates/${vendorId}/preview?city=${encodeURIComponent(
    normalizedCity
  )}${websiteQuery}`;
  const fallbackUrl = `${BASE_URL}/templates/preview?vendor_id=${encodeURIComponent(
    vendorId
  )}&city=${encodeURIComponent(normalizedCity)}${websiteQuery}`;

  const fetchPreview = async () => {
    const response = await axios.get(previewUrl, { timeout: REQUEST_TIMEOUT_MS });
    templateEndpointPreference.set(requestKey, "preview");
    return response.data;
  };

  const fetchFallback = async () => {
    const response = await axios.get(fallbackUrl, { timeout: REQUEST_TIMEOUT_MS });
    templateEndpointPreference.set(requestKey, "fallback");
    return response.data;
  };

  const fetchVendorCatalogProducts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/vendors/catalog/${vendorId}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      const payload = response?.data;
      return Array.isArray(payload?.products) ? payload.products : [];
    } catch {
      return [];
    }
  };

  const ensureProductsFallback = async (templateResponse: any) => {
    const hasProductsField =
      Array.isArray(templateResponse?.data?.products) ||
      Array.isArray(templateResponse?.products);
    const currentProducts = Array.isArray(templateResponse?.data?.products)
      ? templateResponse.data.products
      : Array.isArray(templateResponse?.products)
        ? templateResponse.products
        : [];

    if (currentProducts.length > 0) return templateResponse;
    if (hasProductsField) return templateResponse;
    if (normalizedWebsiteId) return templateResponse;

    const fallbackProducts = await fetchVendorCatalogProducts();
    if (!fallbackProducts.length) return templateResponse;

    if (templateResponse?.data && typeof templateResponse.data === "object") {
      templateResponse.data.products = fallbackProducts;
      return templateResponse;
    }

    if (templateResponse && typeof templateResponse === "object") {
      templateResponse.products = fallbackProducts;
    }

    return templateResponse;
  };

  if (preferredEndpoint === "fallback") {
    try {
      return await ensureProductsFallback(await fetchFallback());
    } catch {
      return ensureProductsFallback(await fetchPreview());
    }
  }

  try {
    return await ensureProductsFallback(await fetchPreview());
  } catch {
    return ensureProductsFallback(await fetchFallback());
  }
};

export const fetchAlltemplatepageTemplate = createAsyncThunk<
  any,
  TemplateFetchArg,
  { state: TemplateThunkState; rejectValue: TemplateApiError }
>(
  "template/fetchAlltemplatepageTemplate",
  async (arg: TemplateFetchArg, { rejectWithValue }) => {
    try {
      return await fetchTemplatePayload(arg.vendorId, arg.citySlug, arg.websiteId);
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
    condition: (arg, { getState }) => {
      const vendor_id = String(arg?.vendorId || "");
      const citySlug = normalizeCitySlug(arg?.citySlug);
      const websiteId = normalizeWebsiteId(arg?.websiteId);
      if (!vendor_id) return false;

      const now = Date.now();
      const requestKey = getRequestKey(vendor_id, citySlug, websiteId);
      const lastRequestedAt = templateLastRequestByVendorCity.get(requestKey) || 0;
      if (now - lastRequestedAt < MIN_REQUEST_GAP_MS) {
        return false;
      }

      const state = getState().alltemplatepage;
      if (
        state?.loading &&
        state.currentVendorId === vendor_id &&
        normalizeCitySlug(state.currentCitySlug || "all") === citySlug &&
        normalizeWebsiteId(state.currentWebsiteId || "") === websiteId
      ) {
        return false;
      }

      const inNotFoundCooldown =
        state?.currentVendorId === vendor_id &&
        normalizeCitySlug(state.currentCitySlug || "all") === citySlug &&
        normalizeWebsiteId(state.currentWebsiteId || "") === websiteId &&
        state.errorStatus === 404 &&
        typeof state.lastErrorAt === "number" &&
        now - state.lastErrorAt < NOT_FOUND_RETRY_MS;

      if (inNotFoundCooldown) {
        return false;
      }

      templateLastRequestByVendorCity.set(requestKey, now);
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
      state.currentCitySlug = null;
      state.currentWebsiteId = null;
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
        const requestedVendorId = action.meta.arg.vendorId;
        const requestedCitySlug = normalizeCitySlug(action.meta.arg.citySlug);
        const requestedWebsiteId = normalizeWebsiteId(action.meta.arg.websiteId);
        const hasCachedData =
          state.currentVendorId === requestedVendorId &&
          normalizeCitySlug(state.currentCitySlug || "all") === requestedCitySlug &&
          normalizeWebsiteId(state.currentWebsiteId || "") === requestedWebsiteId &&
          Boolean(state.data);
        state.loading = !hasCachedData;
        state.error = null;
        state.errorStatus = null;
        state.lastErrorAt = null;
      })
      .addCase(
        fetchAlltemplatepageTemplate.fulfilled,
        (
          state,
          action: PayloadAction<any, string, { arg: TemplateFetchArg }>
        ) => {
          state.loading = false;
          state.currentVendorId = action.meta.arg.vendorId;
          state.currentCitySlug = normalizeCitySlug(action.meta.arg.citySlug);
          state.currentWebsiteId = normalizeWebsiteId(action.meta.arg.websiteId) || null;
          state.lastFetchedAt = Date.now();
          const payload = action.payload;
          const template =
            payload?.data?.template || payload?.data || payload?.template || null;
          const products = Array.isArray(payload?.data?.products)
            ? payload.data.products
            : Array.isArray(payload?.products)
              ? payload.products
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
          const requestedVendorId = action?.meta?.arg?.vendorId;
          const requestedCitySlug = normalizeCitySlug(action?.meta?.arg?.citySlug);
          const requestedWebsiteId = normalizeWebsiteId(action?.meta?.arg?.websiteId);
          const hasCachedData =
            state.currentVendorId === requestedVendorId &&
            normalizeCitySlug(state.currentCitySlug || "all") === requestedCitySlug &&
            normalizeWebsiteId(state.currentWebsiteId || "") === requestedWebsiteId &&
            Boolean(state.data);
          const payload = action.payload as TemplateApiError | undefined;
          state.loading = false;
          if (!hasCachedData) {
            state.data = null;
            state.products = [];
            state.currentVendorId = requestedVendorId || state.currentVendorId;
            state.currentCitySlug = requestedCitySlug || state.currentCitySlug;
            state.currentWebsiteId = requestedWebsiteId || state.currentWebsiteId;
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
