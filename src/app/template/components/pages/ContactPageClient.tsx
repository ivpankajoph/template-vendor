"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

const DynamicMap = dynamic(() => import("@/app/template/components/MapComponent"), {
  ssr: false,
});

export default function ContactPage() {
  const variant = useTemplateVariant();
  const contactData = useSelector((state: any) => state?.vendorprofilepage?.vendor);
  const vendorOverrides = useSelector(
    (state: any) => state?.alltemplatepage?.data?.components?.vendor_profile
  );
  const products = useSelector((state: any) => state?.alltemplatepage?.products || []);
  const templateData = useSelector(
    (state: any) => state?.alltemplatepage?.data?.components?.contact_page
  );
  const params = useParams();
  const vendor_id = params.vendor_id as string;

  const categories = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    const normalizeLabel = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";
    const normalizeId = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";

    products.forEach((product: any) => {
      const rawCategory =
        product?.productCategory?._id ||
        product?.productCategory ||
        product?.productCategoryName ||
        product?.productCategory?.name ||
        product?.productCategory?.title ||
        product?.productCategory?.categoryName;

      const label =
        normalizeLabel(product?.productCategoryName) ||
        normalizeLabel(product?.productCategory?.name) ||
        normalizeLabel(product?.productCategory?.title) ||
        normalizeLabel(product?.productCategory?.categoryName);

      const id = normalizeId(rawCategory) || label;
      if (!id) return;
      if (!label && /^[a-f\d]{24}$/i.test(id)) return;

      const existing = map.get(id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(id, {
          id,
          label: label || "Category",
          count: 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [products]);

  const toCategorySlug = (value: string) =>
    encodeURIComponent(value.toLowerCase().replace(/\s+/g, "-"));

  const vendorFallbackName =
    templateData?.hero?.title?.replace(/^contact\s*/i, "").trim() || "our team";
  const mergedVendor = useMemo(
    () => ({
      ...(contactData && typeof contactData === "object" ? contactData : {}),
      ...(vendorOverrides && typeof vendorOverrides === "object" ? vendorOverrides : {}),
    }),
    [contactData, vendorOverrides]
  );
  const contact = {
    street: (mergedVendor as any)?.street || (mergedVendor as any)?.address || "Store Address",
    city: (mergedVendor as any)?.city || "",
    state: (mergedVendor as any)?.state || "",
    pincode: (mergedVendor as any)?.pincode || "",
    phone:
      (mergedVendor as any)?.phone ||
      (mergedVendor as any)?.alternate_contact_phone ||
      "+91 9876543210",
    email: (mergedVendor as any)?.email || "support@storefront.com",
  };
  const workingHours = (mergedVendor as any)?.operating_hours || "Mon - Fri: 9AM - 6PM";
  const contactAddress = [contact.street, contact.city, contact.state]
    .filter((item) => typeof item === "string" && item.trim())
    .join(", ");
  const heroTitle = templateData?.hero?.title || "Contact Us";
  const heroSubtitle =
    templateData?.hero?.subtitle || `Have a question? Reach out to ${vendorFallbackName}.`;
  const detailsTitle = templateData?.section_2?.hero_title || "Visit or message our team";
  const detailsSubtitle =
    templateData?.section_2?.hero_subtitle ||
    "Share your requirements and we will respond with the best options.";
  const heroBackground =
    templateData?.hero?.backgroundImage ||
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&q=80";
  const mapLat = Number(templateData?.section_2?.lat);
  const mapLong = Number(templateData?.section_2?.long);
  const hasMapCoordinates = Number.isFinite(mapLat) && Number.isFinite(mapLong);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    alert("Message sent!");
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-white";
  const cardClass = isStudio
    ? "template-surface-card bg-slate-900/70 border border-slate-800 text-slate-100 rounded-md"
    : isMinimal
      ? "template-surface-card bg-white border border-slate-200 rounded-xl"
      : isTrend
        ? "template-surface-card bg-white border border-rose-200 rounded-[1.5rem]"
        : "template-surface-card bg-gray-50 border border-slate-200 rounded-2xl";

  return (
    <div className={`${pageClass} template-page-shell template-contact-page`}>
      <div className="group fixed right-6 top-1/2 z-50 -translate-y-1/2">
        <button
          className={`template-primary-button rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:shadow-xl template-accent ${
            isStudio ? "bg-slate-900 text-slate-100" : "bg-white"
          }`}
        >
          Browse Categories
        </button>
        <div className="pointer-events-none absolute right-full top-1/2 mr-4 w-64 -translate-y-1/2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
          <div
            className={`max-h-80 overflow-auto rounded-2xl border p-3 shadow-2xl ${
              isStudio ? "border-slate-800 bg-slate-900 text-slate-100" : "border-slate-200 bg-white"
            }`}
          >
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Browse
            </p>
            <div className="flex flex-col gap-2">
              {categories.length > 0 ? (
                categories.map((category) => {
                  const isObjectId = /^[a-f\d]{24}$/i.test(category.id);
                  const categoryPath = isObjectId ? category.id : toCategorySlug(category.label);
                  return (
                    <Link
                      key={category.id}
                      href={`/template/${vendor_id}/category/${categoryPath}`}
                      className={`flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition ${
                        isStudio
                          ? "text-slate-200 hover:border-slate-700 hover:bg-slate-800/70"
                          : "text-slate-700 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{category.label}</span>
                      <span className="text-xs text-slate-400">{category.count}</span>
                    </Link>
                  );
                })
              ) : (
                <div
                  className={`rounded-xl border border-dashed px-3 py-6 text-center text-xs uppercase tracking-[0.3em] text-slate-400 ${
                    isStudio ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  No categories
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`template-page-hero relative ${isMinimal ? "h-72" : "h-96"} bg-cover bg-center`}
        data-template-section="hero"
        data-template-path="components.contact_page.hero.backgroundImage"
        data-template-component="components.contact_page.hero.backgroundImage"
        style={{
          backgroundImage: `linear-gradient(color-mix(in srgb, var(--template-banner-color) 60%, transparent), color-mix(in srgb, var(--template-banner-color) 60%, transparent)), url('${heroBackground}')`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-white text-center">
          <div>
            <h1
              className="template-section-title text-5xl font-bold"
              data-template-path="components.contact_page.hero.title"
              data-template-section="hero"
            >
              {heroTitle}
            </h1>
            <p
              className="text-xl mt-2"
              data-template-path="components.contact_page.hero.subtitle"
              data-template-section="hero"
            >
              {heroSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8 max-w-3xl" data-template-section="details">
          <h2
            className="text-3xl font-bold"
            data-template-path="components.contact_page.section_2.hero_title"
            data-template-section="details"
          >
            {detailsTitle}
          </h2>
          <p
            className="mt-2 text-base text-slate-600"
            data-template-path="components.contact_page.section_2.hero_subtitle"
            data-template-section="details"
          >
            {detailsSubtitle}
          </p>
        </div>
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-template-section="vendor"
        >
          <InfoCard
            Icon={MapPin}
            title="Visit Us"
            details={`${contactAddress || "Store Address"}${contact.pincode ? ` - ${contact.pincode}` : ""}`}
            className={cardClass}
            dataPath="components.vendor_profile.address"
            sectionId="vendor"
          />
          <InfoCard
            Icon={Phone}
            title="Call Us"
            details={contact.phone}
            className={cardClass}
            dataPath="components.vendor_profile.phone"
            sectionId="vendor"
          />
          <InfoCard
            Icon={Mail}
            title="Email"
            details={contact.email}
            className={cardClass}
            dataPath="components.vendor_profile.email"
            sectionId="vendor"
          />
          <InfoCard
            Icon={Clock}
            title="Working Hours"
            details={workingHours}
            className={cardClass}
            dataPath="components.vendor_profile.operating_hours"
            sectionId="vendor"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16">
          <form
            onSubmit={handleSubmit}
            className={`template-surface-card space-y-5 rounded-3xl border p-6 ${
              isStudio ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-white"
            }`}
          >
            <h2 className="text-3xl font-bold mb-4">Send us a message</h2>

            <input
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                isStudio ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-200"
              }`}
              required
            />

            <input
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                isStudio ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-200"
              }`}
              required
            />

            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                isStudio ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-200"
              }`}
            />

            <textarea
              name="message"
              placeholder="Message"
              rows={6}
              value={form.message}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg ${
                isStudio ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-200"
              }`}
              required
            />

            <button
              type="submit"
              className="template-primary-button w-full text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-lg template-accent-bg template-accent-bg-hover"
            >
              <Send size={20} /> Send Message
            </button>
          </form>

          {hasMapCoordinates ? (
            <div
              data-template-section="map"
              data-template-component="components.contact_page.section_2.lat"
            >
              <DynamicMap lat={mapLat} long={mapLong} />
            </div>
          ) : (
            <div
              data-template-section="map"
              data-template-component="components.contact_page.section_2.lat"
              className={`rounded-3xl border p-8 text-center ${
                isStudio ? "border-slate-800 bg-slate-900/70 text-slate-300" : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              Map location is not configured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ Icon, title, details, className, dataPath, sectionId }: any) {
  const isDark = typeof className === "string" && className.includes("text-slate-100");
  return (
    <div className={`rounded-lg p-6 text-center shadow-md ${className || ""}`}>
      <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-full flex justify-center items-center shadow">
        <Icon size={22} className="template-accent" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p
        className={isDark ? "text-slate-200" : "text-gray-700"}
        data-template-path={dataPath}
        data-template-section={sectionId}
      >
        {details}
      </p>
    </div>
  );
}
