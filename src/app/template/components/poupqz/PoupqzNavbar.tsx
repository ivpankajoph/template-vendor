'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Menu, ShoppingBag, UserCircle2, X } from 'lucide-react'
import { clearTemplateAuth, getTemplateAuth, templateApiFetch } from '../templateAuth'

export function PoupqzNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const template = useSelector((state: any) => state?.alltemplatepage?.data)

  // simple nav items, no dropdowns
  const homeHref = vendorId ? `/template/${vendorId}` : '#'
  const aboutHref = vendorId ? `/template/${vendorId}/about` : '#'
  const productsHref = vendorId ? `/template/${vendorId}/all-products` : '#'
  const contactHref = vendorId ? `/template/${vendorId}/contact` : '#'
  const cartHref = vendorId ? `/template/${vendorId}/cart` : '#'
  const profileHref = vendorId ? `/template/${vendorId}/profile` : '#'
  const loginHref = vendorId ? `/template/${vendorId}/login` : '#'

  const logo =
    template?.components?.logo ||
    'https://images.unsplash.com/photo-1620632523414-054c7bea12ac?auto=format&fit=crop&q=80&w=687'

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
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className='mx-auto flex h-24 w-full max-w-[1400px] items-center justify-between gap-6 px-6 md:px-12'>
        <Link href={homeHref} className='flex h-16 w-52 items-center overflow-hidden transition-transform hover:scale-[1.02]'>
          <img src={logo} alt='Business Logo' className='h-full w-full object-contain' />
        </Link>

        <nav className="hidden lg:flex items-center space-x-10">
          {[
            { label: 'Home', href: homeHref, active: isHome },
            { label: 'Catalog', href: productsHref, active: pathname === productsHref },
            { label: 'Our Story', href: aboutHref, active: pathname === aboutHref },
            { label: 'Support', href: contactHref, active: pathname === contactHref },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`relative text-[15px] font-bold uppercase tracking-widest transition-colors ${item.active ? 'text-[#0c4a6e]' : 'text-slate-500 hover:text-[#0c4a6e]'
                }`}
            >
              {item.label}
              {item.active && (
                <span className='absolute -bottom-2 left-0 h-0.5 w-full bg-[#0c4a6e]' />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-6">
          <Link href={cartHref} className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 transition-colors hover:bg-[#0c4a6e] hover:text-white">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-lg ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="hidden h-6 w-px bg-slate-200 lg:block" />

          {isLoggedIn ? (
            <Link href={profileHref} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 transition-colors hover:bg-[#0c4a6e] hover:text-white">
              <UserCircle2 className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href={loginHref}
              className="hidden rounded-full bg-[#0c4a6e] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#075985] hover:shadow-lg active:scale-95 lg:block"
            >
              Portal Login
            </Link>
          )}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 transition-colors hover:bg-[#0c4a6e] hover:text-white lg:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className='absolute inset-x-0 top-full border-b border-slate-100 bg-white shadow-2xl animate-in slide-in-from-top-4 lg:hidden'>
          <div className='flex flex-col gap-1 p-6'>
            {[
              { label: 'Home', href: homeHref },
              { label: 'Products', href: productsHref },
              { label: 'About Us', href: aboutHref },
              { label: 'Our Contact', href: contactHref },
              { label: 'My Cart', href: cartHref },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className='rounded-xl px-4 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 active:bg-slate-100'
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="my-4 h-px bg-slate-100" />

            {isLoggedIn ? (
              <>
                <Link
                  href={profileHref}
                  className='rounded-xl px-4 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Account Dashboard
                </Link>
                <button
                  type='button'
                  onClick={() => {
                    clearTemplateAuth(vendorId)
                    setIsLoggedIn(false)
                    setCartCount(0)
                    setMobileMenuOpen(false)
                  }}
                  className='rounded-xl px-4 py-3 text-left text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50'
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href={loginHref}
                className='rounded-xl bg-[#0c4a6e] px-4 py-4 text-center text-sm font-bold text-white shadow-lg active:scale-95'
                onClick={() => setMobileMenuOpen(false)}
              >
                Portal Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
