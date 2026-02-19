import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userApi from "@/lib/userApi";

interface AddressState {
  loading: boolean;
  error: string | null;
  addresses: any[];
}

const initialState: AddressState = {
  loading: false,
  error: null,
  addresses: [],
};

export const fetchAddresses = createAsyncThunk(
  "customerAddress/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get("/addresses");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch addresses",
      );
    }
  },
);

export const createAddress = createAsyncThunk(
  "customerAddress/create",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await userApi.post("/addresses", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create address",
      );
    }
  },
);

export const updateAddress = createAsyncThunk(
  "customerAddress/update",
  async (payload: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const res = await userApi.put(`/addresses/${payload.id}`, payload.data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update address",
      );
    }
  },
);

export const deleteAddress = createAsyncThunk(
  "customerAddress/delete",
  async (payload: { id: string }, { rejectWithValue }) => {
    try {
      const res = await userApi.delete(`/addresses/${payload.id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete address",
      );
    }
  },
);

const addressSlice = createSlice({
  name: "customerAddress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload?.addresses || [];
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch addresses";
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        const address = action.payload?.address;
        if (address) {
          state.addresses = [address, ...state.addresses];
        }
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const address = action.payload?.address;
        if (!address) return;
        state.addresses = state.addresses.map((item) =>
          item._id === address._id ? address : item,
        );
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        const deletedId = action.meta.arg.id;
        state.addresses = state.addresses.filter((item) => item._id !== deletedId);
      });
  },
});

export default addressSlice.reducer;
