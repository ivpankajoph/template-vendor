'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import LandingPageDev from './HeroSection'
import { useTemplateVariant } from './useTemplateVariant'
import { getTemplateAuth, templateApiFetch } from './templateAuth'
import { MquiqHome } from './mquiq/MquiqHome'
import { PoupqzHome } from './poupqz/PoupqzHome'
import { OragzeHome } from './oragze/OragzeHome'
import { WhiteRoseHome } from './whiterose/WhiteRoseHome'
import { getRichTextPreview } from '@/lib/rich-text'
import { buildTemplateScopedPath } from '@/lib/template-route'
import { configuredArray, configuredText } from './template-content'

type Product = {
  _id?: string
  productName?: string
  shortDescription?: string
  productCategory?: { _id?: string; name?: string; title?: string; categoryName?: string } | string
  productCategoryName?: string
  defaultImages?: Array<{ url?: string }>
  variants?: Array<{
    _id?: string
    finalPrice?: number
    stockQuantity?: number
  }>
}

const getMinPrice = (variants: Array<{ finalPrice?: number }> = []) => {
  const values = variants
    .map((variant) => variant.finalPrice)
    .filter((value): value is number => typeof value === 'number')
  return values.length ? Math.min(...values) : 0
}

const getCategoryLabel = (product: Product) => {
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

const getCategoryId = (product: Product) => {
  if (typeof product.productCategory === 'string') {
    return /^[a-f\d]{24}$/i.test(product.productCategory)
      ? product.productCategory
      : undefined
  }
  return product.productCategory?._id
}

const toCategorySlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

export function TemplateHomeRenderer() {
  const variant = useTemplateVariant()
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as Product[]
  )
  const [addingId, setAddingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      suffix,
    })
  const homePath = toTemplatePath('')
  const allProductsPath = toTemplatePath('all-products')
  const categoryPath = toTemplatePath('category')
  const loginPath = toTemplatePath('login')

  const categoryEntries = useMemo(() => {
    const map = new Map<string, { label: string; id?: string }>()
    products.forEach((product) => {
      const label = getCategoryLabel(product)
      if (!label) return
      const id = getCategoryId(product)
      const key = id || label
      if (!map.has(key)) map.set(key, { label, id })
    })
    return Array.from(map.values())
  }, [products])

  const home = template?.components?.home_page || {}
  const heroImage = configuredText(
    home?.backgroundImage,
    configuredText(template?.previewImage)
  )
  const description = home?.description || {}
  const features = configuredArray<any>(description?.features, [])
  const faqSection = template?.components?.social_page?.faqs || {}
  const faqHeading = configuredText(
    faqSection?.heading,
    'Frequently Asked Questions'
  )
  const faqSubheading = configuredText(
    faqSection?.subheading,
    'Quick answers to common questions'
  )
  const faqItems = configuredArray<any>(faqSection?.faqs, [])
  const studioHeroKicker = configuredText(home?.hero_kicker, 'Studio collection')
  const studioHeroTitle = configuredText(home?.header_text, 'Design-forward storefronts')
  const studioHeroSubtitle = configuredText(
    home?.header_text_small,
    'High contrast, editorial layouts, bold product grids.'
  )
  const studioHeroPrimary = configuredText(home?.button_header, 'Explore')
  const studioHeroSecondary = configuredText(home?.button_secondary, 'Limited drops')
  const minimalHeroKicker = configuredText(home?.hero_kicker, 'Simple storefront')
  const minimalHeroTitle = configuredText(home?.header_text, 'Minimal, clean, product-first')
  const minimalHeroSubtitle = configuredText(
    home?.header_text_small,
    'No clutter. Just your products.'
  )
  const minimalHeroPrimary = configuredText(home?.button_header, 'Shop now')
  const minimalHeroSecondary = configuredText(home?.button_secondary, 'Fresh arrivals')
  const trendHeroKicker = configuredText(home?.hero_kicker, 'Trending now')
  const trendHeroTitle = configuredText(
    home?.header_text,
    'Shop smart. Save more. Stay in trend.'
  )
  const trendHeroSubtitle = configuredText(
    home?.header_text_small,
    'Daily drops, best prices, and fast checkout for every shopper.'
  )
  const trendHeroPrimary = configuredText(home?.button_header, 'Shop Deals')
  const trendHeroSecondary = configuredText(home?.button_secondary, 'Browse categories')
  const productsHeading = configuredText(home?.products_heading, 'Products in this store')
  const productsKicker = configuredText(home?.products_kicker, 'Catalog')
  const productsSubtitle = configuredText(
    home?.products_subtitle,
    `${products.length} products available`
  )
  const descriptionHeading = configuredText(
    description?.large_text,
    'A storefront built for modern shoppers.'
  )
  const descriptionSummary = configuredText(
    description?.summary,
    'Curate products, tell your story, and convert shoppers faster.'
  )

  const handleAddToCart = async (product: Product) => {
    setActionMessage('')
    if (!vendorId || !product?._id) return
    const auth = getTemplateAuth(vendorId)
    if (!auth) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(homePath)}`
      return
    }
    const variantId = product?.variants?.[0]?._id
    if (!variantId) {
      setActionMessage('Variant not available for this product.')
      return
    }
    setAddingId(product._id)
    try {
      await templateApiFetch(vendorId, '/cart', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product._id,
          variant_id: variantId,
          quantity: 1,
        }),
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('template-cart-updated'))
      }
      setActionMessage('Added to cart.')
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to add to cart.')
    } finally {
      setAddingId(null)
    }
  }

  if (variant.key === 'mquiq') {
    return <MquiqHome />
  }
  if (variant.key === 'poupqz') {
    return <PoupqzHome />
  }
  if (variant.key === 'oragze') {
    return <OragzeHome />
  }
  if (variant.key === 'whiterose') {
    return <WhiteRoseHome />
  }

  if (variant.key === 'studio') {
    return (
      <div className='template-home template-home-studio'>
        <section className='px-6 py-16 lg:px-12' data-template-section='hero'>
          <div className='mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]'>
            <div>
              <p
                className='text-xs uppercase tracking-[0.5em] text-slate-400'
                data-template-path='components.home_page.hero_kicker'
                data-template-section='hero'
              >
                {studioHeroKicker}
              </p>
              <h1
                className='mt-4 text-5xl font-semibold text-white'
                data-template-path='components.home_page.header_text'
                data-template-section='hero'
              >
                {studioHeroTitle}
              </h1>
              <p
                className='mt-4 text-lg text-slate-300'
                data-template-path='components.home_page.header_text_small'
                data-template-section='hero'
              >
                {studioHeroSubtitle}
              </p>
              <div className='mt-8 flex flex-wrap items-center gap-4'>
                <Link
                  href={vendorId ? allProductsPath : '#'}
                  className='rounded-none bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-slate-900'
                  data-template-path='components.home_page.button_header'
                  data-template-section='hero'
                >
                  {studioHeroPrimary}
                </Link>
                <span
                  className='text-xs uppercase tracking-[0.3em] text-slate-400'
                  data-template-path='components.home_page.button_secondary'
                  data-template-section='hero'
                >
                  {studioHeroSecondary}
                </span>
              </div>
            </div>
            <div
              className='overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70'
              data-template-section='branding'
            >
              {home.backgroundImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={home.backgroundImage}
                  alt='Studio hero'
                  className='h-full w-full object-cover'
                  data-template-path='components.home_page.backgroundImage'
                  data-template-section='branding'
                />
              ) : (
                <div className='flex h-80 items-center justify-center text-xs uppercase tracking-[0.4em] text-slate-500'>
                  Hero image
                </div>
              )}
            </div>
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-6 pb-16 lg:px-12'>
          <div className='grid gap-6 md:grid-cols-3'>
            {['Live drop', 'Fast shipping', 'Curated picks'].map((item) => (
              <div
                key={item}
                className='rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-200'
              >
                <p className='text-xs uppercase tracking-[0.3em] text-slate-400'>
                  {item}
                </p>
                <p className='mt-3 text-lg font-semibold'>Studio quality</p>
                <p className='mt-2 text-slate-400'>
                  Designed to spotlight your best products with high contrast.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-6 pb-16 lg:px-12' data-template-section='products'>
          <div className='flex items-center justify-between'>
            <h2
              className='text-2xl font-semibold text-white'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {configuredText(home?.products_heading, 'Latest products')}
            </h2>
            <Link
              href={vendorId ? allProductsPath : '#'}
              className='text-xs uppercase tracking-[0.3em] text-slate-400'
            >
              View all
            </Link>
          </div>
          {products.length > 0 ? (
            <div className='mt-6 grid gap-6 md:grid-cols-3'>
              {products.slice(0, 6).map((product: any) => (
                <Link
                  key={product?._id}
                  href={toTemplatePath(`product/${product?._id}`)}
                  className='group rounded-xl border border-slate-800 bg-slate-900/70 p-4'
                >
                  <div className='aspect-[4/3] overflow-hidden rounded-lg bg-slate-800'>
                    {product?.defaultImages?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.defaultImages[0].url}
                        alt={product.productName}
                        className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
                      />
                    ) : null}
                  </div>
                  <p className='mt-4 text-sm text-slate-400'>
                    {product?.productCategoryName || 'Collection'}
                  </p>
                  <p className='mt-1 text-lg font-semibold text-white'>
                    {product?.productName || 'Product'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className='mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center text-sm text-slate-300'>
              You do not have any products yet.
            </div>
          )}
        </section>
      </div>
    )
  }

  if (variant.key === 'minimal') {
    return (
      <div className='template-home template-home-minimal'>
        <section className='mx-auto max-w-6xl px-6 py-16' data-template-section='hero'>
          <div className='grid items-center gap-10 lg:grid-cols-[1fr_1fr]'>
            <div>
              <p
                className='text-xs uppercase tracking-[0.4em] text-slate-400'
                data-template-path='components.home_page.hero_kicker'
                data-template-section='hero'
              >
                {minimalHeroKicker}
              </p>
              <h1
                className='mt-4 text-5xl font-semibold text-slate-900'
                data-template-path='components.home_page.header_text'
                data-template-section='hero'
              >
                {minimalHeroTitle}
              </h1>
              <p
                className='mt-4 text-lg text-slate-600'
                data-template-path='components.home_page.header_text_small'
                data-template-section='hero'
              >
                {minimalHeroSubtitle}
              </p>
              <div className='mt-8 flex flex-wrap items-center gap-4'>
                <Link
                  href={vendorId ? allProductsPath : '#'}
                  className='rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white'
                  data-template-path='components.home_page.button_header'
                  data-template-section='hero'
                >
                  {minimalHeroPrimary}
                </Link>
                <span
                  className='text-sm text-slate-500'
                  data-template-path='components.home_page.button_secondary'
                  data-template-section='hero'
                >
                  {minimalHeroSecondary}
                </span>
              </div>
            </div>

            <div
              className='overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm'
              data-template-section='branding'
            >
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt='Storefront hero'
                  className='h-72 w-full object-cover sm:h-80 lg:h-[420px]'
                  data-template-path='components.home_page.backgroundImage'
                  data-template-section='branding'
                />
              ) : (
                <div className='flex h-72 items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400 sm:h-80 lg:h-[420px]'>
                  Hero image
                </div>
              )}
            </div>
          </div>
        </section>

        <section className='mx-auto max-w-6xl px-6 pb-16'>
          {products.length > 0 ? (
            <div className='grid gap-8 md:grid-cols-2'>
              {products.slice(0, 4).map((product: any) => (
                <Link
                  key={product?._id}
                  href={toTemplatePath(`product/${product?._id}`)}
                  className='rounded-3xl border border-slate-200 bg-white p-5'
                >
                  <div className='aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100'>
                    {product?.defaultImages?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.defaultImages[0].url}
                        alt={product.productName}
                        className='h-full w-full object-cover'
                      />
                    ) : null}
                  </div>
                  <p className='mt-4 text-xs uppercase tracking-[0.3em] text-slate-400'>
                    {product?.productCategoryName || 'Category'}
                  </p>
                  <p className='mt-2 text-lg font-semibold text-slate-900'>
                    {product?.productName || 'Product'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className='rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500'>
              You do not have any products yet.
            </div>
          )}
        </section>
      </div>
    )
  }

  if (variant.key === 'trend') {
    return (
      <div className='template-home template-home-trend'>
        <section
          className='mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'
          data-template-section='hero'
        >
          <div>
            <span
              className='inline-flex rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-rose-700'
              data-template-path='components.home_page.hero_kicker'
              data-template-section='hero'
            >
              {trendHeroKicker}
            </span>
            <h1
              className='mt-4 text-4xl font-bold text-slate-900 sm:text-5xl'
              data-template-path='components.home_page.header_text'
              data-template-section='hero'
            >
              {trendHeroTitle}
            </h1>
            <p
              className='mt-3 max-w-xl text-base text-slate-600 sm:text-lg'
              data-template-path='components.home_page.header_text_small'
              data-template-section='hero'
            >
              {trendHeroSubtitle}
            </p>
            <div className='mt-7 flex flex-wrap gap-3'>
              <Link
                href={vendorId ? allProductsPath : '#'}
                className='rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white'
                data-template-path='components.home_page.button_header'
                data-template-section='hero'
              >
                {trendHeroPrimary}
              </Link>
              <Link
                href={vendorId ? categoryPath : '#'}
                className='rounded-full border border-rose-200 bg-white px-6 py-3 text-sm font-semibold text-rose-600'
                data-template-path='components.home_page.button_secondary'
                data-template-section='hero'
              >
                {trendHeroSecondary}
              </Link>
            </div>
            <div className='mt-6 grid max-w-xl grid-cols-3 gap-3'>
              <div className='rounded-2xl border border-rose-100 bg-white p-3'>
                <p className='text-xs text-slate-500'>Happy buyers</p>
                <p className='text-lg font-semibold text-slate-900'>
                  {configuredText(description?.percent?.percent_in_number, '92')}%
                </p>
              </div>
              <div className='rounded-2xl border border-rose-100 bg-white p-3'>
                <p className='text-xs text-slate-500'>Products sold</p>
                <p className='text-lg font-semibold text-slate-900'>
                  {configuredText(description?.sold?.sold_number, '0')}
                </p>
              </div>
              <div className='rounded-2xl border border-rose-100 bg-white p-3'>
                <p className='text-xs text-slate-500'>Live catalog</p>
                <p className='text-lg font-semibold text-slate-900'>{products.length}</p>
              </div>
            </div>
          </div>
          <div
            className='overflow-hidden rounded-[2rem] border border-rose-100 bg-white p-3 shadow-lg shadow-rose-200/30'
            data-template-section='branding'
          >
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt='Trend hero'
                className='h-full min-h-[320px] w-full rounded-[1.5rem] object-cover'
                data-template-path='components.home_page.backgroundImage'
                data-template-section='branding'
              />
            ) : (
              <div className='flex min-h-[320px] items-center justify-center rounded-[1.5rem] bg-rose-50 text-xs uppercase tracking-[0.35em] text-rose-400'>
                Hero image
              </div>
            )}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-6 pb-10'>
          <div className='flex items-end justify-between gap-3'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-rose-500'>
                Categories
              </p>
              <h2 className='text-2xl font-bold text-slate-900'>Shop by category</h2>
            </div>
            <Link
              href={vendorId ? categoryPath : '#'}
              className='text-sm font-semibold text-rose-600'
            >
              See all
            </Link>
          </div>
          <div className='mt-4 flex flex-wrap gap-2'>
            {categoryEntries.length > 0 ? (
              categoryEntries.slice(0, 10).map((entry) => {
                const slug = entry.id || toCategorySlug(entry.label)
                return (
                  <Link
                    key={`${entry.label}-${slug}`}
                    href={toTemplatePath(`category/${slug}`)}
                    className='rounded-full border border-rose-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-600'
                  >
                    {entry.label}
                  </Link>
                )
              })
            ) : (
              <p className='text-sm text-slate-500'>No categories available yet.</p>
            )}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-6 pb-12'>
          <div className='mb-5 flex items-end justify-between gap-3'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.3em] text-rose-500'>
                Hot Picks
              </p>
              <h2 className='text-2xl font-bold text-slate-900'>
                {configuredText(home?.products_heading, 'Trending products')}
              </h2>
            </div>
            <Link
              href={vendorId ? allProductsPath : '#'}
              className='text-sm font-semibold text-rose-600'
            >
              View all
            </Link>
          </div>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {products.slice(0, 8).map((product, index) => (
              <div
                key={product._id || `${product.productName}-${index}`}
                className='group overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/35'
              >
                <Link href={product?._id ? toTemplatePath(`product/${product._id}`) : '#'}>
                  <div className='aspect-[4/5] overflow-hidden bg-rose-50'>
                    {product.defaultImages?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.defaultImages[0].url}
                        alt={product.productName || 'Product'}
                        className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-rose-300'>
                        No image
                      </div>
                    )}
                  </div>
                </Link>
                <div className='p-4'>
                  {getCategoryLabel(product) ? (
                    <span className='text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-500'>
                      {getCategoryLabel(product)}
                    </span>
                  ) : null}
                  <Link href={product?._id ? toTemplatePath(`product/${product._id}`) : '#'}>
                    <p className='mt-1 line-clamp-2 text-base font-semibold text-slate-900'>
                      {product.productName || 'Untitled Product'}
                    </p>
                  </Link>
                  <p className='mt-1 line-clamp-2 text-xs text-slate-500'>
                    {getRichTextPreview(product.shortDescription || 'No description yet.', 120)}
                  </p>
                  <div className='mt-3 flex items-center justify-between gap-2'>
                    <span className='text-lg font-bold text-slate-900'>
                      Rs. {getMinPrice(product.variants).toLocaleString()}
                    </span>
                    <button
                      type='button'
                      className='rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:from-pink-600 hover:to-rose-600 disabled:cursor-not-allowed disabled:opacity-60'
                      disabled={
                        !product?._id ||
                        addingId === product._id ||
                        (product.variants?.[0]?.stockQuantity ?? 1) <= 0
                      }
                      onClick={() => handleAddToCart(product)}
                    >
                      {(product.variants?.[0]?.stockQuantity ?? 1) <= 0
                        ? 'Out'
                        : addingId === product._id
                          ? 'Adding'
                          : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className='col-span-full rounded-2xl border border-dashed border-rose-200 bg-white p-8 text-center text-sm text-slate-500'>
                No products found for this vendor yet.
              </div>
            )}
          </div>
          {actionMessage && <p className='mt-3 text-sm text-slate-500'>{actionMessage}</p>}
        </section>

        <section className='mx-auto max-w-7xl px-6 pb-16'>
          <div className='rounded-3xl border border-rose-100 bg-white p-6'>
            <h2 className='text-2xl font-bold text-slate-900'>
              {faqHeading}
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              {configuredText(
                faqSection?.subheading,
                'Quick answers to common shopper questions'
              )}
            </p>
            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              {faqItems.slice(0, 6).map((faq: any, index: number) => (
                <div
                  key={`${faq?.question || 'faq'}-${index}`}
                  className='rounded-2xl border border-rose-100 bg-rose-50/40 p-4'
                >
                  <h3 className='text-sm font-semibold text-slate-900'>
                    {configuredText(faq?.question, 'Question')}
                  </h3>
                  <p className='mt-2 text-sm text-slate-600'>
                    {configuredText(faq?.answer, 'Answer not available.')}
                  </p>
                </div>
              ))}
              {faqItems.length === 0 && (
                <div className='rounded-2xl border border-dashed border-rose-200 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2'>
                  No FAQs added yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className='template-home template-home-classic'>
      <LandingPageDev />

      <section className='mx-auto max-w-7xl px-6 py-16'>
        <div className='grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr]'>
          <div className='space-y-4' data-template-section='description'>
            <p className='text-xs font-semibold uppercase tracking-[0.32em] text-slate-400'>
              Brand Story
            </p>
            <h2
              className='text-2xl font-semibold text-slate-900 sm:text-3xl'
              data-template-path='components.home_page.description.large_text'
              data-template-section='description'
            >
              {descriptionHeading}
            </h2>
            <p
              className='text-sm text-slate-600 sm:text-base'
              data-template-path='components.home_page.description.summary'
              data-template-section='description'
            >
              {descriptionSummary}
            </p>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
              <p className='text-xs uppercase tracking-[0.3em] text-slate-400'>Success</p>
              <p className='mt-2 text-3xl font-semibold text-slate-900'>
                {configuredText(description?.percent?.percent_in_number, '92')}
                <span className='text-lg text-slate-500'>%</span>
              </p>
              <p className='text-sm text-slate-500'>
                {configuredText(description?.percent?.percent_text, 'Satisfied buyers')}
              </p>
            </div>
            <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
              <p className='text-xs uppercase tracking-[0.3em] text-slate-400'>Sold</p>
              <p className='mt-2 text-3xl font-semibold text-slate-900'>
                {configuredText(description?.sold?.sold_number, '0')}
              </p>
              <p className='text-sm text-slate-500'>
                {configuredText(description?.sold?.sold_text, 'Products shipped')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {features.length > 0 && (
        <section className='mx-auto max-w-7xl px-6 pb-16'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {features.slice(0, 8).map((feature: any, index: number) => (
              <div
                key={`${feature?.title || 'feature'}-${index}`}
                className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
              >
                <p className='text-lg font-semibold text-slate-900'>
                  {configuredText(feature?.title, 'Feature')}
                </p>
                <p className='mt-2 text-sm text-slate-600'>
                  {configuredText(
                    feature?.description,
                    'Add feature details from template editor.'
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className='mx-auto max-w-7xl px-6 pb-16' data-template-section='products'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <p
              className='text-xs font-semibold uppercase tracking-[0.32em] text-slate-400'
              data-template-path='components.home_page.products_kicker'
              data-template-section='products'
            >
              {productsKicker}
            </p>
            <h3
              className='text-2xl font-semibold text-slate-900'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {productsHeading}
            </h3>
          </div>
          <p
            className='text-sm text-slate-500'
            data-template-path='components.home_page.products_subtitle'
            data-template-section='products'
          >
            {productsSubtitle}
          </p>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          <Link
            href={allProductsPath}
            className='rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900'
          >
            All products
          </Link>
          {categoryEntries.map((entry) => {
            const slug = entry.id || toCategorySlug(entry.label)
            return (
              <Link
                key={`${entry.label}-${slug}`}
                href={toTemplatePath(`category/${slug}`)}
                className='rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900'
              >
                {entry.label}
              </Link>
            )
          })}
        </div>

        <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {products.slice(0, 9).map((product, index) => (
            <div
              key={product._id || `${product.productName}-${index}`}
              className='group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg'
            >
              <Link href={product?._id ? toTemplatePath(`product/${product._id}`) : '#'}>
                <div className='aspect-[4/3] overflow-hidden bg-slate-100'>
                  {product.defaultImages?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.defaultImages[0].url}
                      alt={product.productName || 'Product'}
                      className='h-full w-full object-cover transition duration-500 group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-slate-400'>
                      No Image
                    </div>
                  )}
                </div>
              </Link>

              <div className='space-y-2 p-4'>
                {getCategoryLabel(product) ? (
                  <span className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'>
                    {getCategoryLabel(product)}
                  </span>
                ) : null}
                <Link href={product?._id ? toTemplatePath(`product/${product._id}`) : '#'}>
                  <p className='text-sm font-semibold text-slate-900'>
                    {product.productName || 'Untitled Product'}
                  </p>
                </Link>
                <p className='line-clamp-2 text-xs text-slate-500'>
                  {getRichTextPreview(product.shortDescription || 'No description yet.', 120)}
                </p>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-sm font-semibold text-slate-900'>
                    Rs. {getMinPrice(product.variants).toLocaleString()}
                  </span>
                  <button
                    type='button'
                    className='rounded-full border border-slate-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60'
                    disabled={
                      !product?._id ||
                      addingId === product._id ||
                      (product.variants?.[0]?.stockQuantity ?? 1) <= 0
                    }
                    onClick={() => handleAddToCart(product)}
                  >
                    {(product.variants?.[0]?.stockQuantity ?? 1) <= 0
                      ? 'Out'
                      : addingId === product._id
                        ? 'Adding'
                        : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className='col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500'>
              No products found for this vendor yet.
            </div>
          )}
        </div>
        {actionMessage && <p className='mt-3 text-sm text-slate-500'>{actionMessage}</p>}
      </section>

      <section className='mx-auto max-w-7xl px-6 pb-16' data-template-section='description'>
        <h2
          className='text-3xl font-semibold text-slate-900'
          data-template-path='components.social_page.faqs.heading'
          data-template-section='description'
        >
          {faqHeading}
        </h2>
        <p
          className='mt-2 text-sm text-slate-600'
          data-template-path='components.social_page.faqs.subheading'
          data-template-section='description'
        >
          {faqSubheading}
        </p>

        <div className='mt-6 grid gap-4 md:grid-cols-2'>
          {faqItems.slice(0, 8).map((faq: any, index: number) => (
            <div
              key={`${faq?.question || 'faq'}-${index}`}
              className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
            >
              <h3 className='text-base font-semibold text-slate-900'>
                {configuredText(faq?.question, 'Question')}
              </h3>
              <p className='mt-2 text-sm text-slate-600'>
                {configuredText(faq?.answer, 'Answer not available.')}
              </p>
            </div>
          ))}
          {faqItems.length === 0 && (
            <div className='rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2'>
              No FAQs added yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
