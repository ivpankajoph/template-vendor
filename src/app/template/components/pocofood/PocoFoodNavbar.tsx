'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  CircleUserRound,
  Heart,
  Menu,
  PhoneCall,
  Sparkles,
  ShoppingBasket,
  X,
} from 'lucide-react'

import { buildTemplateScopedPath } from '@/lib/template-route'
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'
import {
  readPocoFoodWishlist,
  removePocoFoodWishlistItem,
  syncPocoFoodWishlistWithAccount,
  type PocoFoodWishlistItem,
} from './pocofood-wishlist'

const toRgba = (hex: string, alpha: number) => {
  const normalized = String(hex || '')
    .replace('#', '')
    .trim()
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return hex
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function PocoFoodNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const contact = useSelector((state: any) => state?.vendorprofilepage?.vendor)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [wishlistItems, setWishlistItems] = useState<PocoFoodWishlistItem[]>([])
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })
  const isProfilePage = pathname?.includes('/profile')
  const cartHref = toTemplatePath('cart')
  const wishlistHref = toTemplatePath('wishlist')
  const profileHref = toTemplatePath(isLoggedIn ? 'profile' : 'login')

  const logo = String(template?.components?.logo || '').trim()
  const headerConfig = template?.components?.home_page?.header || {}
  const theme = template?.components?.theme || {}
  const accentColor = String(theme?.accentColor || '#ffc222')
  const dangerColor = String(theme?.footerBottomBackground || '#d94b2b')
  const headerTextColor = String(theme?.headerTextColor || '#171717')
  const headerBackground = String(theme?.headerBackground || '#ffffff')
  const accentSoftBackground = toRgba(accentColor, 0.16)
  const accentSoftBorder = toRgba(accentColor, 0.42)
  const logoSize = Math.min(96, Math.max(32, Number(theme?.logoSize) || 48))
  const getHeaderText = (key: string, fallback: string) =>
    String(headerConfig?.[key] || fallback).trim()
  const navItems = [
    { label: getHeaderText('navHomeLabel', 'Home'), href: toTemplatePath(''), emphasis: false, visible: true },
    {
      label: getHeaderText('navMenuLabel', 'Menu'),
      href: toTemplatePath('all-products'),
      emphasis: true,
      visible: headerConfig?.showMenuLink !== false,
    },
    {
      label: getHeaderText('navComboLabel', 'Combo'),
      href: toTemplatePath('combo'),
      emphasis: true,
      icon: Sparkles,
      visible: headerConfig?.showComboLink !== false,
    },
    {
      label: getHeaderText('navBlogLabel', 'Blog'),
      href: toTemplatePath('blog'),
      emphasis: false,
      visible: headerConfig?.showBlogLink !== false,
    },
    {
      label: getHeaderText('navContactLabel', 'Contact'),
      href: toTemplatePath('contact'),
      emphasis: false,
      visible: headerConfig?.showContactLink !== false,
    },
  ].filter((item) => item.visible)
  const businessName = String(
    template?.business_name || contact?.business_name || contact?.name || 'Oph Food'
  ).trim()
  const phone = String(
    contact?.phone || contact?.alternate_contact_phone || '+91 98765 43210'
  ).trim()

  useEffect(() => {
    if (!vendorId) return

    const syncCart = async () => {
      const auth = getTemplateAuth(vendorId)
      setIsLoggedIn(Boolean(auth?.token))

      if (!auth?.token) {
        setCartCount(0)
        return
      }

      try {
        const data = await templateApiFetch(vendorId, '/cart')
        const quantityValue = Number(data?.cart?.total_quantity)
        setCartCount(Number.isFinite(quantityValue) ? quantityValue : 0)
      } catch {
        setCartCount(0)
      }
    }

    void syncCart()

    const handleRefresh = () => void syncCart()
    window.addEventListener('template-cart-updated', handleRefresh)
    window.addEventListener('template-auth-updated', handleRefresh)
    window.addEventListener('focus', handleRefresh)

    return () => {
      window.removeEventListener('template-cart-updated', handleRefresh)
      window.removeEventListener('template-auth-updated', handleRefresh)
      window.removeEventListener('focus', handleRefresh)
    }
  }, [vendorId])

  useEffect(() => {
    if (!vendorId) return

    const syncWishlist = () => {
      const items = readPocoFoodWishlist(vendorId)
      setWishlistItems(items)
      setWishlistCount(items.length)
    }

    syncWishlist()
    void syncPocoFoodWishlistWithAccount(vendorId)

    window.addEventListener('pocofood-wishlist-updated', syncWishlist)
    window.addEventListener('storage', syncWishlist)
    window.addEventListener('focus', syncWishlist)
    const handleAuthRefresh = () => {
      syncWishlist()
      void syncPocoFoodWishlistWithAccount(vendorId)
    }
    window.addEventListener('template-auth-updated', handleAuthRefresh)

    return () => {
      window.removeEventListener('pocofood-wishlist-updated', syncWishlist)
      window.removeEventListener('storage', syncWishlist)
      window.removeEventListener('focus', syncWishlist)
      window.removeEventListener('template-auth-updated', handleAuthRefresh)
    }
  }, [vendorId])

  return (
    <header
      className='sticky top-0 z-40 shadow-[0_6px_30px_rgba(23,23,23,0.06)]'
      style={{ backgroundColor: headerBackground }}
      data-template-section='header'
      data-template-component='components.theme.headerBackground'
    >
      <nav className='mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 lg:px-10'>
        <div className='flex items-center gap-4'>
          <Link href={toTemplatePath('')} className='flex items-center gap-3'>
            {logo ? (
              <img
                src={logo}
                alt={businessName}
                className='rounded-full object-cover'
                style={{ width: logoSize, height: logoSize }}
                data-template-component='components.theme.accentColor'
                data-template-path='components.theme.logoSize'
                data-template-section='branding'
              />
            ) : null}
            <div>
              <p
                className='text-[15px] font-extrabold uppercase tracking-[0.08em]'
                style={{ color: dangerColor }}
                data-template-path='components.home_page.header.brandLabel'
                data-template-section='header'
                data-template-component='components.theme.footerBottomBackground'
              >
                {getHeaderText('brandLabel', 'Oph!')}
              </p>
              <p
                className='max-w-[150px] truncate text-sm font-semibold'
                style={{ color: headerTextColor }}
                data-template-component='components.theme.headerTextColor'
              >
                {businessName}
              </p>
            </div>
          </Link>
        </div>

        <div className='hidden items-center gap-8 lg:flex'>
          {navItems.map((item) =>
            item.emphasis ? (
              <Link
                key={item.label}
                href={item.href}
                className='inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-extrabold transition hover:-translate-y-0.5'
                style={{
                  borderColor: accentSoftBorder,
                  backgroundColor: accentSoftBackground,
                  color: headerTextColor,
                  boxShadow: `0 10px 22px ${toRgba(accentColor, 0.16)}`,
                }}
                data-template-path={
                  item.label === getHeaderText('navMenuLabel', 'Menu')
                    ? 'components.home_page.header.navMenuLabel'
                    : item.label === getHeaderText('navComboLabel', 'Combo')
                      ? 'components.home_page.header.navComboLabel'
                      : undefined
                }
                data-template-section='header'
                data-template-component='components.theme.accentColor'
              >
                {item.icon ? <item.icon className='h-4 w-4' style={{ color: dangerColor }} /> : null}
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className='text-[15px] font-semibold transition hover:text-[#ffae00]'
                style={{ color: headerTextColor }}
                data-template-component='components.theme.headerTextColor'
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className='hidden items-center gap-2.5 lg:flex'>
          <div
            className='flex items-center gap-2 rounded-full border px-3 py-1.5'
            style={{ borderColor: accentSoftBorder, color: headerTextColor }}
            data-template-component='components.theme.accentColor'
          >
            <PhoneCall className='h-4 w-4' style={{ color: dangerColor }} />
            <div>
              <p
                className='text-xs'
                style={{ color: toRgba(headerTextColor, 0.65) }}
                data-template-path='components.home_page.header.callLabel'
                data-template-section='header'
              >
                {getHeaderText('callLabel', 'Call and order in')}
              </p>
              <p
                className='text-lg font-extrabold'
                style={{ color: accentColor }}
                data-template-component='components.theme.accentColor'
              >
                {phone}
              </p>
            </div>
          </div>

          <Link
            href={profileHref}
            aria-label={isLoggedIn ? 'My profile' : 'Login'}
            className='flex h-11 w-11 items-center justify-center rounded-full border transition'
            style={{
              borderColor: isProfilePage ? accentColor : accentSoftBorder,
              backgroundColor: isProfilePage ? accentSoftBackground : 'transparent',
              color: isProfilePage ? dangerColor : headerTextColor,
            }}
            data-template-component='components.theme.accentColor'
          >
            <CircleUserRound className='h-4 w-4' />
          </Link>

          <button
            type='button'
            onClick={() => setWishlistOpen(true)}
            aria-label={`Wishlist, ${wishlistCount} items`}
            className='relative flex h-11 w-11 items-center justify-center rounded-full border transition'
            style={{
              borderColor: wishlistCount > 0 ? accentColor : accentSoftBorder,
              backgroundColor: wishlistCount > 0 ? accentSoftBackground : 'transparent',
              color: wishlistCount > 0 ? dangerColor : headerTextColor,
            }}
            data-template-component='components.theme.accentColor'
          >
            <Heart className={`h-4 w-4 ${wishlistCount > 0 ? 'fill-current' : ''}`} />
            {wishlistCount > 0 ? (
              <span
                className='absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-[#171717]'
                style={{ backgroundColor: accentColor }}
              >
                {wishlistCount > 99 ? '99+' : wishlistCount}
              </span>
            ) : null}
          </button>

          <Link
            href={cartHref}
            className='relative flex h-11 w-11 items-center justify-center rounded-full border transition'
            style={{
              borderColor: pathname?.includes('/cart') ? accentColor : accentSoftBorder,
              backgroundColor: pathname?.includes('/cart') ? accentSoftBackground : 'transparent',
              color: headerTextColor,
            }}
            data-template-component='components.theme.accentColor'
          >
            <ShoppingBasket className='h-4 w-4' />
            <span
              className='absolute right-0 top-0 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-[#171717]'
              style={{ backgroundColor: accentColor }}
            >
              {cartCount}
            </span>
          </Link>

          {isLoggedIn ? (
            <button
              type='button'
              onClick={() => {
                clearTemplateAuth(vendorId)
                setIsLoggedIn(false)
                setCartCount(0)
              }}
              className='rounded-full bg-[#d94b2b] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#b93d21]'
              data-template-component='components.theme.footerBottomBackground'
            >
              Logout
            </button>
          ) : null}
        </div>

        <button
          type='button'
          onClick={() => setMobileMenuOpen((current) => !current)}
          className='flex h-12 w-12 items-center justify-center rounded-full border lg:hidden'
          style={{ borderColor: accentSoftBorder, color: headerTextColor }}
          data-template-component='components.theme.accentColor'
        >
          {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div
          className='border-t bg-white px-4 py-4 lg:hidden'
          style={{ borderColor: accentSoftBorder }}
        >
          <div className='flex flex-col gap-3'>
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className='inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold'
                style={{
                  borderColor: item.emphasis ? accentColor : accentSoftBorder,
                  backgroundColor: item.emphasis ? accentSoftBackground : 'transparent',
                  color: headerTextColor,
                }}
              >
                {item.icon ? <item.icon className='h-4 w-4 text-[#d94b2b]' /> : null}
                {item.label}
              </Link>
            ))}
            <Link
              href={toTemplatePath('cart')}
              onClick={() => setMobileMenuOpen(false)}
              className='rounded-2xl px-4 py-3 text-sm font-semibold text-[#171717]'
              style={{
                backgroundColor: pathname?.includes('/cart')
                  ? accentColor
                  : accentSoftBackground,
              }}
            >
              Cart ({cartCount})
            </Link>
            <button
              type='button'
              onClick={() => {
                setWishlistOpen(true)
                setMobileMenuOpen(false)
              }}
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${
                wishlistCount > 0
                  ? 'border-[#ffc222] bg-[#fff6d6] text-[#d94b2b]'
                  : 'border-[#f2e9c8] text-[#171717]'
              }`}
            >
              Wishlist ({wishlistCount})
            </button>
            <Link
              href={profileHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                isProfilePage
                  ? 'border-[#ffc222] bg-[#fff6d6] text-[#d94b2b]'
                  : 'border-[#f2e9c8] text-[#171717]'
              }`}
            >
              {isLoggedIn ? 'My Profile' : 'Login'}
            </Link>
            {isLoggedIn ? (
              <button
                type='button'
                onClick={() => {
                  clearTemplateAuth(vendorId)
                  setIsLoggedIn(false)
                  setCartCount(0)
                  setMobileMenuOpen(false)
                }}
                className='rounded-2xl bg-[#d94b2b] px-4 py-3 text-sm font-semibold text-white'
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {wishlistOpen ? (
        <div className='fixed inset-0 z-50 lg:z-[60]'>
          <button
            type='button'
            aria-label='Close wishlist'
            onClick={() => setWishlistOpen(false)}
            className='absolute inset-0 bg-black/35'
          />
          <aside className='absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-[-18px_0_40px_rgba(23,23,23,0.18)]'>
            <div className='flex items-center justify-between border-b border-[#f2e9c8] px-5 py-4'>
              <div>
                <p className='text-xs font-extrabold uppercase tracking-[0.16em] text-[#d94b2b]'>
                  Wishlist
                </p>
                <h2 className='text-2xl font-extrabold tracking-[-0.03em] text-[#171717]'>
                  Saved items
                </h2>
              </div>
              <button
                type='button'
                onClick={() => setWishlistOpen(false)}
                className='flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfb7] text-[#171717] transition hover:bg-[#fff6d6]'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto px-5 py-5'>
              {wishlistItems.length ? (
                <div className='space-y-3'>
                  {wishlistItems.map((item) => (
                    <div
                      key={item.product_id}
                      className='flex gap-3 rounded-2xl border border-[#f2e9c8] bg-[#fffdf5] p-3'
                    >
                      <Link
                        href={item.href || wishlistHref}
                        onClick={() => setWishlistOpen(false)}
                        className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#fff6d6]'
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <Heart className='h-6 w-6 text-[#d94b2b]' />
                        )}
                      </Link>
                      <div className='min-w-0 flex-1'>
                        <Link
                          href={item.href || wishlistHref}
                          onClick={() => setWishlistOpen(false)}
                          className='line-clamp-2 text-sm font-extrabold leading-5 text-[#171717]'
                        >
                          {item.product_name}
                        </Link>
                        {item.category ? (
                          <p className='mt-1 truncate text-xs font-semibold text-[#7d7d7d]'>
                            {item.category}
                          </p>
                        ) : null}
                        {Number.isFinite(Number(item.price)) ? (
                          <p className='mt-2 text-sm font-extrabold text-[#ffae00]'>
                            Rs. {Number(item.price || 0).toLocaleString('en-IN')}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type='button'
                        onClick={() => {
                          const nextItems = removePocoFoodWishlistItem(vendorId, item.product_id)
                          setWishlistItems(nextItems)
                          setWishlistCount(nextItems.length)
                        }}
                        className='h-9 rounded-full border border-[#eadfb7] px-3 text-xs font-bold text-[#d94b2b] transition hover:bg-[#fff6d6]'
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#eadfb7] bg-[#fffdf5] px-6 text-center'>
                  <Heart className='h-10 w-10 text-[#d94b2b]' />
                  <p className='mt-4 text-lg font-extrabold text-[#171717]'>
                    No saved items yet
                  </p>
                  <p className='mt-2 text-sm leading-6 text-[#7d7d7d]'>
                    Tap the heart on a dish to keep it here for later.
                  </p>
                </div>
              )}
            </div>

            <div className='border-t border-[#f2e9c8] p-5'>
              <Link
                href={wishlistHref}
                onClick={() => setWishlistOpen(false)}
                className='flex w-full items-center justify-center rounded-full bg-[#ffc222] px-5 py-3 text-sm font-extrabold text-[#171717] transition hover:bg-[#ffae00]'
              >
                View full wishlist
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  )
}
