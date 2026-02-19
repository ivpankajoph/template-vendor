import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { WishlistItem } from "@/lib/wishlist";

interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

const customerWishlistSlice = createSlice({
  name: "customerWishlist",
  initialState,
  reducers: {
    addWishlistItem: (state, action: PayloadAction<WishlistItem>) => {
      const item = action.payload;
      if (!item?.product_id) return;
      state.items = state.items.filter(
        (wishlistItem) => wishlistItem.product_id !== item.product_id,
      );
      state.items.unshift(item);
    },
    removeWishlistItem: (state, action: PayloadAction<string>) => {
      const productId = String(action.payload || "");
      state.items = state.items.filter(
        (wishlistItem) => wishlistItem.product_id !== productId,
      );
    },
    toggleWishlistItem: (state, action: PayloadAction<WishlistItem>) => {
      const item = action.payload;
      if (!item?.product_id) return;
      const isExisting = state.items.some(
        (wishlistItem) => wishlistItem.product_id === item.product_id,
      );
      if (isExisting) {
        state.items = state.items.filter(
          (wishlistItem) => wishlistItem.product_id !== item.product_id,
        );
        return;
      }
      state.items.unshift(item);
    },
    clearWishlist: (state) => {
      state.items = [];
    },
  },
});

export const {
  addWishlistItem,
  removeWishlistItem,
  toggleWishlistItem,
  clearWishlist,
} = customerWishlistSlice.actions;

export default customerWishlistSlice.reducer;
