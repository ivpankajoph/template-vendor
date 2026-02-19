"use client";

import { RootState } from "@/store";
import { useSelector } from "react-redux";

interface HomePageDescription {
  large_text?: string;
  summary?: string;
  percent?: {
    percent_in_number?: number | string;
    percent_text?: string;
  };
  sold?: {
    sold_number?: number | string;
    sold_text?: string;
  };
}

export default function PremierDestination2() {
  const data: HomePageDescription | undefined = useSelector(
    (state: any) => state?.alltemplatepage?.data?.components?.home_page?.description
  );

  console.log("Home Page Description Data:", data);

  return (
    <div className="py-16 lg:py-20 template-accent-gradient">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - Image */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"
                alt={data?.large_text || "Decorative Plant Image"}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {data?.large_text || "Your Title Goes Here"}
            </h2>

            <p className="text-gray-700 text-base lg:text-lg mb-12 leading-relaxed">
              {data?.summary || "Your description text goes here."}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-8">
              
              {/* Customer Satisfaction */}
              <div>
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  {data?.percent?.percent_in_number ?? "--"}%
                </div>
                <div className="text-gray-600 text-base lg:text-lg">
                  {data?.percent?.percent_text ?? "Stat description"}
                </div>
              </div>

              {/* Plants Sold */}
              <div>
                <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  {data?.sold?.sold_number ?? "--"}
                </div>
                <div className="text-gray-600 text-base lg:text-lg">
                  {data?.sold?.sold_text ?? "Sold description"}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
