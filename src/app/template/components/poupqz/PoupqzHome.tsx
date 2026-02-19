'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ChevronDown,
  ChevronUp,
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
} from 'lucide-react'
import type { ComponentType } from 'react'

type TemplateProduct = {
  _id?: string
  productName?: string
  defaultImages?: Array<{ url?: string }>
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

const FEATURED_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1565610222536-ef125c59da2d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1600&q=80',
]

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

function SectionHeader({
  title,
  description,
  titlePath,
  descriptionPath,
  sectionId,
}: {
  title: string
  description: string
  titlePath?: string
  descriptionPath?: string
  sectionId?: string
}) {
  return (
    <div className='mx-auto max-w-[1260px] text-center'>
      <h2
        className='text-[44px] font-semibold leading-[1.12] tracking-[-0.02em] text-[#222936] md:text-[58px]'
        data-template-path={titlePath}
        data-template-section={sectionId}
      >
        {title}
      </h2>
      <div className='mx-auto mt-4 h-[4px] w-[104px] rounded-full bg-[#0b74c6]' />
      <p
        className='mx-auto mt-7 text-[18px] leading-[1.7] text-[#1f2937] md:text-[19px]'
        data-template-path={descriptionPath}
        data-template-section={sectionId}
      >
        {description}
      </p>
    </div>
  )
}

