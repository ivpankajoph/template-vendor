'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  Bookmark,
  ChevronDown,
  Filter,
  Leaf,
  Menu,
  Search,
  ShoppingBasket,
  UserCircle2,
  X,
} from 'lucide-react'
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'
import {
  buildStorefrontScopedPath,
  buildTemplateProductPath,
  getTemplateCityFromPath,
  getTemplateWebsiteFromPath,
} from '@/lib/template-route'
import { fetchTemplateProducts } from '@/lib/template-products-api'

type TemplateProduct = {
  _id?: string
  slug?: string
  productName?: string
  productCategory?: { _id?: string; name?: string; title?: string; categoryName?: string } | string
  productCategoryName?: string
}

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const getCategoryLabel = (product: TemplateProduct) => {
  if (product.productCategoryName) return product.productCategoryName
  if (typeof product.productCategory === 'string') {
    return /^[a-f\d]{24}$/i.test(product.productCategory)
      ? ''
      : product.productCategory
  }
  return (
    product.productCategory?.name ||
    product.productCategory?.title ||
    product.productCategory?.categoryName ||
    ''
  )
}

const getCategoryId = (product: TemplateProduct) => {
  if (typeof product.productCategory === 'string') {
    return /^[a-f\d]{24}$/i.test(product.productCategory)
      ? product.productCategory
      : undefined
  }
  return product.productCategory?._id
}

