"use client";

import { useSelector } from "react-redux";


const FaqsDev = () => {
  const faqSection = useSelector((state: any) => state.alltemplatepage?.data?.components?.social_page.faqs);

  const heading = faqSection?.heading || "Frequently Asked Questions";
  const subheading = faqSection?.subheading || "Quick answers to common questions";
  const faqs = faqSection?.faqs || []; // ✅ faq array

  return (
    <div className="mt-20">
      <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">
        {heading}
      </h2>
      <p className="text-gray-600 text-lg text-center mb-12">
        {subheading}
      </p>

      {faqs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq: any, idx: number) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
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
