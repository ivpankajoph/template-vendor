import { INDIAN_STATES as MASTER_INDIAN_STATES } from "@/lib/constants";

export type CheckoutStep = "bag" | "address" | "payment";
export type CheckoutPaymentMethod = "razorpay" | "cod";

const CHECKOUT_ADDRESS_KEY = "ophmate_checkout_address_id";
const CHECKOUT_PAYMENT_KEY = "ophmate_checkout_payment_method";

export const INDIAN_STATES: string[] = MASTER_INDIAN_STATES;

const canUseStorage = () => typeof window !== "undefined";

export const formatAmount = (amount: number) =>
  `Rs. ${Number(amount || 0).toFixed(2)}`;

export const saveCheckoutAddressId = (addressId: string) => {
  if (!canUseStorage()) return;
  if (!addressId) {
    localStorage.removeItem(CHECKOUT_ADDRESS_KEY);
    return;
  }
  localStorage.setItem(CHECKOUT_ADDRESS_KEY, addressId);
};

export const getSavedCheckoutAddressId = () => {
  if (!canUseStorage()) return "";
  return localStorage.getItem(CHECKOUT_ADDRESS_KEY) || "";
};

export const saveCheckoutPaymentMethod = (
  paymentMethod: CheckoutPaymentMethod,
) => {
  if (!canUseStorage()) return;
  localStorage.setItem(CHECKOUT_PAYMENT_KEY, paymentMethod);
};

export const getSavedCheckoutPaymentMethod = (): CheckoutPaymentMethod => {
  if (!canUseStorage()) return "razorpay";
  const value = localStorage.getItem(CHECKOUT_PAYMENT_KEY);
  return value === "cod" ? "cod" : "razorpay";
};

export const clearCheckoutSession = () => {
  if (!canUseStorage()) return;
  localStorage.removeItem(CHECKOUT_ADDRESS_KEY);
  localStorage.removeItem(CHECKOUT_PAYMENT_KEY);
};
