'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Facebook, Instagram, MapPin, PhoneCall, Twitter, Youtube } from 'lucide-react'

import { buildTemplateScopedPath } from '@/lib/template-route'
import { NEXT_PUBLIC_API_URL } from '@/config/variables'

const PAYMENT_LABELS = ['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL', 'COD']

type FoodStorefrontRestaurant = {
  mobile?: string
  opening_hours?: Array<{
    day?: string
    open?: string
    close?: string
    is_closed?: boolean
  }>
}

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith('/v1')
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`

export function PocoFoodFooter() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const contact = useSelector((state: any) => state?.vendorprofilepage?.vendor)
  const [foodRestaurant, setFoodRestaurant] = useState<FoodStorefrontRestaurant | null>(null)
  const [foodCategories, setFoodCategories] = useState<string[]>([])

  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })

  const footerLinks = [
    { label: 'Home', href: toTemplatePath('') },
    { label: 'Menu', href: `${toTemplatePath('')}#food-menu` },
    { label: 'About', href: toTemplatePath('about') },
    { label: 'My Orders', href: `${toTemplatePath('profile')}#orders` },
    { label: 'Blog', href: toTemplatePath('blog') },
    { label: 'Contact', href: toTemplatePath('contact') },
  ]

  useEffect(() => {
    let cancelled = false

    const loadFoodStorefront = async () => {
      if (!vendorId) return

      try {
        const response = await fetch(`${API_BASE}/vendors/${vendorId}/food-storefront`)
        if (!response.ok) return
        const payload = await response.json()
        if (cancelled) return
        setFoodRestaurant(payload?.data?.restaurant || null)
        setFoodCategories(
          Array.isArray(payload?.data?.categories)
            ? payload.data.categories.map((item: unknown) => String(item || '').trim()).filter(Boolean)
            : []
        )
      } catch {
        if (cancelled) return
        setFoodRestaurant(null)
        setFoodCategories([])
      }
    }

    void loadFoodStorefront()
    return () => {
      cancelled = true
    }
  }, [vendorId])

  const categoryLinks = useMemo(() => {
    return foodCategories.slice(0, 5).map((label) => ({
      label,
      href: toTemplatePath(`category/${encodeURIComponent(
        label
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      )}`),
    }))
  }, [foodCategories, pathname, vendorId])

  const openingHours = useMemo(() => {
    const hours = Array.isArray(foodRestaurant?.opening_hours) ? foodRestaurant.opening_hours : []
    const openDays = hours.filter((item) => !item?.is_closed && item?.day && item?.open && item?.close)

    if (!openDays.length) {
      return [
        'Monday - Friday: 8am - 4pm',
        'Saturday: 9am - 5pm',
      ]
    }

    return openDays.slice(0, 2).map((item) => `${item.day}: ${item.open} - ${item.close}`)
  }, [foodRestaurant?.opening_hours])

  const businessName = String(
    template?.business_name || contact?.business_name || contact?.name || 'Oph Food'
  ).trim()
  const footerConfig = template?.components?.social_page?.footer || {}
  const theme = template?.components?.theme || {}
  const footerBackground = String(theme?.footerBackground || '#18171c')
  const footerBottomBackground = String(theme?.footerBottomBackground || '#d94b2b')
  const footerAccentColor = String(theme?.footerAccentColor || theme?.accentColor || '#ffc222')
  const getFooterText = (key: string, fallback: string) =>
    String(footerConfig?.[key] || fallback).trim()
  const address = [
    contact?.street || contact?.address,
    contact?.city,
    contact?.state,
    contact?.country,
  ]
    .filter((item) => typeof item === 'string' && item.trim())
    .join(', ')
  const phone = String(
    foodRestaurant?.mobile || contact?.phone || contact?.alternate_contact_phone || '+91 98765 43210'
  ).trim()

  return (
    <footer
      className='mt-12 text-white'
      style={{ backgroundColor: footerBackground }}
      data-template-section='footer'
      data-template-component='components.theme.footerBackground'
    >
      <div className='border-b border-white/10'>
        <div className='mx-auto grid max-w-[1440px] gap-8 px-5 py-14 lg:grid-cols-4 lg:px-10'>
          <div>
            <h3
              className='text-[34px] font-extrabold'
              style={{ color: footerBottomBackground }}
              data-template-path='components.social_page.footer.brand_heading'
              data-template-section='footer'
              data-template-component='components.theme.footerBottomBackground'
            >
              {getFooterText('brand_heading', 'Oph!')}
            </h3>
            <p className='mt-5 text-base leading-8 text-white/75'>
              {address || '570 8th Ave, New York, United States'}
            </p>
          </div>

          <div>
            <h4
              className='text-2xl font-extrabold uppercase tracking-tight'
              data-template-path='components.social_page.footer.book_heading'
              data-template-section='footer'
            >
              {getFooterText('book_heading', 'Book a Table')}
            </h4>
            <p
              className='mt-5 text-base leading-8 text-white/75'
              data-template-path='components.social_page.footer.book_text'
              data-template-section='footer'
            >
              {getFooterText('book_text', 'Fresh burgers, pizzas, combos, and chef specials for your everyday cravings.')}
            </p>
            <p
              className='mt-4 text-3xl font-extrabold'
              style={{ color: footerAccentColor }}
              data-template-component='components.theme.footerAccentColor'
            >
              {phone}
            </p>
          </div>

          <div>
            <h4
              className='text-2xl font-extrabold uppercase tracking-tight'
              data-template-path='components.social_page.footer.opening_heading'
              data-template-section='footer'
            >
              {getFooterText('opening_heading', 'Opening Hours')}
            </h4>
            {openingHours.map((item, index) => (
              <p key={`${item}-${index}`} className={`${index === 0 ? 'mt-5' : ''} text-base leading-8 text-white/75`}>
                <span className='font-bold text-white'>{item}</span>
              </p>
            ))}
            <div className='mt-5 flex items-center gap-3'>
              {[Facebook, Twitter, Youtube, Instagram].map((Icon, index) => (
                <a
                  key={index}
                  href='#'
                  className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#18171c] transition'
                >
                  <Icon className='h-5 w-5' />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4
              className='text-2xl font-extrabold uppercase tracking-tight'
              data-template-path='components.social_page.footer.newsletter_heading'
              data-template-section='footer'
            >
              {getFooterText('newsletter_heading', 'Newsletter')}
            </h4>
            <p
              className='mt-5 text-base leading-8 text-white/75'
              data-template-path='components.social_page.footer.newsletter_text'
              data-template-section='footer'
            >
              {getFooterText('newsletter_text', 'Subscribe for weekly offers, new combos, and latest storefront updates.')}
            </p>
            <div className='mt-6 flex overflow-hidden rounded-2xl border border-white/10 bg-[#222126]'>
              <input
                type='email'
                placeholder={getFooterText('newsletter_placeholder', 'Your Email...')}
                className='min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-white outline-none placeholder:text-white/35'
              />
              <button
                type='button'
                className='px-5 py-4 text-sm font-extrabold text-[#171717] transition'
                style={{ backgroundColor: footerAccentColor }}
                data-template-path='components.social_page.footer.newsletter_button'
                data-template-section='footer'
                data-template-component='components.theme.footerAccentColor'
              >
                {getFooterText('newsletter_button', 'SUBSCRIBE')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className='border-b border-white/10'>
        <div className='mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-10'>
          <div className='flex flex-wrap items-center gap-4'>
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-semibold transition ${
                  item.label === 'My Orders'
                    ? 'rounded-full border border-[#ffc222]/40 bg-[#ffc222]/10 px-3 py-1.5 text-[#ffc222] hover:bg-[#ffc222]/20'
                    : 'text-white/75 hover:text-[#ffc222]'
                }`}
              >
                {item.label === 'My Orders' ? getFooterText('orders_label', item.label) : item.label}
              </Link>
            ))}
          </div>
          <div className='flex flex-wrap gap-4'>
            {categoryLinks.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className='text-sm font-semibold text-white/60 transition hover:text-white'
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{ backgroundColor: footerBottomBackground }}
        data-template-component='components.theme.footerBottomBackground'
      >
        <div className='mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-5 text-sm text-white lg:flex-row lg:items-center lg:justify-between lg:px-10'>
          <p>
            Copyright © {new Date().getFullYear()} {businessName}. All Rights Reserved.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <MapPin className='h-4 w-4' />
            <span>{address || 'Delivery available in your city'}</span>
          </div>
          <div className='flex flex-wrap gap-2'>
            {PAYMENT_LABELS.map((item) => (
              <span
                key={item}
                className='rounded-md bg-white px-3 py-1 text-xs font-extrabold text-[#171717]'
              >
                {item}
              </span>
            ))}
            <a href={`tel:${phone}`} className='inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-bold'>
              <PhoneCall className='h-3.5 w-3.5' />
              {phone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
