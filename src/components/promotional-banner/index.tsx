"use client"
import React, { useState } from "react";
import { Badge, X } from "lucide-react";

export default function PromotionalBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null; // hide the banner when closed

  return (
    <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm py-2">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="font-medium">
          Free shipping over <span className="font-bold">₹75</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-4 items-center">
            <span>Shop Now</span>
            <Badge>Limited Offer</Badge>
          </div>

          {/* Close button */}
          <button
            onClick={() => setVisible(false)}
            className="text-white hover:text-gray-200 transition cursor-pointer"
            aria-label="Close banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
