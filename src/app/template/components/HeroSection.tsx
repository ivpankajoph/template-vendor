/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSelector } from "react-redux";
import Link from "next/link";
import { RootState } from "@/store";
import { useParams } from "next/navigation";



export default function LandingPageDev() {
  // ✅ FIXED SELECTOR (correct data path based on your Redux DevTools screenshot)
  const { homepage, loading, error } = useSelector(
    (state: RootState) => ({
      homepage: (state as any)?.alltemplatepage?.data?.components?.home_page,
      previewImage: (state as any)?.alltemplatepage?.data?.previewImage,
      loading: (state as any)?.alltemplatepage?.loading,
      error: (state as any)?.alltemplatepage?.error,
    })
  );
  const params = useParams();
  const vendor_id = params.vendor_id as string;

//   useEffect(() => {
//     if (vendorId) {
//       dispatch(fetchHomepageTemplate(vendorId));
//     }
//   }, [vendorId, dispatch]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (error)
    return <div className="text-center py-20 text-red-500">{error}</div>;

  const bannerImage =
    homepage?.backgroundImage ||
    "https://images.unsplash.com/photo-1463320726281-696a485928c7?w=1920&q=80";

  return (
    <div className="min-h-screen relative" data-template-section="hero">
      {/* ✅ Banner Image from Cloudinary */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        data-template-section="branding"
        data-template-path="components.home_page.backgroundImage"
        data-template-component="components.home_page.backgroundImage"
        style={{
          backgroundImage: `linear-gradient(color-mix(in srgb, var(--template-banner-color) 55%, transparent), color-mix(in srgb, var(--template-banner-color) 55%, transparent)), url(${bannerImage})`,
        }}
      />

      <div className="relative z-10">

        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
          <p
            className="text-white text-sm lg:text-base tracking-widest mb-6 uppercase"
            data-template-path="components.home_page.header_text_small"
            data-template-section="hero"
          >
            {homepage?.header_text_small || "Welcome to APi Urban Jungle Co."}
          </p>

          <h1
            className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-8 max-w-6xl"
            data-template-path="components.home_page.header_text"
            data-template-section="hero"
          >
            {homepage?.header_text ||
              "Discover the Beauty of Nature at Your Fingertips"}
          </h1>

          <Link href={`/template/${vendor_id}/all-products`}>
            <button
              className="text-white px-10 cursor-pointer py-4 rounded-full text-lg lg:text-xl font-semibold transition-all transform hover:scale-105 shadow-lg template-accent-bg template-accent-bg-hover"
              data-template-path="components.home_page.button_header"
              data-template-section="hero"
            >
              {homepage?.button_header || "Shop all Products"}
            </button>
          </Link>
        </div>

        {/* ✅ Features Section */}
        {homepage?.description?.features &&
          homepage.description.features.length > 0 && (
            <div className="relative z-10 bg-gray-50 py-16 lg:py-20">
              <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                  {homepage.description.features.map((feature:any, idx:any) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center mb-6 template-accent-soft template-accent">
                        {feature.icon ? (
                          <img
                            src={feature.icon}
                            alt={feature.title}
                            className="w-10 h-10 lg:w-12 lg:h-12"
                          />
                        ) : (
                          <svg
                            className="w-10 h-10 lg:w-12 lg:h-12"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        )}
                      </div>
                      <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-base lg:text-lg">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
