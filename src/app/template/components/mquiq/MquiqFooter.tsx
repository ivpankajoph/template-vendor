'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
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
import { buildStorefrontScopedPath, buildTemplateProductPath } from '@/lib/template-route'
import { resolveTemplateBlogHref } from '@/app/template/components/blog-page'
import { resolveTemplatePolicyHref } from '@/app/template/components/policy-page'

type Product = {
  _id?: string
  slug?: string
  productName?: string
}

type FooterQuickLink = {
  label: string
  href: string
}

const digitsOnly = (value: unknown) => String(value || '').replace(/[^\d]/g, '')

const toWhatsappHref = (value: unknown, fallbackPhone: string) => {
  if (typeof value === 'string' && value.trim()) {
    const clean = value.trim()
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean
    }
    const directDigits = digitsOnly(clean)
    return directDigits ? `https://wa.me/${directDigits}` : ''
  }
  const fallbackDigits = digitsOnly(fallbackPhone)
  return fallbackDigits ? `https://wa.me/${fallbackDigits}` : ''
}

const resolveHref = (value: unknown) => {
  if (typeof value !== 'string') return '#'
  const trimmed = value.trim()
  return trimmed || '#'
}

const isExternalHref = (value: string) =>
  value.startsWith('http://') || value.startsWith('https://')

const resolveTemplateHref = (
  value: unknown,
  vendorId: string,
  pathname: string | undefined,
  fallback: string
) => {
  if (typeof value !== 'string' || !value.trim()) return fallback
  const href = value.trim()

  if (href.startsWith('#') || isExternalHref(href) || href.startsWith('/template/')) {
    return href
  }

  if (href === '/') {
    return vendorId
      ? buildStorefrontScopedPath({ vendorId, pathname, suffix: '' })
      : href
  }

  if (href.startsWith('/')) {
    return vendorId
      ? buildStorefrontScopedPath({
          vendorId,
          pathname,
          suffix: href.replace(/^\/+/, ''),
        })
      : href
  }

  return href
}

