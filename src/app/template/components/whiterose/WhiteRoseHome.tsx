'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { ArrowRight, Flame, ShieldCheck, Sparkles, Star, TrendingUp } from 'lucide-react'

import { getTemplateAuth, templateApiFetch } from '../templateAuth'
import { buildTemplateScopedPath } from '@/lib/template-route'
import { trackAddToCart } from '@/lib/analytics-events'
import { toastError, toastSuccess } from '@/lib/toast'

import { WhiteRoseProductCard } from './WhiteRoseProductCard'
import {
  type WhiteRoseProduct,
  toWhiteRoseSlug,
  whiteRoseGetCategoryDetails,
  whiteRoseGetLeadImage,
  whiteRoseGetPricing,
  whiteRoseGetRating,
} from './whiterose-utils'

type CategoryCard = {
  key: string
  label: string
  image: string
  href: string
  count: number
  caption: string
}

type ProductRailConfig = {
  kickerPath: string
  headingPath: string
  subtitlePath: string
  kicker: string
  heading: string
  subtitle: string
  products: WhiteRoseProduct[]
  badgePrefix: string
}

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1800&q=80'
const CATEGORY_FALLBACKS = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1585386959984-a41552231658?auto=format&fit=crop&w=1200&q=80',
]
const HIGHLIGHT_ICONS = [ShieldCheck, Sparkles, TrendingUp, Star]

