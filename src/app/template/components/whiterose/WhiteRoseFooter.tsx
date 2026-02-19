'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Mail, Phone, ArrowUp } from 'lucide-react'

type TemplateProduct = {
  _id?: string
  productName?: string
  productCategory?: { _id?: string; name?: string; title?: string; categoryName?: string } | string
  productCategoryName?: string
}

const CITIES = [
  'Agra',
  'Ahmedabad',
  'Bengaluru',
  'Bhopal',
  'Bhubaneswar',
  'Chandigarh',
  'Chennai',
  'Coimbatore',
  'Dehradun',
  'Delhi NCR',
  'Faridabad',
  'Ghaziabad',
  'Gurugram',
  'Guwahati',
  'Hyderabad',
  'Indore',
  'Jaipur',
  'Jodhpur',
  'Kanpur',
  'Kolkata',
  'Lucknow',
  'Mumbai',
  'Nagpur',
  'Noida',
  'Patna',
  'Pune',
  'Ranchi',
  'Surat',
  'Vadodara',
  'Varanasi',
]

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

export function WhiteRoseFooter() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )

  const businessName =
    template?.business_name || vendor?.registrar_name || vendor?.name || 'White Rose'

  const categoryLinks = useMemo(() => {
    const map = new Map<string, { href: string; label: string }>()
    products.forEach((product) => {
      const label = getCategoryLabel(product)
      if (!label) return
      const rawId = getCategoryId(product)
      const slug = rawId || toSlug(label)
      if (!slug) return
      const href = `/template/${vendorId}/category/${slug}`
      if (!map.has(href)) {
        map.set(href, { href, label: String(label) })
      }
    })
    return Array.from(map.values()).slice(0, 20)
  }, [products, vendorId])

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
    <footer className='border-t border-[#e2e6ee] bg-[#f1f2f5] text-[#2b313c]'>
      <div className='mx-auto max-w-[1500px] px-4 py-12 md:px-8'>
        <div className='grid gap-10 border-b border-[#d9dee8] pb-10 xl:grid-cols-[1fr_1fr_1fr_1.2fr]'>
          <div>
            <h3 className='text-[20px] font-semibold text-[#1f2937]'>Furniture</h3>
            <ul className='mt-4 space-y-2 text-[16px] text-[#4b5563]'>
              {categoryLinks.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className='hover:text-[#0b74c6]'>
                    {link.label}
                  </Link>
                </li>
              ))}
              {categoryLinks.length === 0 ? (
                <li>
                  <Link href={`/template/${vendorId}/all-products`} className='hover:text-[#0b74c6]'>
                    All Products
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className='text-[20px] font-semibold text-[#1f2937]'>About Us</h3>
            <ul className='mt-4 space-y-2 text-[16px] text-[#4b5563]'>
              <li>
                <Link href={`/template/${vendorId}/about`} className='hover:text-[#0b74c6]'>
                  About {businessName}
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/contact`} className='hover:text-[#0b74c6]'>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/orders`} className='hover:text-[#0b74c6]'>
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/all-products`} className='hover:text-[#0b74c6]'>
                  Blogs & Updates
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/register`} className='hover:text-[#0b74c6]'>
                  Franchise Enquiry
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-[20px] font-semibold text-[#1f2937]'>Help</h3>
            <ul className='mt-4 space-y-2 text-[16px] text-[#4b5563]'>
              <li>
                <Link href={`/template/${vendorId}/contact`} className='hover:text-[#0b74c6]'>
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/checkout`} className='hover:text-[#0b74c6]'>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/contact`} className='hover:text-[#0b74c6]'>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/contact`} className='hover:text-[#0b74c6]'>
                  Purchase & Returns
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/all-products`} className='hover:text-[#0b74c6]'>
                  Downloads
                </Link>
              </li>
              <li>
                <Link href={`/template/${vendorId}/category`} className='hover:text-[#0b74c6]'>
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className='rounded-lg border border-[#d9dee8] bg-white p-5'>
              <h3 className='text-[20px] font-semibold text-[#1f2937]'>Customer Support</h3>
              <div className='mt-4 flex items-start gap-3'>
                <Phone className='mt-0.5 h-5 w-5 text-[#0b74c6]' />
                <div>
                  <p className='text-[34px] font-semibold leading-none text-[#2b313c]'>
                    {vendor?.phone || vendor?.alternate_contact_phone || '1800 1219 115'}
                  </p>
                  <p className='mt-2 text-[15px] text-[#4b5563]'>
                    You can reach us 7 days a week for product support and order assistance.
                  </p>
                </div>
              </div>
              <div className='mt-4 flex items-start gap-3 text-[16px] text-[#374151]'>
                <Mail className='mt-0.5 h-5 w-5 text-[#0b74c6]' />
                <a href={`mailto:${vendor?.email || ''}`} className='hover:text-[#0b74c6]'>
                  {vendor?.email || 'support@whiterose.com'}
                </a>
              </div>
              <p className='mt-4 text-[15px] leading-[1.6] text-[#4b5563]'>
                {fullAddress || 'Store address will appear here once vendor profile is updated.'}
              </p>
            </div>
          </div>
        </div>

        <div className='grid gap-10 pt-10 lg:grid-cols-[1fr_1.7fr]'>
          <div>
            <h4 className='text-[30px] font-semibold tracking-[-0.02em] text-[#1f2937]'>
              Popular Categories
            </h4>
            <div className='mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[16px] text-[#4b5563]'>
              {categoryLinks.slice(0, 16).map((link) => (
                <Link key={link.href} href={link.href} className='hover:text-[#0b74c6]'>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className='text-[30px] font-semibold tracking-[-0.02em] text-[#1f2937]'>
              Cities We Deliver To
            </h4>
            <div className='mt-4 grid grid-cols-3 gap-x-8 gap-y-2 text-[16px] text-[#4b5563] xl:grid-cols-5'>
              {CITIES.map((city) => (
                <span key={city}>{city}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className='border-t border-[#d9dee8] bg-white'>
        <div className='mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 px-4 py-4 text-[15px] text-[#4b5563] md:flex-row md:px-8'>
          <p>(c) {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <div className='flex items-center gap-5'>
            <Link href={`/template/${vendorId}/contact`} className='hover:text-[#0b74c6]'>
              Privacy Policy
            </Link>
            <Link href={`/template/${vendorId}/checkout`} className='hover:text-[#0b74c6]'>
              Terms of Service
            </Link>
            <Link href={`/template/${vendorId}/contact`} className='hover:text-[#0b74c6]'>
              Return Policy
            </Link>
          </div>
        </div>
      </div>

      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-7 left-7 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0b74c6] text-white shadow-lg transition hover:bg-[#085ea0]'
      >
        <ArrowUp className='h-5 w-5' />
      </button>
    </footer>
  )
}
