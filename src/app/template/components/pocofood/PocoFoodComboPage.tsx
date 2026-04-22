'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import {
  ArrowRight,
  BadgePercent,
  Search,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'

import { NEXT_PUBLIC_API_URL } from '@/config/variables'
import { buildTemplateScopedPath } from '@/lib/template-route'
import { getTemplateAuth, templateApiFetch } from '../templateAuth'

type FoodStorefrontMenuItem = {
  _id?: string
  item_name?: string
  category?: string
  price?: number
  offer_price?: number
  image_url?: string
  gallery_images?: string[]
  is_available?: boolean
  variants?: Array<{
    name?: string
    price?: number
    offer_price?: number
    is_default?: boolean
    is_available?: boolean
  }>
}

type FoodStorefrontOffer = {
  _id?: string
  offer_title?: string
  offer_type?: string
  combo_price?: number
  discount_percent?: number
  flat_discount?: number
  free_item_name?: string
  min_cart_value?: number
  max_discount?: number
  coupon_code?: string
  is_active?: boolean
  combo_items?: Array<{ menu_item_id?: string; item_name?: string; quantity?: number }>
}

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith('/v1')
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`

const MENU_FALLBACKS = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1548365328-9f547fb0953a?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=700&q=80',
]

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  combo: '/pocofood-categories/combo.png',
  pizza: '/pocofood-categories/pizza.png',
  burger: '/pocofood-categories/burger.png',
  drinks: '/pocofood-categories/drinks.png',
  chicken: '/pocofood-categories/chicken.png',
  chiken: '/pocofood-categories/chicken.png',
  'box meals': '/pocofood-categories/box-meals.png',
  'kids menus': '/pocofood-categories/kids-menus.png',
}

const toNumber = (value: unknown) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString('en-IN')}`
const normalizeText = (value: unknown) => String(value || '').trim()
const getCategoryVisual = (label: string, fallback: string) =>
  CATEGORY_IMAGE_MAP[label.trim().toLowerCase()] || fallback

const getFoodMenuImage = (item?: FoodStorefrontMenuItem | null, fallback = '') => {
  const primary = normalizeText(item?.image_url)
  if (primary) return primary
  const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : []
  const firstGallery = gallery.map((image) => normalizeText(image)).find(Boolean)
  return firstGallery || fallback
}

const getFoodOfferValueLabel = (offer?: FoodStorefrontOffer | null) => {
  if (!offer) return 'Live offer'
  if (toNumber(offer.discount_percent) > 0) return `${toNumber(offer.discount_percent)}% OFF`
  if (toNumber(offer.flat_discount) > 0) return `Save ${formatPrice(offer.flat_discount)}`
  if (toNumber(offer.combo_price) > 0) return `Combo ${formatPrice(offer.combo_price)}`
  if (offer.free_item_name) return `${offer.free_item_name} free`
  if (offer.coupon_code) return `Use ${offer.coupon_code}`
  return 'Live offer'
}

const getFoodOfferFinePrint = (offer?: FoodStorefrontOffer | null) => {
  if (!offer) return 'Available for a limited time.'
  const parts = [
    offer.coupon_code ? `Coupon ${offer.coupon_code}` : '',
    toNumber(offer.min_cart_value) > 0 ? `Min order ${formatPrice(offer.min_cart_value)}` : '',
    toNumber(offer.max_discount) > 0 ? `Max discount ${formatPrice(offer.max_discount)}` : '',
  ].filter(Boolean)
  return parts.join(' | ') || 'Available on eligible food orders.'
}

