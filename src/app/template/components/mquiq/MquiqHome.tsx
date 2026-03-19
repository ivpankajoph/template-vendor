'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Wrench,
  Warehouse,
  BadgeDollarSign,
  Medal,
  Cog,
  Headset,
  Factory,
  RefreshCw,
} from 'lucide-react'
import { getRichTextPreview } from '@/lib/rich-text'
import { getTemplateAuth, templateApiFetch } from '../templateAuth'
import { buildStorefrontScopedPath } from '@/lib/template-route'

type TemplateProduct = {
  _id?: string
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
    isActive?: boolean
    variantsImageUrls?: Array<{ url?: string }>
  }>
}

type BenefitIconKey = 'space' | 'custom' | 'durable' | 'safety'

type BenefitItem = {
  title: string
  description: string
  icon: BenefitIconKey
}

type AdvantageIconKey = 'expertise' | 'tailored' | 'support' | 'quality'

type AdvantageItem = {
  title: string
  description: string
  icon: AdvantageIconKey
}

type FaqItem = {
  question: string
  answer: string
}

const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1400&q=80',
]

const DEFAULT_MQUIQ_HERO_BANNER =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80'
const DEFAULT_MQUIQ_ADVANTAGE_IMAGE =
  'https://images.unsplash.com/photo-1586528116493-7a639a4b5f9f?auto=format&fit=crop&w=1400&q=80'

const PRODUCT_BADGES = ['Featured', 'New', 'Popular']

const toNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString()}`

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const hexToRgba = (hex: string, alpha: number, fallback: string) => {
  const value = String(hex || '').trim()
  const normalized = value.startsWith('#') ? value.slice(1) : value
  const safeAlpha = clamp(alpha, 0, 1)

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const r = parseInt(normalized[0] + normalized[0], 16)
    const g = parseInt(normalized[1] + normalized[1], 16)
    const b = parseInt(normalized[2] + normalized[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16)
    const g = parseInt(normalized.slice(2, 4), 16)
    const b = parseInt(normalized.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
  }

  return fallback
}

const getContrastText = (hex: string, light = '#ffffff', dark = '#111827') => {
  const value = String(hex || '').trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return dark
  const r = parseInt(value.slice(0, 2), 16) / 255
  const g = parseInt(value.slice(2, 4), 16) / 255
  const b = parseInt(value.slice(4, 6), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.58 ? dark : light
}

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

const FALLBACK_BENEFITS: BenefitItem[] = [
  {
    title: 'Optimized Space Utilization',
    description:
      'Maximize your warehouse capacity with intelligently designed racking systems.',
    icon: 'space',
  },
  {
    title: 'Customizable Configurations',
    description:
      "Storage solutions tailored precisely to your industry's and facility's unique needs.",
    icon: 'custom',
  },
  {
    title: 'Cost-Effective Durability',
    description:
      'Built to last with high-grade materials, reducing replacement and maintenance expenses.',
    icon: 'durable',
  },
]

const FALLBACK_ADVANTAGES: AdvantageItem[] = [
  {
    title: 'Trusted Expertise',
    description:
      'Since 2023, our dedicated team has been delivering robust storage solutions with deep industry knowledge and commitment.',
    icon: 'expertise',
  },
  {
    title: 'Tailored Storage Systems',
    description:
      'We craft custom slotted angle racks and industrial storage systems to perfectly fit your warehouse and operational needs.',
    icon: 'tailored',
  },
  {
    title: 'Dedicated Customer Support',
    description:
      'Our team provides prompt guidance and service to ensure seamless installation, maintenance, and satisfaction.',
    icon: 'support',
  },
  {
    title: 'Quality & Durability',
    description:
      'Every system is manufactured with quality materials and strict checks for long-term reliability.',
    icon: 'quality',
  },
]

const FALLBACK_FAQS: FaqItem[] = [
  {
    question: 'What types of storage racks do you manufacture?',
    answer:
      'We specialize in Slotted Angle Racks, Industrial Storage Racks, Warehouse Storage Racks, and custom-designed mezzanine floors.',
  },
  {
    question: 'How long does it take to design and install a custom storage rack system?',
    answer:
      'Project timelines vary by size and complexity, but we share a clear delivery schedule after the site requirement review.',
  },
  {
    question: 'Do you provide maintenance and support for your storage racks?',
    answer:
      'Yes. We provide post-installation support, maintenance guidance, and servicing assistance when required.',
  },
]

const getBenefitIcon = (icon: BenefitIconKey) => {
  switch (icon) {
    case 'space':
      return <Warehouse className='h-11 w-11 text-white' />
    case 'custom':
      return <Wrench className='h-11 w-11 text-white' />
    case 'durable':
      return <BadgeDollarSign className='h-11 w-11 text-white' />
    case 'safety':
      return <ShieldCheck className='h-11 w-11 text-white' />
    default:
      return <Warehouse className='h-11 w-11 text-white' />
  }
}

const getAdvantageIcon = (icon: AdvantageIconKey) => {
  switch (icon) {
    case 'expertise':
      return <Medal className='h-7 w-7 text-[#f4b400]' />
    case 'tailored':
      return <Cog className='h-7 w-7 text-[#f4b400]' />
    case 'support':
      return <Headset className='h-7 w-7 text-[#f4b400]' />
    case 'quality':
      return <Factory className='h-7 w-7 text-[#f4b400]' />
    default:
      return <Medal className='h-7 w-7 text-[#f4b400]' />
  }
}

export function MquiqHome() {
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
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})

  // Use products already loaded into Redux store by TemplateDataLoader
  const products = useSelector((state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[])
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')

  const home = template?.components?.home_page || {}
  const aboutPage = template?.components?.about_page || {}
  const socialFaqSection = template?.components?.social_page?.faqs || {}

  const heroTitle =
    home?.header_text || 'Enhancing Storage Efficiency with Durable Racking Systems'
  const heroSubtitle =
    home?.header_text_small ||
    'We design and manufacture robust storage solutions that optimize your space and improve operational productivity.'
  const heroKicker = home?.hero_kicker || 'Reliable Industrial Storage Solutions'
  const heroImage = home?.backgroundImage || DEFAULT_MQUIQ_HERO_BANNER
  const heroStyle = home?.hero_style || {}
  const titleColor = heroStyle?.titleColor || '#ffffff'
  const subtitleColor = heroStyle?.subtitleColor || '#e2e8f0'
  const badgeColor = heroStyle?.badgeColor || '#f8fafc'
  const titleSize = clamp(toNumber(heroStyle?.titleSize) || 58, 30, 84)
  const subtitleSize = clamp(toNumber(heroStyle?.subtitleSize) || 19, 13, 32)
  const badgeSize = clamp(toNumber(heroStyle?.badgeSize) || 12, 10, 20)
  const primaryButtonColor = heroStyle?.primaryButtonColor || '#f4b400'
  const secondaryButtonColor = heroStyle?.secondaryButtonColor || '#ffffff'
  const overlayColor = heroStyle?.overlayColor || '#0f172a'
  const overlayAccentColor = heroStyle?.overlayAccentColor || '#1e293b'
  const overlayOpacity =
    clamp(
      Number.isFinite(Number(heroStyle?.overlayOpacity))
        ? Number(heroStyle?.overlayOpacity)
        : 72,
      0,
      100
    ) / 100
  const badgeTextColor = getContrastText(String(secondaryButtonColor || '#ffffff'))
  const primaryButtonTextColor = getContrastText(String(primaryButtonColor || '#f4b400'))
  const overlayStyle = {
    backgroundImage: `linear-gradient(115deg, ${hexToRgba(
      overlayColor,
      overlayOpacity,
      'rgba(15, 23, 42, 0.74)'
    )} 0%, ${hexToRgba(
      overlayAccentColor,
      Math.min(0.98, overlayOpacity + 0.1),
      'rgba(30, 41, 59, 0.84)'
    )} 52%, ${hexToRgba(
      overlayColor,
      Math.min(1, overlayOpacity + 0.18),
      'rgba(15, 23, 42, 0.92)'
    )} 100%), url('${heroImage}')`,
  }

  const featuredHeading = home?.products_heading || 'Featured Products'
  const featuredSubtitle =
    home?.products_subtitle ||
    'Explore our innovative conveyor systems designed for reliability and efficiency'
  const benefitsSection = home?.benefits || {}
  const benefitsKicker = benefitsSection?.kicker || 'Benefits'
  const benefitsHeading =
    benefitsSection?.heading || 'Why Our Storage Solutions Stand Apart'
  const benefitsSubtitle =
    benefitsSection?.subtitle ||
    'Trusted advantages that enhance your storage management and operational efficiency'
  const advantageSection = home?.advantage || {}
  const businessName = template?.business_name || vendor?.name || 'Storage Solution'
  const advantageKicker = advantageSection?.kicker || 'Why Choose Us'
  const advantageHeading = advantageSection?.heading || `The ${businessName} Advantage`
  const advantageSubtitle =
    advantageSection?.subtitle ||
    'Partner with a team focused on fast execution, dependable quality, and long-term support.'
  const advantageCtaLabel = advantageSection?.ctaLabel || 'Schedule Consultation'
  const advantageTopTag = advantageSection?.topTag || 'Premium Service'
  const advantageImage = advantageSection?.image || DEFAULT_MQUIQ_ADVANTAGE_IMAGE
  const advantageBadgeValue = advantageSection?.badgeValue || '1+'
  const advantageBadgeLabel = advantageSection?.badgeLabel || 'Years of Excellence'

  const featuredProducts = useMemo(() => {
    return products.slice(0, 3).map((product, index) => ({
      _id: product?._id,
      variantId: getPrimaryVariant(product)?._id || '',
      title: product?.productName || `Product ${index + 1}`,
      subtitle:
        product?.brand ||
        getRichTextPreview(product?.shortDescription || '', 100) ||
        'Industrial-grade storage solution',
      image: getProductImage(
        product,
        FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length]
      ),
      pricing: getProductPriceDetails(product),
      stockQuantity: toNumber(getPrimaryVariant(product)?.stockQuantity),
    }))
  }, [products])

  const benefits = useMemo(() => {
    const cards = Array.isArray(home?.benefits?.cards) ? home.benefits.cards : []
    const legacyValues = Array.isArray(aboutPage?.values) ? aboutPage.values : []
    const source = cards.length ? cards : legacyValues

    return Array.from({ length: 3 }, (_, index) => {
      const fallback = FALLBACK_BENEFITS[index] || FALLBACK_BENEFITS[0]
      const item = source[index] || {}

      return {
        title: item?.title || fallback?.title || 'Benefit',
        description:
          item?.description ||
          fallback?.description ||
          'Add benefit details from template editor.',
        icon: (['space', 'custom', 'durable'][index] as BenefitIconKey) || 'space',
      }
    })
  }, [home?.benefits?.cards, aboutPage?.values])

  const advantages = useMemo(() => {
    const cards = Array.isArray(home?.advantage?.cards) ? home.advantage.cards : []
    const legacyValues = Array.isArray(aboutPage?.values) ? aboutPage.values : []
    const source = cards.length ? cards : legacyValues

    return Array.from({ length: 3 }, (_, index) => ({
      title: source[index]?.title || FALLBACK_ADVANTAGES[index]?.title || 'Why choose us',
      description:
        source[index]?.description ||
        FALLBACK_ADVANTAGES[index]?.description ||
        'Add details in template editor.',
      icon:
        (['expertise', 'tailored', 'support'][index] as AdvantageIconKey) ||
        'expertise',
    }))
  }, [home?.advantage?.cards, aboutPage?.values])

  const advantageHighlights = useMemo(() => {
    const values = Array.isArray(home?.advantage?.highlights)
      ? home.advantage.highlights
      : []

    return Array.from({ length: 2 }, (_, index) => {
      const item = values[index] || {}
      const fallback =
        index === 0
          ? { value: '48h', label: 'Quick Response' }
          : { value: '99%', label: 'On-Time Handover' }

      return {
        value: item?.value || fallback.value,
        label: item?.label || fallback.label,
      }
    })
  }, [home?.advantage?.highlights])

  const faqItems = useMemo(() => {
    const rawFaqs = Array.isArray(socialFaqSection?.faqs)
      ? socialFaqSection.faqs
      : []
    if (!rawFaqs.length) return FALLBACK_FAQS

    return rawFaqs.slice(0, 6).map((faq: any) => ({
      question: faq?.question || 'Question',
      answer: faq?.answer || 'Answer not available.',
    }))
  }, [socialFaqSection?.faqs])

  const secondaryButtonLabel = home?.button_secondary || 'New arrivals weekly'
  const featuredGridClass =
    featuredProducts.length <= 1
      ? 'mt-8 grid place-items-center'
      : featuredProducts.length === 2
        ? 'mx-auto mt-8 grid max-w-[700px] gap-5 sm:grid-cols-2 sm:place-items-center'
        : 'mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:place-items-center'

  const handleAddToCart = async (product: {
    _id?: string
    variantId?: string
    stockQuantity?: number
    title?: string
  }) => {
    setActionMessage('')

    if (!vendorId || !product?._id) return
    const auth = getTemplateAuth(vendorId)
    if (!auth?.token) {
      window.location.href = `${toStorefrontPath('login')}?next=${encodeURIComponent(
        toStorefrontPath('all-products')
      )}`
      return
    }
    if (!product.variantId) {
      setActionMessage('Variant not available for this product.')
      return
    }
    if (toNumber(product.stockQuantity) <= 0) {
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
    <div className='template-home template-home-mquiq bg-[#f3f3f3] text-[#2d3138]'>
      <section id='home' className='bg-[#f4b400] pb-8 pt-6 md:pb-10' data-template-section='hero'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div
            className='relative isolate overflow-hidden rounded-[28px] border border-white/25 shadow-[0_28px_70px_rgba(15,23,42,0.25)]'
            data-template-path='components.home_page.backgroundImage'
            data-template-section='branding'
            data-template-component='components.home_page.backgroundImage'
          >
            <div className='absolute inset-0 bg-cover bg-center' style={overlayStyle} />
            <div className='pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full bg-[#f4b400]/20 blur-3xl' />
            <div className='pointer-events-none absolute -left-20 bottom-[-140px] h-[22rem] w-[22rem] rounded-full bg-white/12 blur-3xl' />

            <div className='relative z-10 flex min-h-[430px] items-end px-6 py-8 md:px-10 md:py-10 lg:min-h-[520px] lg:px-14 lg:py-12'>
              <div className='max-w-3xl'>
                <span
                  className='inline-flex items-center rounded-full border border-white/35 bg-white/18 px-4 py-1.5 font-semibold uppercase tracking-[0.18em] backdrop-blur-sm'
                  data-template-path='components.home_page.hero_kicker'
                  data-template-section='hero'
                  style={{ color: badgeColor, fontSize: `${badgeSize}px` }}
                >
                  {heroKicker}
                </span>

                <h1
                  className='mt-5 font-extrabold leading-[1.02] tracking-[-0.03em]'
                  data-template-path='components.home_page.header_text'
                  data-template-section='hero'
                  style={{
                    color: titleColor,
                    fontSize: `clamp(2rem, 5vw, ${titleSize}px)`,
                  }}
                >
                  {heroTitle}
                </h1>

                <p
                  className='mt-4 max-w-2xl leading-[1.58]'
                  data-template-path='components.home_page.header_text_small'
                  data-template-section='hero'
                  style={{
                    color: subtitleColor,
                    fontSize: `clamp(1rem, 2vw, ${subtitleSize}px)`,
                  }}
                >
                  {heroSubtitle}
                </p>

                <div className='mt-7 flex flex-wrap items-center gap-3'>
                  <Link
                    href={toStorefrontPath('all-products')}
                    className='inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5'
                    data-template-path='components.home_page.button_header'
                    data-template-section='hero'
                    style={{
                      backgroundColor: primaryButtonColor,
                      color: primaryButtonTextColor,
                    }}
                  >
                    {home?.button_header || 'Explore Products'}
                  </Link>
                  <span
                    className='inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold backdrop-blur-sm'
                    style={{
                      color: badgeTextColor,
                      backgroundColor: `${secondaryButtonColor}26`,
                    }}
                  >
                    <RefreshCw className='h-4 w-4' />
                    {secondaryButtonLabel}
                  </span>
                </div>
              </div>

              <div className='absolute right-5 top-5 rounded-2xl border border-white/35 bg-white/88 px-5 py-4 shadow-xl backdrop-blur-sm'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f6fb] text-[#f4b400]'>
                    <RefreshCw className='h-5 w-5' />
                  </div>
                  <div>
                    <p className='text-3xl font-extrabold leading-none text-[#1e293b]'>24/7</p>
                    <p className='mt-1 text-sm font-medium text-slate-600'>reliable operations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id='products'
        className='bg-[#f3f3f3] py-12 lg:py-14'
        data-template-section='products'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='text-center'>
            <span className='inline-flex rounded-full bg-[#dbe6f4] px-6 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f4b400]'>
              {home?.products_kicker || 'Our Solutions'}
            </span>
            <h2
              className='mt-4 text-[2rem] font-extrabold tracking-[-0.02em] text-[#2f3136] md:text-[2.3rem]'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {featuredHeading}
            </h2>
            <p
              className='mx-auto mt-3 max-w-4xl text-base text-slate-500 md:text-lg'
              data-template-path='components.home_page.products_subtitle'
              data-template-section='products'
            >
              {featuredSubtitle || featuredHeading}
            </p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className={featuredGridClass}>
              {featuredProducts.map((product, index) => (
                <article
                  key={`${product.title}-${index}`}
                  className={`group w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${featuredProducts.length === 1 ? 'max-w-[280px]' : 'max-w-[320px]'
                    }`}
                >
                  <Link
                    href={
                      vendorId && product?._id
                        ? toStorefrontPath(`product/${product._id}`)
                        : vendorId
                          ? toStorefrontPath('all-products')
                          : '#'
                    }
                    className='block'
                  >
                    <div className='relative border-b border-slate-100 bg-[#f2f4f7] p-2.5'>
                      <div
                        className={`relative overflow-hidden rounded-2xl bg-white ${featuredProducts.length === 1 ? 'aspect-[4/5]' : 'aspect-square'
                          }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.title}
                          className='h-full w-full object-contain p-3 transition duration-300 group-hover:scale-[1.03]'
                        />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <span className='absolute left-6 top-6 rounded-xl bg-[#00a86b] px-3 py-1 text-sm font-bold text-white shadow-sm'>
                        {PRODUCT_BADGES[index] || 'Featured'}
                      </span>
                    </div>
                    <div className='px-3.5 py-3'>
                      <p className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-500'>
                        {product.subtitle}
                      </p>
                      <h3 className='mt-2 text-[1.08rem] font-extrabold leading-tight tracking-[-0.01em] text-[#2f3136]'>
                        {product.title}
                      </h3>
                      <p className='mt-3 text-[15px] text-slate-500'>1 unit</p>
                      {product.pricing.finalPrice > 0 ? (
                        <div className='mt-2 flex items-end gap-3'>
                          <p className='text-[1.1rem] font-extrabold text-[#24324a]'>
                            {formatPrice(product.pricing.finalPrice)}
                          </p>
                          {product.pricing.actualPrice > product.pricing.finalPrice ? (
                            <p className='text-sm text-slate-400 line-through'>
                              {formatPrice(product.pricing.actualPrice)}
                            </p>
                          ) : null}
                          {product.pricing.discountPercent > 0 ? (
                            <span className='rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700'>
                              {product.pricing.discountPercent}% off
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {product.pricing.discountPercent > 0 ? (
                        <p className='mt-1 text-3.5 font-semibold text-[#00a86b]'>
                          {product.pricing.discountPercent}% off
                        </p>
                      ) : null}
                    </div>
                  </Link>
                  <div className='flex items-center justify-between border-t border-slate-100 px-4 py-3'>
                    <span
                      className={`text-sm font-semibold ${product.stockQuantity > 0 ? 'text-[#00a86b]' : 'text-rose-600'
                        }`}
                    >
                      {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                    </span>
                    <button
                      type='button'
                      className='rounded-2xl border border-[#00a86b] px-4 py-2 text-sm font-semibold text-[#00a86b] transition hover:bg-[#00a86b] hover:text-white disabled:cursor-not-allowed disabled:opacity-60'
                      onClick={() => handleAddToCart(product)}
                      disabled={
                        !product?._id ||
                        !product?.variantId ||
                        product.stockQuantity <= 0 ||
                        addingId === product._id
                      }
                    >
                      {addingId === product._id ? 'ADDING' : 'ADD'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className='mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600'>
              No products are mapped for this city yet.
            </div>
          )}
          {actionMessage ? <p className='mt-4 text-center text-sm text-slate-600'>{actionMessage}</p> : null}
        </div>
      </section>

      <section
        id='why-us'
        className='bg-[#f4b400] py-12 lg:py-14'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='text-center'>
            <span
              className='text-sm font-semibold uppercase tracking-[0.22em] text-white/90'
              data-template-path='components.home_page.benefits.kicker'
              data-template-section='description'
            >
              {benefitsKicker}
            </span>
            <h2
              className='mt-3 text-3xl font-extrabold tracking-[-0.02em] text-white md:text-4xl'
              data-template-path='components.home_page.benefits.heading'
              data-template-section='description'
            >
              {benefitsHeading}
            </h2>
            <p
              className='mx-auto mt-3 max-w-4xl text-base text-white/95 md:text-lg'
              data-template-path='components.home_page.benefits.subtitle'
              data-template-section='description'
            >
              {benefitsSubtitle}
            </p>
          </div>

          <div className='mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {benefits.map((item: BenefitItem, index: number) => (
              <article
                key={`${item.title}-${index}`}
                className='flex h-full flex-col items-center rounded-2xl border border-white/20 bg-[#f5be1f] px-6 py-7 text-center shadow-[0_18px_40px_rgba(15,23,42,0.14)]'
              >
                <div className='mx-auto flex h-16 w-16 items-center justify-center'>
                  {getBenefitIcon(item.icon)}
                </div>
                <h3
                  className='mt-4 min-h-[3.2rem] text-[1.2rem] font-extrabold leading-tight tracking-[-0.01em] text-white'
                  data-template-path={`components.home_page.benefits.cards.${index}.title`}
                  data-template-section='description'
                >
                  {item.title}
                </h3>
                <p
                  className='mt-3 text-[0.95rem] leading-relaxed text-white/95'
                  data-template-path={`components.home_page.benefits.cards.${index}.description`}
                  data-template-section='description'
                >
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id='about-us'
        className='bg-[#f3f3f3] py-12 lg:py-14'
        data-template-section='description'
      >
        <div className='mx-auto grid max-w-[1320px] gap-6 px-4 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start'>
          <div>
            <span
              className='text-sm font-semibold uppercase tracking-[0.2em] text-[#f4b400]'
              data-template-path='components.home_page.advantage.kicker'
              data-template-section='description'
            >
              {advantageKicker}
            </span>
            <h2
              className='mt-3 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#2f3136] md:text-4xl'
              data-template-path='components.home_page.advantage.heading'
              data-template-section='description'
            >
              {advantageHeading}
            </h2>
            <p
              className='mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-slate-600'
              data-template-path='components.home_page.advantage.subtitle'
              data-template-section='description'
            >
              {advantageSubtitle}
            </p>

            <div className='mt-6 space-y-5'>
              {advantages.map((item: AdvantageItem, index: number) => (
                <article key={`${item.title}-${index}`} className='flex gap-3'>
                  <div className='mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e6edf5]'>
                    {getAdvantageIcon(item.icon)}
                  </div>
                  <div>
                    <h3
                      className='text-[1.2rem] font-extrabold tracking-[-0.01em] text-[#2f3136]'
                      data-template-path={`components.home_page.advantage.cards.${index}.title`}
                      data-template-section='description'
                    >
                      {item.title}
                    </h3>
                    <p
                      className='mt-1 text-[0.95rem] leading-relaxed text-slate-600'
                      data-template-path={`components.home_page.advantage.cards.${index}.description`}
                      data-template-section='description'
                    >
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className='mt-7 grid gap-3 sm:grid-cols-2'>
              {advantageHighlights.map((item, index) => (
                <div
                  key={`${item.value}-${index}`}
                  className='rounded-2xl border border-slate-200 bg-white px-4 py-3'
                >
                  <p
                    className='text-2xl font-extrabold leading-none text-[#2f3136]'
                    data-template-path={`components.home_page.advantage.highlights.${index}.value`}
                    data-template-section='description'
                  >
                    {item.value}
                  </p>
                  <p
                    className='mt-1 text-sm text-slate-500'
                    data-template-path={`components.home_page.advantage.highlights.${index}.label`}
                    data-template-section='description'
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className='mt-6'>
              <Link
                href={toStorefrontPath('contact')}
                className='inline-flex items-center rounded-full bg-[#f4b400] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#da9f00]'
                data-template-path='components.home_page.advantage.ctaLabel'
                data-template-section='description'
              >
                {advantageCtaLabel}
              </Link>
            </div>
          </div>

          <div
            className='relative overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.14)]'
            data-template-path='components.home_page.advantage.image'
            data-template-section='description'
            data-template-component='components.home_page.advantage.image'
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={advantageImage}
              alt='Why choose us'
              className='h-full min-h-[560px] w-full object-cover'
            />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/38 via-transparent to-transparent' />
            <div className='absolute bottom-6 left-[-14px] rounded-full bg-[#f4b400] px-6 py-5 text-center text-white shadow-lg'>
              <p
                className='text-[42px] font-extrabold leading-none'
                data-template-path='components.home_page.advantage.badgeValue'
                data-template-section='description'
              >
                {advantageBadgeValue}
              </p>
              <p
                className='mt-1 text-[16px] leading-tight'
                data-template-path='components.home_page.advantage.badgeLabel'
                data-template-section='description'
              >
                {advantageBadgeLabel}
              </p>
            </div>
            <div
              className='absolute right-4 top-4 rounded-full border border-white/40 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#1e293b] backdrop-blur-sm'
              data-template-path='components.home_page.advantage.topTag'
              data-template-section='description'
            >
              {advantageTopTag}
            </div>
          </div>
        </div>
      </section>

      <section id='faq' className='bg-[#f3f3f3] py-12 lg:py-14'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='text-center'>
            <span className='text-sm font-semibold uppercase tracking-[0.2em] text-[#f4b400]'>
              FAQ
            </span>
            <h2 className='mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#2f3136] md:text-4xl'>
              Frequently Asked Questions
            </h2>
            <p className='mx-auto mt-3 max-w-4xl text-base text-slate-600 md:text-lg'>
              Answers to common questions about our industrial storage solutions
            </p>
          </div>

          <div className='mx-auto mt-7 max-w-6xl space-y-3'>
            {faqItems.map((faq: FaqItem, index: number) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={`${faq.question}-${index}`}
                  className='overflow-hidden rounded-xl border border-slate-200 bg-white'
                >
                  <button
                    type='button'
                    onClick={() =>
                      setOpenFaqIndex((prev) => (prev === index ? -1 : index))
                    }
                    className={`flex w-full items-center justify-between px-5 py-4 text-left text-lg font-bold tracking-[-0.01em] ${isOpen ? 'bg-[#dfe9f7] text-[#f4b400]' : 'bg-[#eceff4] text-[#2f3136]'
                      }`}
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className='h-6 w-6 text-[#35507c]' />
                    ) : (
                      <ChevronDown className='h-6 w-6 text-[#35507c]' />
                    )}
                  </button>
                  {isOpen ? (
                    <div className='px-5 py-5 text-base leading-relaxed text-slate-700'>
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
