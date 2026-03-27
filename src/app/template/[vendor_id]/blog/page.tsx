import type { Metadata } from "next";

import BlogListPageClient from "@/app/template/components/pages/BlogListPageClient";

export const metadata: Metadata = {
  title: "Blog",
};

export default function BlogPage() {
  return <BlogListPageClient />;
}