const dedupeProducts = (items: WhiteRoseProduct[]) => {
  const seen = new Set<string>()
  return items.filter((product, index) => {
    const key = String(product?._id || product?.productName || index)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const scoreTrending = (product: WhiteRoseProduct) => {
  const pricing = whiteRoseGetPricing(product)
  return pricing.discountPercent * 100 + whiteRoseGetRating(product) * 25 + Number(product?.ratingsCount || 0)
}

const scoreWeeklyTop = (product: WhiteRoseProduct) => {
  const pricing = whiteRoseGetPricing(product)
  const stockBonus = pricing.stockQuantity > 0 ? 60 : -200
  return whiteRoseGetRating(product) * 40 + Number(product?.ratingsCount || 0) * 1.3 + pricing.finalPrice / 1000 + stockBonus
}

const scoreTopRated = (product: WhiteRoseProduct) => {
  return whiteRoseGetRating(product) * 100 + Number(product?.ratingsCount || 0)
}

export function WhiteRoseHome() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as WhiteRoseProduct[]
  )

  const [addingById, setAddingById] = useState<Record<string, boolean>>({})

  const home = template?.components?.home_page || {}
  const description = home?.description || {}
  const benefits = home?.benefits || {}
  const advantage = home?.advantage || {}

  const heroImage = home?.backgroundImage || whiteRoseGetLeadImage(products?.[0]) || HERO_FALLBACK
  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })
  const homePath = toTemplatePath('')
  const allProductsPath = toTemplatePath('all-products')
  const categoryPath = toTemplatePath('category')

  const categoryCards = useMemo<CategoryCard[]>(() => {
    const map = new Map<string, CategoryCard>()
    products.forEach((product) => {
      const category = whiteRoseGetCategoryDetails(product)
      if (!category.label) return
      const slug = category.id || toWhiteRoseSlug(category.label)
      const href = toTemplatePath(`category/${slug}`)
      const current = map.get(href)
      if (current) {
        current.count += 1
        return
      }
      const index = map.size % CATEGORY_FALLBACKS.length
      map.set(href, {
        key: href,
        label: category.label,
        image:
          (typeof product?.defaultImages?.[0] === 'object' && product.defaultImages[0]?.url) ||
          CATEGORY_FALLBACKS[index],
        href,
        count: 1,
        caption: index % 2 === 0 ? 'Hot right now' : 'Shop best picks',
      })
    })
    return Array.from(map.values()).slice(0, 6)
  }, [pathname, products, vendorId])

  const benefitCards =
    Array.isArray(benefits?.cards) && benefits.cards.length > 0
      ? benefits.cards.slice(0, 4)
      : [
          {
            title: 'Secure checkout',
            description: 'Trusted order flow with the existing backend logic.',
          },
          {
            title: 'Fast category browsing',
            description: 'Move buyers from search to cart with fewer dead ends.',
          },
          {
            title: 'Fresh weekly picks',
            description: 'Push current offers and high-intent products up front.',
          },
          {
            title: 'Dashboard controlled',
            description: 'Keep visible copy editable without touching backend flows.',
          },
        ]

  const trendingProducts = useMemo(
    () =>
      dedupeProducts(
        [...products].sort((left, right) => scoreTrending(right) - scoreTrending(left))
      ).slice(0, 4),
    [products]
  )

  const weeklyTopProducts = useMemo(
    () =>
      dedupeProducts(
        [...products].sort((left, right) => scoreWeeklyTop(right) - scoreWeeklyTop(left))
      ).slice(0, 4),
    [products]
  )

  const topRatedProducts = useMemo(
    () =>
      dedupeProducts(
        [...products].sort((left, right) => scoreTopRated(right) - scoreTopRated(left))
      ).slice(0, 4),
    [products]
  )

  const heroProducts = weeklyTopProducts.slice(0, 3)
  const topRatingValue = products.length
    ? Math.max(...products.map((product) => whiteRoseGetRating(product, 4.2)))
    : 4.8

  const heroStats = [
    {
      value: description?.percent?.percent_in_number || '98%',
      label: description?.percent?.percent_text || 'Buyer trust',
      path: 'components.home_page.description.percent.percent_in_number',
    },
    {
      value: description?.sold?.sold_number || `${products.length}+`,
      label: description?.sold?.sold_text || 'Products live',
      path: 'components.home_page.description.sold.sold_number',
    },
    {
      value: `${topRatingValue.toFixed(1)}/5`,
      label: home?.badge_text || 'Top rated picks',
      path: 'components.home_page.badge_text',
    },
  ]

  const productRails: ProductRailConfig[] = [
    {
      kickerPath: 'components.home_page.products_kicker',
      headingPath: 'components.home_page.products_heading',
      subtitlePath: 'components.home_page.products_subtitle',
      kicker: home?.products_kicker || 'Trending products',
      heading: home?.products_heading || 'Trending products shoppers are opening first',
      subtitle:
        home?.products_subtitle ||
        'Show discount-led products up front so the storefront feels active from the first screen.',
      products: trendingProducts,
      badgePrefix: 'Trending',
    },
    {
      kickerPath: 'components.home_page.benefits.kicker',
      headingPath: 'components.home_page.benefits.heading',
      subtitlePath: 'components.home_page.benefits.subtitle',
      kicker: benefits?.kicker || 'Weekly top',
      heading: benefits?.heading || 'Weekly top picks for fast-moving demand',
      subtitle:
        benefits?.subtitle ||
        'Use this rail for products that need the highest visibility this week.',
      products: weeklyTopProducts,
      badgePrefix: 'Weekly top',
    },
    {
      kickerPath: 'components.home_page.advantage.kicker',
      headingPath: 'components.home_page.advantage.heading',
      subtitlePath: 'components.home_page.advantage.subtitle',
      kicker: advantage?.kicker || 'Top rated',
      heading: advantage?.heading || 'Top rated products with strong shopper trust',
      subtitle:
        advantage?.subtitle ||
        'Keep the highest-rated items visible to reduce hesitation and improve conversion.',
      products: topRatedProducts,
      badgePrefix: 'Top rated',
    },
  ]

  const addToCart = async (product: WhiteRoseProduct) => {
    if (!vendorId || !product?._id) return

    const auth = getTemplateAuth(vendorId)
    if (!auth) {
      const loginPath = buildTemplateScopedPath({
        vendorId,
        pathname: pathname || '/',
        suffix: 'login',
      })
      window.location.href = `${loginPath}?next=${encodeURIComponent(homePath)}`
      return
    }

    const pricing = whiteRoseGetPricing(product)
    if (!pricing.variantId) {
      toastError('Variant not available for this product')
      return
    }
    if (pricing.stockQuantity <= 0) {
      toastError('This product is out of stock')
      return
    }

    setAddingById((prev) => ({ ...prev, [product._id as string]: true }))
    try {
      await templateApiFetch(vendorId, '/cart', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product._id,
          variant_id: pricing.variantId,
          quantity: 1,
        }),
      })
      trackAddToCart({
        vendorId,
        userId: auth?.user?.id,
        productId: product._id,
        productName: product?.productName,
        productPrice: pricing.finalPrice,
        quantity: 1,
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('template-cart-updated'))
      }
      toastSuccess('Added to cart')
    } catch (error: any) {
      toastError(error?.message || 'Failed to add to cart')
    } finally {
      setAddingById((prev) => ({ ...prev, [product._id as string]: false }))
    }
  }

  return (
    <div className='template-home template-home-whiterose bg-[#f1f3f6] text-[#172337]'>
      <section className='mx-auto max-w-[1500px] px-4 py-6 md:px-8'>
        <div className='overflow-hidden rounded-[30px] border border-[#dfe3eb] bg-gradient-to-r from-[#e9f2ff] via-white to-[#fff4d9] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:p-8'>
          <div className='grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center'>
            <div className='space-y-6' data-template-section='hero'>
              <div className='flex flex-wrap items-center gap-2'>
                <span
                  className='rounded-full bg-[#2874f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white'
                  data-template-path='components.home_page.hero_kicker'
                  data-template-section='hero'
                >
                  {home?.hero_kicker || 'Daily ecommerce deals'}
                </span>
                <span
                  className='rounded-full bg-[#172337] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white'
                  data-template-path='components.home_page.badge_text'
                  data-template-section='hero'
                >
                  {home?.badge_text || 'New offers every day'}
                </span>
              </div>

              <div className='space-y-4'>
                <h1
                  className='max-w-[640px] text-[38px] font-bold leading-[1.02] tracking-[-0.04em] text-[#172337] sm:text-[50px] lg:text-[58px]'
                  data-template-path='components.home_page.header_text'
                  data-template-section='hero'
                >
                  {home?.header_text || 'A marketplace home built around real product discovery'}
                </h1>
                <p
                  className='max-w-[620px] text-[15px] leading-7 text-[#42526b] sm:text-[17px]'
                  data-template-path='components.home_page.header_text_small'
                  data-template-section='hero'
                >
                  {home?.header_text_small ||
                    'Lead with categories, trending products, weekly top picks, and top rated items so the storefront feels like a live B2C catalog.'}
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-3'>
                <Link
                  href={vendorId ? allProductsPath : '#'}
                  className='inline-flex items-center gap-2 rounded-xl bg-[#ff9f00] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#f08b00]'
                  data-template-path='components.home_page.button_header'
                  data-template-section='hero'
                >
                  {home?.button_header || 'Shop now'}
                  <ArrowRight className='h-4 w-4' />
                </Link>
                <Link
                  href={vendorId ? categoryPath : '#'}
                  className='rounded-xl border border-[#c8d4ea] bg-white px-6 py-3 text-sm font-semibold text-[#172337] transition hover:border-[#2874f0] hover:text-[#2874f0]'
                  data-template-path='components.home_page.button_secondary'
                  data-template-section='hero'
                >
                  {home?.button_secondary || 'Browse departments'}
                </Link>
              </div>

              <div className='grid gap-3 sm:grid-cols-3'>
                {heroStats.map((item) => (
                  <div key={item.label} className='rounded-2xl border border-white/70 bg-white/80 p-4'>
                    <p
                      className='text-2xl font-bold text-[#172337]'
                      data-template-path={item.path}
                      data-template-section='description'
                    >
                      {item.value}
                    </p>
                    <p className='mt-1 text-xs font-medium uppercase tracking-[0.16em] text-[#5f6c7b]'>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                {benefitCards.map((item: any, index: number) => {
                  const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length]
                  return (
                    <div
                      key={`${item?.title || 'highlight'}-${index}`}
                      className='rounded-[22px] border border-[#dfe3eb] bg-white/85 p-4'
                    >
                      <div className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e7f0ff] text-[#2874f0]'>
                        <Icon className='h-4 w-4' />
                      </div>
                      <h2
                        className='mt-3 text-sm font-semibold text-[#172337]'
                        data-template-path={`components.home_page.benefits.cards.${index}.title`}
                        data-template-section='description'
                      >
                        {item?.title || 'Highlight'}
                      </h2>
                      <p
                        className='mt-1 text-xs leading-5 text-[#5f6c7b]'
                        data-template-path={`components.home_page.benefits.cards.${index}.description`}
                        data-template-section='description'
                      >
                        {item?.description || 'Highlight description'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className='grid gap-4'>
              <div className='relative overflow-hidden rounded-[26px] border border-white/80 bg-white/85 p-3 shadow-[0_20px_35px_rgba(15,23,42,0.08)]'>
                <img
                  src={heroImage}
                  alt='White Rose hero'
                  className='h-full min-h-[340px] w-full rounded-[22px] object-cover'
                  data-template-path='components.home_page.backgroundImage'
                  data-template-section='branding'
                  data-template-component='components.home_page.backgroundImage'
                />
                <div className='absolute inset-x-7 bottom-7 rounded-[22px] bg-white/92 p-5 shadow-lg backdrop-blur'>
                  <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2874f0]'>
                    Merchandising focus
                  </p>
                  <h2
                    className='mt-2 text-xl font-semibold text-[#172337]'
                    data-template-path='components.home_page.description.large_text'
                    data-template-section='description'
                  >
                    {description?.large_text || 'Trending deals, weekly tops, and trusted bestsellers'}
                  </h2>
                  <p
                    className='mt-2 text-sm leading-6 text-[#5f6c7b]'
                    data-template-path='components.home_page.description.summary'
                    data-template-section='description'
                  >
                    {description?.summary ||
                      'Keep the first screen focused on buying signals instead of brochure content.'}
                  </p>
                </div>
              </div>

              <div className='rounded-[26px] bg-[#172337] p-5 text-white shadow-[0_20px_35px_rgba(15,23,42,0.12)]'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9ec2ff]'>
                      Weekly top
                    </p>
                    <h2 className='mt-2 text-xl font-semibold'>Products moving fastest this week</h2>
                  </div>
                  <Flame className='h-6 w-6 text-[#ffb74d]' />
                </div>

                <div className='mt-4 grid gap-3'>
                  {heroProducts.length > 0 ? (
                    heroProducts.map((product, index) => {
                      const pricing = whiteRoseGetPricing(product)
                      return (
                        <Link
                          key={product?._id || `${product?.productName || 'hero-product'}-${index}`}
                          href={
                            vendorId && product?._id
                              ? toTemplatePath(`product/${product._id}`)
                              : allProductsPath
                          }
                          className='flex items-center justify-between gap-3 rounded-[18px] bg-white/10 px-4 py-3 transition hover:bg-white/15'
                        >
                          <div className='min-w-0'>
                            <p className='line-clamp-1 text-sm font-semibold text-white'>
                              {product?.productName || 'Top product'}
                            </p>
                            <p className='mt-1 text-xs text-[#dbeafe]'>
                              {whiteRoseGetCategoryDetails(product).label || 'Popular category'}
                            </p>
                          </div>
                          <div className='shrink-0 text-right'>
                            <p className='text-sm font-semibold text-white'>
                              Rs. {Number(pricing.finalPrice || pricing.actualPrice || 0).toLocaleString('en-IN')}
                            </p>
                            <p className='text-xs text-[#9ec2ff]'>{whiteRoseGetRating(product).toFixed(1)} rating</p>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <div className='rounded-[18px] bg-white/10 px-4 py-4 text-sm text-[#dbeafe]'>
                      Add products to populate this weekly rail.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-[1500px] px-4 pb-6 md:px-8'>
        <div className='rounded-[28px] border border-[#dfe3eb] bg-white p-6 shadow-[0_12px_26px_rgba(15,23,42,0.05)]'>
          <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2874f0]'>
                Shop by department
              </p>
              <h2 className='mt-2 text-[30px] font-bold tracking-[-0.03em] text-[#172337]'>
                Browse popular categories
              </h2>
            </div>
            <Link
              href={vendorId ? categoryPath : '#'}
              className='text-sm font-semibold text-[#2874f0] transition hover:text-[#174ea6]'
            >
              See all categories
            </Link>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {categoryCards.length > 0 ? (
              categoryCards.map((category) => (
                <Link
                  key={category.key}
                  href={category.href}
                  className='group overflow-hidden rounded-[24px] border border-[#e6ebf2] bg-[#f8fafc] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(40,116,240,0.12)]'
                >
                  <div className='relative h-48 overflow-hidden'>
                    <img
                      src={category.image}
                      alt={category.label}
                      className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-[#172337]/80 via-transparent to-transparent' />
                    <div className='absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2874f0]'>
                      {category.caption}
                    </div>
                    <div className='absolute bottom-4 left-4 right-4 text-white'>
                      <p className='text-xl font-semibold'>{category.label}</p>
                      <p className='text-sm text-white/80'>{category.count} live products</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className='rounded-[24px] border border-dashed border-[#c8d4ea] bg-[#f8fafc] p-6 text-sm text-[#5f6c7b] xl:col-span-3'>
                Categories appear here once products with categories are available.
              </div>
            )}
          </div>
        </div>
      </section>

      {productRails.map((rail, railIndex) => (
        <section
          key={rail.headingPath}
          className='mx-auto max-w-[1500px] px-4 pb-6 md:px-8'
          data-template-section='products'
        >
          <div className='rounded-[28px] border border-[#dfe3eb] bg-white p-6 shadow-[0_12px_26px_rgba(15,23,42,0.05)]'>
            <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <p
                  className='text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2874f0]'
                  data-template-path={rail.kickerPath}
                  data-template-section='products'
                >
                  {rail.kicker}
                </p>
                <h2
                  className='mt-2 text-[30px] font-bold tracking-[-0.03em] text-[#172337]'
                  data-template-path={rail.headingPath}
                  data-template-section='products'
                >
                  {rail.heading}
                </h2>
              </div>
              <div className='flex flex-col items-start gap-3 sm:items-end'>
                <p
                  className='max-w-[520px] text-sm leading-7 text-[#5f6c7b] sm:text-right'
                  data-template-path={rail.subtitlePath}
                  data-template-section='products'
                >
                  {rail.subtitle}
                </p>
                {railIndex === 2 ? (
                  <Link
                    href={vendorId ? allProductsPath : '#'}
                    className='inline-flex items-center gap-2 rounded-xl bg-[#2874f0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#174ea6]'
                    data-template-path='components.home_page.advantage.ctaLabel'
                    data-template-section='products'
                  >
                    {advantage?.ctaLabel || 'View full catalog'}
                    <ArrowRight className='h-4 w-4' />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
              {rail.products.length > 0 ? (
                rail.products.map((product, index) => {
                  const category = whiteRoseGetCategoryDetails(product)
                  return (
                    <WhiteRoseProductCard
                      key={product?._id || `${product?.productName || 'product'}-${index}-${railIndex}`}
                      product={product}
                      href={
                        vendorId && product?._id
                          ? toTemplatePath(`product/${product._id}`)
                          : allProductsPath
                      }
                      categoryLabel={category.label || 'Top category'}
                      badgeLabel={`${rail.badgePrefix} ${index + 1}`}
                      onAddToCart={product?._id ? () => addToCart(product) : undefined}
                      isAdding={Boolean(product?._id && addingById[product._id])}
                    />
                  )
                })
              ) : (
                <div className='rounded-[22px] border border-dashed border-[#c8d4ea] bg-[#f8fafc] p-6 text-sm text-[#5f6c7b] xl:col-span-4'>
                  Add products to populate this merchandising rail.
                </div>
              )}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
