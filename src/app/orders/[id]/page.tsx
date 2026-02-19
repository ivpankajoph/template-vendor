"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import userApi from "@/lib/userApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PromotionalBanner from "@/components/promotional-banner"
import Navbar from "@/components/navbar/Navbar"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { toastError, toastSuccess } from "@/lib/toast"

const formatMoney = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const token = useSelector((state: RootState) => state.customerAuth.token)
  const orderId = params?.id as string
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return
    }
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const res = await userApi.get(`/orders/${orderId}`)
        setOrder(res.data?.order || null)
      } catch (error: any) {
        toastError(error?.response?.data?.message || "Failed to load order")
      } finally {
        setLoading(false)
      }
    }
    if (orderId) fetchOrder()
  }, [orderId, router, token])

  const totals = useMemo(() => {
    if (!order) return null
    const subtotal = Number(order.subtotal || 0)
    const discount = Number(order.discount || 0)
    const shipping = Number(order.shipping_fee || 0)
    const baseAmount = Math.max(subtotal - discount + shipping, 0)
    const taxAmount = Math.max(Number(order.total || 0) - baseAmount, 0)
    const taxRate = baseAmount ? (taxAmount / baseAmount) * 100 : 0
    return { subtotal, discount, shipping, taxAmount, taxRate, total: Number(order.total || 0) }
  }, [order])

  const downloadInvoice = async () => {
    try {
      const res = await userApi.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      })
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `invoice-${order?.order_number || orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toastSuccess("Invoice downloaded")
    } catch (error: any) {
      toastError(error?.response?.data?.message || "Failed to download invoice")
    }
  }

  if (!token) return null

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-indigo-500">Order details</p>
              <h1 className="text-2xl font-semibold text-slate-900">
                {order?.order_number ? `Order #${order.order_number}` : "Order"}
              </h1>
              <p className="text-sm text-slate-500">
                {order?.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : "Loading..."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push("/orders")}>
                Back to orders
              </Button>
              <Button
                className="bg-indigo-600 text-white hover:bg-indigo-500"
                onClick={downloadInvoice}
                disabled={!order}
              >
                Download invoice (PDF)
              </Button>
            </div>
          </div>

          {loading && (
            <Card>
              <CardContent className="p-6 text-center text-slate-500">
                Loading order details...
              </CardContent>
            </Card>
          )}

          {!loading && !order && (
            <Card>
              <CardContent className="p-6 text-center text-slate-500">
                Order not found.
              </CardContent>
            </Card>
          )}

          {order && totals && (
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <Card className="border-indigo-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.items?.map((item: any) => {
                      const productId = getItemId(item)
                      const productCategory = getItemCategory(item)
                      const productUrl = `/product/${productCategory}/${productId}`
                      return (
                        <div
                          key={item._id || item.variant_id}
                          className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 sm:flex-row sm:items-center"
                        >
                          <Link
                            href={productUrl}
                            className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100"
                          >
                            <Image
                              src={getItemImage(item)}
                              alt={item.product_name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </Link>
                          <div className="flex-1 space-y-1">
                            <Link
                              href={productUrl}
                              className="text-base font-semibold text-slate-900 hover:text-indigo-600"
                            >
                              {item.product_name}
                            </Link>
                            <p className="text-xs text-slate-500">
                              {Object.values(item.variant_attributes || {}).join(" / ") ||
                                "Standard"}
                            </p>
                            <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right text-sm font-semibold text-slate-900">
                            {formatMoney(item.total_price || 0)}
                            <p className="text-xs text-slate-500">
                              {formatMoney(item.unit_price || 0)} each
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>

                <Card className="border-indigo-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">Shipping address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {order.shipping_address?.full_name || "Customer"}
                    </p>
                    <p>{order.shipping_address?.phone}</p>
                    <p>{order.shipping_address?.line1}</p>
                    {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
                    <p>
                      {order.shipping_address?.city}, {order.shipping_address?.state}{" "}
                      {order.shipping_address?.pincode}
                    </p>
                    <p>{order.shipping_address?.country || "India"}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-indigo-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">Order summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Payment</span>
                      <span className="text-slate-900">
                        {order.payment_method || "cod"} ({order.payment_status || "pending"})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-900">{formatMoney(totals.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span className="text-slate-900">- {formatMoney(totals.discount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="text-slate-900">{formatMoney(totals.shipping)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GST ({totals.taxRate.toFixed(2)}%)</span>
                      <span className="text-slate-900">{formatMoney(totals.taxAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3 text-base font-semibold text-slate-900">
                      <span>Total</span>
                      <span>{formatMoney(totals.total)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-indigo-100 bg-indigo-50/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-indigo-700">Invoice details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-indigo-700">
                    <p>Company: Life changing pvt ltd</p>
                    <p>GSTIN: 27AAECL1234F1Z5</p>
                    <p>Support: support@lifechangingpvt.com</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
