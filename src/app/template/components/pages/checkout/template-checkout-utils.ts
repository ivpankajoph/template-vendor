import { INDIAN_STATES as MASTER_INDIAN_STATES } from "@/lib/constants";

export type TemplateCheckoutStep = "bag" | "address" | "payment";
export type TemplatePaymentMethod = "razorpay" | "cod";

const getAddressKey = (vendorId: string) =>
  `template_checkout_address_${vendorId}`;
const getPaymentKey = (vendorId: string) =>
  `template_checkout_payment_${vendorId}`;

const canUseStorage = () => typeof window !== "undefined";

export const INDIAN_STATES: string[] = MASTER_INDIAN_STATES;

export const formatAmount = (amount: number) =>
  `Rs. ${Number(amount || 0).toFixed(2)}`;

export const saveTemplateCheckoutAddressId = (
  vendorId: string,
  addressId: string,
) => {
  if (!canUseStorage()) return;
  if (!addressId) {
    localStorage.removeItem(getAddressKey(vendorId));
    return;
  }
  localStorage.setItem(getAddressKey(vendorId), addressId);
};

export const getTemplateCheckoutAddressId = (vendorId: string) => {
  if (!canUseStorage()) return "";
  return localStorage.getItem(getAddressKey(vendorId)) || "";
};

export const saveTemplateCheckoutPaymentMethod = (
  vendorId: string,
  paymentMethod: TemplatePaymentMethod,
) => {
  if (!canUseStorage()) return;
  localStorage.setItem(getPaymentKey(vendorId), paymentMethod);
};

export const getTemplateCheckoutPaymentMethod = (
  vendorId: string,
): TemplatePaymentMethod => {
  if (!canUseStorage()) return "razorpay";
  const value = localStorage.getItem(getPaymentKey(vendorId));
  return value === "cod" ? "cod" : "razorpay";
};

export const clearTemplateCheckoutSession = (vendorId: string) => {
  if (!canUseStorage()) return;
  localStorage.removeItem(getAddressKey(vendorId));
  localStorage.removeItem(getPaymentKey(vendorId));
};
