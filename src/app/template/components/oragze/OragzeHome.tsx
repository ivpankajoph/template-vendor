'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Leaf,
  RefreshCcw,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react'

type TemplateProduct = {
  _id?: string
  productName?: string
  shortDescription?: string
  defaultImages?: Array<{ url?: string }>
  variants?: Array<{ finalPrice?: number }>
}

type FaqItem = {
  question: string
  answer: string
}

type ProductCard = {
  _id: string
  title: string
  image: string
  price: number
  oldPrice: number
  rating: number
  reviews: number
}

const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1800&q=80'
const FALLBACK_PROMO_IMAGES = [
  'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1800&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=1600&q=80',
]
const FALLBACK_BANNER_IMAGE =
  'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=1800&q=80'

const FALLBACK_PRODUCTS: ProductCard[] = [
  {
    _id: '',
    title: 'Greek Style Plain Yogurt',
    image:
      'https://images.unsplash.com/photo-1571212515416-fca88d63f89c?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    rating: 4.5,
    reviews: 222,
  },
  {
    _id: '',
    title: 'Pure Squeezed No Pulp Orange Juice',
    image:
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    rating: 4.5,
    reviews: 222,
  },
  {
    _id: '',
    title: 'Fresh Oranges',
    image:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    rating: 4.5,
    reviews: 222,
  },
  {
    _id: '',
    title: 'Gourmet Dark Chocolate Bars',
    image:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    rating: 4.5,
    reviews: 222,
  },
]

const FALLBACK_FAQS: FaqItem[] = [
  {
    question: 'Do you offer organic products only?',
    answer:
      'Yes. This storefront is focused on fresh and organic-first categories with curated quality checks.',
  },
  {
    question: 'How fast is delivery for regular orders?',
    answer:
      'Delivery time depends on your location, but most local orders are processed and dispatched quickly.',
  },
  {
    question: 'Can I track my order after checkout?',
    answer:
      'Yes, you can track every order from your account and orders page once the shipment is created.',
  },
]

const getMinPrice = (variants: Array<{ finalPrice?: number }> = []) => {
  const values = variants
    .map((variant) => variant?.finalPrice)
    .filter((value): value is number => typeof value === 'number')
  return values.length ? Math.min(...values) : 18
}

