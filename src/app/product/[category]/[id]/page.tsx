"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  RefreshCw,
  Package,
  Award,
  Shield,
  Zap,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useParams, usePathname, useRouter } from "next/navigation";
import { fetchProductById } from "@/store/slices/productSlice";
import { addCartItem } from "@/store/slices/customerCartSlice";
import { toggleWishlistItem } from "@/store/slices/customerWishlistSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { trackAddToCart } from "@/lib/analytics-events";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";
import MightInterested from "@/components/MightInterested";
import Link from "next/link";
import { FAQ, Variant } from "../../type/type";
import { createWishlistItem } from "@/lib/wishlist";
import ProductReviewsSection, {
  ProductReviewSummary,
} from "@/components/reviews/ProductReviewsSection";

const getColorFromVariant = (variant: Variant): string => {
  return variant?.variantAttributes?.color || "Unknown";
};


const retailBenefits = [
  { icon: Truck, text: "Free shipping over Rs. 75" },
  { icon: RefreshCw, text: "30-day easy returns" },
  { icon: Shield, text: "1-year warranty" },
  { icon: Zap, text: "Fast delivery in 3-7 days" },
];


export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const token = useSelector((state: RootState) => state.customerAuth.token);
  const user = useSelector((state: RootState) => state.customerAuth.user);
  const wishlistItems = useSelector(
    (state: RootState) => state.customerWishlist?.items || [],
  );
  const { product, loading, error } = useSelector(
    (state: any) => state.product,
  );

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary>({
    averageRating: 0,
    ratingsCount: 0,
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (!product) return;

    const firstActiveVariant =
      product.variants.find((v: Variant) => v.isActive) || product.variants[0];
    setSelectedVariant(firstActiveVariant ?? null);

    const defaultPrimaryImage = product.defaultImages?.[0]?.url?.trim();
    const firstImg = firstActiveVariant?.variantsImageUrls[0]?.url?.trim();
    setSelectedImage(defaultPrimaryImage || firstImg || "");

    const metaTitle =
      firstActiveVariant?.variantMetaTitle ||
      product.metaTitle ||
      product.productName;
    const metaDesc =
      firstActiveVariant?.variantMetaDescription ||
      product.metaDescription ||
      "";

    document.title = metaTitle;

    let metaTag = document.querySelector('meta[name="description"]');
    if (metaTag) {
      metaTag.setAttribute("content", metaDesc);
    } else {
      metaTag = document.createElement("meta");
      (metaTag as HTMLMetaElement).name = "description";
      (metaTag as HTMLMetaElement).content = metaDesc;
      document.head.appendChild(metaTag);
    }
  }, [product]);

  useEffect(() => {
    if (selectedVariant?.variantsImageUrls?.[0]?.url) {
      setSelectedImage(selectedVariant.variantsImageUrls[0].url.trim());
    }
  }, [selectedVariant]);

  const onThumbKey = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    img: string,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedImage(img);
    }
  };

  const subtotal = useMemo(() => {
    const basePrice =
      selectedVariant?.finalPrice ?? product?.variants?.[0]?.finalPrice ?? 0;
    return basePrice * quantity;
  }, [quantity, selectedVariant, product]);

  const handleAddToCart = async () => {
    if (!selectedVariant || !product) return;
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      await dispatch(
        addCartItem({
          product_id: product._id,
          variant_id: selectedVariant._id,
          quantity,
        }),
      ).unwrap();
      trackAddToCart({
        vendorId: product?.vendor?._id,
        userId: user?._id || user?.id || "",
        productId: product._id,
        productName: product.productName,
        productPrice: selectedVariant.finalPrice || 0,
        quantity,
      });
      toastSuccess("Added to cart");
    } catch (error: any) {
      toastError(error || "Failed to add to cart");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  const handleMouseEnter = () => setShowMagnifier(true);
  const handleMouseLeave = () => setShowMagnifier(false);
  const wishlisted = wishlistItems.some(
    (item) => item.product_id === String(product?._id || ""),
  );

  const handleToggleWishlist = () => {
    if (!product) return;
    const variant =
      selectedVariant ||
      product.variants?.find((item: Variant) => item?.isActive) ||
      product.variants?.[0];

    dispatch(
      toggleWishlistItem(
        createWishlistItem({
          product_id: product._id,
          product_name: product.productName,
          product_category: product.productCategory || "unknown",
          image_url:
            variant?.variantsImageUrls?.[0]?.url ||
            product.defaultImages?.[0]?.url ||
            "/placeholder.png",
          final_price: variant?.finalPrice || 0,
          actual_price: variant?.actualPrice || variant?.finalPrice || 0,
          brand: product.brand,
          short_description: product.shortDescription || product.description,
          variant_id: variant?._id,
          variant_attributes: variant?.variantAttributes || undefined,
          stock_quantity: variant?.stockQuantity ?? 0,
        }),
      ),
    );
    toastSuccess(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  if (loading) {
    return (
      <>
        <PromotionalBanner />
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading product...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <PromotionalBanner />
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <p className="text-xl font-semibold">Failed to load product</p>
            <p className="text-muted-foreground mt-2">Please try again later</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const defaultImageUrls = (product.defaultImages || [])
    .map((img:any) => img?.url?.trim())
    .filter(Boolean);

  const variantImageUrls = product.variants.flatMap((v: Variant) =>
    v.variantsImageUrls
      .map((img) => img?.url?.trim())
      .filter(Boolean),
  );

  const allImageUrls = Array.from(
    new Set([...defaultImageUrls, ...variantImageUrls]),
  ).filter(Boolean);

  const productDescription =
    selectedVariant?.variantMetaDescription ||
    product.variants[0]?.variantMetaDescription ||
    product.description ||
    product.shortDescription ||
    "No description available.";

  const specs: Record<string, string> = {
    Brand: product.brand || "N/A",
    "Stock Available": selectedVariant?.stockQuantity?.toString() || "0",
    Price: `₹${(selectedVariant?.finalPrice || 0).toLocaleString()}`,
    ...(selectedVariant?.variantAttributes || {}),
  };

  const basePrice = selectedVariant?.finalPrice || 0;
  const actualPrice = selectedVariant?.actualPrice || 0;
  const productAverageRating = Number(product?.averageRating || 0);
  const productRatingsCount = Number(product?.ratingsCount || 0);
  const displayRating =
    reviewSummary.ratingsCount > 0
      ? reviewSummary.averageRating
      : productAverageRating;
  const displayReviewsCount =
    reviewSummary.ratingsCount > 0
      ? reviewSummary.ratingsCount
      : productRatingsCount;

  const mainCategoryLabel =
    product.mainCategoryData?.name ||
    product.mainCategory ||
    "Unassigned";
  const categoryLabel =
    product.productCategoryData?.name ||
    product.productCategory ||
    "Unassigned";
  const subCategoryNames =
    product.productSubCategoryData?.map((sub:any) => sub.name).filter(Boolean) ??
    [];
  const specificationEntries =
    product.specifications
      ?.flatMap((item:any) =>
        Object.entries(item).filter(([, value]) => Boolean(value)),
      )
      .filter(([key]:any) => Boolean(key)) || [];
  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Image Gallery */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-8 self-start">
            <div className="flex gap-4">
              <div className="flex flex-col gap-3">
                {(allImageUrls as string[]).map((img, i) => (
                  <button
                    key={i}
                    aria-label={`View product image ${i + 1}`}
                    onClick={() => setSelectedImage(img)}
                    onKeyDown={(e) => onThumbKey(e, img)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === img
                        ? "ring-2 ring-indigo-500 border-indigo-300 scale-105"
                        : "border-neutral-200 hover:border-indigo-200"
                    }`}
                  >
                    <Image
                      src={img || "/placeholder.jpg"}
                      alt="thumb"
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>

              <div className="flex-1 relative">
                <div className="relative w-full min-h-[520px] rounded-[32px] overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 shadow-2xl border border-white p-4">
                  <div className="relative w-full h-[520px] md:h-[560px] rounded-[28px] overflow-hidden bg-white flex items-center justify-center">
                    <Image
                      src={selectedImage || "/placeholder.jpg"}
                      alt={product.productName}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain cursor-crosshair"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />
                  </div>

                  {showMagnifier && (
                    <div
                      className="absolute w-48 h-48 rounded-full border-4 border-white shadow-2xl overflow-hidden pointer-events-none z-10"
                      style={{
                        left: cursorPos.x - 96,
                        top: cursorPos.y - 96,
                        backgroundImage: `url(${selectedImage})`,
                        backgroundSize: `${520 * 2}px ${520 * 2}px`,
                        backgroundPosition: `-${cursorPos.x * 2}px -${
                          cursorPos.y * 2
                        }px`,
                      }}
                    />
                  )}

                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                    {(selectedVariant?.stockQuantity ?? 0) > 0
                      ? "In Stock"
                      : "Out of Stock"}
                    </Badge>
                    {selectedVariant?.discountPercent &&
                      selectedVariant.discountPercent > 0 && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse">
                          {selectedVariant.discountPercent}% OFF
                        </Badge>
                      )}
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                className={`flex-1 transition-all ${wishlisted ? "bg-pink-50 border-pink-300 text-pink-600" : ""}`}
                onClick={handleToggleWishlist}
                  >
                    <Heart
                      className={`mr-2 ${wishlisted ? "fill-current" : ""}`}
                    />{" "}
                    {wishlisted ? "Added to Favorites" : "Add to Favorites"}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {product.productName}
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                  <Star className="text-amber-400 fill-amber-400 w-5 h-5" />
                  <span className="font-bold text-amber-900">
                    {displayRating > 0 ? displayRating.toFixed(1) : "0.0"}
                  </span>
                  <span className="text-sm text-amber-700">
                    ({displayReviewsCount} reviews)
                  </span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="text-sm text-muted-foreground font-mono bg-neutral-100 px-3 py-1 rounded">
                  SKU: {selectedVariant?.variantSku || "N/A"}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-2xl shadow-lg border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Item Price</p>
                  <div className="flex items-baseline gap-3">
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Rs. {basePrice.toLocaleString()}
                    </div>
                    {actualPrice !== basePrice && (
                      <div className="text-xl text-muted-foreground line-through">
                        Rs. {actualPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                {selectedVariant?.discountPercent &&
                  selectedVariant.discountPercent > 0 && (
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                      Save {selectedVariant.discountPercent}%
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                {retailBenefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded-lg"
                  >
                    <benefit.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-900">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Variants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div>
                <div className="text-sm font-semibold mb-3 text-neutral-700">
                  Select Color
                </div>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.map((v: Variant) => (
                    <button
                      key={v._id}
                      aria-pressed={selectedVariant?._id === v._id}
                      onClick={() => setSelectedVariant(v)}
                      disabled={!v.isActive}
                      className={`group relative px-4 py-3 rounded-xl border-2 transition-all ${
                        selectedVariant?._id === v._id
                          ? "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50 shadow-lg scale-105"
                          : "bg-white border-neutral-200 hover:border-indigo-200 hover:shadow-md"
                      } text-sm flex items-center gap-3 ${
                        !v.isActive ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {v.variantsImageUrls[0] && (
                        <Image
                          src={v.variantsImageUrls[0].url.trim()}
                          alt={getColorFromVariant(v)}
                          width={40}
                          height={40}
                          className="object-cover rounded-lg shadow-sm"
                        />
                      )}
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {getColorFromVariant(v).charAt(0).toUpperCase() +
                            getColorFromVariant(v).slice(1)}
                        </span>
                        {v.stockQuantity <= 0 && (
                          <span className="text-xs text-red-500 font-semibold">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      {selectedVariant?._id === v._id && (
                        <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold mb-3 text-neutral-700">
                  Quantity
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.max(1, q - 1),
                      )
                    }
                  >
                    <span className="text-xl">-</span>
                  </Button>
                  <Input
                    value={String(quantity)}
                    onChange={(e) => {
                      const min = 1;
                      setQuantity(Math.max(min, Number(e.target.value) || min));
                    }}
                    className="w-24 text-center text-xl font-bold border-2 rounded-xl"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <span className="text-xl">+</span>
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Badge
                    className={`${(selectedVariant?.stockQuantity ?? 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {(selectedVariant?.stockQuantity ?? 0) > 0
                      ? "In Stock"
                      : "Out of Stock"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Rs. {subtotal.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="text-2xl font-bold">{quantity} pcs</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
                >
                  <ShoppingCart className="mr-2" /> Add to Bag
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-14 text-lg font-semibold border-2 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                >
                  Buy Now
                  <ChevronRight className="ml-2" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <Truck className="text-green-600 w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Free Shipping</p>
                  <p className="text-xs text-green-700">On orders over Rs. 175</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <RefreshCw className="text-blue-600 w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Easy Returns</p>
                  <p className="text-xs text-blue-700">30-day return policy</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Details Sections */}
            <div className="space-y-8 mt-6">
              <section className="bg-white rounded-xl p-6 shadow-md border">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Info className="text-indigo-600" />
                  Product Details
                </h2>
                <div className="prose max-w-none text-muted-foreground leading-relaxed">
                  <p>{productDescription}</p>
                </div>
              </section>

              <section className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 shadow-md border">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Award className="text-indigo-600" />
                  Specifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(specs).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
                    >
                      <span className="text-sm font-medium text-neutral-600">
                        {k}
                      </span>
                      <span className="text-sm font-bold text-neutral-900">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {specificationEntries.length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-md border">
                  <h2 className="text-2xl font-bold mb-4">
                    Detailed Specifications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {specificationEntries.map(([label, value]:any) => (
                      <div
                        key={`${label}-${value}`}
                        className="p-3 rounded-2xl border border-neutral-100 bg-gradient-to-br from-white to-neutral-50 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {label}
                        </p>
                        <p className="text-sm font-bold text-neutral-900 mt-1">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <ProductReviewsSection
                productId={String(product._id)}
                token={token}
                loginPath={`/login?next=${encodeURIComponent(pathname || "/")}`}
                onSummaryChange={setReviewSummary}
              />
            {product.faqs && product.faqs.length > 0 && (
              <section className="bg-white rounded-xl p-6 shadow-md border">
                <h2 className="text-2xl font-bold mb-4">
                  Frequently Asked Questions
                </h2>
                <Accordion type="multiple" className="w-full">
                  {product.faqs.map((faq: FAQ, index: number) => (
                    <AccordionItem
                      key={index}
                      value={`faq-${index}`}
                      className="border-b-2"
                    >
                      <AccordionTrigger className="text-left font-semibold hover:text-indigo-600 transition-colors">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}

            </div>

            <Separator />

            <div className="bg-white rounded-xl shadow-md border overflow-hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="shipping" className="border-b-2">
                  <AccordionTrigger className="px-6 py-4 hover:bg-neutral-50 font-semibold">
                    <div className="flex items-center gap-2">
                      <Truck className="text-indigo-600" />
                      Shipping & Delivery
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="returns" className="border-b-2">
                  <AccordionTrigger className="px-6 py-4 hover:bg-neutral-50 font-semibold">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="text-indigo-600" />
                      Returns & Warranty
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      30-day hassle-free returns. 1-year limited warranty on
                      manufacturing defects. Full refund or replacement
                      guaranteed.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                {product.vendor?._id && (
                  <AccordionItem value="seller_details">
                    <AccordionTrigger className="px-6 py-4 hover:bg-neutral-50 font-semibold">
                      <div className="flex items-center gap-2">
                        <Package className="text-indigo-600" />
                        Seller Details
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <Link
                        href={`/vendor/catalog/${product.vendor._id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold hover:underline flex items-center gap-1"
                      >
                        {product.vendor.name || "N/A"}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </div>
        </div>

        <MightInterested />

        {/* Mobile Floating Bar */}
        <div className="fixed left-0 right-0 bottom-0 md:hidden z-50">
          <div className="bg-white/95 backdrop-blur-xl border-t-2 border-indigo-200 shadow-2xl p-4">
            <div className="flex gap-3 items-center max-w-3xl mx-auto">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{subtotal.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold shadow-lg"
                disabled={
                  !selectedVariant ||
                  selectedVariant.stockQuantity <= 0}
              >
                <ShoppingCart className="mr-2 w-5 h-5" />
                Add to Bag
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}













