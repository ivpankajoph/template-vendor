import { getTemplateAuth, templateApiFetch } from "../templateAuth";

export type PocoFoodWishlistItem = {
  product_id: string;
  product_name: string;
  category?: string;
  image_url?: string;
  price?: number;
  href?: string;
  added_at: string;
};

export const pocoFoodWishlistKey = (vendorId: string) =>
  `pocofood-wishlist-${vendorId}`;

export const normalizePocoFoodWishlist = (
  value: unknown
): PocoFoodWishlistItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") {
        return {
          product_id: item,
          product_name: "Saved item",
          added_at: new Date(0).toISOString(),
        };
      }

      if (!item || typeof item !== "object") return null;

      const record = item as Partial<PocoFoodWishlistItem>;
      const productId = String(record.product_id || "").trim();
      if (!productId) return null;

      return {
        product_id: productId,
        product_name: String(record.product_name || "Saved item").trim(),
        category: record.category ? String(record.category).trim() : undefined,
        image_url: record.image_url ? String(record.image_url).trim() : undefined,
        price: Number.isFinite(Number(record.price)) ? Number(record.price) : undefined,
        href: record.href ? String(record.href).trim() : undefined,
        added_at: String(record.added_at || new Date().toISOString()),
      };
    })
    .filter(Boolean) as PocoFoodWishlistItem[];
};

export const readPocoFoodWishlist = (vendorId: string) => {
  if (typeof window === "undefined" || !vendorId) return [];

  try {
    const stored = window.localStorage.getItem(pocoFoodWishlistKey(vendorId));
    return normalizePocoFoodWishlist(stored ? JSON.parse(stored) : []);
  } catch {
    return [];
  }
};

export const writePocoFoodWishlist = (
  vendorId: string,
  items: PocoFoodWishlistItem[]
) => {
  if (typeof window === "undefined" || !vendorId) return;
  const normalizedItems = normalizePocoFoodWishlist(items);
  window.localStorage.setItem(
    pocoFoodWishlistKey(vendorId),
    JSON.stringify(normalizedItems)
  );
  window.dispatchEvent(new Event("pocofood-wishlist-updated"));
  void pushPocoFoodWishlistToAccount(vendorId, normalizedItems);
};

export const removePocoFoodWishlistItem = (
  vendorId: string,
  productId: string
) => {
  const nextItems = readPocoFoodWishlist(vendorId).filter(
    (item) => item.product_id !== productId
  );
  writePocoFoodWishlist(vendorId, nextItems);
  return nextItems;
};

const mergeWishlistItems = (
  localItems: PocoFoodWishlistItem[],
  accountItems: PocoFoodWishlistItem[]
) => {
  const map = new Map<string, PocoFoodWishlistItem>();

  [...accountItems, ...localItems].forEach((item) => {
    const productId = String(item?.product_id || "").trim();
    if (!productId) return;
    const existing = map.get(productId);
    map.set(productId, {
      ...existing,
      ...item,
      product_id: productId,
      product_name:
        item.product_name && item.product_name !== "Saved item"
          ? item.product_name
          : existing?.product_name || "Saved item",
      added_at: item.added_at || existing?.added_at || new Date().toISOString(),
    });
  });

  return Array.from(map.values());
};

export const pushPocoFoodWishlistToAccount = async (
  vendorId: string,
  items = readPocoFoodWishlist(vendorId)
) => {
  if (!getTemplateAuth(vendorId)?.token) return items;

  try {
    const data = await templateApiFetch(vendorId, "/wishlist", {
      method: "PUT",
      body: JSON.stringify({ items: normalizePocoFoodWishlist(items) }),
    });
    return normalizePocoFoodWishlist(data?.items || items);
  } catch {
    return items;
  }
};

export const syncPocoFoodWishlistWithAccount = async (vendorId: string) => {
  const localItems = readPocoFoodWishlist(vendorId);
  if (!getTemplateAuth(vendorId)?.token) return localItems;

  try {
    const data = await templateApiFetch(vendorId, "/wishlist");
    const accountItems = normalizePocoFoodWishlist(data?.items || []);
    const mergedItems = mergeWishlistItems(localItems, accountItems);
    window.localStorage.setItem(
      pocoFoodWishlistKey(vendorId),
      JSON.stringify(mergedItems)
    );
    window.dispatchEvent(new Event("pocofood-wishlist-updated"));
    void pushPocoFoodWishlistToAccount(vendorId, mergedItems);
    return mergedItems;
  } catch {
    return localItems;
  }
};
