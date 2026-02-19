'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
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

type TemplateProduct = {
  _id?: string
  productName?: string
  defaultImages?: Array<{ url?: string }>
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

const PRODUCT_BADGES = ['Featured', 'New', 'Popular']

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
  {
    title: 'Enhanced Safety Standards',
    description:
      'Robust construction designed to protect inventory and personnel alike.',
    icon: 'safety',
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

const splitStorageWord = (title: string) => {
  const match = title.match(/storage/i)
  if (!match || typeof match.index !== 'number') {
    return {
      before: title,
      highlighted: '',
      after: '',
    }
  }

  const start = match.index
  const end = start + match[0].length

  return {
    before: title.slice(0, start),
    highlighted: title.slice(start, end),
    after: title.slice(end),
  }
}

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
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor || {})
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  const home = template?.components?.home_page || {}
  const aboutPage = template?.components?.about_page || {}
  const socialFaqSection = template?.components?.social_page?.faqs || {}

  const heroTitle =
    home?.header_text || 'Enhancing Storage Efficiency with Durable Racking Systems'
  const heroSubtitle =
    home?.header_text_small ||
    'We design and manufacture robust storage solutions that optimize your space and improve operational productivity.'
  const heroKicker = home?.hero_kicker || 'Reliable Industrial Storage Solutions'
  const heroImage =
    home?.backgroundImage ||
    template?.previewImage ||
    products?.[0]?.defaultImages?.[0]?.url ||
    FALLBACK_PRODUCT_IMAGES[0]

  const featuredHeading = home?.products_heading || 'Featured Products'
  const featuredSubtitle =
    home?.products_subtitle ||
    'Explore our innovative conveyor systems designed for reliability and efficiency'

  const featuredProducts = useMemo(() => {
    const productCards = products.slice(0, 3).map((product, index) => ({
      _id: product?._id,
      title: product?.productName || `Product ${index + 1}`,
      image:
        product?.defaultImages?.[0]?.url ||
        FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length],
    }))

    if (productCards.length >= 3) return productCards

    while (productCards.length < 3) {
      const index = productCards.length
      productCards.push({
        _id: '',
        title: ['Slotted Angle Racks', 'Steel Mezzanine Floor', 'Warehouse Mezzanine Floors'][
          index
        ],
        image: FALLBACK_PRODUCT_IMAGES[index % FALLBACK_PRODUCT_IMAGES.length],
      })
    }

    return productCards
  }, [products])

  const benefits = useMemo(() => {
    const values = Array.isArray(aboutPage?.values) ? aboutPage.values : []
    if (!values.length) return FALLBACK_BENEFITS

    return values.slice(0, 4).map((item: any, index: number) => ({
      title: item?.title || FALLBACK_BENEFITS[index]?.title || 'Benefit',
      description:
        item?.description ||
        FALLBACK_BENEFITS[index]?.description ||
        'Add benefit details from template editor.',
      icon:
        (['space', 'custom', 'durable', 'safety'][index] as BenefitIconKey) ||
        'space',
    }))
  }, [aboutPage?.values])

  const advantages = useMemo(() => {
    const values = Array.isArray(aboutPage?.values) ? aboutPage.values : []
    if (!values.length) return FALLBACK_ADVANTAGES

    return values.slice(0, 4).map((item: any, index: number) => ({
      title: item?.title || FALLBACK_ADVANTAGES[index]?.title || 'Why choose us',
      description:
        item?.description ||
        FALLBACK_ADVANTAGES[index]?.description ||
        'Add details in template editor.',
      icon:
        (['expertise', 'tailored', 'support', 'quality'][index] as AdvantageIconKey) ||
        'expertise',
    }))
  }, [aboutPage?.values])

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

  const aboutImage =
    aboutPage?.story?.image ||
    products?.[1]?.defaultImages?.[0]?.url ||
    FALLBACK_PRODUCT_IMAGES[1]

  const businessName = template?.business_name || vendor?.name || 'Storage Solution'
  const headingParts = splitStorageWord(heroTitle)

  return (
    <div className='template-home template-home-mquiq bg-[#f3f3f3] text-[#2d3138]'>
      <section id='home' className='bg-[#f4b400]' data-template-section='hero'>
        <div className='mx-auto grid max-w-[1320px] gap-6 px-4 py-8 md:px-8 lg:grid-cols-[1fr_1fr] lg:py-10'>
          <div className='relative overflow-hidden rounded-[10px] bg-gradient-to-br from-[#54503d] via-[#645b41] to-[#736342] px-7 py-8 text-white lg:px-9 lg:py-10'>
            <span
              className='inline-flex items-center rounded-sm border-l-4 border-[#f4b400] bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white'
              data-template-path='components.home_page.hero_kicker'
              data-template-section='hero'
            >
              {heroKicker}
            </span>

            <h1
              className='mt-6 text-4xl font-extrabold leading-[1.05] tracking-[-0.02em] text-white md:text-5xl xl:text-[76px]'
              data-template-path='components.home_page.header_text'
              data-template-section='hero'
            >
              {headingParts.before}
              {headingParts.highlighted ? (
                <span className='bg-gradient-to-r from-[#f7b500] via-[#ff9f2c] to-[#ff6a3a] bg-clip-text text-transparent'>
                  {headingParts.highlighted}
                </span>
              ) : null}
              {headingParts.after}
            </h1>

            <p
              className='mt-5 max-w-xl text-base leading-[1.6] text-white/90 md:text-lg'
              data-template-path='components.home_page.header_text_small'
              data-template-section='hero'
            >
              {heroSubtitle}
            </p>

            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <Link
                href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                className='inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2d3138] transition hover:bg-[#f5f5f5]'
                data-template-path='components.home_page.button_header'
                data-template-section='hero'
              >
                {home?.button_header || 'Explore Products'}
              </Link>
              <span className='inline-flex items-center gap-2 text-sm font-medium text-white/85'>
                <RefreshCw className='h-4 w-4' />
                Trusted by industrial teams
              </span>
            </div>
          </div>

          <div className='relative overflow-hidden rounded-[20px] border-4 border-[#f6cb55] bg-[#f4b400]'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={`${businessName} hero`}
              className='h-full min-h-[380px] w-full object-cover'
              data-template-path='components.home_page.backgroundImage'
              data-template-section='branding'
              data-template-component='components.home_page.backgroundImage'
            />
            <div className='absolute right-4 top-8 rounded-2xl bg-white px-6 py-5 shadow-xl'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef3f8] text-[#f4b400]'>
                  <RefreshCw className='h-5 w-5' />
                </div>
                <div>
                  <p className='text-3xl font-extrabold leading-none text-[#2d3138]'>
                    24/7
                  </p>
                  <p className='mt-1 text-sm text-slate-600'>reliable operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id='products'
        className='bg-[#f3f3f3] py-16 lg:py-20'
        data-template-section='products'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='text-center'>
            <span className='inline-flex rounded-full bg-[#dbe6f4] px-6 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#f4b400]'>
              {home?.products_kicker || 'Our Solutions'}
            </span>
            <h2
              className='mt-5 text-4xl font-extrabold tracking-[-0.02em] text-[#2f3136] md:text-5xl'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {featuredHeading}
            </h2>
            <p
              className='mx-auto mt-4 max-w-4xl text-base text-slate-500 md:text-lg'
              data-template-path='components.home_page.products_subtitle'
              data-template-section='products'
            >
              {featuredSubtitle || featuredHeading}
            </p>
          </div>

          <div className='mt-12 grid gap-7 lg:grid-cols-3'>
            {featuredProducts.map((product, index) => (
              <article
                key={`${product.title}-${index}`}
                className='overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm'
              >
                <Link
                  href={
                    vendorId && product?._id
                      ? `/template/${vendorId}/product/${product._id}`
                      : vendorId
                        ? `/template/${vendorId}/all-products`
                        : '#'
                  }
                  className='block'
                >
                  <div className='relative aspect-[16/10] overflow-hidden bg-slate-100'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.title}
                      className='h-full w-full object-cover transition duration-300 hover:scale-[1.03]'
                    />
                    <span className='absolute left-4 top-4 rounded-md bg-[#f4b400] px-4 py-2 text-sm font-bold text-white'>
                      {PRODUCT_BADGES[index] || 'Featured'}
                    </span>
                  </div>
                  <div className='px-6 py-5'>
                    <h3 className='text-3xl font-extrabold tracking-[-0.01em] text-[#2f3136]'>
                      {product.title}
                    </h3>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id='why-us'
        className='bg-[#f4b400] py-16 lg:py-20'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='text-center'>
            <span className='text-sm font-semibold uppercase tracking-[0.22em] text-white/90'>
              Benefits
            </span>
            <h2 className='mt-4 text-4xl font-extrabold tracking-[-0.02em] text-white md:text-5xl'>
              Why Our Storage Solutions Stand Apart
            </h2>
            <p className='mx-auto mt-4 max-w-4xl text-base text-white/95 md:text-lg'>
              Trusted advantages that enhance your storage management and operational efficiency
            </p>
          </div>

          <div className='mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
            {benefits.map((item: BenefitItem, index: number) => (
              <article
                key={`${item.title}-${index}`}
                className='rounded-xl bg-[#f4be1e] px-7 py-8 text-center shadow-sm'
              >
                <div className='mx-auto flex h-16 w-16 items-center justify-center'>
                  {getBenefitIcon(item.icon)}
                </div>
                <h3
                  className='mt-5 text-3xl font-extrabold tracking-[-0.01em] text-white'
                  data-template-path={`components.about_page.values.${index}.title`}
                  data-template-section='description'
                >
                  {item.title}
                </h3>
                <p
                  className='mt-4 text-base leading-relaxed text-white/95'
                  data-template-path={`components.about_page.values.${index}.description`}
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
        className='bg-[#f3f3f3] py-16 lg:py-20'
        data-template-section='description'
      >
        <div className='mx-auto grid max-w-[1320px] gap-8 px-4 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start'>
          <div>
            <span className='text-sm font-semibold uppercase tracking-[0.2em] text-[#f4b400]'>
              Why Choose Us
            </span>
            <h2 className='mt-4 text-4xl font-extrabold leading-tight tracking-[-0.02em] text-[#2f3136] md:text-5xl'>
              The {businessName} Advantage
            </h2>

            <div className='mt-8 space-y-7'>
              {advantages.map((item: AdvantageItem, index: number) => (
                <article key={`${item.title}-${index}`} className='flex gap-4'>
                  <div className='mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e6edf5]'>
                    {getAdvantageIcon(item.icon)}
                  </div>
                  <div>
                    <h3
                      className='text-3xl font-extrabold tracking-[-0.01em] text-[#2f3136]'
                      data-template-path={`components.about_page.values.${index}.title`}
                      data-template-section='description'
                    >
                      {item.title}
                    </h3>
                    <p
                      className='mt-2 text-base leading-relaxed text-slate-600'
                      data-template-path={`components.about_page.values.${index}.description`}
                      data-template-section='description'
                    >
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className='relative overflow-hidden rounded-[14px] border border-slate-200 bg-white'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={aboutImage}
              alt='Warehouse storage'
              className='h-full min-h-[640px] w-full object-cover'
              data-template-path='components.about_page.story.image'
              data-template-section='description'
              data-template-component='components.about_page.story.image'
            />
            <div className='absolute bottom-8 left-[-18px] rounded-full bg-[#f4b400] px-8 py-7 text-center text-white shadow-lg'>
              <p className='text-[52px] font-extrabold leading-none'>1+</p>
              <p className='mt-2 text-[20px] leading-tight'>Years of Excellence</p>
            </div>
          </div>
        </div>
      </section>

      <section id='faq' className='bg-[#f3f3f3] py-16 lg:py-20'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='text-center'>
            <span className='text-sm font-semibold uppercase tracking-[0.2em] text-[#f4b400]'>
              FAQ
            </span>
            <h2 className='mt-4 text-4xl font-extrabold tracking-[-0.02em] text-[#2f3136] md:text-5xl'>
              Frequently Asked Questions
            </h2>
            <p className='mx-auto mt-3 max-w-4xl text-base text-slate-600 md:text-lg'>
              Answers to common questions about our industrial storage solutions
            </p>
          </div>

          <div className='mx-auto mt-10 max-w-6xl space-y-4'>
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
                    className={`flex w-full items-center justify-between px-6 py-5 text-left text-xl font-bold tracking-[-0.01em] ${
                      isOpen ? 'bg-[#dfe9f7] text-[#f4b400]' : 'bg-[#eceff4] text-[#2f3136]'
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
                    <div className='px-6 py-6 text-base leading-relaxed text-slate-700'>
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
