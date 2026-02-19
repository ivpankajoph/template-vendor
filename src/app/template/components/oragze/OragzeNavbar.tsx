'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  Bookmark,
  ChevronDown,
  Leaf,
  Menu,
  Search,
  ShoppingBasket,
  UserCircle2,
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

export function OragzeNavbar() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const vendorId = String((params as any)?.vendor_id || '')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pagesOpen, setPagesOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedCategoryPath, setSelectedCategoryPath] = useState('')
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
    return Array.from(map.values()).slice(0, 14)
  }, [products, vendorId])

  const productSuggestions = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return []
    return products
      .filter((product) => String(product?.productName || '').toLowerCase().includes(query))
      .slice(0, 5)
  }, [products, searchText])

  const homeHref = vendorId ? `/template/${vendorId}` : '#'
  const aboutHref = vendorId ? `/template/${vendorId}/about` : '#'
  const shopHref = vendorId ? `/template/${vendorId}/all-products` : '#'
  const contactHref = vendorId ? `/template/${vendorId}/contact` : '#'
  const cartHref = vendorId ? `/template/${vendorId}/cart` : '#'
  const checkoutHref = vendorId ? `/template/${vendorId}/checkout` : '#'
  const profileHref = vendorId ? `/template/${vendorId}/profile` : '#'
  const ordersHref = vendorId ? `/template/${vendorId}/orders` : '#'
  const loginHref = vendorId ? `/template/${vendorId}/login` : '#'
  const registerHref = vendorId ? `/template/${vendorId}/register` : '#'
  const firstProductHref =
    vendorId && products?.[0]?._id ? `/template/${vendorId}/product/${products[0]._id}` : shopHref

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

  useEffect(() => {
    if (selectedCategoryPath) return
    if (categoryEntries.length > 0) {
      setSelectedCategoryPath(categoryEntries[0].href)
      return
    }
    setSelectedCategoryPath(shopHref)
  }, [categoryEntries, selectedCategoryPath, shopHref])

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalized = searchText.trim().toLowerCase()
    if (!normalized) {
      router.push(selectedCategoryPath || shopHref)
      return
    }
    const exactMatch = products.find(
      (product) => String(product?.productName || '').toLowerCase() === normalized
    )
    if (exactMatch?._id) {
      router.push(`/template/${vendorId}/product/${exactMatch._id}`)
      return
    }
    const partial = products.find((product) =>
      String(product?.productName || '').toLowerCase().includes(normalized)
    )
    if (partial?._id) {
      router.push(`/template/${vendorId}/product/${partial._id}`)
      return
    }
    router.push(selectedCategoryPath || shopHref)
  }

  return (
    <header className='sticky top-0 z-50 border-b border-[#d8dccf] bg-[#f7f7f3] shadow-sm'>
      <div className='mx-auto flex w-full max-w-[1320px] items-center gap-3 px-4 py-3 md:px-6 xl:px-8'>
        <Link href={homeHref} className='flex shrink-0 items-center gap-2 text-[#151d2a]'>
          <Leaf className='h-8 w-8 text-[#23b14d]' />
          <span className='text-[28px] font-semibold leading-none tracking-[-0.03em] md:text-[34px]'>
            Organic
          </span>
        </Link>

        <form
          onSubmit={handleSearchSubmit}
          className='relative hidden min-w-0 flex-1 items-center rounded-2xl border border-[#e1e5dc] bg-white px-3 py-2 lg:flex'
        >
          <select
            value={selectedCategoryPath}
            onChange={(event) => setSelectedCategoryPath(event.target.value)}
            className='w-[150px] border-r border-slate-200 bg-transparent pr-2 text-[15px] text-slate-700 outline-none'
          >
            <option value={shopHref}>All Categories</option>
            {categoryEntries.map((entry) => (
              <option key={entry.href} value={entry.href}>
                {entry.label}
              </option>
            ))}
          </select>
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
                  href={product?._id ? `/template/${vendorId}/product/${product._id}` : shopHref}
                  className='block rounded-md px-3 py-2 text-[15px] text-slate-700 transition hover:bg-slate-50'
                  onClick={() => setSearchText('')}
                >
                  {product?.productName || 'Product'}
                </Link>
              ))}
            </div>
          ) : null}
        </form>

        <nav className='ml-auto hidden items-center gap-8 lg:flex'>
          <Link
            href={homeHref}
            className={`text-[16px] font-semibold tracking-[0.03em] ${
              pathname === homeHref ? 'text-[#151d2a]' : 'text-[#2a3342] hover:text-[#6dbf4b]'
            }`}
          >
            HOME
          </Link>

          <div className='relative'>
            <button
              type='button'
              onClick={() => setPagesOpen((prev) => !prev)}
              className='inline-flex items-center gap-1.5 text-[16px] font-semibold tracking-[0.03em] text-[#2a3342] transition hover:text-[#6dbf4b]'
            >
              PAGES
              <ChevronDown className={`h-5 w-5 transition ${pagesOpen ? 'rotate-180' : ''}`} />
            </button>
            {pagesOpen ? (
              <div className='absolute right-0 top-[calc(100%+12px)] z-50 w-[280px] rounded-xl border border-slate-200 bg-white p-3 shadow-2xl'>
                {[
                  { label: 'About Us', href: aboutHref },
                  { label: 'Shop', href: shopHref },
                  { label: 'Single Product', href: firstProductHref },
                  { label: 'Cart', href: cartHref },
                  { label: 'Checkout', href: checkoutHref },
                  { label: 'Contact', href: contactHref },
                  { label: isLoggedIn ? 'My Account' : 'Login', href: isLoggedIn ? profileHref : loginHref },
                  ...customPages.map((page: any) => ({
                    label: page?.title || 'Custom Page',
                    href: `/template/${vendorId}/page/${page?.slug || page?.id}`,
                  })),
                ].map((page) => (
                  <Link
                    key={`${page.label}-${page.href}`}
                    href={page.href}
                    className='block rounded-md px-3 py-2 text-[16px] text-slate-700 transition hover:bg-slate-50 hover:text-[#6dbf4b]'
                    onClick={() => setPagesOpen(false)}
                  >
                    {page.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div className='flex items-center gap-4 border-l border-slate-200 pl-5'>
            <Link
              href={isLoggedIn ? profileHref : loginHref}
              className='text-[#2a3342] transition hover:text-[#6dbf4b]'
              title={isLoggedIn ? 'Profile' : 'Login'}
            >
              <UserCircle2 className='h-7 w-7' />
            </Link>
            <Link href={shopHref} className='text-[#2a3342] transition hover:text-[#6dbf4b]'>
              <Bookmark className='h-7 w-7' />
            </Link>
            <Link href={cartHref} className='relative text-[#2a3342] transition hover:text-[#6dbf4b]'>
              <ShoppingBasket className='h-7 w-7' />
              <span className='absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6dbf4b] px-1 text-[11px] font-bold text-white'>
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
                className='text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500 transition hover:text-[#6dbf4b]'
              >
                Logout
              </button>
            ) : null}
          </div>
        </nav>

        <button
          type='button'
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className='ml-auto inline-flex items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 lg:hidden'
        >
          {mobileMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
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
            {[
              { label: 'Home', href: homeHref },
              { label: 'About', href: aboutHref },
              { label: 'Shop', href: shopHref },
              { label: 'Contact', href: contactHref },
              { label: 'Cart', href: cartHref },
              { label: 'Checkout', href: checkoutHref },
              { label: 'Orders', href: ordersHref },
              { label: isLoggedIn ? 'Profile' : 'Login', href: isLoggedIn ? profileHref : loginHref },
              { label: 'Register', href: registerHref },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className='rounded-md px-1 py-1 transition hover:text-[#6dbf4b]'
              >
                {item.label}
              </Link>
            ))}

            {customPages.map((page: any) => (
              <Link
                key={page?.id || page?.slug || page?.title}
                href={`/template/${vendorId}/page/${page?.slug || page?.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className='rounded-md px-1 py-1 transition hover:text-[#6dbf4b]'
              >
                {page?.title || 'Custom Page'}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  )
}
