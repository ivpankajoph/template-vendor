'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  Factory,
  HandCoins,
  Headset,
  ShieldCheck,
  ShoppingCart,
  SquareCheckBig,
  Truck,
  Warehouse,
  Wrench,
  Compass,
  Clock3,
  Cog,
  BadgeDollarSign,
  Medal,
} from 'lucide-react'
import { getRichTextPreview } from '@/lib/rich-text'
import {
  buildStorefrontScopedPath,
  buildTemplateProductPath,
  getTemplateWebsiteFromPath,
} from '@/lib/template-route'
import { getTemplateAuth, templateApiFetch } from '../templateAuth'
import type { ComponentType } from 'react'
import { configuredArray, configuredText } from '../template-content'
import { fetchTemplateProducts } from '@/lib/template-products-api'

type TemplateProduct = {
  _id?: string
  slug?: string
  productName?: string
  shortDescription?: string
  brand?: string
  defaultImages?: Array<{ url?: string }>
  variants?: Array<{
    _id?: string
    finalPrice?: number
    actualPrice?: number
    discountPercent?: number
    stockQuantity?: number
    variantsImageUrls?: Array<{ url?: string }>
    isActive?: boolean
  }>
}

type WhyChooseItem = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

type IndustryItem = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

type BenefitItem = {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

type FaqItem = {
  question: string
  answer: string
}

type HeroStatItem = {
  value: string
  label: string
}

const FEATURED_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1565610222536-ef125c59da2d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1600&q=80',
]

const PRODUCT_BADGES = ['Featured', 'New', 'Popular']

