'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { ChevronDown, Menu, ShoppingBag, UserCircle2, X } from 'lucide-react'
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'

type Product = {
  _id?: string
  productName?: string
}

const NAV_LINK_CLASS =
  'whitespace-nowrap text-[18px] font-medium text-[#111827] transition hover:text-[#0b74c6]'

export function PoupqzNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  )

  const customPages =
    template?.components?.custom_pages?.filter(
      (page: any) => page?.isPublished !== false
    ) || []

  const logo =
    template?.components?.logo ||
    'https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687'

  const homeHref = vendorId ? `/template/${vendorId}` : '#'
  const aboutHref = vendorId ? `/template/${vendorId}/about` : '#'
  const productsHref = vendorId ? `/template/${vendorId}/all-products` : '#'
  const contactHref = vendorId ? `/template/${vendorId}/contact` : '#'
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
        id: String(product._id),
        label: String(product.productName || 'Product'),
      }))
      .filter((product) => {
        const key = product.label.toLowerCase().trim()
        if (!key || seen.has(key)) return false
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
    <header className='sticky top-0 z-50 border-b border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]'>
      <div className='mx-auto flex h-[118px] w-full max-w-[1320px] items-center justify-between gap-6 px-4 md:px-8'>
        <Link href={homeHref} className='flex h-[82px] w-[250px] items-center overflow-hidden'>
          <img src={logo} alt='Business Logo' className='h-full w-full object-contain' />
        </Link>

        <nav className='hidden items-center gap-8 lg:flex xl:gap-10'>
          <Link
            href={homeHref}
            className={`whitespace-nowrap text-[18px] font-medium transition ${
              isHome ? 'text-[#0b74c6]' : 'text-[#111827] hover:text-[#0b74c6]'
            }`}
          >
            Home
          </Link>

          <Link href={aboutHref} className={NAV_LINK_CLASS}>
            About Us
          </Link>

          <div className='group relative'>
            <button type='button' className={`inline-flex items-center gap-2 ${NAV_LINK_CLASS}`}>
              Products
              <ChevronDown className='h-5 w-5' />
            </button>

            <div className='pointer-events-none absolute left-1/2 top-full z-40 mt-3 w-[380px] -translate-x-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
              <div className='max-h-[420px] overflow-y-auto rounded-md border border-slate-200 bg-white p-3 shadow-xl'>
                {productLinks.length > 0 ? (
                  <div className='space-y-1'>
                    {productLinks.map((product) => (
                      <Link
                        key={product.id}
                        href={`/template/${vendorId}/product/${product.id}`}
                        className='block rounded px-3 py-2 text-[15px] text-[#111827] transition hover:bg-slate-50 hover:text-[#0b74c6]'
                      >
                        {product.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    href={productsHref}
                    className='block rounded px-3 py-2 text-[15px] text-slate-600 transition hover:bg-slate-50 hover:text-[#0b74c6]'
                  >
                    View products
                  </Link>
                )}
              </div>
            </div>
          </div>

          {customPages.length > 0 ? (
            <div className='group relative'>
              <button type='button' className={`inline-flex items-center gap-2 ${NAV_LINK_CLASS}`}>
                Pages
                <ChevronDown className='h-5 w-5' />
              </button>

              <div className='pointer-events-none absolute left-1/2 top-full z-40 mt-3 w-[300px] -translate-x-1/2 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100'>
                <div className='max-h-[360px] overflow-y-auto rounded-md border border-slate-200 bg-white p-3 shadow-xl'>
                  <div className='space-y-1'>
                    {customPages.map((page: any) => (
                      <Link
                        key={page?.id || page?.slug || page?.title}
                        href={`/template/${vendorId}/page/${page?.slug || page?.id}`}
                        className='block rounded px-3 py-2 text-[15px] text-[#111827] transition hover:bg-slate-50 hover:text-[#0b74c6]'
                      >
                        {page?.title || 'Custom Page'}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <Link href={contactHref} className={NAV_LINK_CLASS}>
            Contact Us
          </Link>
        </nav>

        <div className='hidden items-center gap-3 lg:flex'>
          <Link
            href={cartHref}
            className='relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-[#1f2937] transition hover:border-[#0b74c6] hover:text-[#0b74c6]'
            title='Cart'
          >
            <ShoppingBag className='h-5 w-5' />
            <span className='absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0b74c6] px-1 text-[11px] font-bold text-white'>
              {cartCount}
            </span>
          </Link>

          <Link
            href={isLoggedIn ? profileHref : loginHref}
            className='inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white text-[#1f2937] transition hover:border-[#0b74c6] hover:text-[#0b74c6]'
            title={isLoggedIn ? 'Profile' : 'Login'}
          >
            <UserCircle2 className='h-6 w-6' />
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href={ordersHref}
                className='text-sm font-semibold text-[#1f2937] transition hover:text-[#0b74c6]'
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
                className='text-sm font-semibold text-[#1f2937] transition hover:text-[#0b74c6]'
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href={loginHref}
              className='text-sm font-semibold text-[#1f2937] transition hover:text-[#0b74c6]'
            >
              Login
            </Link>
          )}

          <Link
            href={contactHref}
            className='inline-flex whitespace-nowrap rounded-[12px] bg-[#0b74c6] px-8 py-3 text-[16px] font-semibold text-white transition hover:bg-[#085ea0]'
          >
            GET A QUOTE
          </Link>
        </div>

        <button
          type='button'
          className='inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 lg:hidden'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className='border-t border-slate-200 bg-white px-4 py-5 lg:hidden'>
          <div className='flex flex-col gap-4 text-[16px] font-medium text-[#111827]'>
            <Link href={homeHref} onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href={aboutHref} onClick={() => setMobileMenuOpen(false)}>
              About Us
            </Link>
            <Link href={productsHref} onClick={() => setMobileMenuOpen(false)}>
              Products
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

            {isLoggedIn ? (
              <button
                type='button'
                onClick={() => {
                  clearTemplateAuth(vendorId)
                  setIsLoggedIn(false)
                  setCartCount(0)
                  setMobileMenuOpen(false)
                }}
                className='mt-2 inline-flex w-max rounded-[10px] border border-slate-300 px-5 py-2.5 text-[14px] font-semibold text-[#111827]'
              >
                Logout
              </button>
            ) : (
              <Link
                href={contactHref}
                className='inline-flex w-max rounded-[10px] bg-[#0b74c6] px-5 py-2.5 text-[14px] font-semibold text-white'
                onClick={() => setMobileMenuOpen(false)}
              >
                GET A QUOTE
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
