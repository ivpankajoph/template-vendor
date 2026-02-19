/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { RootState } from "@/store";
import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useParams } from "next/navigation";
import { useTemplateVariant } from "./useTemplateVariant";
import { MquiqFooter } from "./mquiq/MquiqFooter";
import { PoupqzFooter } from "./poupqz/PoupqzFooter";
import { OragzeFooter } from "./oragze/OragzeFooter";
import { WhiteRoseFooter } from "./whiterose/WhiteRoseFooter";

export default function Footer() {
  const variant = useTemplateVariant();
  const isStudio = variant.key === "studio";
  const isTrend = variant.key === "trend";
  const isMquiq = variant.key === "mquiq";
  const isPoupqz = variant.key === "poupqz";
  const isOragze = variant.key === "oragze";
  const isWhiteRose = variant.key === "whiterose";
  const params = useParams();
  const vendor_id = params.vendor_id as string;

  const contact = useSelector((state: any) => state?.vendorprofilepage?.vendor);
  const { homepage, products } = useSelector((state: RootState) => ({
    homepage: (state as any).alltemplatepage?.data,
    products: (state as any).alltemplatepage?.products || [],
  }));

  const customPages =
    (homepage as any)?.components?.custom_pages?.filter(
      (page: any) => page?.isPublished !== false
    ) || [];
  const contactAddress = [
    contact?.street || contact?.address,
    contact?.city,
    contact?.state,
    contact?.country,
  ]
    .filter((item) => typeof item === "string" && item.trim())
    .join(", ");

  const categoryLinks = useMemo(() => {
    const map = new Map<string, { path: string; label: string }>();
    products.forEach((product: any) => {
      const rawId =
        product?.productCategory?._id ||
        product?.productCategory ||
        product?.productCategoryName ||
        product?.productCategory?.name ||
        product?.productCategory?.title ||
        product?.productCategory?.categoryName;
      const label =
        product?.productCategoryName ||
        product?.productCategory?.name ||
        product?.productCategory?.title ||
        product?.productCategory?.categoryName ||
        (typeof product?.productCategory === "string" &&
        !/^[a-f\d]{24}$/i.test(product.productCategory)
          ? product.productCategory
          : "");
      if (!rawId || !label) return;

      const path = /^[a-f\d]{24}$/i.test(rawId)
        ? `/template/${vendor_id}/category/${rawId}`
        : `/template/${vendor_id}/category/${encodeURIComponent(
            String(label).toLowerCase().replace(/\s+/g, "-")
          )}`;

      if (!map.has(path)) {
        map.set(path, { path, label: String(label) });
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [products, vendor_id]);

  if (isMquiq) {
    return <MquiqFooter />;
  }
  if (isPoupqz) {
    return <PoupqzFooter />;
  }
  if (isOragze) {
    return <OragzeFooter />;
  }
  if (isWhiteRose) {
    return <WhiteRoseFooter />;
  }

  return (
    <footer
      className={`mt-10 w-full border-t ${
        isStudio
          ? "border-slate-800 bg-slate-950 text-slate-100"
          : isTrend
            ? "border-rose-200 bg-gradient-to-b from-white via-rose-50/40 to-white text-slate-900"
            : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src={
                    homepage?.components?.logo ||
                    "https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687"
                  }
                  alt="Business Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg md:text-xl font-semibold tracking-wide truncate max-w-[180px]">
                {homepage?.business_name || "Your Business Name"}
              </span>
            </div>

            <p className="opacity-75 mb-6 leading-relaxed text-sm md:text-base">
              {homepage?.components?.home_page?.header_text_small ||
                "Discover curated products from this vendor storefront."}
            </p>

            <div className="flex gap-4">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 template-accent-soft template-accent ${
                    isTrend ? "border border-rose-200" : ""
                  }`}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
              {[
                { name: "Home", path: `/template/${vendor_id}` },
                { name: "Shop", path: `/template/${vendor_id}/all-products` },
                { name: "About Us", path: `/template/${vendor_id}/about` },
                { name: "Contact", path: `/template/${vendor_id}/contact` },
                ...customPages.map((page: any) => ({
                  name: page.title || "Page",
                  path: `/template/${vendor_id}/page/${page.slug || page.id}`,
                })),
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.path}
                    className="opacity-75 hover:opacity-100 transition template-accent-hover"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
              {categoryLinks.length > 0 ? (
                categoryLinks.map((cat) => (
                  <li key={cat.path}>
                    <Link href={cat.path} className="opacity-75 hover:opacity-100 transition">
                      {cat.label}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link
                    href={`/template/${vendor_id}/all-products`}
                    className="opacity-75 hover:opacity-100 transition"
                  >
                    All Products
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 mt-1" />
                <span className="opacity-75">
                  {contactAddress || "Store Address"}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0" />
                <a
                  href={`tel:${contact?.phone || ""}`}
                  className="opacity-75 hover:opacity-100 transition"
                >
                  {contact?.phone || contact?.alternate_contact_phone || "+91 9876543210"}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0" />
                <a
                  href={`mailto:${contact?.email || ""}`}
                  className="opacity-75 hover:opacity-100 transition"
                >
                  {contact?.email || "info@yourbusiness.com"}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={`border-t ${isTrend ? "border-rose-200" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg md:text-xl font-semibold mb-1">
              Subscribe to Our Newsletter
            </h3>
            <p className="opacity-75 text-sm md:text-base">
              Get updates on new arrivals and offers.
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-80 px-4 py-3 rounded-md border transition-all template-focus-accent"
            />
            <button className="px-5 py-3 rounded-md font-semibold text-white transition-all template-accent-bg template-accent-bg-hover">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className={`border-t ${isTrend ? "border-rose-200" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-75">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()}{" "}
            {homepage?.business_name || contact?.name || contact?.registrar_name || "Your Company"}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((link) => (
              <Link
                key={link}
                href={`/template/${vendor_id}/${link.toLowerCase().replace(/ /g, "-")}`}
                className="hover:opacity-100 transition template-accent-hover"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 z-50 text-white template-accent-bg template-accent-bg-hover"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </footer>
  );
}