const getComboOfferItems = (
  offer: FoodStorefrontOffer,
  menuItems: FoodStorefrontMenuItem[],
) =>
  (Array.isArray(offer?.combo_items) ? offer.combo_items : [])
    .map((comboItem, index) => {
      const comboName = normalizeText(comboItem?.item_name)
      const comboMenuId = normalizeText(comboItem?.menu_item_id)
      const matchedMenuItem =
        menuItems.find((item) => normalizeText(item?._id) === comboMenuId) ||
        menuItems.find(
          (item) => normalizeText(item?.item_name).toLowerCase() === comboName.toLowerCase(),
        ) ||
        null
      const name = comboName || normalizeText(matchedMenuItem?.item_name) || `Combo item ${index + 1}`
      const category = normalizeText(matchedMenuItem?.category) || name || 'combo'
      const variants = Array.isArray(matchedMenuItem?.variants) ? matchedMenuItem.variants : []
      const primaryVariant =
        variants.find((variant) => variant?.is_default && variant?.is_available !== false) ||
        variants.find((variant) => variant?.is_available !== false) ||
        variants[0] ||
        null
      const actualPrice = toNumber(primaryVariant?.price) || toNumber(matchedMenuItem?.price)
      const offerPrice =
        toNumber(primaryVariant?.offer_price) ||
        toNumber(matchedMenuItem?.offer_price) ||
        actualPrice

      return {
        key: comboMenuId || `${name}-${index}`,
        menuItemId: normalizeText(matchedMenuItem?._id || comboMenuId),
        name,
        quantity: Math.max(1, toNumber(comboItem?.quantity) || 1),
        variantName: normalizeText(primaryVariant?.name),
        unitPrice: offerPrice || actualPrice,
        originalUnitPrice: actualPrice || offerPrice,
        image:
          getFoodMenuImage(matchedMenuItem, '') ||
          getCategoryVisual(category, MENU_FALLBACKS[index % MENU_FALLBACKS.length]),
      }
    })
    .filter((item) => item.name)

const getComboOfferTitle = (
  offer: FoodStorefrontOffer,
  comboItems: ReturnType<typeof getComboOfferItems>,
) => {
  if (!comboItems.length) return offer?.offer_title || 'Food combo'
  return comboItems
    .map((item) => `${item.quantity > 1 ? `${item.quantity} ` : ''}${item.name}`)
    .join(' + ')
}

