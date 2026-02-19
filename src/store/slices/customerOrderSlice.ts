import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userApi from "@/lib/userApi";

interface OrderState {
  loading: boolean;
  error: string | null;
  orders: any[];
}

const initialState: OrderState = {
  loading: false,
  error: null,
  orders: [],
};

export const createOrder = createAsyncThunk(
  "customerOrder/create",
  async (
    payload: {
      address_id: string;
      payment_method?: string;
      shipping_fee?: number;
      discount?: number;
      notes?: string;
      delivery_provider?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await userApi.post("/orders", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order",
      );
    }
  },
);

export const fetchOrders = createAsyncThunk(
  "customerOrder/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get("/orders");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders",
      );
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "customerOrder/cancel",
  async (payload: { id: string }, { rejectWithValue }) => {
    try {
      await userApi.put(`/orders/${payload.id}/cancel`);
      return { id: payload.id };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order",
      );
    }
  },
);

const orderSlice = createSlice({
  name: "customerOrder",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.orders || [];
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch orders";
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        const order = action.payload?.order;
        if (order) state.orders = [order, ...state.orders];
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const cancelledId = action.payload?.id;
        if (!cancelledId) return;
        state.orders = state.orders.map((item) =>
          item._id === cancelledId ? { ...item, status: "cancelled" } : item,
        );
      });
  },
});

export default orderSlice.reducer;
