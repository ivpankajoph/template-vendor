'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'

type TemplateProduct = {
  _id?: string
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

const FALLBACK_CATEGORY_LABELS = [
  'Living Room',
  'Bed Room',
  'Dining Room',
  'Home Office',
  'Kids Furniture',
  'Plastic Chairs',
  'Utility',
  'Premium Furniture',
  'Mattress',
]

export function WhiteRoseNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const vendorId = String((params as any)?.vendor_id || '')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pagesOpen, setPagesOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )

  const customPages =
    template?.components?.custom_pages?.filter((page: any) => page?.isPublished !== false) || []

  const categoryEntries = useMemo(() => {
    const map = new Map<string, { label: string; href: string }>()
    products.forEach((product) => {
      const label = getCategoryLabel(product)
      if (!label) return
      const id = getCategoryId(product)
      const slug = id || toSlug(label)
      if (!slug) return
      const href = `/template/${vendorId}/category/${slug}`
      if (!map.has(href)) map.set(href, { label, href })
    })

    const entries = Array.from(map.values())
    if (entries.length > 0) return entries.slice(0, 10)
    return FALLBACK_CATEGORY_LABELS.map((label) => ({
      label,
      href: vendorId ? `/template/${vendorId}/all-products` : '#',
    }))
  }, [products, vendorId])

  const productSuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return []
    return products
      .filter((product) => String(product?.productName || '').toLowerCase().includes(query))
      .slice(0, 6)
  }, [products, searchText])

  const homeHref = vendorId ? `/template/${vendorId}` : '#'
  const aboutHref = vendorId ? `/template/${vendorId}/about` : '#'
  const shopHref = vendorId ? `/template/${vendorId}/all-products` : '#'
  const contactHref = vendorId ? `/template/${vendorId}/contact` : '#'
  const cartHref = vendorId ? `/template/${vendorId}/cart` : '#'
  const checkoutHref = vendorId ? `/template/${vendorId}/checkout` : '#'
  const loginHref = vendorId ? `/template/${vendorId}/login` : '#'
  const profileHref = vendorId ? `/template/${vendorId}/profile` : '#'
  const ordersHref = vendorId ? `/template/${vendorId}/orders` : '#'
  const registerHref = vendorId ? `/template/${vendorId}/register` : '#'
  const firstProductHref =
    vendorId && products?.[0]?._id ? `/template/${vendorId}/product/${products[0]._id}` : shopHref

  const mobileNavItems = useMemo(() => {
    const seen = new Set<string>()
    const items = [
      { id: 'home', label: 'Home', href: homeHref },
      { id: 'about', label: 'About Us', href: aboutHref },
      { id: 'products', label: 'All Products', href: shopHref },
      { id: 'contact', label: 'Contact Us', href: contactHref },
      { id: 'cart', label: 'Cart', href: cartHref },
      { id: 'checkout', label: 'Checkout', href: checkoutHref },
      { id: 'orders', label: 'Orders', href: ordersHref },
      {
        id: 'auth',
        label: isLoggedIn ? 'Profile' : 'Login',
        href: isLoggedIn ? profileHref : loginHref,
      },
      { id: 'register', label: 'Register', href: registerHref },
      { id: 'featured', label: 'Featured Product', href: firstProductHref },
      ...customPages.map((page: any, index: number) => ({
        id: String(page?.id || page?.slug || `custom-${index}`),
        label: page?.title || 'Custom Page',
        href: `/template/${vendorId}/page/${page?.slug || page?.id}`,
      })),
    ]

    return items.filter((item) => {
      const fingerprint = `${item.label}|${item.href}`
      if (seen.has(fingerprint)) return false
      seen.add(fingerprint)
      return true
    })
  }, [
    aboutHref,
    cartHref,
    checkoutHref,
    contactHref,
    customPages,
    firstProductHref,
    homeHref,
    isLoggedIn,
    loginHref,
    ordersHref,
    profileHref,
    registerHref,
    shopHref,
    vendorId,
  ])

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
      if (event.key === `template_auth_${vendorId}`) {
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
  }, [vendorId])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = searchText.trim().toLowerCase()
    if (!normalized) {
      router.push(shopHref)
      return
    }
    const exact = products.find(
      (product) => String(product?.productName || '').toLowerCase() === normalized
    )
    if (exact?._id) {
      router.push(`/template/${vendorId}/product/${exact._id}`)
      return
    }
    const partial = products.find((product) =>
      String(product?.productName || '').toLowerCase().includes(normalized)
    )
    if (partial?._id) {
      router.push(`/template/${vendorId}/product/${partial._id}`)
      return
    }
    router.push(shopHref)
  }

  return (
    <header className='sticky top-0 z-50 border-b border-[#dce0e8] bg-white shadow-[0_1px_8px_rgba(15,23,42,0.06)]'>
      <div className='hidden border-b border-[#e9edf3] bg-[#f8fafc] lg:block'>
        <div className='mx-auto flex max-w-[1500px] items-center justify-between px-8 py-2 text-[14px] text-[#4b5563]'>
          <div className='space-x-4'>
            <Link href={contactHref} className='hover:text-[#0b74c6]'>
              Franchise Enquiry
            </Link>
            <span>|</span>
            <Link href={registerHref} className='hover:text-[#0b74c6]'>
              Warranty Registration
            </Link>
            <span>|</span>
            <Link href={ordersHref} className='hover:text-[#0b74c6]'>
              Track your order
            </Link>
          </div>
          <div>
            <span className='font-semibold text-[#0b74c6]'>Best Deals</span>
          </div>
        </div>
      </div>

      <div className='mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-4 md:px-8'>
        <Link
          href={homeHref}
          className='flex shrink-0 items-center gap-2'
          data-template-section='branding'
        >
          <div className='h-11 w-11 overflow-hidden rounded-sm border border-[#d9dfe8] bg-white'>
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
          <span className='hidden text-[20px] font-semibold text-[#0b74c6] sm:block'>
            {template?.business_name || 'White Rose'}
          </span>
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className='relative hidden min-w-0 flex-1 items-center rounded-full border border-[#d6dbe5] bg-white px-4 py-2 lg:flex'
        >
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder='Search for products'
            className='min-w-0 flex-1 bg-transparent text-[16px] text-[#2f3640] outline-none placeholder:text-[#7b8492]'
          />
          <button
            type='submit'
            className='inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6b7280] transition hover:bg-[#f1f4f8] hover:text-[#0b74c6]'
          >
            <Search className='h-5 w-5' />
          </button>

          {productSuggestions.length > 0 ? (
            <div className='absolute left-0 right-0 top-[calc(100%+10px)] z-50 rounded-xl border border-[#dce2eb] bg-white p-2 shadow-xl'>
              {productSuggestions.map((product) => (
                <Link
                  key={product?._id || product?.productName}
                  href={product?._id ? `/template/${vendorId}/product/${product._id}` : shopHref}
                  className='block rounded-md px-3 py-2 text-[15px] text-[#2f3640] transition hover:bg-[#f5f7fb]'
                  onClick={() => setSearchText('')}
                >
                  {product?.productName || 'Product'}
                </Link>
              ))}
            </div>
          ) : null}
        </form>

        <div className='ml-auto hidden items-center gap-5 lg:flex'>
          <Link href={shopHref} className='text-[#1f2937] transition hover:text-[#0b74c6]' title='Wishlist'>
            <Heart className='h-6 w-6' />
          </Link>
          <Link href={cartHref} className='relative text-[#1f2937] transition hover:text-[#0b74c6]' title='Cart'>
            <ShoppingCart className='h-6 w-6' />
            <span className='absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b74c6] px-1 text-[11px] font-bold text-white'>
              {cartCount}
            </span>
          </Link>
          <Link
            href={isLoggedIn ? profileHref : loginHref}
            className='inline-flex items-center gap-2 text-[18px] font-medium text-[#1f2937] hover:text-[#0b74c6]'
          >
            <UserRound className='h-6 w-6' />
            {isLoggedIn ? 'My Account' : 'Login / Register'}
          </Link>
          {isLoggedIn ? (
            <button
              type='button'
              onClick={() => {
                clearTemplateAuth(vendorId)
                setIsLoggedIn(false)
                setCartCount(0)
              }}
              className='text-sm font-semibold uppercase tracking-[0.08em] text-[#6b7280] transition hover:text-[#0b74c6]'
            >
              Logout
            </button>
          ) : null}
        </div>

        <button
          type='button'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className='ml-auto inline-flex items-center justify-center rounded-md border border-[#d6dbe5] p-2 text-[#374151] lg:hidden'
        >
          {mobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
      </div>

      <div className='hidden border-t border-[#edf0f5] lg:block'>
        <div className='mx-auto flex max-w-[1500px] items-center gap-7 px-8 py-3 text-[30px] font-medium text-[#2f3640]'>
          <Link
            href={homeHref}
            className={`transition hover:text-[#0b74c6] ${pathname === homeHref ? 'text-[#0b74c6]' : ''}`}
          >
            Home
          </Link>
          <Link
            href={aboutHref}
            className={`transition hover:text-[#0b74c6] ${pathname?.includes('/about') ? 'text-[#0b74c6]' : ''}`}
          >
            About Us
          </Link>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setPagesOpen((prev) => !prev)}
              className='inline-flex items-center gap-1 transition hover:text-[#0b74c6]'
            >
              Products
              <ChevronDown className={`h-5 w-5 transition ${pagesOpen ? 'rotate-180' : ''}`} />
            </button>
            {pagesOpen ? (
              <div className='absolute left-0 top-[calc(100%+10px)] z-50 max-h-[420px] w-[340px] overflow-auto rounded-xl border border-[#dce2eb] bg-white p-2 shadow-xl'>
                <Link
                  href={shopHref}
                  className='block rounded-md px-3 py-2 text-[16px] text-[#2f3640] hover:bg-[#f5f7fb]'
                  onClick={() => setPagesOpen(false)}
                >
                  All Products
                </Link>
                {categoryEntries.map((category, index) => (
                  <Link
                    key={`${category.href}-${category.label}-${index}`}
                    href={category.href}
                    className='block rounded-md px-3 py-2 text-[16px] text-[#2f3640] hover:bg-[#f5f7fb]'
                    onClick={() => setPagesOpen(false)}
                  >
                    {category.label}
                  </Link>
                ))}
                {customPages.map((page: any) => (
                  <Link
                    key={page?.id || page?.slug || page?.title}
                    href={`/template/${vendorId}/page/${page?.slug || page?.id}`}
                    className='block rounded-md px-3 py-2 text-[16px] text-[#2f3640] hover:bg-[#f5f7fb]'
                    onClick={() => setPagesOpen(false)}
                  >
                    {page?.title || 'Custom Page'}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <Link
            href={contactHref}
            className={`transition hover:text-[#0b74c6] ${pathname?.includes('/contact') ? 'text-[#0b74c6]' : ''}`}
          >
            Contact Us
          </Link>
          <Link
            href={shopHref}
            className='ml-auto rounded-md bg-[#0b74c6] px-6 py-2 text-[18px] font-semibold text-white transition hover:bg-[#085ea0]'
          >
            GET A QUOTE
          </Link>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className='border-t border-[#edf0f5] bg-white px-4 py-5 lg:hidden'>
          <form onSubmit={handleSearchSubmit} className='mb-4 flex items-center gap-2'>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder='Search for products'
              className='min-w-0 flex-1 rounded-lg border border-[#d6dbe5] px-3 py-2 text-[15px] outline-none'
            />
            <button
              type='submit'
              className='inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0b74c6] text-white'
            >
              <Search className='h-5 w-5' />
            </button>
          </form>

          <div className='flex flex-col gap-2 text-[16px] text-[#2f3640]'>
            {mobileNavItems.map((item, index) => (
              <Link
                key={`${item.id}-${item.href}-${index}`}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className='rounded-md px-1 py-1.5 transition hover:text-[#0b74c6]'
              >
                {item.label}
              </Link>
            ))}
            <div className='mt-2 border-t border-[#eceff4] pt-3'>
              <p className='mb-2 text-xs uppercase tracking-[0.12em] text-[#6b7280]'>Categories</p>
              <div className='grid grid-cols-2 gap-2'>
                {categoryEntries.slice(0, 8).map((category, index) => (
                  <Link
                    key={`mobile-${category.href}-${category.label}-${index}`}
                    href={category.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className='rounded-md border border-[#e4e7ee] px-2 py-1.5 text-sm text-[#374151] hover:border-[#0b74c6] hover:text-[#0b74c6]'
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
