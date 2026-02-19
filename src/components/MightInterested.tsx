"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

interface Product {
  _id?: string;
  productName?: string;
  slug?: string;
  defaultImages?: { url?: string }[];
  variants?: {
    finalPrice?: number;
    actualPrice?: number;
  }[];
}

const MightInterested = () => {
  const router = useRouter();
  const pathname = usePathname();

  const parts = pathname.split("/").filter(Boolean);
  const categoryId = parts[1];

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/category/${categoryId}`
        );

        const data = await res.json();
        setProducts(Array.isArray(data?.products) ? data.products : []);
      } catch (err) {
        console.error("Failed to fetch related products", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="mt-12 text-sm text-muted-foreground">Loading...</div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">You might also like</h2>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto py-2">
        {products.map((product, i) => {
          const imageUrl =
            product?.defaultImages?.[0]?.url || "/placeholder.png";

          const price =
            product?.variants?.[0]?.finalPrice ??
            product?.variants?.[0]?.actualPrice ??
            0;

          return (
            <motion.div
              key={product?._id ?? i}
              whileHover={{ scale: 1.03 }}
              onClick={() => handleNavigate(product?._id)}
              className="min-w-[220px] p-3 rounded-xl border bg-white cursor-pointer"
            >
              <div className="relative h-40 w-full rounded-md overflow-hidden mb-3 bg-gray-100">
                <Image
                  src={imageUrl}
                  alt={product?.productName ?? "Product"}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
              </div>

              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-medium text-sm line-clamp-2">
                    {product?.productName ?? "Unnamed Product"}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    ₹{price.toLocaleString()}
                  </div>
                </div>

                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card click
                  }}
                >
                  +
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  function handleNavigate(productId?: string) {
    if (!categoryId || !productId) return;
    router.push(`/product/${categoryId}/${productId}`);
  }
};

export default MightInterested;
