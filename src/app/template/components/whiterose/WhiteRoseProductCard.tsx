"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star, Truck } from "lucide-react";

import {
  type WhiteRoseProduct,
  whiteRoseFormatCurrency,
  whiteRoseGetLeadImage,
  whiteRoseGetPricing,
  whiteRoseGetRating,
} from "./whiterose-utils";
import { getRichTextPreview } from "@/lib/rich-text";

type WhiteRoseProductCardProps = {
  product: WhiteRoseProduct;
  href: string;
  categoryLabel?: string;
  badgeLabel?: string;
  onAddToCart?: () => void;
  isAdding?: boolean;
  showAddToCart?: boolean;
  compact?: boolean;
  className?: string;
};

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function WhiteRoseProductCard({
  product,
  href,
  categoryLabel,
  badgeLabel,
  onAddToCart,
  isAdding = false,
  showAddToCart = true,
  compact = false,
  className,
}: WhiteRoseProductCardProps) {
  const pricing = whiteRoseGetPricing(product);
  const imageUrl = whiteRoseGetLeadImage(product);
  const rating = whiteRoseGetRating(product);
  const ratingCount = Number(product?.ratingsCount || 86);
  const accentBadge =
    badgeLabel ||
    (pricing.discountPercent > 0 ? `${pricing.discountPercent}% off` : "Fast moving");

  return (
    <article
      className={joinClasses(
        "group overflow-hidden rounded-[18px] border border-[#dfe3eb] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(40,116,240,0.14)]",
        className
      )}
    >
      <Link href={href} className="block">
        <div className="relative overflow-hidden bg-[#f8fafc]">
          <div className={compact ? "h-56" : "h-64 sm:h-72"}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product?.productName || "Product"}
                className="h-full w-full bg-white object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-[#ffecb3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a5200]">
            {accentBadge}
          </div>
          <div className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2874f0] shadow-sm">
            <Heart className="h-4 w-4" />
          </div>
        </div>
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2874f0]">
            {categoryLabel || "Top pick"}
          </span>
          <span
            className={joinClasses(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              pricing.stockQuantity > 0
                ? "bg-[#ecfdf3] text-[#027a48]"
                : "bg-[#fef2f2] text-[#b42318]"
            )}
          >
            {pricing.stockQuantity > 0 ? "In stock" : "Sold out"}
          </span>
        </div>

        <Link href={href} className="block">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 text-[#172337]">
            {product?.productName || "Untitled product"}
          </h3>
        </Link>

        <p className="line-clamp-2 text-sm leading-5 text-[#5f6c7b]">
          {getRichTextPreview(
            product?.shortDescription || "Trusted product listing from this seller catalog.",
            120
          )}
        </p>

        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#047857] px-2 py-1 text-white">
            <Star className="h-3.5 w-3.5 fill-current" />
            {rating.toFixed(1)}
          </span>
          <span className="text-[#5f6c7b]">
            {ratingCount}+ ratings
          </span>
          <span className="hidden items-center gap-1 text-[#5f6c7b] sm:inline-flex">
            <Truck className="h-3.5 w-3.5 text-[#2874f0]" />
            Delivery available
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <span className="text-2xl font-bold leading-none text-[#172337]">
            {whiteRoseFormatCurrency(pricing.finalPrice || pricing.actualPrice)}
          </span>
          {pricing.actualPrice > pricing.finalPrice ? (
            <span className="text-sm text-[#878787] line-through">
              {whiteRoseFormatCurrency(pricing.actualPrice)}
            </span>
          ) : null}
          {pricing.discountPercent > 0 ? (
            <span className="text-sm font-semibold text-[#047857]">
              {pricing.discountPercent}% off
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {showAddToCart ? (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!onAddToCart || isAdding || pricing.stockQuantity <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff9f00] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#f08b00] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {isAdding ? "Adding..." : "Add to cart"}
            </button>
          ) : (
            <div className="rounded-xl border border-[#dfe3eb] bg-[#f8fafc]" />
          )}
          <Link
            href={href}
            className="inline-flex items-center justify-center rounded-xl border border-[#cfd7e6] bg-white px-3 py-3 text-sm font-semibold text-[#172337] transition hover:border-[#2874f0] hover:text-[#2874f0]"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
