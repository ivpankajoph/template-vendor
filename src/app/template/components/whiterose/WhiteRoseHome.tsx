'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react'

type TemplateProduct = {
  _id?: string
  productName?: string
  shortDescription?: string
  productCategory?: { _id?: string; name?: string; title?: string; categoryName?: string } | string
  productCategoryName?: string
  defaultImages?: Array<{ url?: string }>
  variants?: Array<{ finalPrice?: number }>
}

type CategoryCard = {
  key: string
  label: string
  image: string
  href: string
  offer: string
}

type LaunchCard = {
  _id: string
  title: string
  image: string
  href: string
  price: number
  oldPrice: number
  discount: number
}

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1616594039964-5a2c9096f9f2?auto=format&fit=crop&w=1800&q=80'
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1579656592043-a20e25a4aa4b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=1200&q=80',
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

const getMinPrice = (variants: Array<{ finalPrice?: number }> = []) => {
  const values = variants
    .map((variant) => variant?.finalPrice)
    .filter((value): value is number => typeof value === 'number' && value > 0)
  return values.length ? Math.min(...values) : 0
}

export function WhiteRoseHome() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )

  const home = template?.components?.home_page || {}
  const heroTitle = home?.header_text || 'Premium furniture designed for modern homes'
  const heroSubtitle =
    home?.header_text_small ||
    'Comfortable, durable, and beautifully crafted collections for living, dining, and office spaces.'
  const heroImage = home?.backgroundImage || products?.[0]?.defaultImages?.[0]?.url || HERO_FALLBACK

  const categoryCards = useMemo<CategoryCard[]>(() => {
    const map = new Map<string, CategoryCard>()
    products.forEach((product) => {
      const label = getCategoryLabel(product)
      if (!label) return
      const rawId = getCategoryId(product)
      const slug = rawId || toSlug(label)
      if (!slug) return
      const href = `/template/${vendorId}/category/${slug}`
      if (!map.has(href)) {
        const cardIndex = map.size % CATEGORY_FALLBACKS.length
        map.set(href, {
          key: href,
          label,
          image: product?.defaultImages?.[0]?.url || CATEGORY_FALLBACKS[cardIndex],
          href,
          offer: map.size === 0 ? 'UPTO 60% OFF*' : map.size === 1 ? 'UPTO 50% OFF*' : 'UPTO 55% OFF*',
        })
      }
    })

    const entries = Array.from(map.values()).slice(0, 3)
    while (entries.length < 3) {
      const index = entries.length
      const label = ['Recliners', 'Plastic Chairs', 'Office Chairs'][index]
      entries.push({
        key: `${label}-${index}`,
        label,
        image: CATEGORY_FALLBACKS[index],
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
        offer: index === 0 ? 'UPTO 60% OFF*' : index === 1 ? 'UPTO 50% OFF*' : 'UPTO 55% OFF*',
      })
    }
    return entries
  }, [products, vendorId])

  const launchCards = useMemo<LaunchCard[]>(() => {
    const mapped = products.slice(0, 4).map((product, index) => {
      const price = getMinPrice(product?.variants || []) || [13690, 5490, 5990, 4690][index] || 999
      const discount = [57, 33, 58, 47][index] || 25
      const oldPrice = Math.max(price + Math.round(price * 0.45), price + 500)
      return {
        _id: String(product?._id || ''),
        title: product?.productName || `New Launch ${index + 1}`,
        image: product?.defaultImages?.[0]?.url || CATEGORY_FALLBACKS[index % CATEGORY_FALLBACKS.length],
        href:
          vendorId && product?._id
            ? `/template/${vendorId}/product/${product._id}`
            : vendorId
              ? `/template/${vendorId}/all-products`
              : '#',
        price,
        oldPrice,
        discount,
      }
    })

    while (mapped.length < 4) {
      const index = mapped.length
      mapped.push({
        _id: '',
        title: ['Arthur Plus Queen Bed', 'Ergo Office Chair', '4 Door Shoe Rack', 'Mesh Office Chair'][index],
        image: CATEGORY_FALLBACKS[index % CATEGORY_FALLBACKS.length],
        href: vendorId ? `/template/${vendorId}/all-products` : '#',
        price: [13690, 5490, 5990, 4690][index] || 999,
        oldPrice: [32500, 9200, 14500, 8900][index] || 1499,
        discount: [57, 33, 58, 47][index] || 25,
      })
    }

    return mapped
  }, [products, vendorId])

  return (
    <div className='template-home template-home-whiterose bg-[#f6f6f6] text-[#2b2f36]'>
      <section
        className='border-b border-[#e5e7eb] bg-white'
        data-template-section='hero'
      >
        <div className='mx-auto grid max-w-[1500px] items-center gap-6 px-4 py-6 md:px-8 lg:grid-cols-[0.9fr_1.1fr]'>
          <div className='space-y-4'>
            <p
              className='text-[14px] font-semibold uppercase tracking-[0.16em] text-[#0b74c6]'
              data-template-path='components.home_page.hero_kicker'
              data-template-section='hero'
            >
              {home?.hero_kicker || 'Super Saver Week'}
            </p>
            <h1
              className='max-w-[620px] text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#20242c] md:text-[52px]'
              data-template-path='components.home_page.header_text'
              data-template-section='hero'
            >
              {heroTitle}
            </h1>
            <p
              className='max-w-[640px] text-[17px] leading-[1.6] text-[#4b5563]'
              data-template-path='components.home_page.header_text_small'
              data-template-section='hero'
            >
              {heroSubtitle}
            </p>
            <div className='flex flex-wrap items-center gap-3'>
              <Link
                href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                className='rounded-md bg-[#0b74c6] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#085ea0]'
                data-template-path='components.home_page.button_header'
                data-template-section='hero'
              >
                {home?.button_header || 'BUY NOW'}
              </Link>
              <Link
                href={vendorId ? `/template/${vendorId}/category` : '#'}
                className='rounded-md border border-[#d6dbe5] px-6 py-3 text-[15px] font-medium text-[#2b3340] transition hover:border-[#0b74c6] hover:text-[#0b74c6]'
                data-template-path='components.home_page.button_secondary'
                data-template-section='hero'
              >
                {home?.button_secondary || 'Browse Categories'}
              </Link>
            </div>
          </div>
          <div className='relative overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc]'>
            <img
              src={heroImage}
              alt='White Rose hero'
              className='h-full min-h-[360px] w-full object-cover'
              data-template-path='components.home_page.backgroundImage'
              data-template-section='branding'
              data-template-component='components.home_page.backgroundImage'
            />
            <div className='absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#0b74c6] shadow-md'>
              UPTO 60% OFF
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-[1500px] px-4 py-12 md:px-8'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-[44px] font-medium tracking-[-0.02em] text-[#2d3440] md:text-[52px]'>
            Popular Categories
          </h2>
          <div className='hidden items-center gap-2 md:flex'>
            <button
              type='button'
              className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c7ccd6] text-[#4b5563]'
            >
              <ChevronLeft className='h-5 w-5' />
            </button>
            <button
              type='button'
              className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c7ccd6] text-[#4b5563]'
            >
              <ChevronRight className='h-5 w-5' />
            </button>
          </div>
        </div>

        <div className='grid gap-7 lg:grid-cols-3'>
          {categoryCards.map((category) => (
            <article
              key={category.key}
              className='overflow-hidden border border-[#dadde5] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)]'
            >
              <Link href={category.href} className='block'>
                <div className='relative aspect-[4/5] overflow-hidden bg-[#f5f7fb]'>
                  <img
                    src={category.image}
                    alt={category.label}
                    className='h-full w-full object-cover transition duration-300 hover:scale-[1.03]'
                  />
                  <div className='absolute right-4 top-4 bg-black/75 px-3 py-2 text-right text-white'>
                    <p className='text-[16px] font-semibold leading-none'>{category.label}</p>
                    <p className='mt-1 text-[13px] font-semibold'>{category.offer}</p>
                  </div>
                </div>
                <div className='border-t border-[#e7e9ef] py-3 text-center text-[17px] font-medium text-[#2f3640]'>
                  Shop Now
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section
        className='mx-auto max-w-[1500px] px-4 pb-14 md:px-8'
        data-template-section='products'
      >
        <div className='mb-6 flex items-center justify-between gap-3'>
          <h2
            className='text-[44px] font-medium tracking-[-0.02em] text-[#2d3440] md:text-[52px]'
            data-template-path='components.home_page.products_heading'
            data-template-section='products'
          >
            {home?.products_heading || 'New Launches'}
          </h2>
          <Link
            href={vendorId ? `/template/${vendorId}/all-products` : '#'}
            className='text-[18px] font-medium text-[#0b74c6] hover:text-[#085ea0]'
          >
            View All
          </Link>
        </div>
        <p
          className='mb-6 max-w-3xl text-[16px] text-[#4b5563]'
          data-template-path='components.home_page.products_subtitle'
          data-template-section='products'
        >
          {home?.products_subtitle || 'Discover premium pieces curated for your next room refresh.'}
        </p>

        <div className='grid gap-7 md:grid-cols-2 xl:grid-cols-4'>
          {launchCards.map((product, index) => (
            <article key={`${product.title}-${index}`}>
              <Link href={product.href} className='block'>
                <div className='relative overflow-hidden border border-[#dde1ea] bg-white'>
                  <img
                    src={product.image}
                    alt={product.title}
                    className='h-[350px] w-full object-cover transition duration-300 hover:scale-[1.03]'
                  />
                  <span className='absolute left-0 top-0 bg-[#e11d48] px-4 py-2 text-[15px] font-semibold text-white'>
                    {product.discount}% OFF
                  </span>
                  <span className='absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#e11d48] shadow-sm'>
                    <Heart className='h-6 w-6' />
                  </span>
                </div>
              </Link>

              <p className='mt-4 text-[14px] font-semibold uppercase tracking-[0.08em] text-[#15803d]'>
                New Launch
              </p>
              <Link href={product.href} className='block'>
                <h3 className='mt-2 min-h-[64px] text-[30px] font-medium leading-[1.2] tracking-[-0.02em] text-[#212834]'>
                  {product.title}
                </h3>
              </Link>

              <div className='mt-2 flex items-center gap-1'>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className='h-5 w-5 fill-[#f7b600] text-[#f7b600]' />
                ))}
                <span className='ml-1 text-[17px] text-[#4b5563]'>3 reviews</span>
              </div>

              <div className='mt-2 flex items-center gap-3'>
                <span className='text-[38px] font-semibold leading-none text-[#111827]'>
                  Rs. {product.price.toLocaleString()}
                </span>
                <span className='text-[16px] text-[#6b7280] line-through'>
                  Rs. {product.oldPrice.toLocaleString()}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