export function MquiqFooter() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const toStorefrontPath = (suffix = '') =>
    vendorId
      ? buildStorefrontScopedPath({
          vendorId,
          pathname: pathname || undefined,
          suffix,
        })
      : '#'

  const homepage = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  )
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})
  const templateCitySlug = String(
    homepage?.components?.vendor_profile?.default_city_slug ||
      vendor?.default_city_slug ||
      ''
  ).trim()

  const businessName =
    homepage?.business_name ||
    vendor?.name ||
    vendor?.registrar_name ||
    'Shiv Storage Solution'
  const logo =
    homepage?.components?.logo ||
    'https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687'
  const social = homepage?.components?.social_page || {}
  const footer = social?.footer || {}

  const configuredPhone = String(social?.contact_phone || '').trim()
  const phone =
    configuredPhone || vendor?.phone || vendor?.alternate_contact_phone || '+91-9999999999'
  const email = String(footer?.email_text || '').trim() || vendor?.email || 'info@storage.com'
  const address = [
    vendor?.street || vendor?.address,
    vendor?.city,
    vendor?.state,
    vendor?.country,
    vendor?.pincode,
  ]   
    .filter((item: unknown) => typeof item === 'string' && item.trim()) 
    .join(', ')
  const footerAddress = String(footer?.address_text || '').trim() || address
  const footerPhone = String(footer?.phone_text || '').trim() || phone
  const brandLine =
    String(footer?.brand_line || '').trim() || 'Delivering Excellence Since 2023'
  const summaryText =
    String(footer?.summary_text || '').trim() ||
    `Serving industries across India with ${businessName}'s expertise`
  const quickLinksHeading =
    String(footer?.quick_links_heading || '').trim() || 'Quick Links'
  const productsHeading =
    String(footer?.products_heading || '').trim() || 'Our Products'
  const addressHeading = String(footer?.address_heading || '').trim() || 'Address'
  const companyPoints = (
    Array.isArray(footer?.company_points) ? footer.company_points : []
  )
    .map((item: unknown) => String(item || '').trim())
    .filter(Boolean)

  const brandPoints = companyPoints.length
    ? companyPoints
    : ['Inspired by Innovation', 'Driven by Quality', 'Trusted for Reliability']

  const quickLinks = useMemo<FooterQuickLink[]>(() => {
    const defaults: FooterQuickLink[] = [
      { label: 'Home', href: toStorefrontPath('') },
      { label: 'About Us', href: toStorefrontPath('about') },
      { label: 'Contact Us', href: toStorefrontPath('contact') },
      {
        label: String(footer?.blog_label || '').trim() || 'Blog',
        href: resolveTemplateBlogHref({
          value: footer?.blog_href,
          vendorId,
          pathname: pathname || undefined,
          fallback: '/blog',
        }),
      },
    ]

    const configured: unknown[] = Array.isArray(footer?.quick_links)
      ? footer.quick_links
      : []
    const normalized = configured
      .map((item: unknown, index: number) => {
        const row = item as { label?: unknown; href?: unknown }
        return {
          label: String(row?.label || defaults[index]?.label || '').trim(),
          href: resolveTemplateHref(
            row?.href,
            vendorId,
            pathname || undefined,
            defaults[index]?.href || toStorefrontPath('')
          ),
        }
      })
      .filter((item: { label: string }) => Boolean(item.label))

    const baseList = normalized.length ? normalized : defaults
    const shippingHref = resolveTemplatePolicyHref({
      vendorId,
      pathname: pathname || undefined,
      fallback: '/shipping-return-policy',
    })

    if (
      baseList.some(
        (item) =>
          item.href === shippingHref ||
          item.label.toLowerCase().includes('shipping') ||
          item.label.toLowerCase().includes('return')
      )
    ) {
      return baseList
    }

    return [...baseList, { label: 'Shipping & Return Policy', href: shippingHref }]
  }, [footer?.quick_links, pathname, toStorefrontPath, vendorId])

  const productLinks = useMemo<FooterQuickLink[]>(() => {
    const configured = Array.isArray(footer?.product_links) ? footer.product_links : []
    const configuredList = configured
      .map((item: unknown, index: number) => {
        const row = item as { label?: unknown; href?: unknown }
        const defaultHref = toStorefrontPath('all-products')
        return {
          label: String(row?.label || '').trim(),
          href: resolveTemplateHref(
            row?.href,
            vendorId,
            pathname || undefined,
            defaultHref
          ),
        }
      })
      .filter((item: FooterQuickLink) => Boolean(item.label))

    if (configuredList.length) return configuredList

    const seen = new Set<string>()
    const list = products
      .filter((item) => item?._id && item?.productName)
      .map((item) => ({
        label: String(item.productName),
        href: buildTemplateProductPath({
          vendorId,
          pathname: pathname || undefined,
          productId: item._id,
          productSlug: item.slug,
          citySlug: templateCitySlug,
        }),
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
        href: toStorefrontPath('all-products'),
      },
      {
        label: '6 Feet Slotted Angle Rack',
        href: toStorefrontPath('all-products'),
      },
      {
        label: 'Adjustable Rack',
        href: toStorefrontPath('all-products'),
      },
      {
        label: 'Barrel Storage Rack',
        href: toStorefrontPath('all-products'),
      },
      {
        label: 'Bin Storage Rack',
        href: toStorefrontPath('all-products'),
      },
      {
        label: 'Body Part Storage Racks',
        href: toStorefrontPath('all-products'),
      },
    ]
  }, [footer?.product_links, pathname, products, toStorefrontPath, vendorId])

  const whatsappHref = toWhatsappHref(social?.whatsapp, phone)
  const showPhoneButton = social?.show_phone_button !== false && Boolean(phone)
  const showWhatsappButton =
    social?.show_whatsapp_button !== false && Boolean(whatsappHref)
  const hasFloatingButtons = showPhoneButton || showWhatsappButton
  const year = new Date().getFullYear()
  const copyrightTemplate =
    String(footer?.copyright_text || '').trim() ||
    '\u00a9 {year} By {business}. All Rights Reserved.'
  const copyrightText = copyrightTemplate
    .replaceAll('{year}', String(year))
    .replaceAll('{business}', businessName)
  const policyPrimaryLabel =
    String(footer?.policy_primary_label || '').trim() ||
    'Privacy Policy & Terms of Service'
  const policyPrimaryHref = resolveTemplatePolicyHref({
    value: footer?.policy_primary_href,
    vendorId,
    pathname: pathname || undefined,
    fallback: '/privacy',
  })
  const policySecondaryLabel =
    String(footer?.policy_secondary_label || '').trim() || 'Terms & Condition'
  const policySecondaryHref = resolveTemplatePolicyHref({
    value: footer?.policy_secondary_href,
    vendorId,
    pathname: pathname || undefined,
    fallback: '/terms',
  })

  return (
    <footer
      id='contact-us'
      className='relative overflow-hidden border-t border-[#313a48] bg-gradient-to-br from-[#141b27] via-[#1b2432] to-[#121925] text-white'
    >
      <div className='pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#f4b400]/10 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#0ea5e9]/10 blur-3xl' />

      <div className='mx-auto max-w-[1320px] px-4 py-10 md:px-8 lg:py-11'>
        <div className='grid gap-8 lg:grid-cols-[1.35fr_0.8fr_1fr_1fr]'>
          <div>
            <div className='flex h-[96px] w-[240px] items-center justify-center overflow-hidden rounded-[10px] bg-white'>
              <img src={logo} alt='Business Logo' className='h-full w-full object-contain p-3' />
            </div>

            <p
              className='mt-4 text-base font-medium text-white/95'
              data-template-path='components.social_page.footer.brand_line'
            >
              {brandLine}
            </p>

            <ul className='mt-4 space-y-2 text-base text-white/95'>
              {brandPoints.map((point: string, index: number) => (
                <li
                  key={`${point}-${index}`}
                  data-template-path={`components.social_page.footer.company_points.${index}`}
                >
                  {point}
                </li>
              ))}
            </ul>

            <p
              className='mt-4 max-w-md text-base text-white/95'
              data-template-path='components.social_page.footer.summary_text'
            >
              {summaryText}
            </p>

            <div className='mt-4 flex items-center gap-3'>
              <a
                href={resolveHref(social?.facebook)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-[#f4b400]/60 hover:bg-white/20'
              >
                <Facebook className='h-5 w-5' />
              </a>
              <a
                href={resolveHref(social?.instagram)}
                target='_blank'
                rel='noreferrer'
                className='inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-[#f4b400]/60 hover:bg-white/20'
              >
                <Instagram className='h-5 w-5' />
              </a>
            </div>
          </div>

          <div>
            <h3
              className='text-2xl font-bold !text-white'
              data-template-path='components.social_page.footer.quick_links_heading'
            >
              {quickLinksHeading}
            </h3>
            <div className='mt-2 h-[3px] w-16 rounded-full bg-[#f4b400]' />
            <ul className='mt-4 space-y-3'>
              {quickLinks.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  {isExternalHref(item.href) ? (
                    <a
                      href={item.href}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-2 text-base font-medium text-white transition hover:text-[#f4b400]'
                      data-template-path={`components.social_page.footer.quick_links.${index}.label`}
                    >
                      <ChevronRight className='h-5 w-5 text-[#f4b400]' />
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className='inline-flex items-center gap-2 text-base font-medium text-white transition hover:text-[#f4b400]'
                      data-template-path={`components.social_page.footer.quick_links.${index}.label`}
                    >
                      <ChevronRight className='h-5 w-5 text-[#f4b400]' />
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className='text-2xl font-bold !text-white'
              data-template-path='components.social_page.footer.products_heading'
            >
              {productsHeading}
            </h3>
            <div className='mt-2 h-[3px] w-16 rounded-full bg-[#f4b400]' />
            <ul className='mt-4 space-y-2.5'>
              {productLinks.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  {isExternalHref(item.href) ? (
                    <a
                      href={item.href}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-2 text-base font-medium text-white transition hover:text-[#f4b400]'
                      data-template-path={`components.social_page.footer.product_links.${index}.label`}
                    >
                      <ChevronRight className='h-5 w-5 text-[#f4b400]' />
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className='inline-flex items-center gap-2 text-base font-medium text-white transition hover:text-[#f4b400]'
                      data-template-path={`components.social_page.footer.product_links.${index}.label`}
                    >
                      <ChevronRight className='h-5 w-5 text-[#f4b400]' />
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className='text-2xl font-bold !text-white'
              data-template-path='components.social_page.footer.address_heading'
            >
              {addressHeading}
            </h3>
            <div className='mt-2 h-[3px] w-16 rounded-full bg-[#f4b400]' />

            <p
              className='mt-4 text-[0.95rem] font-medium leading-relaxed text-white/95'
              data-template-path='components.social_page.footer.address_text'
            >
              {footerAddress || 'Mundka, Delhi, India'}
            </p>

            <div className='mt-4 space-y-2.5'>
              <a
                href={`tel:${digitsOnly(footerPhone) || phone}`}
                className='inline-flex items-center gap-2 text-[0.95rem] font-medium text-white transition hover:text-[#f4b400]'
                data-template-path='components.social_page.footer.phone_text'
              >
                <Phone className='h-5 w-5' />
                {footerPhone}
              </a>
              <a
                href={`mailto:${email}`}
                className='inline-flex items-center gap-2 text-[0.95rem] font-medium text-white transition hover:text-[#f4b400]'
                data-template-path='components.social_page.footer.email_text'
              >
                <Mail className='h-5 w-5' />
                {email}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-[#2d3440]'>
        <div className='mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-white/95 md:flex-row md:px-8'>
          <p data-template-path='components.social_page.footer.copyright_text'>
            {copyrightText}
          </p>
          <div className='flex flex-wrap items-center gap-4 md:gap-8'>
            <Link
              href={policyPrimaryHref}
              className='transition hover:text-[#f4b400]'
              data-template-path='components.social_page.footer.policy_primary_label'
            >
              {policyPrimaryLabel}
            </Link>
            <Link
              href={policySecondaryHref}
              className='transition hover:text-[#f4b400]'
              data-template-path='components.social_page.footer.policy_secondary_label'
            >
              {policySecondaryLabel}
            </Link>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-14 left-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#f7be2e] to-[#e8a500] text-white shadow-[0_18px_45px_rgba(244,180,0,0.38)] transition hover:-translate-y-0.5 hover:from-[#f7c53e] hover:to-[#e09d00] md:left-8'
      >
        <ArrowUp className='h-6 w-6' />
      </button>

      {hasFloatingButtons ? (
        <div className='fixed bottom-32 right-6 z-50 flex flex-col gap-3 md:right-8'>
          {showPhoneButton ? (
            <a
              href={`tel:${phone}`}
              className='inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white shadow-[0_18px_45px_rgba(239,68,68,0.42)] transition hover:-translate-y-0.5 hover:scale-105'
              aria-label='Call now'
            >
              <PhoneCall className='h-7 w-7' />
            </a>
          ) : null}
          {showWhatsappButton ? (
            <a
              href={whatsappHref}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white shadow-[0_18px_45px_rgba(34,197,94,0.42)] transition hover:-translate-y-0.5 hover:scale-105'
              aria-label='Chat on WhatsApp'
            >
              <MessageCircle className='h-7 w-7' />
            </a>
          ) : null}
        </div>
      ) : null}
    </footer>
  )
}
