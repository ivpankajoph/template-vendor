'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  Heart,
  MapPin,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'

import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'
import { buildTemplateProductPath, buildTemplateScopedPath } from '@/lib/template-route'

import {
  type WhiteRoseProduct,
  toWhiteRoseSlug,
  whiteRoseGetCategoryDetails,
} from './whiterose-utils'

export function WhiteRoseNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const vendorId = String((params as any)?.vendor_id || '')

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [departmentsOpen, setDepartmentsOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})
  const templateCitySlug = String(
    template?.components?.vendor_profile?.default_city_slug ||
      vendor?.default_city_slug ||
      ''
  ).trim()
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as WhiteRoseProduct[]
  )

  const customPages =
    template?.components?.custom_pages?.filter((page: any) => page?.isPublished !== false) || []

  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })

  const categoryEntries = useMemo(() => {
    const map = new Map<string, { label: string; href: string }>()
    products.forEach((product) => {
      const category = whiteRoseGetCategoryDetails(product)
      if (!category.label) return
      const slug = category.id || toWhiteRoseSlug(category.label)
      const href = toTemplatePath(`category/${slug}`)
      if (!map.has(href)) {
        map.set(href, { label: category.label, href })
      }
    })
    return Array.from(map.values()).slice(0, 10)
  }, [products, pathname, vendorId])

  const productSuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return []
    return products
      .filter((product) => String(product?.productName || '').toLowerCase().includes(query))
      .slice(0, 6)
  }, [products, searchText])

  const navigationItems = useMemo(
    () => [
      { label: 'Home', href: toTemplatePath('') },
      { label: 'All Products', href: toTemplatePath('all-products') },
      { label: 'Categories', href: toTemplatePath('category') },
      { label: 'About', href: toTemplatePath('about') },
      { label: 'Contact', href: toTemplatePath('contact') },
      ...customPages.map((page: any) => ({
        label: page?.title || 'Page',
        href: toTemplatePath(`page/${page?.slug || page?.id}`),
      })),
    ],
    [customPages, pathname, vendorId]
  )

  useEffect(() => {
    if (!vendorId) return

    const loadCart = async () => {
      const auth = getTemplateAuth(vendorId)
      setIsLoggedIn(Boolean(auth?.token))
      if (!auth?.token) {
        setCartCount(0)
        return
      }
      try {
        const data = await templateApiFetch(vendorId, '/cart')
        const quantity = Number(data?.cart?.total_quantity)
        if (Number.isFinite(quantity) && quantity >= 0) {
          setCartCount(quantity)
          return
        }
        const fallback = Array.isArray(data?.cart?.items)
          ? data.cart.items.reduce(
              (sum: number, item: any) => sum + Number(item?.quantity || 0),
              0
            )
          : 0
        setCartCount(fallback)
      } catch {
        setCartCount(0)
      }
    }

    loadCart()

    const refresh = () => {
      loadCart()
    }

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === `template_auth_${vendorId}` ||
        event.key?.startsWith(`template_auth_${vendorId}_`)
      ) {
        loadCart()
      }
    }

    window.addEventListener('template-cart-updated', refresh)
    window.addEventListener('template-auth-updated', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('template-cart-updated', refresh)
      window.removeEventListener('template-auth-updated', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', onStorage)
    }
  }, [vendorId, pathname])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = searchText.trim().toLowerCase()
    if (!normalized) {
      router.push(toTemplatePath('all-products'))
      return
    }
    const exact = products.find(
      (product) => String(product?.productName || '').toLowerCase() === normalized
    )
    if (exact?._id) {
      router.push(
        buildTemplateProductPath({
          vendorId,
          pathname: pathname || '/',
          productId: exact._id,
          productSlug: exact.slug,
          citySlug: templateCitySlug,
        })
      )
      return
    }
    const partial = products.find((product) =>
      String(product?.productName || '').toLowerCase().includes(normalized)
    )
    if (partial?._id) {
      router.push(
        buildTemplateProductPath({
          vendorId,
          pathname: pathname || '/',
          productId: partial._id,
          productSlug: partial.slug,
          citySlug: templateCitySlug,
        })
      )
      return
    }
    router.push(toTemplatePath('all-products'))
  }

  return (
    <header className='sticky top-0 z-50 border-b border-[#dfe3eb] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]'>
      <div className='mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-4 md:px-8'>
        <Link href={toTemplatePath('')} className='flex shrink-0 items-center gap-3' data-template-section='branding'>
          <div className='h-12 w-12 overflow-hidden rounded-xl border border-[#dfe3eb] bg-white shadow-sm'>
            <img
              src={
                template?.components?.logo ||
                'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?auto=format&fit=crop&w=200&q=80'
              }
              alt='Store logo'
              className='h-full w-full object-cover'
              data-template-path='components.logo'
              data-template-section='branding'
              data-template-component='components.logo'
            />
          </div>
          <div className='hidden min-w-0 sm:block'>
            <p className='line-clamp-1 text-lg font-semibold text-[#172337]'>
              {template?.business_name || vendor?.registrar_name || vendor?.name || 'White Rose Market'}
            </p>
            <p className='text-xs font-medium uppercase tracking-[0.16em] text-[#2874f0]'>
              B2C marketplace
            </p>
          </div>
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className='relative hidden min-w-0 flex-1 items-center overflow-visible rounded-2xl border border-[#cfd7e6] bg-[#f8fafc] px-4 py-2 shadow-inner lg:flex'
        >
          <button
            type='button'
            className='mr-3 inline-flex h-9 items-center rounded-xl bg-[#2874f0] px-3 text-xs font-semibold uppercase tracking-[0.14em] text-white'
          >
            All
          </button>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder='Search for products, categories, and brands'
            className='min-w-0 flex-1 bg-transparent text-[15px] text-[#172337] outline-none placeholder:text-[#7a8797]'
          />
          <button
            type='submit'
            className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff9f00] text-white transition hover:bg-[#f08b00]'
          >
            <Search className='h-5 w-5' />
          </button>

          {productSuggestions.length > 0 ? (
            <div className='absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-2xl border border-[#dfe3eb] bg-white p-2 shadow-2xl'>
              {productSuggestions.map((product) => (
                <Link
                  key={product?._id || product?.productName}
                  href={
                    product?._id
                      ? buildTemplateProductPath({
                          vendorId,
                          pathname: pathname || '/',
                          productId: product._id,
                          productSlug: product.slug,
                          citySlug: templateCitySlug,
                        })
                      : toTemplatePath('all-products')
                  }
                  className='block rounded-xl px-3 py-2 text-[15px] text-[#172337] transition hover:bg-[#f5f7fb]'
                  onClick={() => setSearchText('')}
                >
                  {product?.productName || 'Product'}
                </Link>
              ))}
            </div>
          ) : null}
        </form>

        <div className='ml-auto hidden items-center gap-5 lg:flex'>
          <div className='hidden items-center gap-2 rounded-xl bg-[#f8fafc] px-3 py-2 xl:inline-flex'>
            <MapPin className='h-4 w-4 text-[#2874f0]' />
            <span className='text-sm text-[#42526b]'>
              {vendor?.city || vendor?.state || 'Across India'}
            </span>
          </div>
          <Link href={toTemplatePath('all-products')} className='text-[#172337] transition hover:text-[#2874f0]' title='Wishlist'>
            <Heart className='h-6 w-6' />
          </Link>
          <Link href={toTemplatePath('cart')} className='relative text-[#172337] transition hover:text-[#2874f0]' title='Cart'>
            <ShoppingCart className='h-6 w-6' />
            <span className='absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2874f0] px-1 text-[11px] font-bold text-white'>
              {cartCount}
            </span>
          </Link>
          <Link href={isLoggedIn ? toTemplatePath('profile') : toTemplatePath('login')} className='inline-flex items-center gap-2 text-sm font-semibold text-[#172337] transition hover:text-[#2874f0]'>
            <UserRound className='h-5 w-5' />
            {isLoggedIn ? 'My Account' : 'Sign in'}
          </Link>
          {isLoggedIn ? (
            <button
              type='button'
              onClick={() => {
                clearTemplateAuth(vendorId)
                setIsLoggedIn(false)
                setCartCount(0)
              }}
              className='rounded-xl border border-[#cfd7e6] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#172337] transition hover:border-[#2874f0] hover:text-[#2874f0]'
            >
              Logout
            </button>
          ) : (
            <Link href={toTemplatePath('register')} className='rounded-xl bg-[#ff9f00] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#f08b00]'>
              Register
            </Link>
          )}
        </div>

        <button
          type='button'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className='ml-auto inline-flex items-center justify-center rounded-xl border border-[#dfe3eb] p-2 text-[#172337] lg:hidden'
        >
          {mobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
      </div>

      <div className='hidden border-t border-[#edf1f5] bg-[#f8fafc] lg:block'>
        <div className='mx-auto flex max-w-[1500px] items-center gap-7 px-8 py-3 text-sm font-semibold text-[#172337]'>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setDepartmentsOpen((prev) => !prev)}
              className='inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 transition hover:text-[#2874f0]'
            >
              Departments
              <ChevronDown className={`h-4 w-4 transition ${departmentsOpen ? 'rotate-180' : ''}`} />
            </button>
            {departmentsOpen ? (
              <div className='absolute left-0 top-[calc(100%+10px)] z-50 max-h-[420px] w-[340px] overflow-auto rounded-2xl border border-[#dfe3eb] bg-white p-2 shadow-2xl'>
                <Link
                  href={toTemplatePath('all-products')}
                  className='block rounded-xl px-3 py-2 text-[15px] text-[#172337] hover:bg-[#f5f7fb]'
                  onClick={() => setDepartmentsOpen(false)}
                >
                  View full catalog
                </Link>
                {categoryEntries.map((category, index) => (
                  <Link
                    key={`${category.href}-${index}`}
                    href={category.href}
                    className='block rounded-xl px-3 py-2 text-[15px] text-[#172337] hover:bg-[#f5f7fb]'
                    onClick={() => setDepartmentsOpen(false)}
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {navigationItems.slice(0, 5).map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={`transition hover:text-[#2874f0] ${pathname === item.href ? 'text-[#2874f0]' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {customPages.slice(0, 2).map((page: any, index: number) => (
            <Link
              key={`${page?.slug || page?.id || index}`}
              href={toTemplatePath(`page/${page?.slug || page?.id}`)}
              className='transition hover:text-[#2874f0]'
            >
              {page?.title || 'Page'}
            </Link>
          ))}

          <Link href={toTemplatePath('orders')} className='transition hover:text-[#2874f0]'>
            Orders
          </Link>

          <Link href={toTemplatePath('contact')} className='ml-auto transition hover:text-[#2874f0]'>
            Customer Care
          </Link>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className='border-t border-[#edf1f5] bg-white px-4 py-5 lg:hidden'>
          <form onSubmit={handleSearchSubmit} className='mb-4 flex items-center gap-2'>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder='Search products'
              className='min-w-0 flex-1 rounded-xl border border-[#dfe3eb] bg-[#f8fafc] px-3 py-2.5 text-[15px] outline-none'
            />
            <button type='submit' className='inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff9f00] text-white'>
              <Search className='h-5 w-5' />
            </button>
          </form>

          <div className='flex flex-col gap-2 text-[15px] text-[#172337]'>
            {navigationItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className='rounded-xl px-2 py-2 transition hover:bg-[#f5f7fb] hover:text-[#2874f0]'
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={toTemplatePath('cart')}
              onClick={() => setMobileMenuOpen(false)}
              className='rounded-xl px-2 py-2 transition hover:bg-[#f5f7fb] hover:text-[#2874f0]'
            >
              Cart ({cartCount})
            </Link>
            <Link
              href={isLoggedIn ? toTemplatePath('profile') : toTemplatePath('login')}
              onClick={() => setMobileMenuOpen(false)}
              className='rounded-xl px-2 py-2 transition hover:bg-[#f5f7fb] hover:text-[#2874f0]'
            >
              {isLoggedIn ? 'My Account' : 'Sign in'}
            </Link>
          </div>

          <div className='mt-4 border-t border-[#edf1f5] pt-4'>
            <p className='mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8797]'>
              Departments
            </p>
            <div className='grid grid-cols-2 gap-2'>
              {categoryEntries.slice(0, 8).map((category, index) => (
                <Link
                  key={`mobile-${category.href}-${index}`}
                  href={category.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className='rounded-xl border border-[#dfe3eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#172337] hover:border-[#2874f0] hover:text-[#2874f0]'
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
