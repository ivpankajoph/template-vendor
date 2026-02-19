"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";
import { Button } from "@/components/ui/button";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";
import { addCartItem } from "@/store/slices/customerCartSlice";
import {
  clearWishlist,
  removeWishlistItem,
} from "@/store/slices/customerWishlistSlice";
import { toastError, toastSuccess } from "@/lib/toast";

const formatAmount = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function WishlistPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const token = useSelector((state: RootState) => state.customerAuth.token);
  const items = useSelector(
    (state: RootState) => state.customerWishlist?.items || [],
  );

  const addToCartFromWishlist = async (item: (typeof items)[number]) => {
    if (!item?.variant_id) {
      toastError("This product variant is missing. Open product and select again.");
      return;
    }
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      await dispatch(
        addCartItem({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: 1,
        }),
      ).unwrap();
      toastSuccess("Added to cart");
    } catch (error: any) {
      toastError(error || "Failed to add to cart");
    }
  };

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <main className="min-h-[70vh] bg-gradient-to-b from-rose-50 via-white to-white px-4 py-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
                <Heart className="h-7 w-7 fill-red-500 text-red-500" />
                My Wishlist
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {items.length} item{items.length === 1 ? "" : "s"} saved
              </p>
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => dispatch(clearWishlist())}
              >
                Clear Wishlist
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                Your wishlist is empty
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Tap the heart icon on products to save your favorites.
              </p>
              <Button asChild className="mt-5">
                <Link href="/">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.product_id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <Link
                    href={`/product/${item.product_category}/${item.product_id}`}
                    className="block"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                      <img
                        src={item.image_url || "/placeholder.png"}
                        alt={item.product_name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </Link>
                  <div className="space-y-2 p-4">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                      {item.product_name}
                    </p>
                    {item.brand ? (
                      <p className="text-xs text-slate-500">{item.brand}</p>
                    ) : null}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        {formatAmount(item.final_price)}
                      </span>
                      {item.actual_price > item.final_price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatAmount(item.actual_price)}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => addToCartFromWishlist(item)}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Bag
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => dispatch(removeWishlistItem(item.product_id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
