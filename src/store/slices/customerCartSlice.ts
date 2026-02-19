import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userApi from "@/lib/userApi";

interface CartState {
  loading: boolean;
  error: string | null;
  cart: any | null;
}

const initialState: CartState = {
  loading: false,
  error: null,
  cart: null,
};

export const fetchCart = createAsyncThunk(
  "customerCart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.get("/cart");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch cart",
      );
    }
  },
);

export const addCartItem = createAsyncThunk(
  "customerCart/add",
  async (
    payload: { product_id: string; variant_id: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await userApi.post("/cart", payload);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add to cart",
      );
    }
  },
);

export const updateCartItem = createAsyncThunk(
  "customerCart/update",
  async (
    payload: { itemId: string; quantity: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await userApi.put(`/cart/item/${payload.itemId}`, {
        quantity: payload.quantity,
      });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update cart",
      );
    }
  },
);

export const removeCartItem = createAsyncThunk(
  "customerCart/remove",
  async (payload: { itemId: string }, { rejectWithValue }) => {
    try {
      const res = await userApi.delete(`/cart/item/${payload.itemId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove item",
      );
    }
  },
);

export const clearCart = createAsyncThunk(
  "customerCart/clear",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.delete("/cart");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear cart",
      );
    }
  },
);

const cartSlice = createSlice({
  name: "customerCart",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload?.cart || null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch cart";
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        state.cart = action.payload?.cart || state.cart;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.cart = action.payload?.cart || state.cart;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.cart = action.payload?.cart || state.cart;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.cart = action.payload?.cart || null;
      });
  },
});

export default cartSlice.reducer;
