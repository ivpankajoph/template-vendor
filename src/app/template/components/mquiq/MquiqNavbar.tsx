'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  Download,
  Facebook,
  Instagram,
  Mail,
  Menu,
  Phone,
  ShoppingBag,
  UserCircle2,
  X,
} from 'lucide-react'
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'

type Product = {
  _id?: string
  productName?: string
}

const resolveHref = (value: unknown) => {
  if (typeof value !== 'string') return '#'
  const trimmed = value.trim()
  return trimmed || '#'
}

export function MquiqNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const homepage = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  )
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})

  const customPages =
    homepage?.components?.custom_pages?.filter(
      (page: any) => page?.isPublished !== false
    ) || []

  const social = homepage?.components?.social_page || {}
  const logo =
    homepage?.components?.logo ||
    'https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687'

  const phone =
    vendor?.phone || vendor?.alternate_contact_phone || '+91-9999999999'
  const email = vendor?.email || 'info@storage.com'

  const homeHref = vendorId ? `/template/${vendorId}` : '#'
  const aboutHref = vendorId ? `/template/${vendorId}/about` : '#'
  const whyUsHref = vendorId ? `/template/${vendorId}#why-us` : '#'
  const contactHref = vendorId ? `/template/${vendorId}/contact` : '#'
  const catalogHref = vendorId ? `/template/${vendorId}/all-products` : '#'
  const cartHref = vendorId ? `/template/${vendorId}/cart` : '#'
  const checkoutHref = vendorId ? `/template/${vendorId}/checkout` : '#'
  const ordersHref = vendorId ? `/template/${vendorId}/orders` : '#'
  const profileHref = vendorId ? `/template/${vendorId}/profile` : '#'
  const loginHref = vendorId ? `/template/${vendorId}/login` : '#'
  const registerHref = vendorId ? `/template/${vendorId}/register` : '#'

  const productLinks = useMemo(() => {
    const seen = new Set<string>()
    return products
      .filter((product) => product?._id && product?.productName)
      .map((product) => ({
        id: product._id as string,
        label: String(product.productName || 'Product'),
      }))
      .filter((product) => {
        const key = `${product.id}-${product.label.toLowerCase()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 12)
  }, [products])

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
      if (event.key === `template_auth_${vendorId}`) refresh()
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

  const isHome = pathname === homeHref || pathname === '/'

  return (
    <header className='relative z-40'>
      <div className='hidden bg-[#2f3640] text-white lg:block'>
        <div className='mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between px-6 xl:px-8'>
          <div className='flex items-center gap-8 text-sm font-medium'>
            <a href={`tel:${phone}`} className='inline-flex items-center gap-3 hover:opacity-90'>
              <Phone className='h-5 w-5 text-[#f4b400]' />
              <span>{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              className='inline-flex items-center gap-3 hover:opacity-90'
            >
              <Mail className='h-5 w-5 text-[#f4b400]' />
              <span>{email}</span>
            </a>
          </div>

          <div className='flex items-center gap-3'>
            <a
              href={resolveHref(social?.facebook)}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'
            >
              <Facebook className='h-5 w-5' />
            </a>
            <a
              href={resolveHref(social?.instagram)}
              target='_blank'
              rel='noreferrer'
              className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'
            >
              <Instagram className='h-5 w-5' />
            </a>
          </div>
        </div>
      </div>

      <nav className='sticky top-0 border-b border-slate-200 bg-[#f3f4f6]'>
        <div className='mx-auto flex w-full max-w-[1320px] items-center justify-between gap-4 px-4 py-4 md:px-6 xl:px-8'>
          <Link
            href={homeHref}
            className='flex h-[72px] w-[190px] items-center justify-center overflow-hidden rounded-[10px] bg-white shadow-sm md:h-[94px] md:w-[290px]'
            data-template-section='branding'
          >
            <img
              src={logo}
              alt='Business Logo'
              className='h-full w-full object-contain p-3'
              data-template-path='components.logo'
              data-template-section='branding'
              data-template-component='components.logo'
            />
          </Link>

          <div className='hidden items-center gap-8 lg:flex'>
            <Link
              href={homeHref}
              className={`relative text-[18px] font-bold transition ${
                isHome ? 'text-[#f4b400]' : 'text-[#2f3136] hover:text-[#f4b400]'
              }`}
            >
              Home
              {isHome ? (
                <span className='absolute -bottom-3 left-0 h-[3px] w-12 rounded-full bg-[#f4b400]' />
              ) : null}
            </Link>

            <Link
              href={aboutHref}
              className='text-[18px] font-bold text-[#2f3136] transition hover:text-[#f4b400]'
            >
              About Us
            </Link>

            <div className='group relative'>
              <button
                type='button'
                className='inline-flex items-center gap-2 text-[18px] font-bold text-[#2f3136] transition hover:text-[#f4b400]'
              >
                Products
                <ChevronDown className='h-5 w-5' />
              </button>

              <div className='pointer-events-none absolute left-1/2 top-full z-40 mt-5 w-[430px] -translate-x-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                <div className='max-h-[520px] overflow-y-auto rounded-xl border border-slate-300 bg-white p-6 shadow-xl'>
                  <p className='text-xl font-bold text-[#f4b400]'>Products</p>
                  <div className='mt-4 border-t border-slate-200 pt-4'>
                    {productLinks.length > 0 ? (
                      <div className='space-y-3'>
                        {productLinks.map((product) => (
                          <Link
                            key={product.id}
                            href={`/template/${vendorId}/product/${product.id}`}
                            className='block text-base font-medium text-[#2f3136] transition hover:text-[#f4b400]'
                          >
                            {product.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        href={catalogHref}
                        className='text-sm font-medium text-slate-500 hover:text-[#f4b400]'
                      >
                        No products added yet. View catalog
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={whyUsHref}
              className='text-[18px] font-bold text-[#2f3136] transition hover:text-[#f4b400]'
            >
              Why Us
            </Link>

            {customPages.length > 0 ? (
              <div className='group relative'>
                <button
                  type='button'
                  className='inline-flex items-center gap-2 text-[18px] font-bold text-[#2f3136] transition hover:text-[#f4b400]'
                >
                  Pages
                  <ChevronDown className='h-5 w-5' />
                </button>
                <div className='pointer-events-none absolute left-1/2 top-full z-40 mt-5 w-[300px] -translate-x-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                  <div className='max-h-[420px] overflow-y-auto rounded-xl border border-slate-300 bg-white p-4 shadow-xl'>
                    <div className='space-y-2'>
                      {customPages.map((page: any) => (
                        <Link
                          key={page?.id || page?.slug || page?.title}
                          href={`/template/${vendorId}/page/${page?.slug || page?.id}`}
                          className='block rounded-md px-3 py-2 text-sm font-medium text-[#2f3136] transition hover:bg-slate-50 hover:text-[#f4b400]'
                        >
                          {page?.title || 'Custom Page'}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className='hidden items-center gap-3 lg:flex'>
            <Link
              href={catalogHref}
              className='inline-flex items-center gap-2 rounded-full border border-slate-300 bg-transparent px-5 py-3 text-[16px] font-bold text-[#2f3136] transition hover:border-[#f4b400] hover:text-[#f4b400]'
            >
              <Download className='h-5 w-5' />
              Download Catalog
            </Link>

            <Link
              href={cartHref}
              className='relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-[#2f3136] transition hover:border-[#f4b400] hover:text-[#f4b400]'
              title='Cart'
            >
              <ShoppingBag className='h-5 w-5' />
              <span className='absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f4b400] px-1 text-[11px] font-bold text-white'>
                {cartCount}
              </span>
            </Link>

            <Link
              href={isLoggedIn ? profileHref : loginHref}
              className='inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-[#2f3136] transition hover:border-[#f4b400] hover:text-[#f4b400]'
              title={isLoggedIn ? 'Profile' : 'Login'}
            >
              <UserCircle2 className='h-6 w-6' />
            </Link>

            {isLoggedIn ? (
              <>
                <Link
                  href={ordersHref}
                  className='text-sm font-semibold text-[#2f3136] transition hover:text-[#f4b400]'
                >
                  Orders
                </Link>
                <button
                  type='button'
                  onClick={() => {
                    clearTemplateAuth(vendorId)
                    setIsLoggedIn(false)
                    setCartCount(0)
                  }}
                  className='text-sm font-semibold text-[#2f3136] transition hover:text-[#f4b400]'
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                className='text-sm font-semibold text-[#2f3136] transition hover:text-[#f4b400]'
              >
                Login
              </Link>
            )}

            <Link
              href={contactHref}
              className='inline-flex rounded-full bg-[#f4b400] px-7 py-3 text-[16px] font-bold text-white transition hover:bg-[#d79a00]'
            >
              Contact Us
            </Link>
          </div>

          <button
            type='button'
            className='inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 lg:hidden'
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className='h-6 w-6' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </button>
        </div>

        {mobileMenuOpen ? (
          <div className='border-t border-slate-200 bg-white px-4 py-5 lg:hidden'>
            <div className='flex flex-col gap-4 text-base font-semibold text-[#2f3136]'>
              <Link href={homeHref} onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href={aboutHref} onClick={() => setMobileMenuOpen(false)}>
                About Us
              </Link>
              <Link href={whyUsHref} onClick={() => setMobileMenuOpen(false)}>
                Why Us
              </Link>
              <Link href={catalogHref} onClick={() => setMobileMenuOpen(false)}>
                All Products
              </Link>
              <Link href={cartHref} onClick={() => setMobileMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
              <Link href={checkoutHref} onClick={() => setMobileMenuOpen(false)}>
                Checkout
              </Link>
              {isLoggedIn ? (
                <>
                  <Link href={ordersHref} onClick={() => setMobileMenuOpen(false)}>
                    Orders
                  </Link>
                  <Link href={profileHref} onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link href={loginHref} onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href={registerHref} onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}
              <Link href={contactHref} onClick={() => setMobileMenuOpen(false)}>
                Contact Us
              </Link>

              {customPages.length > 0 ? (
                <div className='mt-2 border-t border-slate-200 pt-4'>
                  <p className='mb-2 text-xs uppercase tracking-[0.22em] text-slate-500'>
                    Pages
                  </p>
                  <div className='space-y-2'>
                    {customPages.map((page: any) => (
                      <Link
                        key={page?.id || page?.slug || page?.title}
                        href={`/template/${vendorId}/page/${page?.slug || page?.id}`}
                        className='block text-sm font-medium text-slate-700'
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {page?.title || 'Custom Page'}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className='mt-2 border-t border-slate-200 pt-4'>
                <p className='mb-2 text-xs uppercase tracking-[0.22em] text-slate-500'>
                  Products
                </p>
                <div className='max-h-48 space-y-2 overflow-y-auto pr-1'>
                  {productLinks.length > 0 ? (
                    productLinks.map((product) => (
                      <Link
                        key={product.id}
                        href={`/template/${vendorId}/product/${product.id}`}
                        className='block text-sm font-medium text-slate-700'
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {product.label}
                      </Link>
                    ))
                  ) : (
                    <p className='text-sm text-slate-500'>No products added yet.</p>
                  )}
                </div>
              </div>

              <div className='mt-2 border-t border-slate-200 pt-4 text-sm text-slate-600'>
                <a href={`tel:${phone}`} className='block'>
                  {phone}
                </a>
                <a href={`mailto:${email}`} className='block pt-1'>
                  {email}
                </a>
              </div>

              {isLoggedIn ? (
                <button
                  type='button'
                  onClick={() => {
                    clearTemplateAuth(vendorId)
                    setIsLoggedIn(false)
                    setCartCount(0)
                    setMobileMenuOpen(false)
                  }}
                  className='mt-2 inline-flex w-max rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700'
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  )
}
