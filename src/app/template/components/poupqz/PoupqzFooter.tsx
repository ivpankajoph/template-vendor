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
  Phone,
  PhoneCall,
  MessageCircle,
  ChevronRight,
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
      .slice(0, 5)

    if (list.length > 0) return list

    return [
      { label: 'Mezzanine Floor', href: vendorId ? `/template/${vendorId}#products` : '#' },
      { label: 'Industrial Storage Rack', href: vendorId ? `/template/${vendorId}#products` : '#' },
      { label: 'Warehouse Storage Rack', href: vendorId ? `/template/${vendorId}#products` : '#' },
      { label: 'Slotted Angle Rack', href: vendorId ? `/template/${vendorId}#products` : '#' },
      { label: 'Cable Tray & Raceway', href: vendorId ? `/template/${vendorId}#products` : '#' },
    ]
  }, [products, vendorId])

  const whatsappHref = toWhatsappHref(social?.whatsapp, phonePrimary)

  const defaultDescriptionLines = [
    'Delivering Excellence Since 2023',
    'Inspired by Innovation',
    'Driven by Quality',
    'Trusted for Reliability',
    'Serving industries globally with our expertise',
  ]

  return (
    <footer id='contact-us' className='relative bg-blue-900 rounded-md font-sans text-slate-300' data-template-section='footer'>
      <div className='mx-auto max-w-[1400px] px-6 py-16 md:px-10 lg:px-14'>
        {/* Main Grid — 4 columns matching reference image */}
        <div className='grid gap-12 sm:grid-cols-2 lg:grid-cols-4'>

          {/* ── Col 1: Brand ── */}
          <div className='flex flex-col'>
            {/* Logo in a white box */}
            <div className='mb-6 inline-flex h-[80px] w-fit items-center justify-center rounded-xl  px-8 py-2 shadow-md'>
              <Link href='#' className='inline-block transition-transform hover:scale-[1.02]'>
                <img src={logo} alt='Business Logo' className='h-12 w-auto object-contain' />
              </Link>
            </div>

            <div
              className='flex flex-col gap-2.5 text-[14px] leading-snug text-[#cbd5e1]'
              data-template-path='components.footer.short_description'
              data-template-section='footer'
            > 
              {template?.components?.footer?.short_description ? (
                <p className='leading-relaxed'>{template.components.footer.short_description}</p>
              ) : (
                defaultDescriptionLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))
              )}
            </div>

            <div className='mt-8 flex gap-3'>
              <a
                href={resolveHref(social?.facebook)}
                target='_blank'
                rel='noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-transparent text-slate-400 transition-all hover:border-[#fbbf24] hover:text-[#fbbf24]'
                aria-label='Facebook'
              >
                <Facebook className='h-4 w-4' />
              </a>
              <a
                href={resolveHref(social?.instagram)}
                target='_blank'
                rel='noreferrer'
                className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-transparent text-slate-400 transition-all hover:border-[#fbbf24] hover:text-[#fbbf24]'
                aria-label='Instagram'
              >
                <Instagram className='h-4 w-4' />
              </a>
            </div>
          </div>

          {/* ── Col 2: Quick Links ── */}
          <div className='lg:pl-6 '>
            <h4 className='text-xl font-bold'>  
              Quick Links 
            </h4>
            <div className='mt-3 h-[2px] w-12 bg-transparent' />
            <nav className='mt-8 flex flex-col gap-5'>
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className='group flex items-center gap-3 text-[14px] text-[#cbd5e1] transition-colors hover:text-[#fbbf24]'
                >
                  <ChevronRight className='h-4 w-4 shrink-0 text-black transition-transform group-hover:translate-x-1' />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Col 3: Products ── */}
          <div>
            <h4 className='text-xl font-bold text-white'>
              Our Products           
            </h4>
            <div className='mt-3 h-[2px] w-12 bg-black-400' />
            <nav className='mt-8 flex flex-col gap-5'>
              {productLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className='group flex items-start gap-3 text-[14px] text-[#cbd5e1] transition-colors hover:text-[#fbbf24]'
                >
                  <ChevronRight className='mt-[2px] h-4 w-4 shrink-0 text-[#fbbf24] transition-transform group-hover:translate-x-1' />
                  <span className='leading-snug'>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* ── Col 4: Address ── */}
          <div>
            <h4 className='text-xl font-bold text-white'>
              Address
            </h4>
            <div className='mt-3 h-[2px] w-12 bg-black-400' />
            <div className='mt-8 space-y-6 text-[14px] text-[#cbd5e1]'>
              <div className='leading-relaxed pr-4'>{address}</div>

              <div className='flex items-start gap-3'>
                <Phone className='mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-400' />
                <div className='flex flex-col gap-1.5'>
                  <a href={`tel:${phonePrimary}`} className='hover:text-[#fbbf24] transition-colors break-all'>{phonePrimary}</a>
                  {phoneSecondary && phoneSecondary !== phonePrimary && (
                    <a href={`tel:${phoneSecondary}`} className='hover:text-[#fbbf24] transition-colors break-all'>{phoneSecondary}</a>
                  )}
                </div>
              </div>

              <div className='flex items-start gap-3'>
                <Mail className='mt-0.5 h-[18px] w-[18px] shrink-0 text-slate-400' />
                <div className='flex flex-col gap-1.5'>
                  <a href={`mailto:${emailPrimary}`} className='hover:text-[#fbbf24] transition-colors break-all'>{emailPrimary}</a>
                  {emailSecondary && emailSecondary !== emailPrimary && (
                    <a href={`mailto:${emailSecondary}`} className='hover:text-[#fbbf24] transition-colors break-all'>{emailSecondary}</a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Bottom ── */}
        <div className='mt-16 border-t border-slate-700/60 pt-8'>
          <div className='flex flex-col items-center justify-between gap-4 md:flex-row'>
            <p className='text-[13px] text-slate-400'>
              &copy; {new Date().getFullYear()} By {businessName}. All Rights Reserved.
            </p>
            <div className='flex items-center gap-6'>
              <Link href='/privacy' className='text-[13px] text-slate-400 hover:text-white transition-colors'>
                Privacy Policy & Terms of Service
              </Link>
              <Link href='/terms' className='text-[13px] text-slate-400 hover:text-white transition-colors'>
                Shipping & Return Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Action: Scroll to Top ── */}
      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-8 left-8 z-50 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fbbf24] text-slate-900 shadow-xl transition-all hover:scale-110 active:scale-95'
        aria-label='Scroll to top'
      >
        <ArrowUp className='h-6 w-6' />
      </button>

      {/* ── Floating Actions: Call + WhatsApp ── */}
      <div className='fixed bottom-8 right-8 z-50 flex flex-col gap-4'>
        <a
          href={`tel:${phonePrimary}`}
          className='flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#ef4444] text-white shadow-xl transition-all hover:scale-110 active:scale-95'
          aria-label='Call us'
        >
          <PhoneCall className='h-6 w-6' />
        </a>
        <a
          href={whatsappHref}
          target='_blank'
          rel='noreferrer'
          className='flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#22c55e] text-white shadow-xl transition-all hover:scale-110 active:scale-95'
          aria-label='WhatsApp'
        >
          <MessageCircle className='h-[26px] w-[26px]' />
        </a>
      </div>
    </footer>
  )
}