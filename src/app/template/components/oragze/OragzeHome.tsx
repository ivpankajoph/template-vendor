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
  ShoppingCart,
  RotateCcw,
  Banknote,
  Tags,
} from 'lucide-react'
import { getTemplateAuth, templateApiFetch } from '../templateAuth'

type TemplateProduct = {
  _id?: string
  productName?: string
  shortDescription?: string
  brand?: string
  defaultImages?: Array<{ url?: string }>
  productCategory?: { _id?: string; name?: string; title?: string; categoryName?: string } | string
  productCategoryName?: string
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

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const getCategoryLabel = (product: TemplateProduct) => {
  if (product.productCategoryName) return product.productCategoryName
  if (typeof product.productCategory === 'string') {
    return /^[a-f\d]{24}$/i.test(product.productCategory) ? '' : product.productCategory
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
    return /^[a-f\d]{24}$/i.test(product.productCategory) ? product.productCategory : undefined
  }
  return product.productCategory?._id
}

const toNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString('en-IN')}`

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

type FaqItem = {
  question: string
  answer: string
}

type ProductCard = {
  _id: string
  variantId: string
  title: string
  image: string
  price: number
  oldPrice: number
  discountPercent: number
  rating: number
  reviews: number
  stockQuantity: number
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
    variantId: '',
    title: 'Greek Style Plain Yogurt',
    image:
      'https://images.unsplash.com/photo-1571212515416-fca88d63f89c?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    discountPercent: 25,
    rating: 4.5,
    reviews: 222,
    stockQuantity: 10,
  },
  {
    _id: '',
    variantId: '',
    title: 'Pure Squeezed No Pulp Orange Juice',
    image:
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    discountPercent: 25,
    rating: 4.5,
    reviews: 222,
    stockQuantity: 10,
  },
  {
    _id: '',
    variantId: '',
    title: 'Fresh Oranges',
    image:
      'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    discountPercent: 25,
    rating: 4.5,
    reviews: 222,
    stockQuantity: 10,
  },
  {
    _id: '',
    variantId: '',
    title: 'Gourmet Dark Chocolate Bars',
    image:
      'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=1200&q=80',
    price: 18,
    oldPrice: 24,
    discountPercent: 25,
    rating: 4.5,
    reviews: 222,
    stockQuantity: 10,
  },
]




export function OragzeHome() {
  const params = useParams()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const products = useSelector(
    (state: any) => (state?.alltemplatepage?.products || []) as TemplateProduct[]
  )

  const home = template?.components?.home_page || {}

  const heroTitle = home?.header_text || 'Organic Foods at your Doorsteps'
  const heroSubtitle =
    home?.header_text_small || 'Dignissim massa diam elementum. Trusted freshness, delivered daily.'
  const heroButtonPrimary = home?.button_header || 'START SHOPPING'
  const heroButtonSecondary = home?.button_secondary || 'JOIN NOW'
  const productsHeading = home?.products_heading || 'Featured products'
  const productsSubtitle =
    home?.products_subtitle || 'Shop curated organic picks and seasonal essentials.'
  const heroImage = home?.backgroundImage || FALLBACK_HERO_IMAGE

  const featuredProducts = useMemo(() => {
    const mapped = products.slice(0, 8).map((product: TemplateProduct, index: number) => {
      const pricing = getProductPriceDetails(product)
      const primaryVariant = getPrimaryVariant(product)
      const stockQuantity = toNumber(primaryVariant?.stockQuantity)

      return {
        _id: String(product?._id || ''),
        variantId: primaryVariant?._id || '',
        title: product?.productName || `Product ${index + 1}`,
        image: getProductImage(product, FALLBACK_PRODUCTS[index % FALLBACK_PRODUCTS.length].image),
        price: pricing.finalPrice || 18,
        oldPrice: pricing.actualPrice || (pricing.finalPrice ? pricing.finalPrice + 6 : 24),
        discountPercent: pricing.discountPercent,
        rating: 4.5,
        reviews: 222,
        stockQuantity: stockQuantity,
      } satisfies ProductCard
    })

    if (mapped.length === 0) {
      return FALLBACK_PRODUCTS.map((fallback: ProductCard, index: number) => ({
        ...fallback,
        variantId: '',
        discountPercent: 0,
        stockQuantity: 10,
      }))
    }

    return mapped
  }, [products])

  const handleAddToCart = async (product: Partial<ProductCard>) => {
    setActionMessage('')

    if (!vendorId || !product?._id) return
    const auth = getTemplateAuth(vendorId)
    if (!auth?.token) {
      window.location.href = `/template/${vendorId}/login?next=/template/${vendorId}/all-products`
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
      setActionMessage('Added to cart successfully.')
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to add to cart.')
    } finally {
      setAddingId(null)
    }
  }



  const categories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string }>()
    products.forEach((product) => {
      const name = getCategoryLabel(product)
      if (name && !map.has(name)) {
        map.set(name, {
          id: getCategoryId(product) || name,
          name,
          image: getProductImage(product, 'https://images.unsplash.com/photo-1571212515416-fca88d63f89c?auto=format&fit=crop&w=300&q=80')
        })
      }
    })
    const list = Array.from(map.values())
    if (list.length > 0) return list.slice(0, 10)
    
    return [
      { id: '1', name: 'Ethnic Wear', image: 'https://images.unsplash.com/photo-1583391733958-623bb58be0a5?auto=format&fit=crop&w=300&q=80' },
      { id: '2', name: 'Western Dresses', image: 'https://images.unsplash.com/photo-1550639525-c97d455acf70?auto=format&fit=crop&w=300&q=80' },
      { id: '3', name: 'Menswear', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80' },
      { id: '4', name: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80' },
      { id: '5', name: 'Home Decor', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80' },
      { id: '6', name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80' },
      { id: '7', name: 'Accessories', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=300&q=80' },
    ]
  }, [products])

  return (
    <div className='template-home template-home-oragze bg-[#f3f4f6] text-[#222936]'>
      <section id='hero' className='bg-white border-b border-slate-200' data-template-section='hero'>
        <div className='mx-auto max-w-[1320px] px-4 py-8 md:px-8'>
          
          {/* Circular Categories */}
          <div className='mb-10 flex gap-4 md:gap-7 overflow-x-auto pb-4 no-scrollbar items-start'>
            {categories.map((cat, idx) => (
              <Link
                key={`${cat.id}-${idx}`}
                href={vendorId ? `/template/${vendorId}/category/${toSlug(cat.name)}` : '#'}
                className='group flex flex-col items-center min-w-[70px] md:min-w-[90px] shrink-0'
              >
                <div className='h-[70px] w-[70px] overflow-hidden rounded-full border border-pink-100 bg-white shadow-sm md:h-[90px] md:w-[90px] p-0.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:border-pink-300'>
                   <img
                     src={cat.image}
                     alt={cat.name}
                     className='h-full w-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500'
                   />
                </div>
                <span className='mt-3 text-center text-[12px] font-semibold text-slate-700 md:text-[14px] leading-tight group-hover:text-pink-600 transition-colors px-1 max-w-full'>
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>

          {/* Banner Hero */}
          <div className='relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#ffd391] to-[#ffbda8] shadow-sm'>
            <div className='flex flex-col md:flex-row items-center justify-between'>
              <div className='p-8 md:p-12 lg:pl-16 lg:w-3/5 space-y-5'>
                 <h1
                   className='text-[34px] font-extrabold leading-[1.1] tracking-tight text-red-700 md:text-[52px]'
                   data-template-path='components.home_page.header_text'
                   data-template-section='hero'
                 >
                   {heroTitle}
                 </h1>
                 <p
                   className='text-[17px] font-semibold text-amber-900/80 md:text-[20px]'
                   data-template-path='components.home_page.header_text_small'
                   data-template-section='hero'
                 >
                   {heroSubtitle}
                 </p>
                 <Link
                   href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                   className='inline-block mt-4 rounded-md bg-white px-8 py-3.5 text-[17px] font-bold tracking-wide text-red-600 shadow-lg transition-transform hover:-translate-y-1 hover:scale-105 duration-300'
                 >
                   {heroButtonPrimary}
                 </Link>
              </div>
              <div className='h-[250px] w-full md:h-[420px] md:w-2/5'>
                 <img
                   src={heroImage}
                   alt={heroTitle}
                   className='h-full w-full object-cover object-center'
                   data-template-path='components.home_page.backgroundImage'
                   data-template-section='branding'
                 />
              </div>
            </div>
          </div>

          {/* Feature Strip */}
          <div className='mx-auto mt-8 flex max-w-[850px] flex-wrap items-center justify-around gap-4 rounded-xl border border-pink-100 bg-pink-50/50 px-6 py-4 shadow-sm backdrop-blur-sm'>
            <div className='flex items-center gap-3 group transition-transform hover:scale-110 cursor-default'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600 group-hover:animate-pulse'>
                <RotateCcw className='h-5 w-5' />
              </div>
              <span className='text-[14px] font-bold text-slate-800 md:text-[16px]'>7 Days Easy Return</span>
            </div>
            <div className='hidden w-px h-8 bg-slate-300 md:block'></div>
            <div className='flex items-center gap-3 group transition-transform hover:scale-110 cursor-default'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 group-hover:animate-bounce'>
                <Banknote className='h-5 w-5' />
              </div>
              <span className='text-[14px] font-bold text-slate-800 md:text-[16px]'>Cash on Delivery</span>
            </div>
            <div className='hidden w-px h-8 bg-slate-300 md:block'></div>
            <div className='flex items-center gap-3 group transition-transform hover:scale-110 cursor-default'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 group-hover:animate-spin'>
                <Tags className='h-5 w-5' />
              </div>
              <span className='text-[14px] font-bold text-slate-800 md:text-[16px]'>Lowest Prices</span>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-[#f1f2ef] py-14 md:py-16'>
        <div className='mx-auto grid max-w-[1320px] gap-7 px-4 md:px-8 lg:grid-cols-[1.4fr_1fr]'>
          <article className='relative overflow-hidden rounded-sm'>
            <img 
              src={FALLBACK_PROMO_IMAGES[0]}
              alt='Items on sale'
              className='h-full min-h-[400px] w-full object-cover transition-transform duration-700 hover:scale-105'
            /> 
            <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent' />
            <div className='absolute left-8 bottom-10'>
              <h3 className='text-[28px] font-bold leading-[1.02] tracking-tight text-white md:text-[36px]'>
                Items on SALE
              </h3>
              <p className='mt-2 text-[16px] font-medium text-white/90 md:text-[20px]'>
                Discounts up to 30%
              </p>
              <Link
                href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                className='mt-5 inline-flex items-center gap-2 border-b-2 border-white pb-1 text-[16px] font-bold tracking-wide text-white transition hover:gap-4'
              >
                SHOP NOW
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

          </article>

          <div className='grid gap-7'>
            <article className='relative overflow-hidden rounded-sm'>
              <img
                src={FALLBACK_PROMO_IMAGES[1]}
                alt='Combo offers'
                className='h-full min-h-[190px] w-full object-cover transition-transform duration-700 hover:scale-105'
              />
              <div className='absolute inset-0 bg-gradient-to-r from-blue-900/40 to-transparent' />
              <div className='absolute left-6 top-1/2 -translate-y-1/2 text-white'>
                <h3 className='text-[24px] font-bold leading-tight md:text-[30px]'>
                  Combo Offers
                </h3>
                <p className='mt-1 text-[16px] font-medium text-white/90'>
                  Up to 50% Off
                </p>
                <Link
                  href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                  className='mt-4 inline-flex items-center gap-1 border-b border-white pb-0.5 text-[14px] font-bold transition hover:gap-2'
                > 
                  SHOP NOW
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </article>


            <article className='relative overflow-hidden rounded-sm'>
              <img
                src={FALLBACK_PROMO_IMAGES[2]}
                alt='Discount coupons'
                className='h-full min-h-[190px] w-full object-cover transition-transform duration-700 hover:scale-105'
              />
              <div className='absolute inset-0 bg-gradient-to-r from-teal-900/40 to-transparent' />
              <div className='absolute left-6 top-1/2 -translate-y-1/2 text-white'>
                <h3 className='text-[24px] font-bold leading-tight md:text-[30px]'>
                  Exclusive Coupons
                </h3>
                <p className='mt-1 text-[16px] font-medium text-white/90'>
                  Extra 40% Off
                </p>
                <Link
                  href={vendorId ? `/template/${vendorId}/all-products` : '#'}
                  className='mt-4 inline-flex items-center gap-1 border-b border-white pb-0.5 text-[14px] font-bold transition hover:gap-2'
                >
                  COLLECT NOW
                  <ChevronRight className="h-4 w-4" />
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

          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
            {featuredProducts.map((product: ProductCard, index: number) => (
              <article key={`${product.title}-${index}`} className='flex flex-col group overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl'>
                <Link
                  href={
                    product._id
                      ? `/template/${vendorId}/product/${product._id}`
                      : vendorId
                        ? `/template/${vendorId}/all-products`
                        : '#'
                  }
                  className='block overflow-hidden relative aspect-square bg-slate-50'
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className='h-full w-full object-contain transition duration-500 group-hover:scale-105 p-6'
                  />
                  {product.discountPercent > 0 && (
                    <div className="absolute top-0 left-0 bg-red-600 text-white text-[12px] font-black px-3 py-1 lg:py-1.5 tracking-tight">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white shadow-lg text-pink-600">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
                <div className='flex flex-col flex-grow p-4'>
                  <Link
                    href={
                      product._id
                        ? `/template/${vendorId}/product/${product._id}`
                        : vendorId
                          ? `/template/${vendorId}/all-products`
                          : '#'
                    }
                    className='line-clamp-2 min-h-[40px] text-[15px] font-medium leading-[1.3] text-slate-800 hover:text-pink-600 transition-colors'
                  >
                    {product.title}
                  </Link>

                  <div className='mt-1.5 flex items-center gap-1'>
                    <div className='flex items-center text-amber-500'>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className='text-[12px] text-slate-500 font-medium'>({product.reviews})</span>
                  </div>

                  <div className='mt-2.5 flex items-baseline gap-2'>
                    <span className='text-[22px] font-black text-slate-900'>
                      {formatPrice(product.price)}
                    </span>
                    {product.oldPrice > product.price ? (
                      <span className='text-[14px] text-slate-400 line-through font-medium'>
                        {formatPrice(product.oldPrice)}
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="mt-1 flex items-center gap-1.5 uppercase text-[11px] font-black text-green-600">
                    <Truck className="h-3.5 w-3.5" />
                    FREE DELIVERY
                  </div>

                  <div className='mt-4 mt-auto space-y-2'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.preventDefault()
                        handleAddToCart(product)
                      }}
                      disabled={
                        !product?._id ||
                        !product?.variantId ||
                        product.stockQuantity <= 0 ||
                        addingId === product._id
                      }
                      className='flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 py-2.5 text-[14px] font-black text-white transition hover:bg-pink-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
                    >
                      {addingId === product._id ? (
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className='h-4 w-4' />
                      )}
                      {addingId === product._id ? 'ADDING...' : product.stockQuantity > 0 || !product._id ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    {product.stockQuantity < 10 && product.stockQuantity > 0 && product._id ? (
                      <p className='text-center text-[10px] font-black text-red-600 uppercase tracking-tighter'>Only {product.stockQuantity} items left!</p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {actionMessage ? <p className='col-span-full mt-6 rounded-md bg-white p-3 text-center text-[15px] font-semibold text-slate-700 shadow-sm border border-slate-200'>{actionMessage}</p> : null}
        </div>
      </section>

      <section className='bg-white py-14'>
        <div className='mx-auto max-w-[1320px] px-4 md:px-8'>
          <div className='relative overflow-hidden rounded-3xl bg-slate-900'>
            <div className='absolute inset-0 opacity-40 mix-blend-overlay'>
              <img
                src={FALLBACK_BANNER_IMAGE}
                alt='Subscription discount'
                className='h-full w-full object-cover'
              />
            </div>
            <div className='relative grid items-center gap-12 p-8 md:grid-cols-2 md:p-16 lg:gap-20'>
              <div className='text-white'>
                <div className='inline-block rounded-full bg-pink-600 px-4 py-1.5 text-[14px] font-bold tracking-wider'>
                  SPECIAL OFFER
                </div>
                <h3 className='mt-6 text-[40px] font-black leading-[1.1] tracking-tight md:text-[56px]'>
                  Get 25% OFF
                  <br />
                  <span className='text-pink-500'>Your First Order</span>
                </h3>
                <p className='mt-6 text-[18px] font-medium text-slate-300 md:text-[22px]'>
                  Join 10,000+ happy shoppers and get exclusive deals delivered to your inbox.
                </p>
              </div>

              <div className='rounded-2xl bg-white/10 p-1 backdrop-blur-md'>
                <form className='flex flex-col gap-4 p-6'>
                  <div className="space-y-4">
                    <input
                      type='text'
                      placeholder='Your Name'
                      className='w-full rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-[16px] text-white placeholder:text-white/60 outline-none focus:bg-white/20 transition'
                    />
                    <input
                      type='email'
                      placeholder='Email Address'
                      className='w-full rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-[16px] text-white placeholder:text-white/60 outline-none focus:bg-white/20 transition'
                    />
                  </div>
                  <button
                    type='button'
                    className='mt-2 w-full rounded-xl bg-pink-600 px-6 py-4 text-[18px] font-black text-white shadow-xl shadow-pink-600/20 transition hover:bg-pink-500 hover:scale-[1.02] active:scale-95'
                  >
                    Claim Discount
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>



    </div>
  )
}
