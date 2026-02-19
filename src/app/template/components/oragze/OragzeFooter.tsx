'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Facebook, Instagram, Leaf, Twitter, Youtube } from 'lucide-react'

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

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )

  const social = template?.components?.social_page || {}
  const businessName = template?.business_name || 'Organic'

  const organicLinks = [
    { label: 'About us', href: vendorId ? `/template/${vendorId}/about` : '#' },
    { label: 'Conditions', href: vendorId ? `/template/${vendorId}/checkout` : '#' },
    { label: 'Our Journals', href: vendorId ? `/template/${vendorId}/all-products` : '#' },
    { label: 'Careers', href: vendorId ? `/template/${vendorId}/contact` : '#' },
    { label: 'Affiliate Programme', href: vendorId ? `/template/${vendorId}/register` : '#' },
    { label: 'Ultras Press', href: vendorId ? `/template/${vendorId}/about` : '#' },
  ]

  const quickLinks = [
    { label: 'Offers', href: vendorId ? `/template/${vendorId}` : '#' },
    { label: 'Discount Coupons', href: vendorId ? `/template/${vendorId}/all-products` : '#' },
    { label: 'Stores', href: vendorId ? `/template/${vendorId}/contact` : '#' },
    { label: 'Track Order', href: vendorId ? `/template/${vendorId}/orders` : '#' },
    { label: 'Shop', href: vendorId ? `/template/${vendorId}/all-products` : '#' },
    { label: 'Info', href: vendorId ? `/template/${vendorId}/about` : '#' },
  ]

  const customerService = [
    { label: 'FAQ', href: vendorId ? `/template/${vendorId}#faq` : '#' },
    { label: 'Contact', href: vendorId ? `/template/${vendorId}/contact` : '#' },
    { label: 'Privacy Policy', href: vendorId ? `/template/${vendorId}/privacy-policy` : '#' },
    { label: 'Returns & Refunds', href: vendorId ? `/template/${vendorId}/returns-refunds` : '#' },
    { label: 'Cookie Guidelines', href: vendorId ? `/template/${vendorId}/cookie-guidelines` : '#' },
    { label: 'Delivery Information', href: vendorId ? `/template/${vendorId}/delivery-information` : '#' },
  ]

  const featuredProductLinks = useMemo(() => {
    return products
      .filter((item) => item?._id && item?.productName)
      .slice(0, 4)
      .map((item) => ({
        label: String(item.productName || 'Product'),
        href: `/template/${vendorId}/product/${item._id}`,
      }))
  }, [products, vendorId])

  return (
    <footer id='contact-us' className='mt-16 border-t border-[#d8dccf] bg-[#ececea] text-[#232b3a]'>
      <div className='mx-auto max-w-[1320px] px-4 py-14 md:px-8'>
        <div className='grid gap-10 md:grid-cols-2 xl:grid-cols-[1.15fr_0.8fr_0.8fr_0.95fr_1fr]'>
          <div>
            <div className='flex items-center gap-2 text-[#111827]'>
              <Leaf className='h-8 w-8 text-[#23b14d]' />
              <span className='text-[40px] font-semibold leading-none tracking-[-0.04em] md:text-[52px]'>
                Organic
              </span>
            </div>
            <div className='mt-6 flex items-center gap-3'>
              {[
                { icon: Facebook, href: resolveHref(social?.facebook) },
                { icon: Twitter, href: resolveHref(social?.twitter) },
                { icon: Youtube, href: resolveHref(social?.youtube) },
                { icon: Instagram, href: resolveHref(social?.instagram) },
              ].map((entry) => {
                const Icon = entry.icon
                return (
                  <a
                    key={`${entry.href}-${Icon.displayName || 'icon'}`}
                    href={entry.href}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex h-12 w-12 items-center justify-center rounded-lg border border-[#d5d9d0] bg-[#f7f7f4] text-slate-500 transition hover:text-[#6dbf4b]'
                  >
                    <Icon className='h-5 w-5' />
                  </a>
                )
              })}
            </div>
            <ul className='mt-8 space-y-2'>
              {featuredProductLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className='text-[15px] text-slate-600 hover:text-[#6dbf4b]'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[36px]'>
              Organic
            </h3>
            <ul className='mt-5 space-y-2 text-[16px] leading-[1.6] text-slate-600'>
              {organicLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className='transition hover:text-[#6dbf4b]'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[36px]'>
              Quick Links
            </h3>
            <ul className='mt-5 space-y-2 text-[16px] leading-[1.6] text-slate-600'>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className='transition hover:text-[#6dbf4b]'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[36px]'>
              Customer Service
            </h3>
            <ul className='mt-5 space-y-2 text-[16px] leading-[1.6] text-slate-600'>
              {customerService.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className='transition hover:text-[#6dbf4b]'>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[36px]'>
              Subscribe Us
            </h3>
            <p className='mt-5 text-[16px] leading-[1.7] text-slate-600'>
              Subscribe to our newsletter to get updates about our grand offers.
            </p>
            <div className='mt-5 flex overflow-hidden rounded-md border border-[#d5d9d0] bg-white'>
              <input
                type='email'
                placeholder='Email Address'
                className='min-w-0 flex-1 px-4 py-3 text-[17px] text-slate-700 outline-none'
              />
              <button
                type='button'
                className='bg-[#1f2733] px-5 py-3 text-[17px] font-semibold text-white transition hover:bg-[#111827]'
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-[#d8dccf]'>
        <div className='mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-4 py-5 text-[15px] text-slate-600 md:flex-row md:px-8'>
          <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <p className='text-center md:text-right'>
            HTML Template by <span className='font-semibold text-slate-700'>TemplatesJungle</span>{' '}
            Distributed By <span className='font-semibold text-slate-700'>ThemeWagon</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