export function OragzeNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const vendorId = String((params as any)?.vendor_id || '')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [apiProducts, setApiProducts] = useState<TemplateProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const vendorProfile = template?.components?.vendor_profile || {}
  const businessName =
    String(
      vendorProfile?.name ||
        vendorProfile?.registrar_name ||
        vendorProfile?.business_name ||
        template?.business_name ||
        template?.name ||
        'Organic'
    ).trim() || 'Organic'
  const templateCitySlug = String(
    template?.components?.vendor_profile?.default_city_slug || ''
  ).trim()
  const fallbackProducts = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )
  const products = apiProducts.length ? apiProducts : fallbackProducts
  const routeCitySlug = getTemplateCityFromPath(pathname || '/', vendorId)
  const routeWebsiteId = getTemplateWebsiteFromPath(pathname || '/', vendorId)

  const customPages =
    template?.components?.custom_pages?.filter((page: any) => page?.isPublished !== false) || []
  const toStorefrontPath = (suffix = '') =>
    buildStorefrontScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })

  const categoryEntries = useMemo(() => {
    const map = new Map<string, { label: string; href: string }>()
    products.forEach((product) => {
      const label = getCategoryLabel(product)
      if (!label) return
      const id = getCategoryId(product)
      const slug = id || toSlug(label)
      if (!slug) return
      const href = toStorefrontPath(`category/${slug}`)
      if (!map.has(href)) map.set(href, { label, href })
    })
    return Array.from(map.values()).slice(0, 14)
  }, [pathname, products, vendorId])

  const productSuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return []
    return products
      .filter((product) => String(product?.productName || '').toLowerCase().includes(query))
      .slice(0, 5)
  }, [products, searchText])

  const homeHref = vendorId ? toStorefrontPath('') : '#'
  const aboutHref = vendorId ? toStorefrontPath('about') : '#'
  const shopHref = vendorId ? toStorefrontPath('all-products') : '#'
  const contactHref = vendorId ? toStorefrontPath('contact') : '#'
  const cartHref = vendorId ? toStorefrontPath('cart') : '#'
  const checkoutHref = vendorId ? toStorefrontPath('checkout') : '#'
  const profileHref = vendorId ? toStorefrontPath('profile') : '#'
  const ordersHref = vendorId ? toStorefrontPath('orders') : '#'
  const loginHref = vendorId ? toStorefrontPath('login') : '#'
  const registerHref = vendorId ? toStorefrontPath('register') : '#'
  const wishlistHref = vendorId ? toStorefrontPath('wishlist') : '#'
  const productLinks = useMemo(() => {
    const seen = new Set<string>()
    return products
      .map((product) => {
        const id = String(product?._id || '').trim()
        const label = String(product?.productName || '').trim()
        if (!id || !label) return null
        const key = `${id}-${label.toLowerCase()}`
        if (seen.has(key)) return null
        seen.add(key)
        return {
          id,
          label,
          slug: String(product?.slug || '').trim(),
        }
      })
      .filter(Boolean)
      .slice(0, 18) as Array<{ id: string; label: string; slug: string }>
  }, [products])
  const basePages = [
    { label: 'Home', href: homeHref },
    { label: 'Shop', href: shopHref },
    { label: 'About', href: aboutHref },
    { label: 'Contact', href: contactHref },
  ]
  const pageLinks = [
    ...basePages,
    ...customPages.map((page: any) => ({
      label: page?.title || 'Custom Page',
      href: toStorefrontPath(`page/${page?.slug || page?.id}`),
    })),
  ]

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
        } else {
          const fallback = Array.isArray(data?.cart?.items)
            ? data.cart.items.reduce(
                (sum: number, item: any) => sum + Number(item?.quantity || 0),
                0
              )
            : 0
          setCartCount(fallback)
        }
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
        refresh()
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

  useEffect(() => {
    if (!vendorId) {
      setApiProducts([])
      return
    }

    let cancelled = false
    setProductsLoading(true)

    fetchTemplateProducts({
      vendorId,
      websiteId: routeWebsiteId,
      city: 'all',
      page: 1,
      limit: 80,
      sort: 'newest',
    })
      .then((response) => {
        if (!cancelled) setApiProducts(response.products || [])
      })
      .catch(() => {
        if (!cancelled) setApiProducts([])
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [routeWebsiteId, vendorId])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (searchText.trim()) params.set('search', searchText.trim())
    if (filterCategory !== 'All') params.set('category', filterCategory)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)

    const queryString = params.toString()
    const targetPath = queryString ? `${shopHref}?${queryString}` : shopHref
    
    router.push(targetPath)
    setFilterOpen(false)
  }

  return (
    <header className='sticky top-0 z-50 border-b border-[#d8dccf] bg-[#f7f7f3] shadow-sm'>
      <div className='mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-3 md:px-6 xl:px-8'>
        <div className='flex items-center gap-4 lg:flex-nowrap'>
          <Link href={homeHref} className='flex shrink-0 items-center gap-2 group transition-all'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#69b64a] text-white transition-transform group-hover:rotate-12'>
              <Leaf className='h-6 w-6' />
            </div>
            <span className='max-w-[230px] truncate text-[24px] font-extrabold tracking-tight text-[#1a2e1c] font-heading sm:max-w-[320px] xl:max-w-[360px]'>
              {businessName}
            </span>
          </Link>

          <nav className='hidden min-w-0 flex-1 items-center justify-center gap-x-4 gap-y-2 overflow-visible lg:flex xl:gap-x-5'>
            {pageLinks.slice(0, 6).map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className='whitespace-nowrap text-[13px] font-bold tracking-wide text-slate-700 transition hover:text-[#69b64a] font-heading uppercase xl:text-[14px]'
              >
                {item.label}
              </Link>
            ))}

            <div className='group relative'>
              <button
                type='button'
                className='inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold tracking-wide text-slate-700 transition hover:text-[#69b64a] font-heading uppercase xl:text-[14px]'
              >
                Categories
                <ChevronDown className='h-4 w-4 transition group-hover:rotate-180' />
              </button>
              <div className='pointer-events-none absolute left-1/2 top-full z-50 w-[320px] -translate-x-1/2 pt-4 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                <div className='max-h-[430px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.2)]'>
                  <Link
                    href={shopHref}
                    className='mb-2 block rounded-xl bg-[#f1f4ec] px-3 py-2 text-sm font-bold text-[#234225] transition hover:bg-[#e5eadc]'
                  >
                    All Categories
                  </Link>
                  {categoryEntries.length > 0 ? (
                    categoryEntries.map((category) => (
                      <Link
                        key={category.href}
                        href={category.href}
                        className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#6dbf4b]'
                      >
                        {category.label}
                      </Link>
                    ))
                  ) : (
                    <p className='rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500'>
                      No categories found.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className='group relative'>
              <button
                type='button'
                className='inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold tracking-wide text-slate-700 transition hover:text-[#69b64a] font-heading uppercase xl:text-[14px]'
              >
                Products
                <ChevronDown className='h-4 w-4 transition group-hover:rotate-180' />
              </button>
              <div className='pointer-events-none absolute left-1/2 top-full z-50 w-[420px] -translate-x-1/2 pt-4 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                <div className='max-h-[520px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]'>
                  <div className='mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3'>
                    <p className='text-xs font-black uppercase tracking-[0.16em] text-slate-400'>
                      Website products
                    </p>
                    <Link
                      href={shopHref}
                      className='rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:border-[#6dbf4b] hover:text-[#6dbf4b]'
                    >
                      View all
                    </Link>
                  </div>
                  {productLinks.length > 0 ? (
                    productLinks.map((product) => (
                      <Link
                        key={product.id}
                        href={buildTemplateProductPath({
                          vendorId,
                          pathname: pathname || '/',
                          productId: product.id,
                          productSlug: product.slug,
                          citySlug: routeCitySlug || templateCitySlug,
                        })}
                        className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                      >
                        <span className='line-clamp-2'>{product.label}</span>
                      </Link>
                    ))
                  ) : (
                    <p className='rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500'>
                      {productsLoading ? 'Loading products...' : 'No products added yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {pageLinks.slice(6).map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className='whitespace-nowrap text-[13px] font-bold tracking-wide text-slate-700 transition hover:text-[#69b64a] font-heading uppercase xl:text-[14px]'
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className='hidden shrink-0 items-center gap-4 border-l border-slate-200 pl-5 lg:flex'>
            <div className='group relative'>
              <button
                type='button'
                className='text-[#2a3342] transition hover:text-[#6dbf4b]'
                title='Account'
              >
                <UserCircle2 className='h-7 w-7' />
              </button>
              <div className='pointer-events-none absolute right-0 top-full z-50 w-[200px] pt-4 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                <div className='rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.2)]'>
                  {isLoggedIn ? (
                    <>
                      <Link
                        href={profileHref}
                        className='block rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                      >
                        My Profile
                      </Link>
                      <Link
                        href={ordersHref}
                        className='block rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                      >
                        Orders
                      </Link>
                      <hr className='my-2 border-slate-100' />
                      <button
                        type='button'
                        onClick={() => {
                          clearTemplateAuth(vendorId)
                          setIsLoggedIn(false)
                          setCartCount(0)
                        }}
                        className='w-full text-left rounded-xl px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50'
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={loginHref}
                        className='block rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                      >
                        Login
                      </Link>
                      <Link
                        href={registerHref}
                        className='block rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Link
              href={wishlistHref}
              className='text-[#2a3342] transition hover:text-[#6dbf4b]'
              title='Wishlist'
            >
              <Bookmark className='h-7 w-7' />
            </Link>

            <div className='group relative'>
              <Link
                href={cartHref}
                className='relative block text-[#2a3342] transition hover:text-[#6dbf4b]'
                title='Cart'
              >
                <ShoppingBasket className='h-7 w-7' />
                <span className='absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6dbf4b] px-1 text-[11px] font-bold text-white'>
                  {cartCount}
                </span>
              </Link>
              <div className='pointer-events-none absolute right-0 top-full z-50 w-[200px] pt-4 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                <div className='rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_70px_rgba(15,23,42,0.2)]'>
                  <Link
                    href={cartHref}
                    className='block rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                  >
                    View Cart
                  </Link>
                  <Link
                    href={checkoutHref}
                    className='block rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-[#f1f4ec] hover:text-[#234225]'
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <button
            type='button'
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className='ml-auto inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 lg:hidden'
          >
            {mobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
          </button>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className='relative hidden min-w-0 items-center rounded-2xl border border-[#e1e5dc] bg-white px-3 py-2 lg:flex'
        >
          <div className='relative'>
            <button
              type='button'
              onClick={() => setFilterOpen(!filterOpen)}
              className='flex w-[150px] items-center justify-between border-r border-slate-200 bg-transparent px-3 text-[14px] font-bold text-slate-700 outline-none hover:text-[#23b14d]'
            >
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4' />
                <span className='truncate'>{filterCategory === 'All' ? 'Filters' : filterCategory}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition ${filterOpen ? 'rotate-180' : ''}`} />
            </button>

            {filterOpen && (
              <div className='absolute left-0 top-[calc(100%+14px)] z-50 w-[240px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl'>
                <div className='space-y-4'>
                  <div>
                    <label className='mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-400'>
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm font-bold outline-none'
                    >
                      <option value='All'>All Categories</option>
                      {categoryEntries.map((entry) => (
                        <option key={entry.href} value={entry.label}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-400'>
                      Price Range
                    </label>
                    <div className='flex items-center gap-2'>
                      <input
                        type='number'
                        placeholder='Min'
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold outline-none focus:border-[#23b14d]'
                      />
                      <span className='text-slate-300'>-</span>
                      <input
                        type='number'
                        placeholder='Max'
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className='w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs font-bold outline-none focus:border-[#23b14d]'
                      />
                    </div>
                  </div>

                  <button
                    type='submit'
                    className='w-full rounded-lg bg-[#23b14d] py-2 text-sm font-bold text-white transition hover:bg-[#1e9641]'
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder='Search for products'
            className='min-w-0 flex-1 bg-transparent px-4 text-[15px] text-slate-700 outline-none placeholder:text-slate-500'
          />
          <button
            type='submit'
            className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f4ec] text-[#1b2536] transition hover:bg-[#e5eadc]'
          >
            <Search className='h-5 w-5' />
          </button>

          {productSuggestions.length > 0 ? (
            <div className='absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl'>
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
                          citySlug: routeCitySlug || templateCitySlug,
                        })
                      : shopHref
                  }
                  className='block rounded-md px-3 py-2 text-[15px] text-slate-700 transition hover:bg-slate-50'
                  onClick={() => setSearchText('')}
                >
                  {product?.productName || 'Product'}
                </Link>
              ))}
            </div>
          ) : null}
        </form>
      </div>

      {mobileMenuOpen ? (
        <div className='border-t border-slate-200 bg-white px-4 py-5 lg:hidden'>
          <form onSubmit={handleSearchSubmit} className='mb-4 flex items-center gap-2'>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder='Search products'
              className='min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[15px] outline-none'
            />
            <button
              type='submit'
              className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#6dbf4b] text-white'
            >
              <Search className='h-5 w-5' />
            </button>
          </form>

          <div className='flex flex-col gap-3 text-[16px] font-medium text-[#1f2937]'>
            <div className='flex flex-wrap gap-2'>
              {pageLinks.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className='rounded-md px-2 py-1 text-sm font-bold uppercase tracking-wider transition hover:text-[#6dbf4b]'
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='rounded-2xl border border-slate-100 bg-slate-50 p-2'>
                <p className='px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400'>
                  Account
                </p>
                {isLoggedIn ? (
                  <>
                    <Link
                      href={profileHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                    >
                      My Profile
                    </Link>
                    <Link
                      href={ordersHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                    >
                      Orders
                    </Link>
                    <button
                      type='button'
                      onClick={() => {
                        clearTemplateAuth(vendorId)
                        setIsLoggedIn(false)
                        setMobileMenuOpen(false)
                      }}
                      className='block w-full text-left rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-white'
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href={loginHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                    >
                      Login
                    </Link>
                    <Link
                      href={registerHref}
                      onClick={() => setMobileMenuOpen(false)}
                      className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>

              <div className='rounded-2xl border border-slate-100 bg-slate-50 p-2'>
                <p className='px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400'>
                  Your Cart
                </p>
                <Link
                  href={cartHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                >
                  View Cart ({cartCount})
                </Link>
                <Link
                  href={checkoutHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                >
                  Checkout
                </Link>
                <Link
                  href={wishlistHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                >
                  Wishlist
                </Link>
              </div>

              <div className='rounded-2xl border border-slate-100 bg-slate-50 p-2'>
                <p className='px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400'>
                  Categories
                </p>
                {categoryEntries.length > 0 ? (
                  categoryEntries.slice(0, 8).map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                    >
                      {category.label}
                    </Link>
                  ))
                ) : (
                  <p className='px-3 py-2 text-sm font-semibold text-slate-500'>No categories found.</p>
                )}
              </div>

              <div className='rounded-2xl border border-slate-100 bg-slate-50 p-2'>
                <p className='px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400'>
                  Products
                </p>
                {productLinks.length > 0 ? (
                  productLinks.slice(0, 8).map((product) => (
                    <Link
                      key={product.id}
                      href={buildTemplateProductPath({
                        vendorId,
                        pathname: pathname || '/',
                        productId: product.id,
                        productSlug: product.slug,
                        citySlug: routeCitySlug || templateCitySlug,
                      })}
                      onClick={() => setMobileMenuOpen(false)}
                      className='block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#6dbf4b]'
                    >
                      <span className='line-clamp-1'>{product.label}</span>
                    </Link>
                  ))
                ) : (
                  <p className='px-3 py-2 text-sm font-semibold text-slate-500'>
                    {productsLoading ? 'Loading products...' : 'No products added yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