export function OragzeHome() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  const home = template?.components?.home_page || {}
  const faqSection = template?.components?.social_page?.faqs || {}
  const heroTitle = home?.header_text || 'Organic Foods at your Doorsteps'
  const heroSubtitle =
    home?.header_text_small || 'Dignissim massa diam elementum. Trusted freshness, delivered daily.'
  const heroButtonPrimary = home?.button_header || 'START SHOPPING'
  const heroButtonSecondary = home?.button_secondary || 'JOIN NOW'
  const productsHeading = home?.products_heading || 'Featured products'
  const productsSubtitle =
    home?.products_subtitle || 'Shop curated organic picks and seasonal essentials.'
  const faqHeading = faqSection?.heading || 'Frequently Asked Questions'
  const faqSubheading = faqSection?.subheading || ''
  const heroImage = home?.backgroundImage || FALLBACK_HERO_IMAGE

  const featuredProducts = useMemo(() => {
    const mapped = products.slice(0, 4).map((product, index) => {
      const price = getMinPrice(product?.variants || [])
      const oldPrice = Math.max(price + Math.round(price * 0.3), price + 6)
      return {
        _id: String(product?._id || ''),
        title: product?.productName || FALLBACK_PRODUCTS[index]?.title || `Product ${index + 1}`,
        image:
          product?.defaultImages?.[0]?.url ||
          FALLBACK_PRODUCTS[index % FALLBACK_PRODUCTS.length].image,
        price,
        oldPrice,
        rating: 4.5,
        reviews: 222,
      } satisfies ProductCard
    })

    while (mapped.length < 4) {
      mapped.push(FALLBACK_PRODUCTS[mapped.length])
    }

    return mapped
  }, [products])

  const faqItems = useMemo<FaqItem[]>(() => {
    const rawFaqs = Array.isArray(faqSection?.faqs) ? faqSection.faqs : []
    if (!rawFaqs.length) return FALLBACK_FAQS
    return rawFaqs.slice(0, 5).map((faq: any) => ({
      question: faq?.question || 'Question',
      answer: faq?.answer || 'Answer not available.',
    }))
  }, [faqSection?.faqs])

  return (
    <div className='template-home template-home-oragze bg-[#f1f2ef] text-[#1f2937]'>
      <section
        id='home'
        className='relative overflow-hidden bg-[#f7d86a]'
        data-template-section='hero'
      >
        <div className='mx-auto max-w-[1320px] px-4 pb-0 pt-10 md:px-8 lg:pt-12'>
          <div className='grid items-end gap-8 lg:grid-cols-[1.05fr_0.95fr]'>
            <div>
              <h1
                className='max-w-2xl text-[42px] font-semibold leading-[0.98] tracking-[-0.04em] text-[#172033] md:text-[62px] xl:text-[82px]'
                data-template-path='components.home_page.header_text'
                data-template-section='hero'
              >
                {heroTitle}
              </h1>
              <p
                className='mt-5 max-w-xl text-[18px] leading-[1.3] tracking-[-0.01em] text-[#5a6474] md:text-[22px]'
                data-template-path='components.home_page.header_text_small'
                data-template-section='hero'
              >
                {heroSubtitle}
              </p>
              <div className='mt-8 flex flex-wrap items-center gap-4'>
                <Link
                  href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                  className='rounded-full bg-[#69b64a] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#5aa13f] md:px-8 md:py-4 md:text-[18px]'
                  data-template-path='components.home_page.button_header'
                  data-template-section='hero'
                >
                  {heroButtonPrimary}
                </Link>
                <Link
                  href={vendorId ? `/template/${vendorId}/register` : '#'}
                  className='rounded-full bg-[#1c2738] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#101828] md:px-8 md:py-4 md:text-[18px]'
                  data-template-path='components.home_page.button_secondary'
                  data-template-section='hero'
                >
                  {heroButtonSecondary}
                </Link>
              </div>
            </div>

            <div
              className='relative overflow-hidden rounded-[14px]'
              data-template-section='branding'
            >
              <img
                src={heroImage}
                alt={heroTitle}
                className='h-full min-h-[420px] w-full object-cover md:min-h-[520px]'
                data-template-path='components.home_page.backgroundImage'
                data-template-section='branding'
              />
            </div>
          </div>

          <div className='mt-12 grid gap-6 md:grid-cols-3'>
            <div>
              <p className='text-[46px] font-extrabold leading-none tracking-[-0.03em] text-[#1d2738] md:text-[72px]'>
                14k+
              </p>
              <p className='mt-2 text-[22px] font-semibold leading-[1.04] tracking-[-0.02em] text-[#1d2738] md:text-[32px]'>
                PRODUCT
                <br />
                VARIETIES
              </p>
            </div>
            <div>
              <p className='text-[46px] font-extrabold leading-none tracking-[-0.03em] text-[#1d2738] md:text-[72px]'>
                50k+
              </p>
              <p className='mt-2 text-[22px] font-semibold leading-[1.04] tracking-[-0.02em] text-[#1d2738] md:text-[32px]'>
                HAPPY
                <br />
                CUSTOMERS
              </p>
            </div>
            <div>
              <p className='text-[46px] font-extrabold leading-none tracking-[-0.03em] text-[#1d2738] md:text-[72px]'>
                10+
              </p>
              <p className='mt-2 text-[22px] font-semibold leading-[1.04] tracking-[-0.02em] text-[#1d2738] md:text-[32px]'>
                STORE LOCATIONS
              </p>
            </div>
          </div>

          <div className='mt-10 grid overflow-hidden rounded-t-lg md:grid-cols-3'>
            <article className='bg-[#69b64a] px-8 py-7 text-white'>
              <RefreshCcw className='h-12 w-12' />
              <h3 className='mt-5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[30px]'>
                Fresh from farm
              </h3>
              <p className='mt-3 text-[16px] leading-[1.45] text-white/95 md:text-[20px]'>
                Sourced daily from trusted growers for better nutrition and taste.
              </p>
            </article>
            <article className='bg-[#2f3c1f] px-8 py-7 text-white'>
              <Leaf className='h-12 w-12' />
              <h3 className='mt-5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[30px]'>
                100% Organic
              </h3>
              <p className='mt-3 text-[16px] leading-[1.45] text-white/95 md:text-[20px]'>
                Curated product range that aligns with natural and clean-label choices.
              </p>
            </article>
            <article className='bg-[#ff6a00] px-8 py-7 text-white'>
              <Truck className='h-12 w-12' />
              <h3 className='mt-5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[30px]'>
                Free delivery
              </h3>
              <p className='mt-3 text-[16px] leading-[1.45] text-white/95 md:text-[20px]'>
                Quick dispatch and doorstep delivery for smooth and reliable shopping.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className='bg-[#f1f2ef] py-14 md:py-16'>
        <div className='mx-auto grid max-w-[1320px] gap-7 px-4 md:px-8 lg:grid-cols-[1.4fr_1fr]'>
          <article className='relative overflow-hidden rounded-sm'>
            <img
              src={FALLBACK_PROMO_IMAGES[0]}
              alt='Items on sale'
              className='h-full min-h-[560px] w-full object-cover'
            />
            <div className='absolute inset-0 bg-black/25' />
            <div className='absolute left-8 top-1/2 -translate-y-1/2'>
              <h3 className='text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-white md:text-[48px]'>
                Items on SALE
              </h3>
              <p className='mt-3 text-[20px] leading-[1.2] text-white md:text-[30px]'>
                Discounts up to 30%
              </p>
              <Link
                href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                className='mt-8 inline-flex border-b border-white text-[18px] font-semibold tracking-[0.04em] text-white md:text-[24px]'
              >
                SHOP NOW
              </Link>
            </div>
          </article>

          <div className='grid gap-7'>
            <article className='relative overflow-hidden rounded-sm'>
              <img
                src={FALLBACK_PROMO_IMAGES[1]}
                alt='Combo offers'
                className='h-full min-h-[265px] w-full object-cover'
              />
              <div className='absolute inset-0 bg-[#0b74c6]/22' />
              <div className='absolute left-8 top-10'>
                <h3 className='text-[30px] font-semibold leading-[1.02] tracking-[-0.02em] text-white md:text-[40px]'>
                  Combo offers.
                </h3>
                <p className='mt-3 text-[20px] leading-[1.2] text-white md:text-[28px]'>
                  Discounts up to 50%
                </p>
                <Link
                  href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                  className='mt-7 inline-flex border-b border-white text-[18px] font-semibold tracking-[0.04em] text-white md:text-[24px]'
                >
                  SHOP NOW
                </Link>
              </div>
            </article>

            <article className='relative overflow-hidden rounded-sm'>
              <img
                src={FALLBACK_PROMO_IMAGES[2]}
                alt='Discount coupons'
                className='h-full min-h-[265px] w-full object-cover'
              />
              <div className='absolute inset-0 bg-[#1f746f]/26' />
              <div className='absolute left-8 top-10'>
                <h3 className='text-[30px] font-semibold leading-[1.02] tracking-[-0.02em] text-white md:text-[40px]'>
                  Discount Coupons
                </h3>
                <p className='mt-3 text-[20px] leading-[1.2] text-white md:text-[28px]'>
                  Discounts up to 40%
                </p>
                <Link
                  href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                  className='mt-7 inline-flex border-b border-white text-[18px] font-semibold tracking-[0.04em] text-white md:text-[24px]'
                >
                  SHOP NOW
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section
        id='products'
        className='bg-[#f1f2ef] py-12 md:py-14'
        data-template-section='products'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='mb-10 flex items-center justify-between'>
            <h2
              className='text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#172033] md:text-[42px]'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {productsHeading}
            </h2>
            <div className='flex items-center gap-3'>
              <Link
                href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                className='rounded-lg bg-[#69b64a] px-4 py-2 text-[16px] font-semibold text-white transition hover:bg-[#5aa13f] md:px-6 md:py-3 md:text-[20px]'
              >
                View All
              </Link>
              <button
                type='button'
                className='inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#e5e7e3] text-slate-500 md:h-14 md:w-14'
              >
                <ChevronLeft className='h-8 w-8' />
              </button>
              <button
                type='button'
                className='inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#f3f4f2] text-[#172033] md:h-14 md:w-14'
              >
                <ChevronRight className='h-8 w-8' />
              </button>
            </div>
          </div>
          <p
            className='mb-8 max-w-2xl text-sm text-slate-600 md:text-base'
            data-template-path='components.home_page.products_subtitle'
            data-template-section='products'
          >
            {productsSubtitle}
          </p>

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            {featuredProducts.map((product, index) => (
              <article key={`${product.title}-${index}`}>
                <Link
                  href={
                    product._id
                      ? `/template/${vendorId}/product/${product._id}`
                      : vendorId
                        ? `/template/${vendorId}/all-products`
                        : '#'
                  }
                  className='block overflow-hidden rounded-sm'
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className='h-[280px] w-full object-cover transition duration-300 hover:scale-[1.03] md:h-[320px]'
                  />
                </Link>
                <h3 className='mt-4 line-clamp-2 min-h-[50px] text-[17px] font-medium leading-[1.25] tracking-[-0.02em] text-[#222936] md:text-[21px]'>
                  {product.title}
                </h3>

                <div className='mt-2 flex items-center gap-1'>
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className='h-4 w-4 fill-[#f6b300] text-[#f6b300] md:h-5 md:w-5'
                    />
                  ))}
                  <span className='ml-2 text-[15px] text-slate-500 md:text-[18px]'>({product.reviews})</span>
                </div>

                <div className='mt-2 flex flex-wrap items-center gap-2'>
                  <span className='text-[14px] text-slate-500 line-through md:text-[16px]'>
                    ${product.oldPrice.toFixed(2)}
                  </span>
                  <span className='text-[17px] font-semibold leading-none text-[#1f2937] md:text-[20px]'>
                    ${product.price.toFixed(2)}
                  </span>
                  <span className='border border-[#bcc2cd] px-2 py-0.5 text-[11px] font-medium text-slate-500 md:text-[12px]'>
                    10% OFF
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-[#f1f2ef] py-10 md:py-14'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='relative overflow-hidden rounded-sm'>
            <img
              src={FALLBACK_BANNER_IMAGE}
              alt='Subscription discount'
              className='h-full min-h-[420px] w-full object-cover'
            />
            <div className='absolute inset-0 bg-black/35' />
            <div className='absolute inset-0 grid items-center gap-8 px-8 py-10 md:grid-cols-2 lg:px-14'>
              <div className='text-white'>
                <h3 className='text-[36px] font-semibold leading-[1.04] tracking-[-0.03em] md:text-[60px]'>
                  Get 25% Discount
                  <br />
                  on your first
                  <br />
                  purchase
                </h3>
                <p className='mt-6 text-[20px] leading-[1.3] text-white/95 md:text-[30px]'>
                  Just Sign Up & Register it now to become member.
                </p>
              </div>

              <form className='space-y-4 rounded-sm bg-white/6 p-1 backdrop-blur-[1px]'>
                <input
                  type='text'
                  placeholder='Name'
                  className='w-full bg-white px-5 py-4 text-[16px] text-slate-700 outline-none md:text-[20px]'
                />
                <input
                  type='email'
                  placeholder='Email Address'
                  className='w-full bg-white px-5 py-4 text-[16px] text-slate-700 outline-none md:text-[20px]'
                />
                <button
                  type='button'
                  className='w-full bg-[#1f2733] px-5 py-4 text-[18px] font-semibold text-white transition hover:bg-[#111827] md:text-[22px]'
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section id='faq' className='bg-[#f1f2ef] py-10 md:py-12' data-template-section='description'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='mb-7 flex items-center gap-3'>
            <ShieldCheck className='h-9 w-9 text-[#69b64a]' />
            <h2
              className='text-[32px] font-semibold leading-none tracking-[-0.03em] text-[#172033] md:text-[44px]'
              data-template-path='components.social_page.faqs.heading'
              data-template-section='description'
            >
              {faqHeading}
            </h2>
          </div>
          {faqSubheading ? (
            <p
              className='mb-5 max-w-3xl text-sm text-slate-600 md:text-base'
              data-template-path='components.social_page.faqs.subheading'
              data-template-section='description'
            >
              {faqSubheading}
            </p>
          ) : null}
          <div className='space-y-4'>
            {faqItems.map((faq: FaqItem, index: number) => {
              const isOpen = openFaqIndex === index
              return (
                <article
                  key={`${faq.question}-${index}`}
                  className='overflow-hidden rounded-sm border border-[#d7dbd0] bg-white'
                >
                  <button
                    type='button'
                    onClick={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))}
                    className='flex w-full items-center justify-between px-6 py-5 text-left'
                  >
                    <span
                      className='pr-4 text-[18px] font-medium leading-[1.25] text-[#1f2937] md:text-[24px]'
                      data-template-path={`components.social_page.faqs.faqs.${index}.question`}
                      data-template-section='description'
                    >
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className='h-8 w-8 shrink-0 text-[#1f2937]' />
                    ) : (
                      <ChevronDown className='h-8 w-8 shrink-0 text-[#1f2937]' />
                    )}
                  </button>
                  {isOpen ? (
                    <div
                      className='border-t border-[#e8ece2] px-6 py-5 text-[16px] leading-[1.6] text-slate-600 md:text-[18px]'
                      data-template-path={`components.social_page.faqs.faqs.${index}.answer`}
                      data-template-section='description'
                    >
                      {faq.answer}
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
