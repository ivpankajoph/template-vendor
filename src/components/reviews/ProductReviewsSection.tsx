"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, X } from "lucide-react";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { toastError, toastSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";

type ReviewImage = {
  url: string;
  publicId?: string;
};

type ProductReview = {
  _id: string;
  rating: number;
  comment: string;
  images?: ReviewImage[];
  reviewer?: {
    name?: string;
    avatar?: string;
  };
  createdAt?: string;
};

type ReviewsApiResponse = {
  success?: boolean;
  reviews?: ProductReview[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  summary?: {
    averageRating?: number;
    ratingsCount?: number;
  };
};

export type ProductReviewSummary = {
  averageRating: number;
  ratingsCount: number;
};

type PendingUpload = {
  file: File;
  previewUrl: string;
};

type ProductReviewsSectionProps = {
  productId: string;
  token?: string | null;
  loginPath: string;
  onSummaryChange?: (summary: ProductReviewSummary) => void;
  theme?: "default" | "studio";
};

const PAGE_SIZE = 5;
const MAX_IMAGES = 5;

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatReviewDate = (value?: string) => {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const buildInitial = (name?: string) => {
  const label = String(name || "").trim();
  if (!label) return "C";
  return label.charAt(0).toUpperCase();
};

export default function ProductReviewsSection({
  productId,
  token,
  loginPath,
  onSummaryChange,
  theme = "default",
}: ProductReviewsSectionProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary>({
    averageRating: 0,
    ratingsCount: 0,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [uploads, setUploads] = useState<PendingUpload[]>([]);

  const isStudio = theme === "studio";

  const reviewBoxClass = isStudio
    ? "rounded-xl border border-slate-800 bg-slate-900/70 p-4"
    : "rounded-xl border border-slate-200 bg-white p-4";

  const loadReviews = useCallback(
    async (targetPage: number) => {
      if (!NEXT_PUBLIC_API_URL) return;

      setLoading(true);
      try {
        const res = await fetch(
          `${NEXT_PUBLIC_API_URL}/products/${productId}/reviews?page=${targetPage}&limit=${PAGE_SIZE}`,
        );
        if (!res.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = (await res.json()) as ReviewsApiResponse;
        const nextSummary: ProductReviewSummary = {
          averageRating: toNumber(data?.summary?.averageRating),
          ratingsCount: toNumber(data?.summary?.ratingsCount),
        };

        setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
        setSummary(nextSummary);
        setPagination({
          total: toNumber(data?.pagination?.total),
          totalPages: Math.max(1, toNumber(data?.pagination?.totalPages) || 1),
          hasNextPage: Boolean(data?.pagination?.hasNextPage),
          hasPrevPage: Boolean(data?.pagination?.hasPrevPage),
        });
        onSummaryChange?.(nextSummary);
      } catch (error: any) {
        toastError(error?.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    },
    [productId, onSummaryChange],
  );

  useEffect(() => {
    loadReviews(page);
  }, [page, loadReviews]);

  useEffect(() => {
    return () => {
      for (const upload of uploads) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    };
  }, [uploads]);

  const clearUploads = () => {
    for (const upload of uploads) {
      URL.revokeObjectURL(upload.previewUrl);
    }
    setUploads([]);
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    const remaining = MAX_IMAGES - uploads.length;
    if (remaining <= 0) {
      toastError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const accepted = fileList
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    if (!accepted.length) {
      toastError("Please select valid image files");
      return;
    }

    setUploads((prev) => [...prev, ...accepted]);
    event.target.value = "";
  };

  const handleRemoveUpload = (index: number) => {
    setUploads((prev) => {
      const item = prev[index];
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      router.push(loginPath);
      return;
    }

    if (rating < 1 || rating > 5) {
      toastError("Please select a rating between 1 and 5");
      return;
    }

    const normalizedComment = comment.trim();
    if (normalizedComment.length < 3) {
      toastError("Please write at least 3 characters");
      return;
    }

    if (!NEXT_PUBLIC_API_URL) {
      toastError("API URL is not configured");
      return;
    }

    setSubmitting(true);
    try {
      const uploadedImages = [];
      for (const upload of uploads) {
        const uploaded = await uploadImageToCloudinary(
          upload.file,
          "ophmate/product-reviews",
        );
        uploadedImages.push(uploaded);
      }

      const res = await fetch(`${NEXT_PUBLIC_API_URL}/products/${productId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: normalizedComment,
          images: uploadedImages,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to submit review");
      }

      toastSuccess(data?.message || "Review submitted");
      setRating(0);
      setComment("");
      clearUploads();
      setPage(1);
      await loadReviews(1);
    } catch (error: any) {
      toastError(error?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const averageLabel = useMemo(
    () => (summary.ratingsCount > 0 ? summary.averageRating.toFixed(1) : "0.0"),
    [summary],
  );

  return (
    <div className={`rounded-xl border p-5 ${isStudio ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-white"}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className={`text-xl font-bold ${isStudio ? "text-slate-100" : "text-slate-900"}`}>
            Customer Reviews
          </h3>
          <p className={`mt-1 text-sm ${isStudio ? "text-slate-400" : "text-slate-500"}`}>
            {summary.ratingsCount} review{summary.ratingsCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          {averageLabel} / 5
        </div>
      </div>

      {!token ? (
        <div className={reviewBoxClass}>
          <p className={isStudio ? "text-sm text-slate-300" : "text-sm text-slate-600"}>
            Login to write a review for this product.
          </p>
          <Button className="mt-3" onClick={() => router.push(loginPath)}>
            Write a review
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={reviewBoxClass}>
          <p className={`mb-2 text-sm font-semibold ${isStudio ? "text-slate-200" : "text-slate-800"}`}>
            Rate this product
          </p>
          <div className="mb-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded p-1"
                  aria-label={`Set ${value} stars`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= rating
                        ? "fill-amber-400 text-amber-400"
                        : isStudio
                          ? "text-slate-600"
                          : "text-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share your experience with this product..."
            className={`min-h-24 w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 ${
              isStudio
                ? "border-slate-700 bg-slate-950 text-slate-100 focus:ring-slate-500"
                : "border-slate-200 bg-white text-slate-900 focus:ring-indigo-300"
            }`}
          />

          <div className="mt-3">
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm font-medium ${
                isStudio
                  ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Upload photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>
            <p className={`mt-1 text-xs ${isStudio ? "text-slate-400" : "text-slate-500"}`}>
              You can upload up to {MAX_IMAGES} images
            </p>
          </div>

          {uploads.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {uploads.map((upload, index) => (
                <div key={`${upload.previewUrl}-${index}`} className="relative">
                  <img
                    src={upload.previewUrl}
                    alt="Review upload preview"
                    className="h-20 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUpload(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" className="mt-4" disabled={submitting}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit review"
            )}
          </Button>
        </form>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className={`rounded-lg border p-4 text-sm ${isStudio ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-500"}`}>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className={`rounded-lg border p-4 text-sm ${isStudio ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-500"}`}>
            No reviews yet. Be the first to review this product.
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className={reviewBoxClass}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {buildInitial(review.reviewer?.name)}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isStudio ? "text-slate-100" : "text-slate-900"}`}>
                      {review.reviewer?.name || "Verified customer"}
                    </p>
                    <p className={`text-xs ${isStudio ? "text-slate-400" : "text-slate-500"}`}>
                      {formatReviewDate(review.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {toNumber(review.rating).toFixed(1)}
                </div>
              </div>
              <p className={`text-sm leading-relaxed ${isStudio ? "text-slate-200" : "text-slate-700"}`}>
                {review.comment}
              </p>
              {Array.isArray(review.images) && review.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {review.images.map((image, index) => (
                    <img
                      key={`${image.url}-${index}`}
                      src={image.url}
                      alt="Review attachment"
                      className="h-16 w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </Button>
          <span className={`text-sm ${isStudio ? "text-slate-300" : "text-slate-600"}`}>
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
