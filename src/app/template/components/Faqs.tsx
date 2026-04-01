"use client";

import { useSelector } from "react-redux";
import {
  configuredArray,
  configuredText,
} from "@/app/template/components/template-content";

const FaqsDev = () => {
  const faqSection = useSelector(
    (state: any) => state.alltemplatepage?.data?.components?.social_page.faqs
  );

  const heading = configuredText(
    faqSection?.heading,
    "Frequently Asked Questions"
  );
  const subheading = configuredText(
    faqSection?.subheading,
    "Quick answers to common questions"
  );
  const faqs = configuredArray<any>(faqSection?.faqs, []);

  return (
    <div className="mt-20">
      <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
        {heading}
      </h2>
      <p className="mb-12 text-center text-lg text-gray-600">{subheading}</p>

      {faqs.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {faqs.map((faq: any, idx: number) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {configuredText(faq?.question)}
              </h3>
              <p className="leading-relaxed text-gray-600">
                {configuredText(faq?.answer)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No FAQs available right now.</p>
      )}
    </div>
  );
};

export default FaqsDev;
