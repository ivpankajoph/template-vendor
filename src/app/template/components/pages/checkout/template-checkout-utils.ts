import { INDIAN_STATES as MASTER_INDIAN_STATES } from "@/lib/constants";

export type TemplateCheckoutStep = "bag" | "address" | "payment";
export type TemplatePaymentMethod = "razorpay" | "cod";

const getAddressKey = (vendorId: string) =>
  `template_checkout_address_${vendorId}`;
const getPaymentKey = (vendorId: string) =>
  `template_checkout_payment_${vendorId}`;
const getCouponKey = (vendorId: string) =>
  `template_checkout_coupon_${vendorId}`;

const canUseStorage = () => typeof window !== "undefined";

export const INDIAN_STATES: string[] = MASTER_INDIAN_STATES;
export const FREE_DELIVERY_MINIMUM_AMOUNT = 500;
export const FOOD_GST_RATE = 0.05;
export const DELIVERY_GST_RATE = 0.18;

export const formatAmount = (amount: number) =>
  `Rs. ${Number(amount || 0).toFixed(2)}`;

export const roundCurrency = (amount: number) =>
  Math.round(Number(amount || 0) * 100) / 100;

export const qualifiesForFreeDelivery = (amount: number) =>
  Number(amount || 0) >= FREE_DELIVERY_MINIMUM_AMOUNT;

export const calculateFoodGst = (amount: number) =>
  roundCurrency(Math.max(Number(amount || 0), 0) * FOOD_GST_RATE);

export const calculateDeliveryGst = (amount: number) =>
  roundCurrency(Math.max(Number(amount || 0), 0) * DELIVERY_GST_RATE);

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
  localStorage.removeItem(getCouponKey(vendorId));
};

export const saveTemplateCheckoutCouponCode = (
  vendorId: string,
  couponCode: string,
) => {
  if (!canUseStorage()) return;
  const normalizedCode = String(couponCode || "").trim().toUpperCase();
  if (!normalizedCode) {
    localStorage.removeItem(getCouponKey(vendorId));
    return;
  }
  localStorage.setItem(getCouponKey(vendorId), normalizedCode);
};

export const getTemplateCheckoutCouponCode = (vendorId: string) => {
  if (!canUseStorage()) return "";
  return localStorage.getItem(getCouponKey(vendorId)) || "";
};
