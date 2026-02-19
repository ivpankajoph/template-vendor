"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { fetchCart, removeCartItem, updateCartItem } from "@/store/slices/customerCartSlice"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { toastError, toastSuccess } from "@/lib/toast"
import PromotionalBanner from "@/components/promotional-banner"
import Footer from "@/components/footer"
import Navbar from "@/components/navbar/Navbar"

export default function CartPage() {
  const dispatch = useDispatch<AppDispatch>()
  const token = useSelector((state: RootState) => state.customerAuth.token)
  const cart = useSelector((state: RootState) => state.customerCart.cart)
  const loading = useSelector((state: RootState) => state.customerCart.loading)

  useEffect(() => {
    if (token) dispatch(fetchCart())
  }, [dispatch, token])

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p>Please login to view your cart.</p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!cart || cart.items?.length === 0) {
    return (
<>
<PromotionalBanner/>
<Navbar/>
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p>{loading ? "Loading cart..." : "Your cart is empty."}</p>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer/></>
    )
  }

  return (
   <>
   <PromotionalBanner/>
   <Navbar/>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>My Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.map((item: any) => (
              <div key={item._id} className="flex justify-between items-center border-b py-2">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {Object.values(item.variant_attributes || {}).join(" / ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await dispatch(
                          updateCartItem({
                            itemId: item._id,
                            quantity: Math.max(1, item.quantity - 1),
                          }),
                        ).unwrap()
                        toastSuccess("Cart updated")
                      } catch (error: any) {
                        toastError(error || "Failed to update cart")
                      }
                    }}
                  >
                    -
                  </Button>
                  <span>{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await dispatch(
                          updateCartItem({
                            itemId: item._id,
                            quantity: item.quantity + 1,
                          }),
                        ).unwrap()
                        toastSuccess("Cart updated")
                      } catch (error: any) {
                        toastError(error || "Failed to update cart")
                      }
                    }}
                  >
                    +
                  </Button>
                  <span className="font-semibold">₹{(item.total_price || 0).toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await dispatch(removeCartItem({ itemId: item._id })).unwrap()
                        toastSuccess("Item removed")
                      } catch (error: any) {
                        toastError(error || "Failed to remove item")
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-3">
              <span>Total</span>
              <span>₹{(cart.subtotal || 0).toFixed(2)}</span>
            </div>
            <Button asChild>
              <Link href="/checkout/bag">Proceed to Checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    <Footer/>
    </>
  )
}