export function PoupqzHome() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )
  const home = template?.components?.home_page || {}
  const descriptionData = home?.description || {}
  const about = template?.components?.about_page || {}
  const aboutStoryParagraphs = Array.isArray(about?.story?.paragraphs)
    ? about.story.paragraphs
    : []
  const socialFaqSection = template?.components?.social_page?.faqs || {}
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(-1)

  const featuredTitle = home?.products_heading || 'Our Featured Products'
  const featuredDescription =
    home?.products_subtitle ||
    'Explore our wide range of high-quality industrial storage solutions designed to maximise space, improve efficiency, and support heavy-duty performance.'
  const whyChooseTitle = descriptionData?.large_text || 'Why Choose Us'

  const whyChooseDescription =
    descriptionData?.summary ||
    'Experience the benefits of partnering with one of the most trusted industrial rack manufacturers.'
  const industriesTitle = about?.hero?.title || 'Industries We Deal With'

  const industriesDescription =
    about?.hero?.subtitle ||
    'Our advanced and reliable storage solutions are designed to meet the needs of industries across India.'
  const benefitsTitle = about?.story?.heading || 'Benefits of Our Products'

  const benefitsDescription =
    aboutStoryParagraphs[0] ||
    'Our storage solutions are designed to deliver long-term value to your business.'
  const faqHeading = socialFaqSection?.heading || 'Frequently Asked Questions'
  const faqSubheading =
    socialFaqSection?.subheading ||
    'Find quick answers to common queries about our products, services, and support.'

  const featuredProducts = useMemo(() => {
    const mapped = products.slice(0, 3).map((product, index) => ({
      _id: product?._id || '',
      title:
        product?.productName ||
        ['Heavy Duty Rack', 'Long Span Rack', 'Mezzanine Floor'][index] ||
        `Product ${index + 1}`,
      image:
        product?.defaultImages?.[0]?.url ||
        FEATURED_FALLBACK_IMAGES[index % FEATURED_FALLBACK_IMAGES.length],
    }))

    while (mapped.length < 3) {
      const index = mapped.length
      mapped.push({
        _id: '',
        title: ['Heavy Duty Rack', 'Long Span Rack', 'Mezzanine Floor'][index],
        image: FEATURED_FALLBACK_IMAGES[index % FEATURED_FALLBACK_IMAGES.length],
      })
    }

    return mapped
  }, [products])

  const whyChooseItems = useMemo(() => {
    const values = Array.isArray(template?.components?.about_page?.values)
      ? template.components.about_page.values
      : []
    if (!values.length) return WHY_CHOOSE_FALLBACK

    return values.slice(0, 6).map((value: any, index: number) => ({
      title: value?.title || WHY_CHOOSE_FALLBACK[index]?.title || 'Why choose us',
      description:
        value?.description ||
        WHY_CHOOSE_FALLBACK[index]?.description ||
        'Add description in template editor.',
      icon: WHY_CHOOSE_FALLBACK[index]?.icon || SquareCheckBig,
    }))
  }, [template?.components?.about_page?.values])

  const benefitItems = useMemo(() => {
    const values = Array.isArray(template?.components?.about_page?.values)
      ? template.components.about_page.values
      : []
    if (!values.length) return BENEFITS_FALLBACK

    return values.slice(0, 4).map((value: any, index: number) => ({
      title: value?.title || BENEFITS_FALLBACK[index]?.title || 'Benefit',
      description:
        value?.description ||
        BENEFITS_FALLBACK[index]?.description ||
        'Add description in template editor.',
      icon: BENEFITS_FALLBACK[index]?.icon || HandCoins,
    }))
  }, [template?.components?.about_page?.values])

  const faqItems = useMemo(() => {
    const apiFaqs = Array.isArray(socialFaqSection?.faqs)
      ? socialFaqSection.faqs
      : []
    if (!apiFaqs.length) return FAQ_FALLBACK

    return apiFaqs.slice(0, 8).map((faq: any) => ({
      question: faq?.question || 'Question',
      answer: faq?.answer || 'Answer not available.',
    }))
  }, [socialFaqSection?.faqs])

  return (
    <div className='template-home template-home-poupqz bg-[#f3f4f6]'>
      <section id='home' className='py-[8px]' />

      <section
        id='products'
        className='border-t border-slate-200 py-[64px] md:py-[78px]'
        data-template-section='products'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <SectionHeader
            title={featuredTitle}
            description={featuredDescription}
            titlePath='components.home_page.products_heading'
            descriptionPath='components.home_page.products_subtitle'
            sectionId='products'
          />

          <div className='mt-12 grid gap-6 lg:grid-cols-3'>
            {featuredProducts.map((product, index) => (
              <article
                key={`${product.title}-${index}`}
                className='overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
              >
                <Link
                  href={
                    vendorId && product._id
                      ? `/template/${vendorId}/product/${product._id}`
                      : vendorId
                        ? `/template/${vendorId}/all-products`
                        : '#'
                  }
                  className='block'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.title}
                    className='h-[300px] w-full object-cover'
                  />
                  <div className='px-5 py-5'>
                    <h3 className='text-[24px] font-medium leading-[1.25] text-[#111827]'>
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
        id='about-us'
        className='border-t border-slate-200 py-[64px] md:py-[78px]'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <SectionHeader
            title={whyChooseTitle}
            description={whyChooseDescription}
            titlePath='components.home_page.description.large_text'
            descriptionPath='components.home_page.description.summary'
            sectionId='description'
          />

          <div className='mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3'>
            {whyChooseItems.map((item: WhyChooseItem, index: number) => {
              const Icon = item.icon
              return (
                <article key={`${item.title}-${index}`} className='space-y-3'>
                  <Icon className='h-7 w-7 text-[#1f2937]' />
                  <h3
                    className='text-[22px] font-medium leading-[1.3] text-[#1f2937]'
                    data-template-path={`components.about_page.values.${index}.title`}
                    data-template-section='description'
                  >
                    {item.title}
                  </h3>
                  <p
                    className='text-[18px] leading-[1.75] text-[#1f2937]'
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

      <section
        id='industries'
        className='border-t border-slate-200 py-[64px] md:py-[78px]'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <SectionHeader
            title={industriesTitle}
            description={industriesDescription}
            titlePath='components.about_page.hero.title'
            descriptionPath='components.about_page.hero.subtitle'
            sectionId='description'
          />

          <div className='mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4'>
            {INDUSTRY_FALLBACK.map((item: IndustryItem, index: number) => {
              const Icon = item.icon
              return (
                <article
                  key={`${item.title}-${index}`}
                  className='rounded-[8px] border border-slate-200 bg-[#f5f6f8] px-7 py-8 text-center shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                >
                  <div className='mx-auto flex h-14 w-14 items-center justify-center text-[#0b74c6]'>
                    <Icon className='h-10 w-10' />
                  </div>
                  <h3 className='mt-4 text-[22px] font-medium leading-[1.3] text-[#1f2937]'>
                    {item.title}
                  </h3>
                  <p className='mt-3 text-[17px] leading-[1.7] text-[#334155]'>{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id='benefits'
        className='border-t border-slate-200 py-[64px] md:py-[78px]'
        data-template-section='description'
      >
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <SectionHeader
            title={benefitsTitle}
            description={benefitsDescription}
            titlePath='components.about_page.story.heading'
            descriptionPath='components.about_page.story.paragraphs.0'
            sectionId='description'
          />

          <div className='mt-12 grid gap-6 md:grid-cols-2'>
            {benefitItems.map((item: BenefitItem, index: number) => {
              const Icon = item.icon
              return (
                <article
                  key={`${item.title}-${index}`}
                  className='rounded-[8px] border border-slate-200 bg-[#f5f6f8] px-7 py-8 shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                >
                  <div className='flex items-start gap-4'>
                    <Icon className='mt-1 h-10 w-10 shrink-0 text-[#0b74c6]' />
                    <div>
                      <h3 className='text-[22px] font-medium leading-[1.3] text-[#1f2937]'>
                        {item.title}
                      </h3>
                      <p className='mt-3 text-[17px] leading-[1.7] text-[#334155]'>{item.description}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section id='faq' className='border-t border-slate-200 py-[64px] md:py-[78px]'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <SectionHeader
            title={faqHeading}
            description={faqSubheading}
            titlePath='components.social_page.faqs.heading'
            descriptionPath='components.social_page.faqs.subheading'
            sectionId='description'
          />

          <div className='mx-auto mt-12 max-w-[1220px] space-y-4'>
            {faqItems.map((faq: FaqItem, index: number) => {
              const isOpen = openFaqIndex === index
              return (
                <article
                  key={`${faq.question}-${index}`}
                  className='overflow-hidden rounded-[6px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
                >
                  <button
                    type='button'
                    onClick={() =>
                      setOpenFaqIndex((prev) => (prev === index ? -1 : index))
                    }
                    className='flex w-full items-center justify-between px-7 py-5 text-left'
                  >
                    <span
                      className='pr-4 text-[18px] font-medium leading-[1.45] text-[#111827]'
                      data-template-path={`components.social_page.faqs.faqs.${index}.question`}
                      data-template-section='description'
                    >
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className='h-6 w-6 shrink-0 text-[#1f2937]' />
                    ) : (
                      <ChevronDown className='h-6 w-6 shrink-0 text-[#1f2937]' />
                    )}
                  </button>

                  {isOpen ? (
                    <div
                      className='border-t border-slate-200 px-7 py-5 text-[16px] leading-[1.75] text-slate-700'
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

          {vendorId ? (
            <div className='mt-10 text-center'>
              <Link
                href={`/template/${vendorId}/all-products`}
                className='inline-flex rounded-[10px] bg-[#0b74c6] px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-[#085ea0]'
              >
                Explore All Products
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
