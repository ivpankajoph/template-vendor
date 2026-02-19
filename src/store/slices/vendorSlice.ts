import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";



const BASE_URL = NEXT_PUBLIC_API_URL

// ------------------------------
// Async Thunk
// ------------------------------
export const updateVendorBusiness = createAsyncThunk(
  "vendor/updateBusiness",
  async (
    {

      formData,
    }: {

      formData: FormData;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state: any = getState();
      const token = state?.auth?.token;
    const response = await axios.put(
      `${BASE_URL}/vendors/business`,
      formData,
      {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Business update response:", response,response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update business details"
      );
    }
  }
);

// ------------------------------
// Slice
// ------------------------------
interface VendorState {
  loading: boolean;
  success: boolean;
  error: string | null;
  business: any | null;
}

const initialState: VendorState = {
  loading: false,
  success: false,
  error: null,
  business: null,
};

const vendorBusinessSlice = createSlice({
  name: "vendorBusiness",
  initialState,
  reducers: {
    resetBusinessState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateVendorBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateVendorBusiness.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.business = action.payload;
      })
      .addCase(updateVendorBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetBusinessState } = vendorBusinessSlice.actions;
export default vendorBusinessSlice.reducer;
