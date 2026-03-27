import type { Metadata } from "next";

import BlogDetailPageClient from "@/app/template/components/pages/BlogDetailPageClient";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogDetailPage() {
  return <BlogDetailPageClient />;
}
