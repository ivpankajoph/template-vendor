import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface Vendor {
  _id: string;
  email: string;
  phone: string;
  role: string;
  is_email_verified: boolean;
  is_profile_completed: boolean;
  profile_complete_level: number;
  is_active: boolean;
  is_verified: boolean;
  country: string;
  business_type: string;
  categories: string[];
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  gst_number?: string;
  gst_cert?: string;
  pan_number?: string;
  pan_card?: string;
  bank_name?: string;
  bank_account?: string;
  branch?: string;
  ifsc_code?: string;
  upi_id?: string;
  alternate_contact_name?: string;
  alternate_contact_phone?: string;
  return_policy?: string;
  operating_hours?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProfileState {
  vendor: Vendor | null;
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
  lastErrorAt: number | null;
  currentVendorId: string | null;
  lastFetchedAt: number | null;
}

const initialState: VendorProfileState = {
  vendor: null,
  loading: false,
  error: null,
  errorStatus: null,
  lastErrorAt: null,
  currentVendorId: null,
  lastFetchedAt: null,
};

export const BASE_URL = NEXT_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 8_000;
const NOT_FOUND_RETRY_MS = 60 * 1000;
const MIN_REQUEST_GAP_MS = 5_000;
const vendorProfileLastRequestByVendor = new Map<string, number>();

type VendorApiError = {
  message: string;
  status: number | null;
};

type VendorProfileThunkState = {
  vendorprofilepage: VendorProfileState;
};

export const fetchVendorProfile = createAsyncThunk<
  Vendor,
  string,
  { state: VendorProfileThunkState; rejectValue: VendorApiError }
>(
  "vendor/fetchProfile",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/vendors/vendorprofile?id=${id}`, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      const vendor =
        response?.data?.vendor ??
        response?.data?.data?.vendor ??
        response?.data?.data ??
        null;

      if (!vendor || typeof vendor !== "object") {
        return rejectWithValue({
          message: "Vendor profile not found in API response",
          status: 404,
        });
      }

      return vendor as Vendor;
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
        "Failed to fetch vendor profile";
      const message =
        typeof rawMessage === "string" && rawMessage.trim()
          ? rawMessage
          : "Failed to fetch vendor profile";
      return rejectWithValue({ message, status });
    }
  },
  {
    condition: (id, { getState }) => {
      if (!id) return false;

      const now = Date.now();
      const lastRequestedAt = vendorProfileLastRequestByVendor.get(id) || 0;
      if (now - lastRequestedAt < MIN_REQUEST_GAP_MS) {
        return false;
      }

      const state = getState().vendorprofilepage;
      if (state?.loading && state.currentVendorId === id) {
        return false;
      }

      const inNotFoundCooldown =
        state?.currentVendorId === id &&
        state.errorStatus === 404 &&
        typeof state.lastErrorAt === "number" &&
        now - state.lastErrorAt < NOT_FOUND_RETRY_MS;

      if (inNotFoundCooldown) {
        return false;
      }

      vendorProfileLastRequestByVendor.set(id, now);
      return true;
    },
    dispatchConditionRejection: false,
  }
);

const vendorProfileSlice = createSlice({
  name: "vendorProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorProfile.pending, (state, action) => {
        const requestedVendorId = action.meta.arg;
        const hasCachedVendor =
          state.currentVendorId === requestedVendorId && Boolean(state.vendor);
        state.loading = !hasCachedVendor;
        state.error = null;
        state.errorStatus = null;
        state.lastErrorAt = null;
      })
      .addCase(fetchVendorProfile.fulfilled, (state, action: PayloadAction<Vendor, string, { arg: string }>) => {
        state.loading = false;
        state.vendor = action.payload;
        state.currentVendorId = action.meta.arg;
        state.lastFetchedAt = Date.now();
        state.error = null;
        state.errorStatus = null;
        state.lastErrorAt = null;
      })
      .addCase(fetchVendorProfile.rejected, (state, action) => {
        const requestedVendorId = action.meta.arg;
        const hasCachedVendor =
          state.currentVendorId === requestedVendorId && Boolean(state.vendor);
        const payload = action.payload as VendorApiError | undefined;
        state.loading = false;
        if (!hasCachedVendor) {
          state.vendor = null;
          state.currentVendorId = requestedVendorId || state.currentVendorId;
        }
        state.error = payload?.message || "Something went wrong";
        state.errorStatus = payload?.status ?? null;
        state.lastErrorAt = Date.now();
        if (payload?.status === 404) {
          state.lastFetchedAt = Date.now();
        }
      });
  },
});

export default vendorProfileSlice.reducer;
