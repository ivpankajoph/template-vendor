'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ArrowUp,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  MessageCircle,
} from 'lucide-react'

type Product = {
  _id?: string
  productName?: string
}

const resolveHref = (value: unknown) => {
  if (typeof value !== 'string') return '#'
  const trimmed = value.trim()
  return trimmed || '#'
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

export function PoupqzFooter() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  )
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})

  const social = template?.components?.social_page || {}
  const logo =
    template?.components?.logo ||
    'https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687'
  const businessName =
    template?.business_name ||
    vendor?.name ||
    vendor?.registrar_name ||
    'PRK Steel Products Pvt. Ltd.'

  const phonePrimary = vendor?.phone || '+91-9810871830'
  const phoneSecondary = vendor?.alternate_contact_phone || '+91-9891493095'
  const emailPrimary = vendor?.email || 'info@prksteel.com'
  const emailSecondary = 'prksteel.sales@gmail.com'
  const address = [
    vendor?.street || vendor?.address || '118, First Floor, South Extn. Plaza-II',
    vendor?.city || 'New Delhi',
    vendor?.pincode || '110049',
  ]
    .filter((value: unknown) => typeof value === 'string' && value.trim())
    .join(', ')

  const quickLinks = [
    { label: 'Home', href: vendorId ? `/template/${vendorId}` : '#' },
    { label: 'About Us', href: vendorId ? `/template/${vendorId}#about-us` : '#' },
    { label: 'Products', href: vendorId ? `/template/${vendorId}#products` : '#' },
    { label: 'Contact Us', href: vendorId ? `/template/${vendorId}#contact-us` : '#' },
    { label: 'Privacy Policy & Terms of Service', href: '/privacy' },
    { label: 'Shipping & Return Policy', href: '/terms' },
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
        const key = item.label.toLowerCase().trim()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)

    if (list.length > 0) return list

    return [
      { label: 'Mezzanine Floor', href: vendorId ? `/template/${vendorId}#products` : '#' },
      {
        label: 'Industrial Storage Rack',
        href: vendorId ? `/template/${vendorId}#products` : '#',
      },
      { label: 'Warehouse Storage Rack', href: vendorId ? `/template/${vendorId}#products` : '#' },
      { label: 'Slotted Angle Rack', href: vendorId ? `/template/${vendorId}#products` : '#' },
      { label: 'Cable Tray & Raceway', href: vendorId ? `/template/${vendorId}#products` : '#' },
    ]
  }, [products, vendorId])

  const whatsappHref = toWhatsappHref(social?.whatsapp, phonePrimary)

  return (
    <footer id='contact-us' className='relative'>
      <div className='h-[86px] w-full bg-[#0b74c6]' />

      <div className='bg-[#1f2733] text-white'>
        <div className='mx-auto max-w-[1320px] px-4 pb-8 pt-12 md:px-8 md:pb-10 md:pt-14'>
          <div className='grid gap-10 md:grid-cols-2 xl:grid-cols-4'>
            <div>
              <div className='flex h-[110px] w-[260px] max-w-full items-center justify-center overflow-hidden rounded-[8px] bg-white'>
                <img src={logo} alt='Business Logo' className='h-full w-full object-contain p-3' />
              </div>

              <p className='mt-8 max-w-[340px] text-[16px] leading-[1.65] text-white/95'>
                Leading manufacturer of industrial storage solutions and racking systems with
                exceptional customer service.
              </p>

              <div className='mt-6 flex items-center gap-4'>
                <a
                  href={resolveHref(social?.facebook)}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#0b74c6] text-[#0b74c6] transition hover:bg-[#0b74c6] hover:text-white'
                >
                  <Facebook className='h-6 w-6' />
                </a>
                <a
                  href={resolveHref(social?.instagram)}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#0b74c6] text-[#0b74c6] transition hover:bg-[#0b74c6] hover:text-white'
                >
                  <Instagram className='h-6 w-6' />
                </a>
              </div>
            </div>

            <div>
              <h3 className='whitespace-nowrap text-[30px] font-semibold leading-[1.25] md:text-[34px]'>
                Quick Links
              </h3>
              <ul className='mt-5 space-y-3'>
                {quickLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className='text-[17px] leading-[1.5] text-white/95 transition hover:text-[#2f93e5]'
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className='whitespace-nowrap text-[30px] font-semibold leading-[1.25] md:text-[34px]'>
                Our Products
              </h3>
              <ul className='mt-5 space-y-3'>
                {productLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className='text-[17px] leading-[1.5] text-white/95 transition hover:text-[#2f93e5]'
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className='whitespace-nowrap text-[30px] font-semibold leading-[1.25] md:text-[34px]'>
                Contact Us
              </h3>
              <div className='mt-5 space-y-4 text-[17px] leading-[1.5] text-white/95'>
                <p>Registered Office:</p>
                <p className='inline-flex items-start gap-2'>
                  <MapPin className='mt-1 h-5 w-5 shrink-0 text-white' />
                  <span>{address}</span>
                </p>
                <p>Factory Office:</p>
                <p className='inline-flex items-center gap-2'>
                  <Phone className='h-5 w-5 shrink-0 text-white' />
                  <a href={`tel:${phonePrimary}`} className='hover:text-[#2f93e5]'>
                    {phonePrimary}
                  </a>
                </p>
                <p className='inline-flex items-center gap-2'>
                  <Phone className='h-5 w-5 shrink-0 text-white' />
                  <a href={`tel:${phoneSecondary}`} className='hover:text-[#2f93e5]'>
                    {phoneSecondary}
                  </a>
                </p>
                <p className='inline-flex items-start gap-2'>
                  <Mail className='mt-1 h-5 w-5 shrink-0 text-white' />
                  <span>
                    <a href={`mailto:${emailPrimary}`} className='hover:text-[#2f93e5]'>
                      {emailPrimary}
                    </a>
                    <span>, </span>
                    <a href={`mailto:${emailSecondary}`} className='hover:text-[#2f93e5]'>
                      {emailSecondary}
                    </a>
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className='mt-10 border-t border-white/20 pt-7 text-[17px] text-white/95'>
            &copy; Copyright {businessName}. All Rights Reserved.
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-8 left-8 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#0b74c6] text-white shadow-lg transition hover:bg-[#085ea0]'
      >
        <ArrowUp className='h-7 w-7' />
      </button>

      <div className='fixed bottom-32 right-8 z-50 flex flex-col gap-4'>
        <a
          href={whatsappHref}
          target='_blank'
          rel='noreferrer'
          className='inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#21c45d] text-white shadow-lg transition hover:scale-105'
        >
          <MessageCircle className='h-8 w-8' />
        </a>
        <a
          href={`tel:${phonePrimary}`}
          className='inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#0b74f0] text-white shadow-lg transition hover:scale-105'
        >
          <PhoneCall className='h-8 w-8' />
        </a>
      </div>
    </footer>
  )
}
