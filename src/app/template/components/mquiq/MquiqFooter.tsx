'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronRight,
  Facebook,
  Instagram,
  Mail,
  Phone,
  PhoneCall,
  MessageCircle,
  ArrowUp,
} from 'lucide-react'

type Product = {
  _id?: string
  productName?: string
}

const toWhatsappHref = (value: unknown, fallbackPhone: string) => {
  if (typeof value === 'string' && value.trim()) {
    const clean = value.trim()
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean
    }
    return `https://wa.me/${clean.replace(/[^\d]/g, '')}`
  }
  return `https://wa.me/${fallbackPhone.replace(/[^\d]/g, '')}`
}

const resolveHref = (value: unknown) => {
  if (typeof value !== 'string') return '#'
  const trimmed = value.trim()
  return trimmed || '#'
}

export function MquiqFooter() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')

  const homepage = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  )
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})

  const businessName =
    homepage?.business_name ||
    vendor?.name ||
    vendor?.registrar_name ||
    'Shiv Storage Solution'
  const logo =
    homepage?.components?.logo ||
    'https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687'
  const social = homepage?.components?.social_page || {}

  const phone = vendor?.phone || vendor?.alternate_contact_phone || '+91-9999999999'
  const email = vendor?.email || 'info@storage.com'
  const address = [
    vendor?.street || vendor?.address,
    vendor?.city,
    vendor?.state,
    vendor?.country,
    vendor?.pincode,
  ]
    .filter((item: unknown) => typeof item === 'string' && item.trim())
    .join(', ')

  const quickLinks = [
    { label: 'Home', href: vendorId ? `/template/${vendorId}` : '#' },
    { label: 'About Us', href: vendorId ? `/template/${vendorId}#about-us` : '#' },
    { label: 'Contact Us', href: vendorId ? `/template/${vendorId}#contact-us` : '#' },
  ]

  const productLinks = useMemo(() => {
    const seen = new Set<string>()
    const list = products
      .filter((item) => item?._id && item?.productName)
      .map((item) => ({
        label: String(item.productName),
        href: `/template/${vendorId}/product/${item._id}`,
      }))
      .filter((item) => {
        const key = item.label.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)

    if (list.length > 0) return list

    return [
      {
        label: '5 Shelves Rack',
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
      },
      {
        label: '6 Feet Slotted Angle Rack',
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
      },
      {
        label: 'Adjustable Rack',
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
      },
      {
        label: 'Barrel Storage Rack',
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
      },
      {
        label: 'Bin Storage Rack',
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
      },
      {
        label: 'Body Part Storage Racks',
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
      },
    ]
  }, [products, vendorId])

  const whatsappHref = toWhatsappHref(social?.whatsapp, phone)

  return (
    <footer
      id='contact-us'
      className='relative border-t border-[#2d3440] bg-[#1e2530] text-white'
    >
      <div className='mx-auto max-w-[1320px] px-4 py-12 md:px-8 lg:py-14'>
        <div className='grid gap-10 lg:grid-cols-[1.35fr_0.8fr_1fr_1fr]'>
          <div>
            <div className='flex h-[118px] w-[290px] items-center justify-center overflow-hidden rounded-[10px] bg-white'>
              <img src={logo} alt='Business Logo' className='h-full w-full object-contain p-3' />
            </div>

            <p className='mt-6 text-lg font-medium text-white/95'>
              Delivering Excellence Since 2023
            </p>

            <ul className='mt-4 space-y-2 text-base text-white/95'>
              <li>Inspired by Innovation</li>
              <li>Driven by Quality</li>
              <li>Trusted for Reliability</li>
            </ul>

            <p className='mt-5 max-w-md text-lg text-white/95'>
              Serving industries across India with {businessName}&apos;s expertise
            </p>

            <div className='mt-5 flex items-center gap-3'>
              <a
                href={resolveHref(social?.facebook)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'
              >
                <Facebook className='h-5 w-5' />
              </a>
              <a
                href={resolveHref(social?.instagram)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'
              >
                <Instagram className='h-5 w-5' />
              </a>
            </div>
          </div>

          <div>
            <h3 className='text-3xl font-bold'>Quick Links</h3>
            <div className='mt-2 h-[3px] w-16 rounded-full bg-[#f4b400]' />
            <ul className='mt-5 space-y-4'>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className='inline-flex items-center gap-2 text-lg font-medium text-white transition hover:text-[#f4b400]'
                  >
                    <ChevronRight className='h-5 w-5 text-[#f4b400]' />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-3xl font-bold'>Our Products</h3>
            <div className='mt-2 h-[3px] w-16 rounded-full bg-[#f4b400]' />
            <ul className='mt-5 space-y-3'>
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className='inline-flex items-center gap-2 text-lg font-medium text-white transition hover:text-[#f4b400]'
                  >
                    <ChevronRight className='h-5 w-5 text-[#f4b400]' />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-3xl font-bold'>Address</h3>
            <div className='mt-2 h-[3px] w-16 rounded-full bg-[#f4b400]' />

            <p className='mt-5 text-base font-medium leading-relaxed text-white/95'>
              {address || 'Mundka, Delhi, India'}
            </p>

            <div className='mt-5 space-y-3'>
              <a
                href={`tel:${phone}`}
                className='inline-flex items-center gap-2 text-base font-medium text-white transition hover:text-[#f4b400]'
              >
                <Phone className='h-5 w-5' />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className='inline-flex items-center gap-2 text-base font-medium text-white transition hover:text-[#f4b400]'
              >
                <Mail className='h-5 w-5' />
                {email}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-[#2d3440]'>
        <div className='mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-white/95 md:flex-row md:px-8'>
          <p>
            &copy; {new Date().getFullYear()} By {businessName}. All Rights Reserved.
          </p>
          <div className='flex flex-wrap items-center gap-4 md:gap-8'>
            <Link href='/privacy' className='transition hover:text-[#f4b400]'>
              Privacy Policy &amp; Terms of Service
            </Link>
            <Link href='/terms' className='transition hover:text-[#f4b400]'>
              Shipping &amp; Return Policy
            </Link>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-14 left-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-md bg-[#f4b400] text-white shadow-lg transition hover:bg-[#d79a00] md:left-8'
      >
        <ArrowUp className='h-6 w-6' />
      </button>

      <div className='fixed bottom-32 right-6 z-50 flex flex-col gap-3 md:right-8'>
        <a
          href={`tel:${phone}`}
          className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#ef1c24] text-white shadow-lg transition hover:scale-105'
        >
          <PhoneCall className='h-7 w-7' />
        </a>
        <a
          href={whatsappHref}
          target='_blank'
          rel='noreferrer'
          className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#21c45d] text-white shadow-lg transition hover:scale-105'
        >
          <MessageCircle className='h-7 w-7' />
        </a>
      </div>
    </footer>
  )
}