// helpers copied/trimmed from mquiq variant
const toNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString()}`

const getProductImage = (product: TemplateProduct, fallback: string) => {
  const defaultImage = product?.defaultImages?.find((image) => image?.url)?.url
  if (defaultImage) return defaultImage

  const variants = Array.isArray(product?.variants) ? product.variants : []
  for (const variant of variants) {
    const variantImage = variant?.variantsImageUrls?.find((image) => image?.url)?.url
    if (variantImage) return variantImage
  }

  return fallback
}

const getPrimaryVariant = (product: TemplateProduct) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  return variants.find((variant) => variant?._id && variant?.isActive !== false) || variants[0] || null
}

const getProductPriceDetails = (product: TemplateProduct) => {
  const variants = Array.isArray(product?.variants) ? product.variants : []
  const prices = variants
    .map((variant) => ({
      finalPrice: toNumber(variant?.finalPrice),
      actualPrice: toNumber(variant?.actualPrice),
      discountPercent: toNumber(variant?.discountPercent),
    }))
    .filter((entry) => entry.finalPrice > 0)

  if (!prices.length) {
    return {
      finalPrice: 0,
      actualPrice: 0,
      discountPercent: 0,
    }
  }

  const best = prices.reduce((current, entry) =>
    entry.finalPrice < current.finalPrice ? entry : current
  )

  const computedDiscount =
    best.discountPercent > 0
      ? best.discountPercent
      : best.actualPrice > best.finalPrice && best.actualPrice > 0
        ? Math.round(((best.actualPrice - best.finalPrice) / best.actualPrice) * 100)
        : 0

  return {
    finalPrice: best.finalPrice,
    actualPrice: best.actualPrice,
    discountPercent: computedDiscount,
  }
}

const WHY_CHOOSE_FALLBACK: WhyChooseItem[] = [
  {
    title: 'Quality Assurance',
    description:
      'We use premium-grade steel and follow strict quality checks at every stage to ensure strong, long-lasting, and safe storage systems.',
    icon: SquareCheckBig,
  },
  {
    title: 'Expert Installation',
    description:
      'Our trained team ensures smooth and secure installation at your site, following all required safety norms and technical standards.',
    icon: Wrench,
  },
  {
    title: 'Custom Design',
    description:
      'Every business is different, so we create custom-designed solutions that fit your space and storage needs.',
    icon: Compass,
  },
  {
    title: 'Dedicated Support',
    description:
      'Our support team is just a call away and available to help with guidance, planning, and after-sales service.',
    icon: Headset,
  },
  {
    title: 'Timely Delivery',
    description:
      'With streamlined production and efficient logistics, we ensure on-time delivery to keep your operations running.',
    icon: Clock3,
  },
  {
    title: 'Safety Compliance',
    description:
      'All our products follow or exceed industry safety standards, ensuring secure and reliable use in any environment.',
    icon: ShieldCheck,
  },
]

const INDUSTRY_FALLBACK: IndustryItem[] = [
  {
    title: 'Warehousing',
    description:
      'Smart racking systems that improve inventory handling and optimize warehouse space.',
    icon: Warehouse,
  },
  {
    title: 'Retail',
    description:
      'Efficient and attractive storage for both back-end operations and front-end display.',
    icon: ShoppingCart,
  },
  {
    title: 'Manufacturing',
    description:
      'Strong and flexible racks for storing raw materials, tools, components, and finished products.',
    icon: Factory,
  },
  {
    title: 'Logistics',
    description:
      'Fast-access, high-density solutions for smooth and organized distribution operations.',
    icon: Truck,
  },
]

const BENEFITS_FALLBACK: BenefitItem[] = [
  {
    title: 'Cost-Effective Solutions',
    description:
      'Our systems are designed to last, helping reduce operational costs over the long term by improving storage efficiency and reducing waste.',
    icon: HandCoins,
  },
  {
    title: 'Strong and Durable Construction',
    description:
      'Made from high-quality steel and robust materials, our products offer excellent strength, load-bearing capacity, and long life.',
    icon: Wrench,
  },
  {
    title: 'Easy Installation and Maintenance',
    description:
      'Our expert team ensures quick, hassle-free installation, and our systems are engineered for minimal maintenance.',
    icon: Cog,
  },
  {
    title: 'Safe and Secure Storage',
    description:
      'All our products are designed keeping safety in mind to ensure stable, organized, and secure storage.',
    icon: ShieldCheck,
  },
]

const FAQ_FALLBACK: FaqItem[] = [
  {
    question: 'What products do you offer?',
    answer:
      'We offer mezzanine floors, industrial storage racks, warehouse storage racks, slotted angle racks, and cable tray systems.',
  },
  {
    question: 'Do you provide customised storage solutions?',
    answer:
      'Yes. We design and manufacture customized storage solutions based on your available space and operational requirements.',
  },
  {
    question: 'Where is your company based?',
    answer: 'Our offices are based in Delhi NCR, and we support clients across India.',
  },
  {
    question: 'Do you offer installation services?',
    answer:
      'Yes. Our trained team handles complete on-site installation while following safety and quality standards.',
  },
  {
    question: 'Can you deliver products outside Delhi NCR?',
    answer:
      'Yes, we deliver and support projects outside Delhi NCR depending on order scope and location.',
  },
]

export function PoupqzHome() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const toStorefrontPath = (suffix = '') =>
    vendorId
      ? buildStorefrontScopedPath({
          vendorId,
          pathname: pathname || undefined,
          suffix,
        })
      : '#'
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const templateCitySlug = String(
    template?.components?.vendor_profile?.default_city_slug || ''
  ).trim()

  // Use the reusable storefront product API so the home section matches navbar/all-products behavior.
  const fallbackProducts = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )
  const routeWebsiteId = getTemplateWebsiteFromPath(pathname || '/', vendorId)
  const [apiProducts, setApiProducts] = useState<TemplateProduct[]>([])
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)
  const products = hasLoadedProducts ? apiProducts : fallbackProducts

  const home = template?.components?.home_page || {}
  const descriptionData = home?.description || {}
  const about = template?.components?.about_page || {}
  const hasAboutStoryParagraphs = Array.isArray(about?.story?.paragraphs)
  const aboutStoryParagraphs = configuredArray<unknown>(about?.story?.paragraphs, [])
    .map((paragraph) => configuredText(paragraph))
    .filter((paragraph) => paragraph !== '')
  const socialFaqSection = template?.components?.social_page?.faqs || {}
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')

  useEffect(() => {
    if (!vendorId) {
      setApiProducts([])
      setHasLoadedProducts(false)
      return
    }

    let cancelled = false
    setProductsLoading(true)

    fetchTemplateProducts({
      vendorId,
      websiteId: routeWebsiteId,
      city: 'all',
      page: 1,
      limit: 12,
      sort: 'newest',
    })
      .then((response) => {
        if (cancelled) return
        setApiProducts(response.products || [])
        setHasLoadedProducts(true)
      })
      .catch(() => {
        if (cancelled) return
        setApiProducts([])
        setHasLoadedProducts(false)
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [routeWebsiteId, vendorId])

  const featuredTitle = configuredText(home?.products_heading, 'Our Featured Products')
  const featuredDescription = configuredText(
    home?.products_subtitle,
    'Explore our wide range of high-quality industrial storage solutions designed to maximise space, improve efficiency, and support heavy-duty performance.'
  )
  const whyChooseTitle = configuredText(descriptionData?.large_text, 'Why Choose Us')

  const whyChooseDescription = configuredText(
    descriptionData?.summary,
    'Experience the benefits of partnering with one of the most trusted industrial rack manufacturers.'
  )
  const industriesTitle = configuredText(about?.hero?.title, 'Industries We Deal With')

  const industriesDescription = configuredText(
    about?.hero?.subtitle,
    'Our advanced and reliable storage solutions are designed to meet the needs of industries across India.'
  )
  const benefitsTitle = configuredText(about?.story?.heading, 'Benefits of Our Products')

  const benefitsDescription = hasAboutStoryParagraphs
    ? configuredText(aboutStoryParagraphs[0])
    : configuredText(
        undefined,
    'Our storage solutions are designed to deliver long-term value to your business.'
      )
  const faqHeading = configuredText(
    socialFaqSection?.heading,
    'Frequently Asked Questions'
  )
  const faqSubheading = configuredText(
    socialFaqSection?.subheading,
    'Find quick answers to common queries about our products, services, and support.'
  )
  const industrySection = home?.industries || {}

  const featuredProducts = useMemo(() => {
    return products.slice(0, 3).map((product, index) => {
      const primary = getPrimaryVariant(product)
      const pricing = getProductPriceDetails(product)
      return {
        _id: product?._id || '',
        slug: product?.slug || '',
        variantId: primary?._id || '',
        title: configuredText(product?.productName, `Product ${index + 1}`),
        subtitle: configuredText(
          product?.brand,
          getRichTextPreview(configuredText(product?.shortDescription), 100)
        ),
        image: getProductImage(
          product,
          FEATURED_FALLBACK_IMAGES[index % FEATURED_FALLBACK_IMAGES.length]
        ),
        pricing,
        stockQuantity: toNumber(primary?.stockQuantity),
      }
    })
  }, [products])

  const whyChooseItems = useMemo(() => {
    const values = Array.isArray(template?.components?.about_page?.values)
      ? template.components.about_page.values
      : []
    if (!values.length) return WHY_CHOOSE_FALLBACK

    return values.slice(0, 6).map((value: any, index: number) => ({
      title: configuredText(
        value?.title,
        WHY_CHOOSE_FALLBACK[index]?.title || 'Why choose us'
      ),
      description: configuredText(
        value?.description,
        WHY_CHOOSE_FALLBACK[index]?.description || 'Add description in template editor.'
      ),
      icon: WHY_CHOOSE_FALLBACK[index]?.icon || SquareCheckBig,
    }))
  }, [template?.components?.about_page?.values])

  const benefitItems = useMemo(() => {
    const values = Array.isArray(template?.components?.about_page?.values)
      ? template.components.about_page.values
      : []
    if (!values.length) return BENEFITS_FALLBACK

    return values.slice(0, 4).map((value: any, index: number) => ({
      title: configuredText(value?.title, BENEFITS_FALLBACK[index]?.title || 'Benefit'),
      description: configuredText(
        value?.description,
        BENEFITS_FALLBACK[index]?.description || 'Add description in template editor.'
      ),
      icon: BENEFITS_FALLBACK[index]?.icon || HandCoins,
    }))
  }, [template?.components?.about_page?.values])

  const faqItems = useMemo(() => {
    const apiFaqs = Array.isArray(socialFaqSection?.faqs)
      ? socialFaqSection.faqs
      : []
    if (!apiFaqs.length) return FAQ_FALLBACK

    return apiFaqs.slice(0, 8).map((faq: any) => ({
      question: configuredText(faq?.question, 'Question'),
      answer: configuredText(faq?.answer, 'Answer not available.'),
    }))
  }, [socialFaqSection?.faqs])

  const heroStats = useMemo<HeroStatItem[]>(() => {
    const stats = configuredArray<any>(home?.heroStats, [])
    if (!stats.length) {
      return [
        { label: 'Project Delivered', value: '500+' },
        { label: 'States Reached', value: '25+' },
        { label: 'Manufacturing Unit', value: '2' },
        { label: 'Year Experience', value: '15+' },
      ]
    }

    return stats.slice(0, 4).map((stat: any, index: number) => ({
      value: configuredText(stat?.value, ['500+', '25+', '2', '15+'][index] || ''),
      label: configuredText(
        stat?.label,
        ['Project Delivered', 'States Reached', 'Manufacturing Unit', 'Year Experience'][index] ||
          ''
      ),
    }))
  }, [home?.heroStats])

  const industryItems = useMemo(() => {
    const items = configuredArray<any>(industrySection?.items, [])
    if (!items.length) return INDUSTRY_FALLBACK

    return items.slice(0, 4).map((item: any, index: number) => ({
      title: configuredText(item?.title, INDUSTRY_FALLBACK[index]?.title || 'Industry'),
      description: configuredText(
        item?.description,
        INDUSTRY_FALLBACK[index]?.description || 'Add industry description.'
      ),
      icon: INDUSTRY_FALLBACK[index]?.icon || Warehouse,
    }))
  }, [industrySection?.items])

  const handleAddToCart = async (product: any) => {
    setActionMessage('')
    if (!vendorId || !product?._id) return
    const auth = getTemplateAuth(vendorId)
    if (!auth) {
      window.location.href = `${toStorefrontPath('login')}?next=${encodeURIComponent(
        toStorefrontPath('')
      )}`
      return
    }
    if (!product.variantId) {
      setActionMessage('Variant not available for this product.')
      return
    }

    if (product.stockQuantity <= 0) {
      setActionMessage('This product is out of stock.')
      return
    }

    setAddingId(product._id)
    try {
      await templateApiFetch(vendorId, '/cart', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product._id,
          variant_id: product.variantId,
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

  return (
    <div className='template-home template-home-poupqz min-h-screen bg-white font-sans text-slate-900'>
      {/* 
          HERO SECTION: 
          Premium makeover with rich blue-to-indigo gradient and immersive industrial depth.
      */}
      <section
        id='home'
        className='relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] pb-24 pt-12 text-white'
        data-template-section='hero'
      >
        {/* Subtle background patterns for industrial feel */}
        <div className='absolute inset-0 opacity-10 pointer-events-none'>
          <div className='absolute inset-0' style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className='mx-auto max-w-[1400px] px-6 md:px-12'>
          <div className='relative z-10 flex flex-col items-center text-center'>
            <div className='mb-6 flex animate-in fade-in slide-in-from-bottom-4 duration-700'>
              <span
                className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md shadow-2xl'
                data-template-path='components.home_page.hero_kicker'
                data-template-section='hero'
              >
                <div className='h-2 w-2 rounded-full bg-[#38bdf8] animate-pulse' />
                {configuredText(home?.hero_kicker, 'Industrial Excellence')}
              </span>
            </div>

            <h1
              className='max-w-5xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-6 duration-1000'
              data-template-path='components.home_page.header_text'
              data-template-section='hero'
            >
              {configuredText(
                home?.header_text,
                'Premium RackFlow Systems for High-Efficiency Logistics'
              )}
            </h1>

            <p
              className='mt-8 max-w-3xl text-lg font-medium leading-relaxed text-blue-100/90 md:text-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200'
              data-template-path='components.home_page.header_text_small'
              data-template-section='hero'
            >
              {configuredText(
                home?.header_text_small,
                'Engineered for maximum density and effortless flow. Our blue-white modular systems redefine warehouse storage standards.'
              )}
            </p>

            <div className='mt-12 flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300'>
              <Link
                href={toStorefrontPath('all-products')}
                className='group relative inline-flex items-center gap-3 overflow-hidden rounded-xl bg-white px-10 py-5 text-base font-black text-[#0c4a6e] transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95'
                data-template-path='components.home_page.button_header'
                data-template-section='hero'
              >
                {configuredText(home?.button_header, 'View Catalog')}
                <ShoppingCart className='h-5 w-5 transition-transform group-hover:translate-x-1' />
              </Link>
              <button
                type='button'
                className='inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/5 px-10 py-5 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/10'
                data-template-path='components.home_page.button_secondary'
                data-template-section='hero'
              >
                {configuredText(home?.button_secondary, 'Custom Solutions')}
              </button>
            </div>

            {/* Value Badges */}
            <div className='mt-20 grid grid-cols-2 gap-8 md:grid-cols-4 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500'>
              {heroStats.map((stat, i) => (
                <div key={i} className='rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm'>
                  <div
                    className='text-3xl font-black text-white'
                    data-template-path={`components.home_page.heroStats.${i}.value`}
                    data-template-section='description'
                  >
                    {stat.value}
                  </div>
                  <div
                    className='text-[10px] font-bold uppercase tracking-widest text-[#38bdf8]'
                    data-template-path={`components.home_page.heroStats.${i}.label`}
                    data-template-section='description'
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 
          PRODUCTS SECTION: 
          Distinct "Dense Content" Grid with Sharp Industrial Card Design
      */}
      <section
        id='products'
        className='relative z-20 -mt-12 bg-white pb-24 pt-12 md:pb-32'
        data-template-section='products'
      >
        <div className='mx-auto max-w-[1400px] px-6 md:px-12'>
          <div className='mb-16 flex flex-col items-center text-center'>
            <div className='mb-4 text-xs font-black uppercase tracking-[0.4em] text-[#0ea5e9]'>
              Curated Collections
            </div>
            <h2
              className='text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {featuredTitle}
            </h2>
            <div className='mt-6 h-1 w-20 bg-[#0ea5e9]' />
            <p
              className='mt-8 max-w-2xl text-lg font-medium leading-relaxed text-slate-500'
              data-template-path='components.home_page.products_subtitle'
              data-template-section='products'
            >
              {featuredDescription}
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
              {featuredProducts.map((product, index) => (
                <article
                  key={`${product.title}-${index}`}
                  className='group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all duration-300 hover:border-[#0ea5e9]/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)]'
                >
                  <Link
                    href={
                      vendorId && product?._id
                        ? buildTemplateProductPath({
                            vendorId,
                            pathname: pathname || undefined,
                            productId: product._id,
                            productSlug: product.slug,
                            citySlug: templateCitySlug,
                          })
                        : vendorId
                          ? toStorefrontPath('all-products')
                          : '#'
                    }
                    className='block flex-1'
                  >
                    <div className='relative aspect-[5/4] overflow-hidden bg-slate-50 p-6'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image}
                        alt={product.title}
                        className='h-full w-full object-contain transition duration-500 group-hover:scale-110'
                      />
                      <div className='absolute left-4 top-4'>
                        <span className='rounded-md bg-[#0c4a6e] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg'>
                          {PRODUCT_BADGES[index] || 'Stock Ready'}
                        </span>
                      </div>
                    </div>

                    <div className='flex flex-col p-6'>
                      {product.subtitle && (
                        <div className='mb-2 text-[10px] font-bold uppercase tracking-widest text-[#0ea5e9]'>
                          {product.subtitle}
                        </div>
                      )}
                      <h3 className='text-xl font-bold leading-tight text-slate-900 group-hover:text-[#0ea5e9] transition-colors'>
                        {product.title}
                      </h3>

                      <div className='mt-6 flex items-center justify-between'>
                        {product.pricing.finalPrice > 0 ? (
                          <div className='flex flex-col'>
                            <div className='flex items-center gap-2'>
                              <span className='text-2xl font-black text-slate-950'>
                                {formatPrice(product.pricing.finalPrice)}
                              </span>
                              {product.pricing.discountPercent > 0 && (
                                <span className='rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-black text-red-600'>
                                  -{product.pricing.discountPercent}%
                                </span>
                              )}
                            </div>
                            {product.pricing.actualPrice > product.pricing.finalPrice && (
                              <span className='text-xs font-semibold text-slate-400 line-through'>
                                {formatPrice(product.pricing.actualPrice)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className='text-sm font-bold text-slate-400'>Price on Request</div>
                        )}

                        <div className='flex items-center gap-1'>
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className='h-1 w-3 rounded-full bg-slate-100 overflow-hidden'>
                              <div className='h-full w-full bg-emerald-500 transform translate-x-0' />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className='grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100'>
                    <div className='flex h-14 items-center justify-center bg-slate-50/50'>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${product.stockQuantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                      >
                        {product.stockQuantity > 0 ? `${product.stockQuantity} Units In Field` : 'On Backorder'}
                      </span>
                    </div>
                    <button
                      type='button'
                      className='flex h-14 items-center justify-center bg-white text-[11px] font-black uppercase tracking-widest text-[#0c4a6e] transition-colors hover:bg-[#0c4a6e] hover:text-white disabled:opacity-30'
                      onClick={() => handleAddToCart(product)}
                      disabled={
                        !product?._id ||
                        !product?.variantId ||
                        product.stockQuantity <= 0 ||
                        addingId === product._id
                      }
                    >
                      {addingId === product._id ? 'Processing...' : 'Quick Quote'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className='rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 py-24 text-center'>
              <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-400'>
                <Warehouse className='h-8 w-8' />
              </div>
              <p className='mt-6 text-sm font-bold uppercase tracking-widest text-slate-500'>
                {productsLoading ? 'Loading products...' : 'No products found for this website.'}
              </p>
            </div>
          )}
          {actionMessage && (
            <div className='mt-12 text-center'>
              <span className='inline-flex rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700'>
                {actionMessage}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 
          WHY CHOOSE US: 
          Modern Bento-Grid Style for Better Sectioning
      */}
      <section
        id='about-us'
        className='bg-slate-50 py-24 md:py-32'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1400px] px-6 md:px-12 text-center lg:text-left'>
          <div className='mb-20 flex flex-col lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-3xl'>
              <div className='mb-4 text-xs font-black uppercase tracking-[0.4em] text-[#0ea5e9]'>
                Quality Benchmarks
              </div>
              <h2
                className='text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl'
                data-template-path='components.home_page.description.large_text'
                data-template-section='description'
              >
                {whyChooseTitle}
              </h2>
              <p
                className='mt-8 text-lg font-medium leading-relaxed text-slate-500'
                data-template-path='components.home_page.description.summary'
                data-template-section='description'
              >
                {whyChooseDescription}
              </p>
            </div>
            <div className='mt-8 lg:mt-0'>
              <div className='flex items-center gap-4 rounded-3xl bg-white p-2 shadow-xl ring-1 ring-slate-200'>
                <div className='flex -space-x-3 p-2'>
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className='h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-slate-100'>
                      <img src={`https://i.pravatar.cc/100?u=${n + 20}`} alt='client' />
                    </div>
                  ))}
                </div>
                <div className='pr-4 text-left'>
                  <div className='text-sm font-black text-slate-950'>ISO CERTIFIED</div>
                  <div className='text-[10px] font-bold text-slate-400 uppercase'>Global Compliance</div>
                </div>
              </div>
            </div>
          </div>

          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {whyChooseItems.map((item: WhyChooseItem, index: number) => {
              const Icon = item.icon
              return (
                <article
                  key={`${item.title}-${index}`}
                  className='group flex flex-col rounded-3xl border border-slate-100 bg-white p-10 transition-all duration-300 hover:border-[#0ea5e9]/20 hover:shadow-2xl'
                >
                  <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0c4a6e]/5 text-[#0c4a6e] transition-colors group-hover:bg-[#0c4a6e] group-hover:text-white'>
                    <Icon className='h-8 w-8' />
                  </div>
                  <h3
                    className='mt-8 text-2xl font-bold tracking-tight text-slate-950'
                    data-template-path={`components.about_page.values.${index}.title`}
                    data-template-section='description'
                  >
                    {item.title}
                  </h3>
                  <div className='mt-4 h-1 w-8 bg-[#0ea5e9]/20 transition-all group-hover:w-16 group-hover:bg-[#0ea5e9]' />
                  <p
                    className='mt-6 text-base font-medium leading-relaxed text-slate-500'
                    data-template-path={`components.about_page.values.${index}.description`}
                    data-template-section='description'
                  >
                    {item.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* 
          INDUSTRIES: 
          Clean horizontal highlight section
      */}
      <section
        id='industries'
        className='border-y border-slate-100 bg-white py-24'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1400px] px-6 md:px-12'>
          <div className='mb-20 space-y-4 text-center'>
            <div
              className='text-[10px] font-black uppercase tracking-[0.5em] text-[#0ea5e9]'
              data-template-path='components.home_page.industries.kicker'
              data-template-section='description'
            >
              {configuredText(industrySection?.kicker, 'Strategic Sectors')}
            </div>
            <h2
              className='text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl'
              data-template-path='components.home_page.industries.heading'
              data-template-section='description'
            >
              {configuredText(industrySection?.heading, industriesTitle)}
            </h2>
            <p
              className='mx-auto max-w-2xl text-lg font-medium text-slate-500'
              data-template-path='components.home_page.industries.subtitle'
              data-template-section='description'
            >
              {configuredText(industrySection?.subtitle, industriesDescription)}
            </p>
          </div>

          <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            {industryItems.map((item: IndustryItem, index: number) => {
              const Icon = item.icon
              return (
                <article
                  key={`${item.title}-${index}`}
                  className='group relative flex flex-col items-center text-center'
                >
                  <div className='relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 shadow-inner group-hover:bg-slate-950 transition-colors duration-500'>
                    <Icon className='relative z-10 h-10 w-10 text-[#0c4a6e] group-hover:text-white transition-colors duration-500' />
                  </div>
                  <h3
                    className='text-xl font-bold text-slate-950'
                    data-template-path={`components.home_page.industries.items.${index}.title`}
                    data-template-section='description'
                  >
                    {item.title}
                  </h3>
                  <p
                    className='mt-4 text-sm font-medium leading-relaxed text-slate-400'
                    data-template-path={`components.home_page.industries.items.${index}.description`}
                    data-template-section='description'
                  >
                    {item.description}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* 
          FAQ: 
          Premium Accordion Styling
      */}
      <section id='faq' className='bg-slate-50 py-24 md:py-32'>
        <div className='mx-auto max-w-4xl px-6'>
          <div className='mb-20 text-center'>
            <div className='mb-4 text-xs font-black uppercase tracking-[0.4em] text-[#0ea5e9]'>
              Client Support
            </div>
            <h2
              className='text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl'
              data-template-path='components.social_page.faqs.heading'
              data-template-section='description'
            >
              {faqHeading}
            </h2>
          </div>

          <div className='space-y-4'>
            {faqItems.map((faq: FaqItem, index: number) => {
              const isOpen = openFaqIndex === index
              return (
                <article
                  key={index}
                  className={`overflow-hidden rounded-3xl border transition-all duration-300 ${isOpen ? 'border-[#0ea5e9]/30 bg-white shadow-xl' : 'border-slate-200 bg-white/50'
                    }`}
                >
                  <button
                    type='button'
                    className='flex w-full items-center justify-between px-8 py-6 text-left'
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  >
                    <span className={`text-lg font-bold tracking-tight ${isOpen ? 'text-[#0c4a6e]' : 'text-slate-900'}`}>
                      {faq.question}
                    </span>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[#0c4a6e] text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronDown className='h-4 w-4' />
                    </div>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className='px-8 pb-8 text-base font-medium leading-relaxed text-slate-500'>
                      {faq.answer}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
