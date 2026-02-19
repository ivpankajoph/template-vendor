import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface Banner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BannerState {
  banners: Banner[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: BannerState = {
  banners: [],
  loading: false,
  error: null,
  success: false,
};

const BASE_URL = NEXT_PUBLIC_API_URL;

export const fetchBanners = createAsyncThunk<Banner[], void, { rejectValue: string }>(
  "banners/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE_URL}/banners`);


      if (!Array.isArray(res.data)) {
        console.error("Unexpected response format:", res.data);
        throw new Error("Invalid response structure");
      }

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch banners");
    }
  }
);

const bannerSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload; // ✅ sets array correctly
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Error fetching banners";
      });
  },
});

export default bannerSlice.reducer;
