/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useParams } from "next/navigation";
import axios from "axios";
import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from "./templateAuth";
import { useTemplateVariant } from "./useTemplateVariant";
import { MquiqNavbar } from "./mquiq/MquiqNavbar";
import { PoupqzNavbar } from "./poupqz/PoupqzNavbar";
import { OragzeNavbar } from "./oragze/OragzeNavbar";
import { WhiteRoseNavbar } from "./whiterose/WhiteRoseNavbar";

export default function Navbar() {
  const variant = useTemplateVariant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { homepage } = useSelector((state: RootState) => ({
    homepage: (state as any).alltemplatepage?.data,
  }));
  const customPages =
    (homepage as any)?.components?.custom_pages?.filter(
      (page: any) => page?.isPublished !== false
    ) || [];

  // Get vendor_id from dynamic route
  const params = useParams();
  const vendor_id = params.vendor_id;

  const menuItems = ["Home", "About", "Contact"];
  const isStudio = variant.key === "studio";
  const isTrend = variant.key === "trend";
  const isMquiq = variant.key === "mquiq";
  const isPoupqz = variant.key === "poupqz";
  const isOragze = variant.key === "oragze";
  const isWhiteRose = variant.key === "whiterose";
  const isCustomVariant = isMquiq || isPoupqz || isOragze || isWhiteRose;
  const desktopLinkTone = isStudio
    ? "text-slate-100 hover:text-sky-300"
    : isTrend
      ? "text-slate-700 hover:text-rose-600"
      : "text-slate-800 hover:text-slate-900";
  const iconTone = isStudio
    ? "text-slate-100 hover:text-sky-300"
    : isTrend
      ? "text-slate-600 hover:text-rose-600"
      : "text-slate-700 hover:text-slate-900";
  const navLabelClass = isStudio
    ? "uppercase tracking-[0.2em] text-xs"
    : isTrend
      ? "text-sm"
      : "";
  const authTextTone = isStudio
    ? "text-slate-300 hover:text-white"
    : isTrend
      ? "text-slate-500 hover:text-rose-600"
      : "text-slate-500 hover:text-slate-900";

  useEffect(() => {
    if (isCustomVariant) return;

    const load = async () => {
      try {
        const [categoriesRes, subcategoriesRes] = await Promise.all([
          axios.get(`${NEXT_PUBLIC_API_URL}/categories/getall`),
          axios.get(`${NEXT_PUBLIC_API_URL}/subcategories/getall`),
        ]);
        setCategories(categoriesRes.data?.data || []);
        setSubcategories(subcategoriesRes.data?.data || []);
      } catch {
        setCategories([]);
        setSubcategories([]);
      }
    };

    load();
  }, [isCustomVariant]);

  useEffect(() => {
    if (isCustomVariant) return;

    if (!vendor_id) return;
    const currentVendorId = String(vendor_id);

    const loadCart = async () => {
      const auth = getTemplateAuth(currentVendorId);
      setIsLoggedIn(Boolean(auth?.token));

      if (!auth?.token) {
        setCartCount(0);
        return;
      }

      try {
        const data = await templateApiFetch(currentVendorId, "/cart");
        const quantityValue = Number(data?.cart?.total_quantity);
        const itemQuantityFallback = Array.isArray(data?.cart?.items)
          ? data.cart.items.reduce(
              (sum: number, item: any) => sum + Number(item?.quantity || 0),
              0
            )
          : 0;

        if (Number.isFinite(quantityValue) && quantityValue >= 0) {
          setCartCount(quantityValue);
        } else {
          setCartCount(itemQuantityFallback);
        }
      } catch {
        setCartCount(0);
      }
    };

    loadCart();

    const refreshCart = () => {
      loadCart();
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === `template_auth_${currentVendorId}`) {
        loadCart();
      }
    };

    window.addEventListener("template-cart-updated", refreshCart);
    window.addEventListener("template-auth-updated", refreshCart);
    window.addEventListener("focus", refreshCart);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("template-cart-updated", refreshCart);
      window.removeEventListener("template-auth-updated", refreshCart);
      window.removeEventListener("focus", refreshCart);
      window.removeEventListener("storage", onStorage);
    };
  }, [isCustomVariant, vendor_id]);

  const subcategoriesByCategory = useMemo(() => {
    return subcategories.reduce<Record<string, any[]>>((acc, sub) => {
      const categoryId =
        sub?.category_id?._id || sub?.category_id || sub?.categoryId;
      if (!categoryId) return acc;
      if (!acc[categoryId]) acc[categoryId] = [];
      acc[categoryId].push(sub);
      return acc;
    }, {});
  }, [subcategories]);

  useEffect(() => {
    if (isCustomVariant) return;

    if (!categories.length) return;
    if (!activeCategoryId) {
      setActiveCategoryId(categories[0]?._id || null);
      return;
    }
    if (!categories.find((category) => category?._id === activeCategoryId)) {
      setActiveCategoryId(categories[0]?._id || null);
    }
  }, [isCustomVariant, categories, activeCategoryId]);

  if (isMquiq) {
    return <MquiqNavbar />;
  }
  if (isPoupqz) {
    return <PoupqzNavbar />;
  }
  if (isOragze) {
    return <OragzeNavbar />;
  }
  if (isWhiteRose) {
    return <WhiteRoseNavbar />;
  }

  return (
    <nav
      className={`sticky top-0 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 md:py-6 z-40 backdrop-blur-2xl border-b border-slate-200/60 ${
        isStudio
          ? "bg-slate-950/80 text-slate-100"
          : isTrend
            ? "bg-white/95 text-slate-900 shadow-sm shadow-rose-200/30"
            : "bg-white/90 text-slate-900"
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3 md:gap-4">
        <div
          className="w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden shadow-sm"
          data-template-section="branding"
        >
          <img
            src={
              homepage?.components?.logo ||
              "https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687"
            }
            alt="Business Logo"
            className="w-full h-full object-cover"
            data-template-path="components.logo"
            data-template-section="branding"
            data-template-component="components.logo"
          />
        </div>

        <span className="text-lg md:text-xl lg:text-2xl font-semibold tracking-wide truncate max-w-[160px] md:max-w-[200px]">
          {homepage?.business_name || "Your Business Name"}
        </span>
      </div>

      {/* Desktop Menu */}
      <div
        className={`hidden lg:flex items-center gap-8 ${isStudio ? "gap-6" : ""} ${
          isTrend ? "gap-6" : ""
        }`}
      >
        {menuItems.map((item) => (
          <Link
            key={item}
            href={
              item === "Home"
                ? `/template/${vendor_id}`
                : `/template/${vendor_id}/${item.toLowerCase()}`
            }
            className={`text-base font-medium transition-all duration-200 ${desktopLinkTone} ${navLabelClass}`}
          >
            {item}
          </Link>
        ))}
        <Link
          href={`/template/${vendor_id}/cart`}
          className={`text-base font-medium transition-all duration-200 ${desktopLinkTone} ${navLabelClass}`}
        >
          Cart
        </Link>
        {isLoggedIn ? (
          <>
            <Link
              href={`/template/${vendor_id}/orders`}
              className={`text-base font-medium transition-all duration-200 ${desktopLinkTone} ${navLabelClass}`}
            >
              Orders
            </Link>
            <Link
              href={`/template/${vendor_id}/profile`}
              className={`text-base font-medium transition-all duration-200 ${desktopLinkTone} ${navLabelClass}`}
            >
              Profile
            </Link>
          </>
        ) : (
          <Link
            href={`/template/${vendor_id}/login`}
            className={`text-base font-medium transition-all duration-200 ${desktopLinkTone} ${navLabelClass}`}
          >
            Login
          </Link>
        )}
        {customPages.map((page: any) => (
          <Link
            key={page.id || page.slug || page.title}
            href={`/template/${vendor_id}/page/${page.slug || page.id}`}
            className={`text-base font-medium transition-all duration-200 ${desktopLinkTone}`}
          >
            {page.title || "Page"}
          </Link>
        ))}

        <div className="relative group">
        <Link
          href={`/template/${vendor_id}/category`}
          className={`text-base font-medium transition-all duration-200 ${desktopLinkTone} ${navLabelClass}`}
        >
          Category
        </Link>

          <div className="pointer-events-none absolute right-0 top-full z-50 w-[90vw] max-w-[560px] pt-4 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
            <div
              className={`flex w-full overflow-hidden rounded-2xl border shadow-2xl ${
                isStudio
                  ? "border-slate-800 bg-slate-900 text-slate-100"
                  : isTrend
                    ? "border-rose-100 bg-white text-slate-900"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`w-1/2 border-r p-4 ${
                  isStudio ? "border-slate-800" : isTrend ? "border-rose-100" : "border-slate-100"
                }`}
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Categories
                </p>
                <div className="flex max-h-72 flex-col gap-2 overflow-auto pr-1">
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/template/${vendor_id}/category/${category._id}`}
                        onMouseEnter={() => setActiveCategoryId(category._id)}
                        className={`rounded-xl px-3 py-2 text-sm transition ${
                          activeCategoryId === category._id
                            ? isStudio
                              ? "bg-slate-800 text-slate-100"
                              : isTrend
                                ? "bg-rose-50 text-rose-600"
                              : "bg-slate-100 text-slate-900"
                            : isStudio
                              ? "text-slate-300 hover:bg-slate-800/60"
                              : isTrend
                                ? "text-slate-600 hover:bg-rose-50"
                              : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {category?.name || "Category"}
                      </Link>
                    ))
                  ) : (
                    <div
                      className={`rounded-xl border border-dashed px-3 py-6 text-center text-xs uppercase tracking-[0.3em] text-slate-400 ${
                        isStudio
                          ? "border-slate-700 bg-slate-900/70"
                          : isTrend
                            ? "border-rose-200 bg-rose-50"
                            : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      No categories
                    </div>
                  )}
                </div>
              </div>
              <div className="w-1/2 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Subcategories
                </p>
                <div className="flex max-h-72 flex-col gap-2 overflow-auto pr-1">
                  {(subcategoriesByCategory[activeCategoryId || ""] || []).length >
                  0 ? (
                    (subcategoriesByCategory[activeCategoryId || ""] || []).map(
                      (sub) => (
                        <Link
                          key={sub._id}
                          href={`/template/${vendor_id}/subcategory/${sub._id}`}
                          className={`rounded-xl px-3 py-2 text-sm transition ${
                            isStudio
                              ? "text-slate-300 hover:bg-slate-800/60"
                              : isTrend
                                ? "text-slate-600 hover:bg-rose-50"
                                : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {sub?.name || "Subcategory"}
                        </Link>
                      )
                    )
                  ) : (
                    <div
                      className={`rounded-xl border border-dashed px-3 py-6 text-center text-xs uppercase tracking-[0.3em] text-slate-400 ${
                        isStudio
                          ? "border-slate-700 bg-slate-900/70"
                          : isTrend
                            ? "border-rose-200 bg-rose-50"
                            : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      No subcategories
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Icons */}
      <div className="hidden lg:flex items-center gap-5">
        {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
          <a
            key={i}
            href="#"
            className={`transition-colors duration-200 ${iconTone}`}
          >
            <Icon size={22} />
          </a>
        ))}
        <Link
          href={`/template/${vendor_id}/cart`}
          className={`relative transition-colors duration-200 ${iconTone}`}
        >
          <ShoppingBag size={22} />
          <span
            className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-white ${
              isTrend ? "bg-rose-500" : "bg-slate-900"
            }`}
          >
            {cartCount}
          </span>
        </Link>
        {isLoggedIn && (
          <button
            onClick={() => {
              clearTemplateAuth(String(vendor_id));
              setIsLoggedIn(false);
              setCartCount(0);
            }}
            className={`text-xs font-semibold uppercase tracking-[0.2em] ${authTextTone}`}
          >
            Logout
          </button>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="lg:hidden flex items-center justify-center p-2 rounded-md transition-transform duration-200 hover:scale-105"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden absolute top-full left-0 right-0 bg-opacity-90 backdrop-blur-lg py-8 shadow-md animate-slideDown ${
            isStudio
              ? "bg-slate-950 text-slate-100"
              : isTrend
                ? "bg-white text-slate-900"
                : "bg-white text-slate-900"
          }`}
        >
          <div className="flex flex-col items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item}
                href={
                  item === "Home"
                    ? `/template/${vendor_id}`
                    : `/template/${vendor_id}/${item.toLowerCase()}`
                }
                className={`text-lg font-medium transition-colors duration-200 ${desktopLinkTone}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            {customPages.map((page: any) => (
              <Link
                key={page.id || page.slug || page.title}
                href={`/template/${vendor_id}/page/${page.slug || page.id}`}
                className={`text-lg font-medium transition-colors duration-200 ${desktopLinkTone}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {page.title || "Page"}
              </Link>
            ))}
            <Link
              href={`/template/${vendor_id}/category`}
              className={`text-lg font-medium transition-colors duration-200 ${desktopLinkTone}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Category
            </Link>

            <div className="flex items-center gap-5 mt-4">
              {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className={`transition-colors duration-200 ${iconTone}`}
                >
                  <Icon size={22} />
                </a>
              ))}
              <Link
                href={`/template/${vendor_id}/cart`}
                className={`relative transition-colors duration-200 ${iconTone}`}
              >
                <ShoppingBag size={22} />
                <span
                  className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-white ${
                    isTrend ? "bg-rose-500" : "bg-slate-900"
                  }`}
                >
                  {cartCount}
                </span>
              </Link>
              {isLoggedIn ? (
                <>
                  <Link
                    href={`/template/${vendor_id}/orders`}
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${authTextTone}`}
                  >
                    Orders
                  </Link>
                  <Link
                    href={`/template/${vendor_id}/profile`}
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${authTextTone}`}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      clearTemplateAuth(String(vendor_id));
                      setIsLoggedIn(false);
                      setCartCount(0);
                    }}
                    className={`text-xs font-semibold uppercase tracking-[0.2em] ${authTextTone}`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href={`/template/${vendor_id}/login`}
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${authTextTone}`}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
