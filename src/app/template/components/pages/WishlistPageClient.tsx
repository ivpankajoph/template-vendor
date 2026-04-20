"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Heart, ShoppingBasket, Trash2 } from "lucide-react";

import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { buildTemplateScopedPath } from "@/lib/template-route";
import { getTemplateAuth, templateApiFetch } from "@/app/template/components/templateAuth";
import {
  readPocoFoodWishlist,
  removePocoFoodWishlistItem,
  syncPocoFoodWishlistWithAccount,
  writePocoFoodWishlist,
  type PocoFoodWishlistItem,
} from "@/app/template/components/pocofood/pocofood-wishlist";

type FoodMenuItem = {
  _id?: string;
  item_name?: string;
  category?: string;
  price?: number;
  offer_price?: number;
  image_url?: string;
  gallery_images?: string[];
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const formatMoney = (value?: number) =>
  Number.isFinite(Number(value))
    ? `Rs. ${Number(value || 0).toLocaleString("en-IN")}`
    : "";

const getFoodImage = (item?: FoodMenuItem) => {
  const direct = String(item?.image_url || "").trim();
  if (direct) return direct;
  const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : [];
  return gallery.map((image) => String(image || "").trim()).find(Boolean) || "";
};

export default function WishlistPageClient() {
  const params = useParams();
  const pathname = usePathname();
  const vendorId = String((params as any)?.vendor_id || "");
  const [wishlistItems, setWishlistItems] = useState<PocoFoodWishlistItem[]>([]);
  const [menuItems, setMenuItems] = useState<FoodMenuItem[]>([]);
  const [addingId, setAddingId] = useState("");
  const [message, setMessage] = useState("");

  const toTemplatePath = (suffix = "") =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || "/",
      suffix,
    });

  useEffect(() => {
    if (!vendorId || typeof window === "undefined") return;

    const syncWishlist = () => setWishlistItems(readPocoFoodWishlist(vendorId));
    syncWishlist();
    void syncPocoFoodWishlistWithAccount(vendorId);

    window.addEventListener("pocofood-wishlist-updated", syncWishlist);
    window.addEventListener("storage", syncWishlist);
    window.addEventListener("focus", syncWishlist);
    const handleAuthRefresh = () => {
      syncWishlist();
      void syncPocoFoodWishlistWithAccount(vendorId);
    };
    window.addEventListener("template-auth-updated", handleAuthRefresh);

    return () => {
      window.removeEventListener("pocofood-wishlist-updated", syncWishlist);
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener("focus", syncWishlist);
      window.removeEventListener("template-auth-updated", handleAuthRefresh);
    };
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;

    const loadMenu = async () => {
      try {
        const response = await fetch(`${API_BASE}/vendors/${vendorId}/food-storefront`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);
        if (cancelled) return;
        setMenuItems(Array.isArray(payload?.data?.menu_items) ? payload.data.menu_items : []);
      } catch {
        if (!cancelled) setMenuItems([]);
      }
    };

    void loadMenu();

    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  const resolvedItems = useMemo(() => {
    const menuById = new Map(menuItems.map((item) => [String(item?._id || ""), item]));

    return wishlistItems.map((item) => {
      const menuItem = menuById.get(item.product_id);
      const price =
        item.price ??
        (Number(menuItem?.offer_price || 0) ||
          Number(menuItem?.price || 0) ||
          undefined);

      return {
        ...item,
        product_name:
          item.product_name !== "Saved item"
            ? item.product_name
            : String(menuItem?.item_name || item.product_name),
        category: item.category || menuItem?.category,
        image_url: item.image_url || getFoodImage(menuItem),
        price,
        href: item.href || toTemplatePath(`product/${item.product_id}`),
      };
    });
  }, [menuItems, pathname, vendorId, wishlistItems]);

  const removeItem = (productId: string) => {
    setWishlistItems(removePocoFoodWishlistItem(vendorId, productId));
  };

  const clearWishlist = () => {
    writePocoFoodWishlist(vendorId, []);
    setWishlistItems([]);
  };

  const addToCart = async (item: PocoFoodWishlistItem) => {
    setMessage("");
    if (!vendorId || !item.product_id) return;

    const auth = getTemplateAuth(vendorId);
    if (!auth?.token) {
      window.location.href = `${toTemplatePath("login")}?next=${encodeURIComponent(pathname || toTemplatePath("wishlist"))}`;
      return;
    }

    setAddingId(item.product_id);
    try {
      await templateApiFetch(vendorId, "/cart", {
        method: "POST",
        body: JSON.stringify({
          food_menu_item_id: item.product_id,
          quantity: 1,
        }),
      });
      window.dispatchEvent(new CustomEvent("template-cart-updated"));
      setMessage(`${item.product_name} added to cart.`);
    } catch (error: any) {
      setMessage(error?.message || "Failed to add item to cart.");
    } finally {
      setAddingId("");
    }
  };

  return (
    <main className="min-h-screen bg-[#fbfaf4] text-[#171717]">
      <section className="border-y border-[#f2ead4] bg-[#fff7e4] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#d94b2b]">
            Wishlist
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                Saved food items
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6b5d]">
                Keep favorite dishes ready for your next order.
              </p>
            </div>
            {resolvedItems.length ? (
              <button
                type="button"
                onClick={clearWishlist}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadfb7] bg-white px-5 py-3 text-sm font-extrabold text-[#d94b2b] transition hover:bg-[#fff6d6]"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </button>
            ) : null}
          </div>
          {message ? (
            <p className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#171717]">
              {message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {resolvedItems.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resolvedItems.map((item) => (
              <article
                key={item.product_id}
                className="overflow-hidden rounded-[24px] border border-[#eadfb7] bg-white p-4 shadow-[0_16px_36px_rgba(23,23,23,0.05)]"
              >
                <Link
                  href={item.href || toTemplatePath(`product/${item.product_id}`)}
                  className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[20px] bg-[#fff6d6]"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Heart className="h-10 w-10 text-[#d94b2b]" />
                  )}
                </Link>
                <div className="mt-4">
                  {item.category ? (
                    <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#d94b2b]">
                      {item.category}
                    </p>
                  ) : null}
                  <Link
                    href={item.href || toTemplatePath(`product/${item.product_id}`)}
                    className="mt-2 line-clamp-2 block text-xl font-extrabold leading-tight tracking-[-0.03em]"
                  >
                    {item.product_name}
                  </Link>
                  {formatMoney(item.price) ? (
                    <p className="mt-3 text-lg font-extrabold text-[#ffae00]">
                      {formatMoney(item.price)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <button
                    type="button"
                    onClick={() => void addToCart(item)}
                    disabled={addingId === item.product_id}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ffc222] px-4 py-3 text-sm font-extrabold text-[#171717] transition hover:bg-[#ffae00] disabled:opacity-60"
                  >
                    <ShoppingBasket className="h-4 w-4" />
                    {addingId === item.product_id ? "Adding..." : "Add to cart"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product_id)}
                    className="inline-flex items-center justify-center rounded-full border border-[#eadfb7] px-4 py-3 text-sm font-extrabold text-[#d94b2b] transition hover:bg-[#fff6d6]"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#eadfb7] bg-white px-6 text-center">
            <Heart className="h-12 w-12 text-[#d94b2b]" />
            <h2 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">
              Your wishlist is empty
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6f6b5d]">
              Save dishes from the menu and they will appear here.
            </p>
            <Link
              href={toTemplatePath("all-products")}
              className="mt-6 rounded-full bg-[#ffc222] px-6 py-3 text-sm font-extrabold text-[#171717] transition hover:bg-[#ffae00]"
            >
              Browse menu
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
