import { redirect } from "next/navigation";

export default function CheckoutRootPage() {
  redirect("/checkout/bag");
}
