"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { cancelOrder, fetchOrders } from "@/store/slices/customerOrderSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toastError, toastSuccess } from "@/lib/toast"
import PromotionalBanner from "@/components/promotional-banner"
import Navbar from "@/components/navbar/Navbar"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import userApi from "@/lib/userApi"

const formatMoney = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`

export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const token = useSelector((state: RootState) => state.customerAuth.token)
  const orders = useSelector((state: RootState) => state.customerOrder.orders)
  const loading = useSelector((state: RootState) => state.customerOrder.loading)
  const getItemCategory = (item: any) =>
    item?.product_category ||
    item?.productCategory ||
    item?.product?.productCategory ||
    "unknown"
  const getItemId = (item: any) =>
    item?.product_id || item?.productId || item?.product?._id || item?._id
  const getItemImage = (item: any) =>
    item?.image_url ||
    item?.image ||
    item?.product?.image_url ||
    "/placeholder.png"

  const downloadInvoice = async (orderId: string, orderNumber?: string) => {
    try {
      const res = await userApi.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${orderNumber || orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess("Invoice downloaded")
    } catch (error: any) {
      toastError(error?.response?.data?.message || "Failed to download invoice")
    }
  }

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return
    }
    dispatch(fetchOrders())
  }, [dispatch, token, router])

  if (!token) return null

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-pink-50 p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-indigo-500">Your purchase history</p>
                <CardTitle className="text-2xl text-slate-900">My Orders</CardTitle>
              </div>
              <div className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                {orders.length} orders
              </div>
            </CardHeader>
          </Card>
          {loading && <p>Loading orders...</p>}
          {!loading && orders.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p>No orders yet.</p>
              </CardContent>
            </Card>
          )}
          {orders.map((order: any) => (
            <Card key={order._id} className="border-indigo-100 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Order #{order.order_number}</p>
                    <p className="text-xs text-slate-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      {order.status}
                    </span>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {order.payment_method || "cod"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Items ({order.items?.length || 0})</span>
                  <span>Click any item to view details</span>
                </div>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-2">
                  {order.items.map((item: any) => {
                    const productId = getItemId(item)
                    const productCategory = getItemCategory(item)
                    const productUrl = `/product/${productCategory}/${productId}`
                    return (
                      <Link
                        key={item._id || item.variant_id}
                        href={productUrl}
                        className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-shadow hover:shadow-sm"
                      >
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                          <Image
                            src={getItemImage(item)}
                            alt={item.product_name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-1 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Object.values(item.variant_attributes || {}).join(" / ")}
                            </p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-sm font-semibold whitespace-nowrap text-slate-900">
                            {formatMoney(item.total_price || 0)}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between border-t pt-3 font-semibold">
                  <span>Total</span>
                  <span>{formatMoney(order.total || 0)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => router.push(`/orders/${order._id}`)}>
                    View details
                  </Button>
                  <Button
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                    onClick={() => downloadInvoice(order._id, order.order_number)}
                  >
                    Download invoice
                  </Button>
                </div>
                {order.status === "pending" && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await dispatch(cancelOrder({ id: order._id })).unwrap()
                        toastSuccess("Order cancelled")
                      } catch (error: any) {
                        toastError(error || "Failed to cancel order")
                      }
                    }}
                  >
                    Cancel Order
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
