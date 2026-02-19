export type WishlistItem = {
  product_id: string;
  product_name: string;
  product_category: string;
  image_url: string;
  final_price: number;
  actual_price: number;
  brand?: string;
  short_description?: string;
  variant_id?: string;
  variant_attributes?: Record<string, string>;
  stock_quantity?: number;
  added_at: string;
};

type CreateWishlistItemInput = {
  product_id: string;
  product_name: string;
  product_category: string;
  image_url?: string;
  final_price?: number;
  actual_price?: number;
  brand?: string;
  short_description?: string;
  variant_id?: string;
  variant_attributes?: Record<string, string>;
  stock_quantity?: number;
};

const toNonNegativeNumber = (value: number | undefined) => {
  const next = Number(value || 0);
  if (!Number.isFinite(next) || next < 0) return 0;
  return next;
};

export const createWishlistItem = (
  input: CreateWishlistItemInput,
): WishlistItem => ({
  product_id: String(input.product_id || ""),
  product_name: String(input.product_name || "Untitled Product"),
  product_category: String(input.product_category || "unknown"),
  image_url: String(input.image_url || "/placeholder.png"),
  final_price: toNonNegativeNumber(input.final_price),
  actual_price: toNonNegativeNumber(input.actual_price),
  brand: input.brand ? String(input.brand) : undefined,
  short_description: input.short_description
    ? String(input.short_description)
    : undefined,
  variant_id: input.variant_id ? String(input.variant_id) : undefined,
  variant_attributes: input.variant_attributes || undefined,
  stock_quantity:
    input.stock_quantity !== undefined
      ? toNonNegativeNumber(input.stock_quantity)
      : undefined,
  added_at: new Date().toISOString(),
});
