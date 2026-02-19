"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchBanners } from "@/store/slices/bannerSlice";
import { NEXT_PUBLIC_API_URL_BANNERS } from "@/config/variables";

export default function FullWidthBanner() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    banners = [],
    loading,
    error,
  } = useSelector((state: any) => state.banner ?? {});

  console.log("Banners from Redux:", banners);

  const [index, setIndex] = useState(0);
  const BASE_URL = NEXT_PUBLIC_API_URL_BANNERS;

  // // Fetch banners on mount
  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);


  // Auto slide
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (loading)
    return (
      <div className="h-[70vh] flex items-center justify-center text-gray-500 text-lg">
        Loading banners...
      </div>
    );

  if (error)
    return (
      <div className="h-[70vh] flex items-center justify-center text-red-600 text-lg">
        Failed to load banners: {String(error)}
      </div>
    );

  if (!Array.isArray(banners) || banners.length === 0)
    return (
      <div className="h-[70vh] flex items-center justify-center text-gray-400 text-lg">
        No banners available.
      </div>
    );

  const currentBanner = banners[index];

  return (
    <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-[90vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id ?? index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={currentBanner.imageUrl ? currentBanner.imageUrl : "/placeholder-banner.png"}
            alt={currentBanner.title ?? ""}
            fill
            priority
            unoptimized
            className="object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/placeholder-banner.png";
            }}
          />
         
        </motion.div>
      </AnimatePresence>

      {/* 🔘 Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              i === index
                ? "bg-white scale-125"
                : "bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
