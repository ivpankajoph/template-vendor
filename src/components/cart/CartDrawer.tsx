"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, X, Plus, Minus } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { fetchCart, removeCartItem, updateCartItem } from "@/store/slices/customerCartSlice"
import Link from "next/link"
import { toastError, toastSuccess } from "@/lib/toast"

export default function CartDrawer() {
  const dispatch = useDispatch<AppDispatch>()
  const cart = useSelector((state: RootState) => state.customerCart.cart)
  const loading = useSelector((state: RootState) => state.customerCart.loading)
  const token = useSelector((state: RootState) => state.customerAuth.token)

  const cartItems = token ? cart?.items || [] : []

  useEffect(() => {
    if (token) {
      dispatch(fetchCart())
    }
  }, [dispatch, token])

  const updateQuantity = async (id: string, amount: number, current: number) => {
    const nextQty = Math.max(1, current + amount)
    try {
      await dispatch(updateCartItem({ itemId: id, quantity: nextQty })).unwrap()
      toastSuccess("Cart updated")
    } catch (error: any) {
      toastError(error || "Failed to update cart")
    }
  }

  const removeItem = async (id: string) => {
    try {
      await dispatch(removeCartItem({ itemId: id })).unwrap()
      toastSuccess("Item removed")
    } catch (error: any) {
      toastError(error || "Failed to remove item")
    }
  }

  const subtotal = cart?.subtotal || 0

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {token && cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-lg font-semibold">My Cart</SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {!token ? (
            <div className="text-center text-muted-foreground mt-10">
              <p className="mb-4">Please login to view your cart.</p>
              <Button asChild>
                <Link href="/login">Go to Login</Link>
              </Button>
            </div>
          ) : cartItems.length === 0 ? (
            <p className="text-center text-muted-foreground mt-10">
              {loading ? "Loading cart..." : "Your cart is empty 🛒"}
            </p>
          ) : (
            cartItems.map((item: any) => (
              <div
                key={item._id}
                className="flex items-center gap-4 border rounded-lg p-3 hover:bg-muted/30 transition-colors"
              >
                {/* Image */}
                <div className="relative h-16 w-16 flex-shrink-0">
                  <Image
                    src={item.image_url || "/placeholder.png"}
                    alt={item.product_name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {item.product_name}
                    </h4>
                    <button onClick={() => removeItem(item._id)}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Object.values(item.variant_attributes || {}).join(" / ")}
                  </p>

                  {/* Quantity + Price */}
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center border rounded-md">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(item._id, -1, item.quantity)}
                        className="h-6 w-6"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => updateQuantity(item._id, 1, item.quantity)}
                        className="h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      ₹{(item.total_price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {token && (
          <div className="border-t px-4 py-4 space-y-3 bg-background">
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <Button
              className="mt-4 w-full py-6 text-base font-semibold rounded-full"
              asChild
              disabled={cartItems.length === 0}
            >
              <Link href="/checkout/bag">Proceed to Checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

