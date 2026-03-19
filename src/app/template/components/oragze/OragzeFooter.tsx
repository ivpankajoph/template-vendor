'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Facebook, Instagram, Leaf, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react'
import { buildTemplateScopedPath } from '@/lib/template-route'

type TemplateProduct = {
  _id?: string
  productName?: string
}

const resolveHref = (value: unknown) => {
  if (typeof value !== 'string') return '#'
  const trimmed = value.trim()
  return trimmed || '#'
}

export function OragzeFooter() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      suffix,
    })

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )

  const social = template?.components?.social_page || {}
  const businessName = template?.business_name || 'Organic'

  const organicLinks = [
    { label: 'About us', href: vendorId ? toTemplatePath('about') : '#' },
    { label: 'Conditions', href: vendorId ? toTemplatePath('checkout') : '#' },
    { label: 'Our Journals', href: vendorId ? toTemplatePath('all-products') : '#' },
    { label: 'Careers', href: vendorId ? toTemplatePath('contact') : '#' },
    { label: 'Affiliate Programme', href: vendorId ? toTemplatePath('register') : '#' },
  ]

  const quickLinks = [
    { label: 'Offers', href: vendorId ? toTemplatePath('') : '#' },
    { label: 'Discount Coupons', href: vendorId ? toTemplatePath('all-products') : '#' },
    { label: 'Stores', href: vendorId ? toTemplatePath('contact') : '#' },
    { label: 'Track Order', href: vendorId ? toTemplatePath('orders') : '#' },
    { label: 'Shop', href: vendorId ? toTemplatePath('all-products') : '#' },
  ]

  const customerService = [
    { label: 'Contact', href: vendorId ? toTemplatePath('contact') : '#' },
    { label: 'Privacy Policy', href: vendorId ? toTemplatePath('privacy-policy') : '#' },
    { label: 'Returns & Refunds', href: vendorId ? toTemplatePath('returns-refunds') : '#' },
    { label: 'Delivery Information', href: vendorId ? toTemplatePath('delivery-information') : '#' },
  ]

  return (
    <footer id='contact-us' className='mt-12 border-t border-slate-200 bg-white text-slate-800'>
      <div className='mx-auto max-w-[1320px] px-4 py-16 md:px-8'>
        <div className='grid gap-12 md:grid-cols-2 lg:grid-cols-5'>
          <div className='lg:col-span-2 pr-0 lg:pr-12'>
            <div className='flex items-center gap-2 text-pink-600 mb-6'>
              <Leaf className='h-8 w-8 text-pink-600' />
              <span className='text-[34px] font-extrabold tracking-tight text-slate-800'>
                {businessName}
              </span>
            </div>
            <p className='text-[15px] leading-relaxed text-slate-600 mb-8'>
              Your trusted marketplace for quality products. Unbeatable prices, massive selection, and fast delivery guaranteed.
            </p>
            <div className='flex items-center gap-4'>
              {[
                { icon: Facebook, href: resolveHref(social?.facebook), color: 'hover:text-blue-600 hover:bg-blue-50' },
                { icon: Twitter, href: resolveHref(social?.twitter), color: 'hover:text-sky-500 hover:bg-sky-50' },
                { icon: Youtube, href: resolveHref(social?.youtube), color: 'hover:text-red-600 hover:bg-red-50' },
                { icon: Instagram, href: resolveHref(social?.instagram), color: 'hover:text-pink-600 hover:bg-pink-50' },
              ].map((entry) => {
                const Icon = entry.icon
                return (
                  <a
                    key={`${entry.href}-${Icon.displayName || 'icon'}`}
                    href={entry.href}
                    target='_blank'
                    rel='noreferrer'
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:-translate-y-1 ${entry.color}`}
                  >
                    <Icon className='h-5 w-5' />
                  </a>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className='text-[18px] font-bold text-slate-900 mb-6'>
              Quick Links
            </h3>
            <ul className='space-y-3'>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className='text-[15px] font-medium text-slate-600 transition-colors hover:text-pink-600'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-[18px] font-bold text-slate-900 mb-6'>
              Customer Service
            </h3>
            <ul className='space-y-3'>
              {customerService.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className='text-[15px] font-medium text-slate-600 transition-colors hover:text-pink-600'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-[18px] font-bold text-slate-900 mb-6'>
              Contact Us
            </h3>
            <ul className='space-y-4 text-[15px] font-medium text-slate-600'>
              <li className='flex items-start gap-3'>
                <MapPin className='h-5 w-5 text-pink-600 shrink-0 mt-0.5' />
                <span>123 Commerce Blvd, Tech City, TC 10010</span>
              </li>
              <li className='flex items-center gap-3'>
                <Phone className='h-5 w-5 text-pink-600 shrink-0' />
                <span>+1 234 567 890</span>
              </li>
              <li className='flex items-center gap-3'>
                <Mail className='h-5 w-5 text-pink-600 shrink-0' />
                <span>support@{toSlug(businessName) || 'store'}.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className='border-t border-slate-200 bg-slate-50'>
        <div className='mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-4 px-4 py-6 text-[14px] font-medium text-slate-500 md:flex-row md:px-8'>
          <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <div className='flex items-center gap-6'>
            <Link href='#' className='hover:text-pink-600 transition-colors'>Terms of Service</Link>
            <Link href='#' className='hover:text-pink-600 transition-colors'>Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '')
}