export function PocoFoodComboPage() {
  const params = useParams()
  const pathname = usePathname()
  const vendorId = String((params as any)?.vendor_id || '')
  const [foodMenuItems, setFoodMenuItems] = useState<FoodStorefrontMenuItem[]>([])
  const [foodOffers, setFoodOffers] = useState<FoodStorefrontOffer[]>([])
  const [addingId, setAddingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [query, setQuery] = useState('')

  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })

  const allProductsPath = toTemplatePath('all-products')
  const loginPath = toTemplatePath('login')
  const cartPath = toTemplatePath('cart')
  useEffect(() => {
    let cancelled = false

    const loadFoodStorefront = async () => {
      if (!vendorId) return
      try {
        const response = await fetch(`${API_BASE}/vendors/${vendorId}/food-storefront`, {
          cache: 'no-store',
        })
        const payload = await response.json().catch(() => null)
        if (cancelled) return
        setFoodMenuItems(Array.isArray(payload?.data?.menu_items) ? payload.data.menu_items : [])
        setFoodOffers(Array.isArray(payload?.data?.offers) ? payload.data.offers : [])
      } catch {
        if (cancelled) return
        setFoodMenuItems([])
        setFoodOffers([])
      }
    }

    void loadFoodStorefront()
    return () => {
      cancelled = true
    }
  }, [vendorId])

  const visibleFoodOffers = useMemo(() => {
    const search = query.trim().toLowerCase()
    const liveOffers = foodOffers.filter((offer) => offer?.is_active !== false)
    if (!search) return liveOffers

    return liveOffers.filter((offer) => {
      const comboItems = getComboOfferItems(offer, foodMenuItems)
      const text = [
        offer?.offer_title,
        offer?.offer_type,
        offer?.free_item_name,
        offer?.coupon_code,
        getComboOfferTitle(offer, comboItems),
        ...comboItems.map((item) => item.name),
      ]
        .join(' ')
        .toLowerCase()
      return text.includes(search)
    })
  }, [foodMenuItems, foodOffers, query])

  const heroOffer = visibleFoodOffers[0] || foodOffers.find((offer) => offer?.is_active !== false) || null
  const heroComboItems = heroOffer ? getComboOfferItems(heroOffer, foodMenuItems) : []
  const heroTitle = heroOffer ? getComboOfferTitle(heroOffer, heroComboItems) : 'Fresh combo offers'

  const addOfferToCart = async (
    offer: FoodStorefrontOffer,
    comboItems: ReturnType<typeof getComboOfferItems>,
  ) => {
    setActionMessage('')
    if (!vendorId) return

    const auth = getTemplateAuth(vendorId)
    if (!auth?.token) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(pathname || allProductsPath)}`
      return
    }

    const missingItems = comboItems.filter((item) => !item.menuItemId)
    if (missingItems.length) {
      setActionMessage(
        `Combo item missing in Food Hub: ${missingItems.map((item) => item.name).join(', ')}. Please edit this offer and select items from dropdown.`,
      )
      return
    }

    const cartItems = comboItems.filter((item) => item.quantity > 0)
    if (!cartItems.length) {
      setActionMessage('Combo items not available for cart.')
      return
    }

    const offerId = normalizeText(offer?._id || offer?.offer_title || 'combo-offer')
    setAddingId(`offer-${offerId}`)
    try {
      await Promise.all(
        cartItems.map((item) =>
          templateApiFetch(vendorId, '/cart', {
            method: 'POST',
            body: JSON.stringify({
              item_type: 'food',
              food_menu_item_id: item.menuItemId,
              quantity: item.quantity,
              variant_name: item.variantName,
              selected_addons: [],
            }),
          }),
        ),
      )

      window.dispatchEvent(new CustomEvent('template-cart-updated'))
      setActionMessage(`${getComboOfferTitle(offer, comboItems)} added to cart. Combo discount will apply in cart.`)
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to add combo.')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className='template-home template-home-pocofood min-h-screen bg-[#fff8e8] text-[#171717]'>
      <section className='relative overflow-hidden border-b border-[#eadfb7] bg-[#fff8e8]'>
        <div className='absolute left-0 top-0 h-full w-full bg-[linear-gradient(135deg,#fff8e8_0%,#fffdf5_44%,#ffe6a6_100%)]' />
        <div className='absolute -right-24 top-7 h-60 w-60 rounded-full border-[36px] border-[#ffc222]/35' />
        <div className='absolute -left-20 bottom-1 h-44 w-44 rounded-full border-[28px] border-[#d94b2b]/10' />

        <div className='relative mx-auto grid min-h-[390px] max-w-[1440px] items-center gap-8 px-4 py-8 lg:grid-cols-[0.98fr_1.02fr] lg:px-10 lg:py-10'>
          <div className='max-w-3xl'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[#ffc222] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#d94b2b] shadow-[0_12px_26px_rgba(255,194,34,0.16)]'>
              <Sparkles className='h-4 w-4' />
              Combo offers
            </div>
            <h1 className='mt-4 text-[42px] font-black leading-[0.94] tracking-[-0.06em] text-[#171717] sm:text-[60px] lg:text-[72px]'>
              Today's combo
              <span className='block text-[#d94b2b]'>deals</span>
            </h1>
            <p className='mt-4 max-w-2xl text-base font-bold leading-7 text-[#5f574c]'>
              {heroTitle}. Browse every live deal in one place, add a combo to cart, and checkout with the offer discount applied.
            </p>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link
                href={allProductsPath}
                className='inline-flex items-center gap-2 rounded-full bg-[#ffc222] px-6 py-3 text-sm font-black uppercase text-[#171717] transition hover:bg-[#ffae00]'
              >
                View menu
                <ArrowRight className='h-4 w-4' />
              </Link>
              <Link
                href={cartPath}
                className='inline-flex items-center gap-2 rounded-full border border-[#171717]/15 bg-white px-6 py-3 text-sm font-black uppercase text-[#171717] transition hover:border-[#d94b2b] hover:text-[#d94b2b]'
              >
                <ShoppingBasket className='h-4 w-4' />
                Go to cart
              </Link>
            </div>
          </div>

          <div className='relative min-h-[330px]'>
            <div className='absolute inset-x-8 top-12 h-[230px] rounded-[50%] bg-[#ffc222]/55 blur-[2px]' />
            <div className='absolute right-2 top-0 z-10 rounded-full bg-[#d94b2b] px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_18px_34px_rgba(217,75,43,0.2)]'>
              {heroOffer ? getFoodOfferValueLabel(heroOffer) : 'Live offer'}
            </div>
            <div className='relative mx-auto flex h-[330px] max-w-[620px] items-center justify-center'>
              {heroComboItems.length ? (
                <div className='flex w-full items-center justify-center'>
                  {heroComboItems.slice(0, 3).map((item, index) => (
                    <div
                      key={item.key}
                      className={`relative flex shrink-0 items-center justify-center rounded-full border-[12px] border-white bg-[#fffaf0] shadow-[0_24px_42px_rgba(23,23,23,0.14)] ${
                        index === 1 ? 'h-56 w-56 z-20' : 'h-40 w-40 z-10'
                      }`}
                      style={{ marginLeft: index ? '-30px' : 0, marginTop: index === 1 ? '-12px' : '22px' }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`${index === 1 ? 'h-44 w-44' : 'h-32 w-32'} object-contain drop-shadow-[0_16px_24px_rgba(23,23,23,0.18)]`}
                      />
                      {item.quantity > 1 ? (
                        <span className='absolute right-4 top-4 rounded-full bg-[#171717] px-3 py-1 text-xs font-black text-white'>
                          x{item.quantity}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='flex h-52 w-52 items-center justify-center rounded-full border-[14px] border-white bg-[#fffaf0] shadow-[0_24px_42px_rgba(23,23,23,0.14)]'>
                  <img src='/pocofood-categories/combo.png' alt='Combo' className='h-40 w-40 object-contain' />
                </div>
              )}

              <div className='absolute bottom-0 left-4 rounded-[22px] bg-white px-5 py-4 shadow-[0_18px_36px_rgba(23,23,23,0.1)]'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-[#ffc222] text-[#171717]'>
                    <BadgePercent className='h-6 w-6' />
                  </div>
                  <div>
                    <p className='text-xs font-black uppercase tracking-[0.15em] text-[#d94b2b]'>Best combo</p>
                    <p className='max-w-[240px] truncate text-lg font-black text-[#171717]'>{heroTitle}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-[1440px] px-4 py-8 lg:px-10 lg:py-12'>
        <div className='mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <p className='text-xs font-black uppercase tracking-[0.22em] text-[#d94b2b]'>
              All offers
            </p>
            <h2 className='mt-2 text-[34px] font-black leading-none tracking-[-0.05em] text-[#171717] sm:text-[48px]'>
              Combo deals menu
            </h2>
          </div>
          <div className='relative w-full lg:max-w-md'>
            <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#d94b2b]' />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search combos, coupon, food items...'
              className='h-14 w-full rounded-full border border-[#eadfb7] bg-white pl-12 pr-5 text-sm font-bold text-[#171717] outline-none transition placeholder:text-[#7d7d7d] focus:border-[#ffc222] focus:ring-4 focus:ring-[#ffc222]/25'
            />
          </div>
        </div>

        {actionMessage ? (
          <div className='mb-6 rounded-[18px] border border-[#eadfb7] bg-white px-5 py-4 text-sm font-bold text-[#5c3324]'>
            {actionMessage}
          </div>
        ) : null}

        {visibleFoodOffers.length ? (
          <div className='grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3'>
            {visibleFoodOffers.map((offer, index) => {
              const comboItems = getComboOfferItems(offer, foodMenuItems)
              const isComboOffer = comboItems.length > 0 || offer?.offer_type === 'combo_price'
              const isComboSet = comboItems.length > 1 || comboItems.some((item) => item.quantity > 1)
              const comboTitle = getComboOfferTitle(offer, comboItems)
              const comboWorth = comboItems.reduce(
                (sum, item) => sum + toNumber(item.originalUnitPrice || item.unitPrice) * item.quantity,
                0,
              )
              const comboPrice = toNumber(offer?.combo_price)
              const comboSavings =
                comboWorth > 0 && comboPrice > 0 && comboWorth > comboPrice ? comboWorth - comboPrice : 0
              const offerId = normalizeText(offer?._id || offer?.offer_title || `offer-${index}`)
              const offerAdding = addingId === `offer-${offerId}`

              return (
                <article
                  key={offer?._id || `${offer?.offer_title || 'offer'}-${index}`}
                  className='group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#eadfb7] bg-white shadow-[0_16px_30px_rgba(23,23,23,0.055)] transition hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(23,23,23,0.09)]'
                >
                  <div className='relative bg-white px-5 pt-5'>
                    <span className='absolute left-5 top-5 z-10 rounded-full bg-[#3c1710] px-4 py-1.5 text-xs font-black uppercase text-white shadow-[0_10px_20px_rgba(60,23,16,0.18)]'>
                      {isComboOffer ? (isComboSet ? 'Combo' : 'Deal') : 'Offer'}
                    </span>
                    <div className='flex h-[178px] items-center justify-center pt-7 sm:h-[188px] lg:h-[198px]'>
                      {comboItems.length && !isComboSet ? (
                        <img
                          src={comboItems[0].image}
                          alt={comboItems[0].name}
                          className='h-[148px] w-full object-contain drop-shadow-[0_16px_28px_rgba(23,23,23,0.14)] sm:h-[156px] lg:h-[164px]'
                        />
                      ) : comboItems.length ? (
                        comboItems.slice(0, 3).map((item, itemIndex) => (
                          <div
                            key={item.key}
                            className='relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#fff8ef] sm:h-28 sm:w-28'
                            style={{ marginLeft: itemIndex ? '-18px' : 0 }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className='h-20 w-20 object-contain drop-shadow-[0_14px_24px_rgba(23,23,23,0.16)] sm:h-24 sm:w-24'
                            />
                            {item.quantity > 1 ? (
                              <span className='absolute -right-1 -top-1 rounded-full bg-[#ffc222] px-2 py-1 text-xs font-black text-[#171717]'>
                                x{item.quantity}
                              </span>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className='flex h-32 w-32 items-center justify-center rounded-full bg-[#fff8ef]'>
                          <UtensilsCrossed className='h-14 w-14 text-[#d94b2b]' />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-1 flex-col p-5 pt-4'>
                    <p className='text-xs font-black uppercase tracking-[0.18em] text-[#d94b2b]'>
                      {String(offer?.offer_type || 'offer').replace(/_/g, ' ')}
                    </p>
                    <h3 className='mt-2 min-h-[58px] text-[26px] font-black leading-[1.08] tracking-[-0.04em] text-[#171717] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:text-[28px]'>
                      {isComboOffer ? comboTitle : offer?.offer_title || 'Food offer'}
                    </h3>

                    {comboItems.length ? (
                      <div className='mt-3 flex min-h-[34px] max-h-[72px] flex-wrap gap-2 overflow-hidden'>
                        {comboItems.slice(0, 4).map((item) => (
                          <span
                            key={`${item.key}-chip`}
                            className='max-w-full truncate rounded-full bg-[#fff3cf] px-3 py-1 text-xs font-black text-[#5c3324]'
                          >
                            {item.quantity} x {item.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className='mt-3 min-h-[34px]' />
                    )}

                    <div className='mt-5 flex min-h-[38px] flex-wrap items-end justify-between gap-3'>
                      <p className='text-[30px] font-black leading-none text-[#d94b2b]'>
                        {isComboOffer && comboPrice > 0 ? formatPrice(comboPrice) : getFoodOfferValueLabel(offer)}
                      </p>
                      {comboSavings > 0 ? (
                        <p className='rounded-full bg-[#fff3cf] px-3 py-1 text-xs font-black text-[#5c3324]'>
                          Save {formatPrice(comboSavings)}
                        </p>
                      ) : null}
                    </div>

                    {comboWorth > 0 && comboPrice > 0 && comboWorth > comboPrice ? (
                      <p className='mt-2 min-h-[20px] text-sm font-bold text-[#6f6255]'>
                        Worth <span className='line-through'>{formatPrice(comboWorth)}</span>
                      </p>
                    ) : (
                      <div className='mt-2 min-h-[20px]' />
                    )}
                    <p className='mt-3 min-h-[40px] text-sm font-semibold leading-5 text-[#6f6255] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]'>
                      {getFoodOfferFinePrint(offer)}
                    </p>

                    {isComboOffer && comboItems.length ? (
                      <button
                        type='button'
                        onClick={() => void addOfferToCart(offer, comboItems)}
                        disabled={offerAdding}
                        className='mt-auto inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#ffc222] px-4 py-3 text-sm font-black uppercase text-[#171717] transition hover:bg-[#ffae00] disabled:cursor-not-allowed disabled:bg-[#eadfb7]'
                      >
                        <ShoppingBasket className='h-4 w-4' />
                        {offerAdding ? 'Adding combo...' : 'Add combo to cart'}
                      </button>
                    ) : (
                      <Link
                        href={allProductsPath}
                        className='mt-auto inline-flex w-full items-center justify-center rounded-[16px] bg-[#ffc222] px-4 py-3 text-sm font-black uppercase text-[#171717] transition hover:bg-[#ffae00]'
                      >
                        Order from menu
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className='rounded-[28px] border border-dashed border-[#eadfb7] bg-white px-6 py-16 text-center'>
            <BadgePercent className='mx-auto h-12 w-12 text-[#d94b2b]' />
            <h3 className='mt-4 text-3xl font-black tracking-[-0.04em] text-[#171717]'>
              No combo offers found
            </h3>
            <p className='mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-[#6f6255]'>
              Live deals will appear here as soon as the restaurant enables food offers.
            </p>
            <Link
              href={allProductsPath}
              className='mt-6 inline-flex rounded-full bg-[#ffc222] px-6 py-3 text-sm font-black uppercase text-[#171717] transition hover:bg-[#ffae00]'
            >
              Browse menu
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
