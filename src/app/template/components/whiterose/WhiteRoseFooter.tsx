'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { ArrowUp, Mail, MapPin, Phone } from 'lucide-react'

import { buildTemplateScopedPath } from '@/lib/template-route'
import { resolveTemplateBlogHref } from '@/app/template/components/blog-page'
import { resolveTemplatePolicyHref } from '@/app/template/components/policy-page'

import {
  type WhiteRoseProduct,
  toWhiteRoseSlug,
  whiteRoseGetCategoryDetails,
} from './whiterose-utils'

const DEFAULT_FOOTER_POINTS = ['Secure checkout', 'Fast delivery', 'Easy support']

export function WhiteRoseFooter() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as WhiteRoseProduct[]
  )

  const footerContent = template?.components?.social_page?.footer || {}
  const businessName =
    template?.business_name || vendor?.registrar_name || vendor?.name || 'White Rose Market'

  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })

  const resolveFooterHref = (value: unknown) => {
    const href = typeof value === 'string' ? value.trim() : ''
    if (!href) return toTemplatePath('')
    if (href.startsWith('/template/')) return href
    if (href === '/') return toTemplatePath('')
    if (href.startsWith('/')) return toTemplatePath(href.replace(/^\/+/, ''))
    return href.startsWith('http') ? href : toTemplatePath(href)
  }

  const categoryLinks = useMemo(() => {
    const map = new Map<string, { href: string; label: string }>()
    products.forEach((product) => {
      const category = whiteRoseGetCategoryDetails(product)
      if (!category.label) return
      const slug = category.id || toWhiteRoseSlug(category.label)
      const href = toTemplatePath(`category/${slug}`)
      if (!map.has(href)) {
        map.set(href, { href, label: category.label })
      }
    })
    return Array.from(map.values()).slice(0, 6)
  }, [products, pathname, vendorId])

  const quickLinks =
    Array.isArray(footerContent?.quick_links) && footerContent.quick_links.length > 0
      ? footerContent.quick_links.slice(0, 5)
      : [
          { label: 'Home', href: toTemplatePath('') },
          { label: 'All Products', href: toTemplatePath('all-products') },
          { label: 'Categories', href: toTemplatePath('category') },
          { label: 'Contact', href: toTemplatePath('contact') },
          {
            label: String(footerContent?.blog_label || '').trim() || 'Blog',
            href: resolveTemplateBlogHref({
              value: footerContent?.blog_href,
              vendorId,
              pathname: pathname || '/',
              fallback: '/blog',
            }),
          },
        ]
  const shippingPolicyHref = resolveTemplatePolicyHref({
    vendorId,
    pathname: pathname || '/',
    fallback: '/shipping-return-policy',
  })
  const quickLinksWithShipping = quickLinks.some((item: any) => {
    const label = String(item?.label || '').toLowerCase()
    const href = String(item?.href || '').trim()
    return (
      href === shippingPolicyHref ||
      label.includes('shipping') ||
      label.includes('return')
    )
  })
    ? quickLinks
    : [...quickLinks, { label: 'Shipping & Return Policy', href: shippingPolicyHref }]

  const productLinks =
    Array.isArray(footerContent?.product_links) && footerContent.product_links.length > 0
      ? footerContent.product_links.slice(0, 6)
      : categoryLinks

  const footerPoints =
    Array.isArray(footerContent?.company_points) && footerContent.company_points.length > 0
      ? footerContent.company_points.slice(0, 3)
      : DEFAULT_FOOTER_POINTS
  const policyPrimaryLabel = String(footerContent?.policy_primary_label || '').trim() || 'Privacy Policy'
  const policyPrimaryHref = resolveTemplatePolicyHref({
    value: footerContent?.policy_primary_href,
    vendorId,
    pathname: pathname || '/',
    fallback: '/privacy',
  })
  const policySecondaryLabel =
    String(footerContent?.policy_secondary_label || '').trim() || 'Terms & Condition'
  const policySecondaryHref = resolveTemplatePolicyHref({
    value: footerContent?.policy_secondary_href,
    vendorId,
    pathname: pathname || '/',
    fallback: '/terms',
  })

  const fullAddress = [
    vendor?.street || vendor?.address,
    vendor?.city,
    vendor?.state,
    vendor?.country,
    vendor?.pincode,
  ]
    .filter((item: any) => typeof item === 'string' && item.trim())
    .join(', ')

  return (
    <footer className='mt-10 bg-[#172337] text-white'>
      <div className='mx-auto grid max-w-[1500px] gap-8 px-4 py-10 md:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]'>
        <div>
          <Link href={toTemplatePath('')} className='flex items-center gap-3'>
            <div className='h-12 w-12 overflow-hidden rounded-xl border border-white/15 bg-white/10'>
              <img
                src={
                  template?.components?.logo ||
                  'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?auto=format&fit=crop&w=200&q=80'
                }
                alt='Store logo'
                className='h-full w-full object-cover'
              />
            </div>
            <div>
              <p className='text-lg font-semibold'>{businessName}</p>
              <p className='text-xs font-medium uppercase tracking-[0.16em] text-[#9ec2ff]'>
                {footerContent?.brand_line || 'B2C marketplace storefront'}
              </p>
            </div>
          </Link>

          <p className='mt-4 max-w-[440px] text-sm leading-7 text-[#c7d2e3]'>
            {footerContent?.summary_text ||
              'A storefront focused on categories, deals, and product discovery while keeping backend operations unchanged.'}
          </p>

          <div className='mt-4 flex flex-wrap gap-2'>
            {footerPoints.map((point: string, index: number) => (
              <span
                key={`${point}-${index}`}
                className='rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#dbeafe]'
              >
                {point}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-[#9ec2ff]'>
            Shop
          </h3>
          <div className='mt-4 grid gap-3 text-sm text-[#dbeafe]'>
            {quickLinksWithShipping.map((item: any, index: number) => (
              <Link
                key={`${item?.label || 'link'}-${index}`}
                href={resolveFooterHref(item?.href)}
                className='transition hover:text-white'
              >
                {item?.label || 'Link'}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-[#9ec2ff]'>
            Top Categories
          </h3>
          <div className='mt-4 grid gap-3 text-sm text-[#dbeafe]'>
            {productLinks.length > 0 ? (
              productLinks.map((item: any, index: number) => (
                <Link
                  key={`${item?.label || 'product-link'}-${index}`}
                  href={resolveFooterHref(item?.href || item?.path || 'all-products')}
                  className='transition hover:text-white'
                >
                  {item?.label || 'Category'}
                </Link>
              ))
            ) : (
              <span className='text-sm text-[#c7d2e3]'>Categories will appear from the live catalog.</span>
            )}
          </div>
        </div>

        <div>
          <h3 className='text-sm font-semibold uppercase tracking-[0.18em] text-[#9ec2ff]'>
            Help
          </h3>
          <div className='mt-4 grid gap-4 text-sm text-[#dbeafe]'>
            <div className='flex gap-3'>
              <Phone className='mt-0.5 h-4 w-4 text-[#9ec2ff]' />
              <a href={`tel:${vendor?.phone || vendor?.alternate_contact_phone || ''}`} className='transition hover:text-white'>
                {footerContent?.phone_text || vendor?.phone || vendor?.alternate_contact_phone || 'Contact seller'}
              </a>
            </div>
            <div className='flex gap-3'>
              <Mail className='mt-0.5 h-4 w-4 text-[#9ec2ff]' />
              <a href={`mailto:${vendor?.email || ''}`} className='transition hover:text-white'>
                {footerContent?.email_text || vendor?.email || 'support@storefront.com'}
              </a>
            </div>
            <div className='flex gap-3'>
              <MapPin className='mt-0.5 h-4 w-4 text-[#9ec2ff]' />
              <p>{footerContent?.address_text || fullAddress || 'Address available from vendor profile'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-white/10'>
        <div className='mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 px-4 py-4 text-[13px] text-[#c7d2e3] md:flex-row md:px-8'>
          <p>
            {footerContent?.copyright_text
              ? String(footerContent.copyright_text)
                  .replace('{year}', String(new Date().getFullYear()))
                  .replace('{business}', businessName)
              : `(c) ${new Date().getFullYear()} ${businessName}. All rights reserved.`}
          </p>
          <div className='flex items-center gap-5'>
            <Link href={policyPrimaryHref} className='transition hover:text-white'>
              {policyPrimaryLabel}
            </Link>
            <Link href={policySecondaryHref} className='transition hover:text-white'>
              {policySecondaryLabel}
            </Link>
            <Link href={toTemplatePath('orders')} className='transition hover:text-white'>
              Order help
            </Link>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#2874f0] text-white shadow-lg transition hover:bg-[#174ea6]'
      >
        <ArrowUp className='h-5 w-5' />
      </button>
    </footer>
  )
}
