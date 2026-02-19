"use client";
import { createContext, useContext, useEffect, useState } from "react";

export const VendorContext = createContext("default");

export const useVendor = () => useContext(VendorContext);

export default function VendorProvider({ children }: { children: React.ReactNode }) {
  const [vendorId, setVendorId] = useState("default");

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const id = parts[2];
    if (id) setVendorId(id);
  }, []);

  return (
    <VendorContext.Provider value={vendorId}>
      {children}
    </VendorContext.Provider>
  );
}
