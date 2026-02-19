"use client";
import Script from "next/script";
import { useVendor } from "@/providers/VendorProvider";

export default function GoogleAnalytics() {
  const vendorId = useVendor();
  const measurementId = "G-CN686811YH";

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />

      <Script id="ga-init">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          gtag('js', new Date());
          gtag('config', '${measurementId}', { debug_mode: true });

          gtag('event', 'vendor_event', {
            vendor_id: '${vendorId}'
          });
        `}
      </Script>
    </>
  );
}
