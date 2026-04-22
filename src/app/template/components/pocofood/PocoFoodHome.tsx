'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import {
  ArrowRight,
  Bike,
  CalendarCheck2,
  CreditCard,
  Heart,
  Leaf,
  MapPin,
  Play,
  Quote,
  Search,
  ShoppingBasket,
  Star,
  Store,
  UtensilsCrossed,
  X,
} from 'lucide-react'

import { configuredText } from '../template-content'
import { getTemplateAuth, templateApiFetch } from '../templateAuth'
import { buildTemplateScopedPath } from '@/lib/template-route'
import { getRichTextPreview } from '@/lib/rich-text'
import { NEXT_PUBLIC_API_URL } from '@/config/variables'
import {
  readPocoFoodWishlist,
  writePocoFoodWishlist,
  type PocoFoodWishlistItem,
} from './pocofood-wishlist'

type FoodStorefrontMenuItem = {
  _id?: string
  item_name?: string
  category?: string
  price?: number
  offer_price?: number
  description?: string
  image_url?: string
  gallery_images?: string[]
  food_type?: string
  is_available?: boolean
  prep_time_minutes?: number
  addons?: Array<{ name?: string; price?: number; is_free?: boolean }>
  variants?: Array<{
    name?: string
    price?: number
    offer_price?: number
    is_default?: boolean
    is_available?: boolean
  }>
}

type FoodAddonOption = {
  name?: string
  price?: number
  is_free?: boolean
}

type FoodVariantOption = {
  name?: string
  price?: number
  offer_price?: number
  is_default?: boolean
  is_available?: boolean
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

type FoodStorefrontRestaurant = {
  restaurant_name?: string
  cover_image_url?: string
  logo_url?: string
  mobile?: string
  minimum_order_amount?: number
  average_preparation_time?: number
  food_service_type?: string
  opening_hours?: Array<{
    day?: string
    open?: string
    close?: string
    is_closed?: boolean
  }>
}

type FeaturedDishCard = {
  _id: string
  slug: string
  title: string
  category: string
  foodType?: string
  image: string
  price: number
  oldPrice: number
  stockQuantity: number
  variantId: string
  href: string
  isFoodCatalogItem: boolean
  description: string
  rating: number
  foodMenuItemId?: string
  selectedVariantName?: string
  availableAddons?: FoodAddonOption[]
  availableVariants?: FoodVariantOption[]
}

function FoodTypeMark({ type }: { type?: string }) {
  const normalized = String(type || 'veg').toLowerCase().replace(/[\s-]+/g, '_')
  const isNonVeg = normalized === 'non_veg' || normalized === 'nonveg'

  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border bg-white ${
        isNonVeg ? 'border-[#d93025]' : 'border-[#229a45]'
      }`}
      title={isNonVeg ? 'Non veg' : 'Veg'}
      aria-label={isNonVeg ? 'Non veg' : 'Veg'}
    >
      <span className={`h-2 w-2 rounded-full ${isNonVeg ? 'bg-[#d93025]' : 'bg-[#229a45]'}`} />
    </span>
  )
}

type TestimonialCard = {
  name: string
  role: string
  rating: number
  text: string
  image: string
}

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith('/v1')
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80'
const MENU_FALLBACKS = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1548365328-9f547fb0953a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80',
]
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  combo: '/pocofood-categories/combo.png',
  'kids menus': '/pocofood-categories/kids-menus.png',
  pizza: '/pocofood-categories/pizza.png',
  'box meals': '/pocofood-categories/box-meals.png',
  burger: '/pocofood-categories/burger.png',
  chicken: '/pocofood-categories/chicken.png',
  chiken: '/pocofood-categories/chicken.png',
  sauces: '/pocofood-categories/sauces.png',
  drinks: '/pocofood-categories/drinks.png',
}
const NEWS_FALLBACKS = [
  'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=900&q=80',
]
const HERO_MOTION_FALLBACKS = [
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1600&q=80',
]

const fallbackTestimonials: TestimonialCard[] = [
  {
    name: 'Rose',
    role: 'Design',
    rating: 5,
    text: 'Fast delivery, sharp presentation, and the menu layout feels premium on mobile too.',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'Clara',
    role: 'Food Blogger',
    rating: 4,
    text: 'The offers and dish cards are clear enough that ordering feels frictionless from the first scroll.',
    image:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
  },
  {
    name: 'John Doe',
    role: 'Customer',
    rating: 5,
    text: 'Strong food storefront. The sections make combos, bestsellers, and recipes easy to spot.',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
]

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

const getCategoryVisual = (label: string, fallback: string) =>
  CATEGORY_IMAGE_MAP[label.trim().toLowerCase()] || fallback

const toNumber = (value: unknown) => {
  const result = Number(value)
  return Number.isFinite(result) ? result : 0
}

const formatPrice = (value: unknown) => `Rs. ${toNumber(value).toLocaleString('en-IN')}`
const configuredImage = (value: unknown, fallback: string) =>
  configuredText(value).trim() || fallback
const configuredDisplayText = (value: unknown, fallback = '') =>
  configuredText(value).trim() || fallback
const getFoodMenuImage = (item?: FoodStorefrontMenuItem | null, fallback = '') => {
  const primary = String(item?.image_url || '').trim()
  if (primary) return primary
  const gallery = Array.isArray(item?.gallery_images) ? item.gallery_images : []
  const firstGallery = gallery.map((image) => String(image || '').trim()).find(Boolean)
  return firstGallery || fallback
}

const getFoodVariantPrice = (
  variants: FoodVariantOption[] = [],
  variantName = '',
  fallbackPrice = 0,
) => {
  const normalizedVariantName = String(variantName || '').trim().toLowerCase()
  const matchedVariant =
    variants.find(
      (item) =>
        item?.is_available !== false &&
        String(item?.name || '').trim().toLowerCase() === normalizedVariantName,
    ) ||
    variants.find((item) => item?.is_default && item?.is_available !== false) ||
    variants.find((item) => item?.is_available !== false) ||
    null

  if (!matchedVariant) return fallbackPrice
  return toNumber(matchedVariant.offer_price) || toNumber(matchedVariant.price) || fallbackPrice
}

const getFoodAddonPrice = (addons: FoodAddonOption[] = [], selectedAddonNames: string[] = []) =>
  selectedAddonNames.reduce((sum, addonName) => {
    const addon = addons.find(
      (item) =>
        String(item?.name || '').trim().toLowerCase() === String(addonName || '').trim().toLowerCase(),
    )
    if (!addon || addon.is_free) return sum
    return sum + toNumber(addon.price)
  }, 0)

const getSelectedFoodAddonRecords = (
  addons: FoodAddonOption[] = [],
  selectedAddonNames: string[] = [],
) =>
  addons.filter((addon) =>
    selectedAddonNames.includes(String(addon?.name || '').trim()),
  )

const getFoodOfferDisplay = (offer?: FoodStorefrontOffer | null) => {
  if (!offer) {
    return {
      badge: 'Fresh combos this week',
      eyebrow: 'Hot fresh',
      headline: 'Chef special',
      statPrefix: 'Get upto',
      statValue: '50%',
      statSuffix: 'OFF',
      detail: 'Seasonal combos, quick delivery, and fresh kitchen picks.',
    }
  }

  const badge = String(offer.offer_title || 'Fresh combos this week').trim()
  const eyebrow =
    String(offer.offer_type || '')
      .replace(/_/g, ' ')
      .trim() || 'Hot fresh'

  if (toNumber(offer.discount_percent) > 0) {
    return {
      badge,
      eyebrow,
      headline: badge,
      statPrefix: 'Get upto',
      statValue: `${toNumber(offer.discount_percent)}%`,
      statSuffix: 'OFF',
      detail: 'Percentage savings applied on selected dishes and combos.',
    }
  }

  if (toNumber(offer.flat_discount) > 0) {
    return {
      badge,
      eyebrow,
      headline: badge,
      statPrefix: 'Save flat',
      statValue: `Rs. ${toNumber(offer.flat_discount)}`,
      statSuffix: 'OFF',
      detail: 'Flat savings on your current order once the offer is applied.',
    }
  }

  if (toNumber(offer.combo_price) > 0) {
    return {
      badge,
      eyebrow,
      headline: badge,
      statPrefix: 'Combo at',
      statValue: `Rs. ${toNumber(offer.combo_price)}`,
      statSuffix: '',
      detail: 'Bundle pricing for a ready-to-order combo meal.',
    }
  }

  if (offer.free_item_name) {
    return {
      badge,
      eyebrow,
      headline: offer.free_item_name,
      statPrefix: 'Free item',
      statValue: 'FREE',
      statSuffix: '',
      detail: `${offer.free_item_name} included with this live offer.`,
    }
  }

  return {
    badge,
    eyebrow,
    headline: badge,
    statPrefix: 'Live now',
    statValue: 'OFFER',
    statSuffix: '',
    detail: 'New kitchen offer available for a limited time.',
  }
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
  return parts.join(' • ') || 'Available on eligible food orders.'
}

const getComboOfferItems = (
  offer: FoodStorefrontOffer,
  menuItems: FoodStorefrontMenuItem[],
) =>
  (Array.isArray(offer?.combo_items) ? offer.combo_items : [])
    .map((comboItem, index) => {
      const comboName = String(comboItem?.item_name || '').trim()
      const comboMenuId = String(comboItem?.menu_item_id || '').trim()
      const matchedMenuItem =
        menuItems.find((item) => String(item?._id || '') === comboMenuId) ||
        menuItems.find(
          (item) =>
            String(item?.item_name || '').trim().toLowerCase() === comboName.toLowerCase(),
        ) ||
        null
      const name = comboName || String(matchedMenuItem?.item_name || `Combo item ${index + 1}`)
      const category = String(matchedMenuItem?.category || name || 'combo')
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
        menuItemId: String(matchedMenuItem?._id || comboMenuId || ''),
        name,
        quantity: Math.max(1, toNumber(comboItem?.quantity) || 1),
        variantName: String(primaryVariant?.name || ''),
        unitPrice: offerPrice || actualPrice,
        originalUnitPrice: offerPrice || actualPrice,
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

const normalizeOfferMatchText = (value: unknown) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')

const hexToRgba = (value: unknown, alpha: number, fallback = 'rgba(125,153,32,0.92)') => {
  const hex = String(value || '').trim().replace('#', '')
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : hex
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red},${green},${blue},${alpha})`
}

const getFoodOfferImage = (
  offer: FoodStorefrontOffer | null,
  menuItems: FoodStorefrontMenuItem[],
  fallback: string,
) => {
  if (!offer) return fallback

  const titleText = normalizeOfferMatchText(
    [offer.offer_title, offer.free_item_name].filter(Boolean).join(' ')
  )
  const titleMatchedMenuItem =
    menuItems.find((item) => {
      const itemName = normalizeOfferMatchText(item?.item_name)
      return itemName && titleText && (titleText.includes(itemName) || itemName.includes(titleText))
    }) || null
  const titleMatchedImage = getFoodMenuImage(titleMatchedMenuItem, '')
  if (titleMatchedImage) return titleMatchedImage

  const comboItems = getComboOfferItems(offer, menuItems)
  const comboTitleImage = comboItems
    .filter((item) => {
      const itemName = normalizeOfferMatchText(item?.name)
      return itemName && titleText && (titleText.includes(itemName) || itemName.includes(titleText))
    })
    .map((item) => String(item?.image || '').trim())
    .find(Boolean)
  if (comboTitleImage) return comboTitleImage

  const comboImage = comboItems.map((item) => String(item?.image || '').trim()).find(Boolean)
  if (comboImage) return comboImage

  const titleCandidates = [offer.free_item_name, offer.offer_title]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
  const matchedMenuItem =
    menuItems.find((item) =>
      titleCandidates.includes(String(item?.item_name || '').trim().toLowerCase()),
    ) || null

  return getFoodMenuImage(matchedMenuItem, fallback)
}

export function PocoFoodHome() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const vendorId = String((params as any)?.vendor_id || '')
  const template = useSelector((state: any) => state?.alltemplatepage?.data)
  const vendor = useSelector((state: any) => state?.vendorprofilepage?.vendor)
  const [activeCategory, setActiveCategory] = useState('all')
  const [addingId, setAddingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [foodMenuItems, setFoodMenuItems] = useState<FoodStorefrontMenuItem[]>([])
  const [foodOffers, setFoodOffers] = useState<FoodStorefrontOffer[]>([])
  const [foodRestaurant, setFoodRestaurant] = useState<FoodStorefrontRestaurant | null>(null)
  const [customizingProduct, setCustomizingProduct] = useState<FeaturedDishCard | null>(null)
  const [selectedFoodVariantName, setSelectedFoodVariantName] = useState('')
  const [selectedFoodAddons, setSelectedFoodAddons] = useState<string[]>([])
  const [customizationQuantity, setCustomizationQuantity] = useState(1)
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [heroSearchText, setHeroSearchText] = useState('')
  const [heroSearchOpen, setHeroSearchOpen] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined' || !customizingProduct) return

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [customizingProduct])

  const home = template?.components?.home_page || {}
  const faqSection = template?.components?.social_page?.faqs || {}
  const blogEntries = Array.isArray(template?.components?.social_page?.blogs?.items)
    ? template.components.social_page.blogs.items
    : []
  const toTemplatePath = (suffix = '') =>
    buildTemplateScopedPath({
      vendorId,
      pathname: pathname || '/',
      suffix,
    })

  const allProductsPath = toTemplatePath('all-products')
  const loginPath = toTemplatePath('login')
  const homePath = toTemplatePath('')
  const menuSectionPath = `${homePath}#food-menu`
  const foodProductPath = (foodId?: string) =>
    foodId ? toTemplatePath(`product/${foodId}`) : allProductsPath

  const heroTitle = configuredText(home?.header_text, 'Unlimited medium pizzas')
  const heroSubtitle = configuredText(
    home?.header_text_small,
    'Medium 2-topping pizza with bold combos, quick delivery, and swiggy-style restaurant energy.'
  )
  const heroButtonPrimary = configuredText(home?.button_header, 'Order now')
  const heroButtonSecondary = configuredText(home?.button_secondary, 'See menu')
  const heroDetail = configuredText(home?.hero_detail, '')
  const heroStyle = home?.hero_style || {}
  const heroTitleColor = configuredText(heroStyle?.titleColor, '#ffffff')
  const heroAccentColor = configuredText(heroStyle?.overlayAccentColor, '#ffc222')
  const heroSubtitleColor = configuredText(heroStyle?.subtitleColor, '#ff8c42')
  const heroPrimaryButtonColor = configuredText(heroStyle?.primaryButtonColor, '#ffc222')
  const heroSecondaryButtonColor = configuredText(heroStyle?.secondaryButtonColor, '#d94b2b')
  const heroTitleSize = toNumber(heroStyle?.titleSize)
  const heroSubtitleSize = toNumber(heroStyle?.subtitleSize)
  const heroImage = configuredImage(home?.backgroundImage, foodRestaurant?.cover_image_url || HERO_FALLBACK)
  const heroBackdropImages = useMemo(() => {
    const configuredImage = typeof heroImage === 'string' ? heroImage.trim() : ''
    return [configuredImage || HERO_MOTION_FALLBACKS[0], ...HERO_MOTION_FALLBACKS.slice(1)]
  }, [heroImage])
  const heroTitleWords = useMemo(() => {
    const words = heroTitle.split(/\s+/).filter(Boolean)
    if (words.length <= 1) {
      return {
        primary: heroTitle,
        accent: '',
      }
    }
    return {
      primary: words.slice(0, -1).join(' '),
      accent: words[words.length - 1],
    }
  }, [heroTitle])
  const productsHeading = configuredDisplayText(home?.products_heading, 'Popular dishes')
  const productsSubtitle = configuredDisplayText(
    home?.products_subtitle,
    'Scroll through pizzas, burgers, drinks, and restaurant bestsellers.'
  )
  const recipeSectionHeading = configuredText(home?.recipe_section_heading, 'Top recipes')
  const servicesConfig = home?.benefits || {}
  const advantageConfig = home?.advantage || {}
  const advantageKicker = configuredDisplayText(advantageConfig?.kicker, 'Always Quality')
  const advantageHeading = configuredDisplayText(
    advantageConfig?.heading,
    'The best quality for your health'
  )
  const advantageSubtitle = configuredDisplayText(
    advantageConfig?.subtitle,
    'Each freshly meal is perfectly sized for one person to enjoy at one sitting.\nOur fully prepared meals are delivered fresh, and ready to eat in 3 minutes.'
  )
  const advantageCtaLabel = configuredDisplayText(advantageConfig?.ctaLabel, 'Discover now')
  const advantageTopTag = configuredDisplayText(advantageConfig?.topTag, 'Freshly Made')
  const advantageVisualCardTitle = configuredDisplayText(
    advantageConfig?.visualCardTitle,
    'Daily quality meals'
  )
  const advantagePromiseLabel = configuredDisplayText(
    advantageConfig?.promiseLabel,
    'Healthy Promise'
  )
  const advantagePromiseText = configuredDisplayText(
    advantageConfig?.promiseText,
    'Crisp ingredients.\nBetter taste.'
  )
  const advantagePremiumLabel = configuredDisplayText(advantageConfig?.premiumLabel, 'Premium Picks')
  const advantageAccentColor = configuredDisplayText(advantageConfig?.accentColor, '#d94b2b')
  const advantageGlowColor = configuredDisplayText(advantageConfig?.glowColor, '#7d9920')
  const advantageMainImage = configuredImage(advantageConfig?.image, '/pocofood-categories/chicken.png')
  const advantageVisualCardImage = configuredImage(
    advantageConfig?.visualCardImage,
    '/pocofood-categories/pizza.png'
  )
  const advantagePremiumImageOne = configuredImage(
    advantageConfig?.premiumImageOne,
    '/pocofood-categories/burger.png'
  )
  const advantagePremiumImageTwo = configuredImage(
    advantageConfig?.premiumImageTwo,
    '/pocofood-categories/box-meals.png'
  )
  const advantageCards = Array.from({ length: 3 }, (_, index) => {
    const fallbackCards = [
      { title: 'Choose your meal', description: '80+ menus to choose from' },
      { title: 'Authentical product', description: 'Keep healthy and regulate immune system.' },
      { title: '', description: '' },
    ]
    const card = Array.isArray(advantageConfig?.cards) ? advantageConfig.cards[index] : null
    return {
      title: configuredDisplayText(card?.title, fallbackCards[index].title),
      description: configuredDisplayText(card?.description, fallbackCards[index].description),
    }
  })

  useEffect(() => {
    let cancelled = false

    const loadFoodStorefront = async () => {
      if (!vendorId) return
      try {
        const response = await fetch(`${API_BASE}/vendors/${vendorId}/food-storefront`)
        if (!response.ok) return
        const payload = await response.json()
        if (cancelled) return
        setFoodRestaurant(payload?.data?.restaurant || null)
        setFoodMenuItems(payload?.data?.menu_items || [])
        setFoodOffers(payload?.data?.offers || [])
      } catch {
        if (cancelled) return
        setFoodRestaurant(null)
        setFoodMenuItems([])
        setFoodOffers([])
      }
    }

    void loadFoodStorefront()
    return () => {
      cancelled = true
    }
  }, [vendorId])

  const menuCategories = useMemo(() => {
    const map = new Map<string, { key: string; label: string; href: string; image: string }>()
    foodMenuItems.forEach((item, index) => {
      const label = String(item.category || '').trim()
      if (!label) return
      const key = toSlug(label)
      if (map.has(key)) return
      map.set(key, {
        key,
        label,
        href: toTemplatePath(`category/${encodeURIComponent(key)}`),
        image: getCategoryVisual(label, getFoodMenuImage(item, MENU_FALLBACKS[index % MENU_FALLBACKS.length])),
      })
    })
    return Array.from(map.values())
  }, [foodMenuItems, pathname, vendorId])

  const categoryTabs = useMemo(() => {
    if (menuCategories.length) {
      return menuCategories.map((item) => ({ key: item.key, label: item.label, href: item.href }))
    }
    return []
  }, [menuCategories])

  useEffect(() => {
    if (!categoryTabs.length) return
    if (!categoryTabs.some((item) => item.key === activeCategory)) {
      setActiveCategory(categoryTabs[0].key)
    }
  }, [activeCategory, categoryTabs])

  const featuredProducts = useMemo<FeaturedDishCard[]>(() => {
    if (foodMenuItems.length) {
      const base =
        activeCategory === 'all'
          ? foodMenuItems
          : foodMenuItems.filter((item) => toSlug(String(item.category || '')) === activeCategory)

      return base.slice(0, 8).map((item, index) => ({
        _id: String(item?._id || `food-${index}`),
        slug: '',
        title: item?.item_name || `Dish ${index + 1}`,
        category: item?.category || 'Chef pick',
        foodType: item?.food_type || 'veg',
        image: getFoodMenuImage(item, MENU_FALLBACKS[index % MENU_FALLBACKS.length]),
        price: toNumber(item?.offer_price) || toNumber(item?.price) || 299,
        oldPrice: toNumber(item?.price),
        stockQuantity: 10,
        variantId: '',
        href: foodProductPath(String(item?._id || '')),
        isFoodCatalogItem: true,
        foodMenuItemId: String(item?._id || ''),
        selectedVariantName:
          item?.variants?.find((variant) => variant?.is_default && variant?.is_available !== false)?.name ||
          item?.variants?.find((variant) => variant?.is_available !== false)?.name ||
          '',
        availableAddons: Array.isArray(item?.addons) ? item.addons : [],
        availableVariants: Array.isArray(item?.variants) ? item.variants : [],
        description: getRichTextPreview(item?.description || 'Freshly prepared bestseller from the current menu.', 95),
        rating: 4 + (index % 2 === 0 ? 1 : 0),
      }))
    }
    return []
  }, [activeCategory, foodMenuItems, menuSectionPath])

  const promoOffer = foodOffers[0] || null
  const promoOfferDisplay = getFoodOfferDisplay(promoOffer)
  const heroPromoLabel = promoOfferDisplay.badge
  const promoSidebarTitle = promoOffer?.free_item_name || promoOffer?.offer_title || 'Chicken'
  const promoSidebarSubtitle = promoOffer?.offer_type
    ? promoOffer.offer_type.replace(/_/g, ' ')
    : 'Super delicious'
  const promoCallPhone = String(foodRestaurant?.mobile || vendor?.phone || '+91-98765-43210')
  const restaurantName = String(foodRestaurant?.restaurant_name || vendor?.business_name || 'Oph Food').trim()
  const restaurantCuisineLabel = String(foodRestaurant?.food_service_type || '').trim()
  const restaurantPrepTime = toNumber(foodRestaurant?.average_preparation_time)
  const restaurantMinimumOrder = toNumber(foodRestaurant?.minimum_order_amount)
  const configuredHeroPrice = toNumber(home?.hero_price)
  const heroPrice = configuredHeroPrice || promoOffer?.combo_price || featuredProducts[0]?.price || 299
  const configuredHeroOldPrice = toNumber(home?.hero_old_price)
  const heroOldPrice =
    configuredHeroOldPrice ||
    (featuredProducts[0]?.oldPrice && featuredProducts[0].oldPrice > featuredProducts[0].price
      ? featuredProducts[0].oldPrice
      : Math.max(toNumber(heroPrice) + 100, 0))
  const heroCardKicker = configuredText(home?.hero_card_kicker, restaurantName)
  const heroCardTitle = configuredText(home?.hero_card_title, promoOfferDisplay.badge)
  const heroCardBadge = configuredText(home?.hero_card_badge, 'Live')
  const heroStartingLabel = configuredText(home?.hero_starting_label, 'Starting at')
  const heroRatingLabel = configuredText(home?.hero_rating_label, 'Rating')
  const heroRatingValue = configuredText(home?.hero_rating_value, '4.9/5')
  const heroFeatureFallbacks = [
    restaurantPrepTime ? `${restaurantPrepTime} min prep` : '30 min delivery',
    restaurantMinimumOrder ? `Min order ${formatPrice(restaurantMinimumOrder)}` : 'Premium toppings',
    restaurantCuisineLabel || 'Fresh oven baked',
  ]
  const heroFeatures = Array.from({ length: 3 }, (_, index) =>
    configuredText(
      Array.isArray(home?.hero_features) ? home.hero_features[index] : '',
      heroFeatureFallbacks[index]
    )
  )
  const visibleFoodOffers = foodOffers.filter((offer) => offer?.is_active !== false)
  const primaryVisibleOffer = visibleFoodOffers[0] || promoOffer
  const promoOfferComboItems = primaryVisibleOffer
    ? getComboOfferItems(primaryVisibleOffer, foodMenuItems)
    : []
  const hasPromoOfferComboItems = promoOfferComboItems.length > 0
  const dynamicOfferBackgroundImage = getFoodOfferImage(primaryVisibleOffer, foodMenuItems, heroImage)
  const promoOfferBackgroundImage = configuredImage(
    home?.offer_section_background_image,
    dynamicOfferBackgroundImage
  )
  const offerSectionEyebrow = configuredText(home?.offer_section_eyebrow, promoOfferDisplay.eyebrow)
  const offerSectionButtonLabel = configuredText(home?.offer_section_button_label, 'Order now')
  const offerSectionBackgroundColor = configuredText(home?.offer_section_background_color, '#1b1a1f')
  const offerSectionTitleColor = configuredText(home?.offer_section_title_color, '#ffca1a')
  const offerSectionEyebrowColor = configuredText(home?.offer_section_eyebrow_color, '#fffdf8')
  const offerSectionPriceColor = configuredText(home?.offer_section_price_color, '#ffc222')
  const offerSectionPriceBackground = configuredText(home?.offer_section_price_background, '#ffffff')
  const offerSectionButtonBackground = configuredText(home?.offer_section_button_background, '#ffffff')
  const offerSectionButtonTextColor = configuredText(home?.offer_section_button_text_color, '#171717')
  const offerSectionOverlayOpacity =
    Math.min(90, Math.max(0, toNumber(home?.offer_section_overlay_opacity) || 48)) / 100

  const quickRecipes = featuredProducts.slice(0, 6)

  useEffect(() => {
    if (!vendorId || typeof window === 'undefined') return

    const syncWishlist = () => {
      setWishlistIds(readPocoFoodWishlist(vendorId).map((item) => item.product_id))
    }

    syncWishlist()
    window.addEventListener('pocofood-wishlist-updated', syncWishlist)
    window.addEventListener('storage', syncWishlist)

    return () => {
      window.removeEventListener('pocofood-wishlist-updated', syncWishlist)
      window.removeEventListener('storage', syncWishlist)
    }
  }, [vendorId])

  const toggleWishlist = (product: FeaturedDishCard) => {
    const productId = String(product?._id || '').trim()
    if (!productId || productId.startsWith('fallback-')) return

    const currentItems = readPocoFoodWishlist(vendorId)
    const exists = currentItems.some((item) => item.product_id === productId)
    const nextItems = exists
      ? currentItems.filter((item) => item.product_id !== productId)
      : [
          {
            product_id: productId,
            product_name: product.title,
            category: product.category,
            image_url: product.image,
            price: product.price,
            href: product.href,
            added_at: new Date().toISOString(),
          } satisfies PocoFoodWishlistItem,
          ...currentItems.filter((item) => item.product_id !== productId),
        ]

    writePocoFoodWishlist(vendorId, nextItems)
    setWishlistIds(nextItems.map((item) => item.product_id))
  }

  const topRecipeCards: FeaturedDishCard[] = quickRecipes.length
    ? quickRecipes
    : [
        {
          _id: 'fallback-1',
          slug: '',
          title: 'Veggie Lover',
          category: 'Pizza',
          foodType: 'veg',
          image: '/pocofood-categories/pizza.png',
          price: 299,
          oldPrice: 0,
          stockQuantity: 10,
          variantId: '',
          href: allProductsPath,
          isFoodCatalogItem: true,
          foodMenuItemId: '',
          selectedVariantName: '',
          availableAddons: [],
          availableVariants: [],
          description: '',
          rating: 5,
        },
        {
          _id: 'fallback-2',
          slug: '',
          title: 'Plain Tea',
          category: 'Hot Drinks',
          foodType: 'veg',
          image: '/pocofood-categories/drinks.png',
          price: 199,
          oldPrice: 0,
          stockQuantity: 10,
          variantId: '',
          href: allProductsPath,
          isFoodCatalogItem: true,
          foodMenuItemId: '',
          selectedVariantName: '',
          availableAddons: [],
          availableVariants: [],
          description: '',
          rating: 5,
        },
        {
          _id: 'fallback-3',
          slug: '',
          title: 'Pepperoni Calzone',
          category: 'Pizza',
          foodType: 'non_veg',
          image: '/pocofood-categories/pizza.png',
          price: 349,
          oldPrice: 399,
          stockQuantity: 10,
          variantId: '',
          href: allProductsPath,
          isFoodCatalogItem: true,
          foodMenuItemId: '',
          selectedVariantName: '',
          availableAddons: [],
          availableVariants: [],
          description: '',
          rating: 5,
        },
        {
          _id: 'fallback-4',
          slug: '',
          title: 'Apricot Chicken',
          category: 'Chicken',
          image: '/pocofood-categories/chicken.png',
          price: 329,
          oldPrice: 0,
          stockQuantity: 10,
          variantId: '',
          href: allProductsPath,
          isFoodCatalogItem: true,
          foodMenuItemId: '',
          selectedVariantName: '',
          availableAddons: [],
          availableVariants: [],
          description: '',
          rating: 5,
        },
        {
          _id: 'fallback-5',
          slug: '',
          title: 'Penne Funghi Chicken',
          category: 'Pasta',
          image: '/pocofood-categories/box-meals.png',
          price: 319,
          oldPrice: 0,
          stockQuantity: 10,
          variantId: '',
          href: allProductsPath,
          isFoodCatalogItem: true,
          foodMenuItemId: '',
          selectedVariantName: '',
          availableAddons: [],
          availableVariants: [],
          description: '',
          rating: 5,
        },
        {
          _id: 'fallback-6',
          slug: '',
          title: 'Bacon Burger',
          category: 'Burgers',
          image: '/pocofood-categories/burger.png',
          price: 289,
          oldPrice: 0,
          stockQuantity: 10,
          variantId: '',
          href: allProductsPath,
          isFoodCatalogItem: true,
          foodMenuItemId: '',
          selectedVariantName: '',
          availableAddons: [],
          availableVariants: [],
          description: '',
          rating: 5,
        },
      ]
  const heroSearchItems = useMemo<FeaturedDishCard[]>(() => {
    if (foodMenuItems.length) {
      return foodMenuItems.map((item, index) => {
        const variants = Array.isArray(item?.variants) ? item.variants : []
        const primaryVariant =
          variants.find((variant) => variant?.is_default && variant?.is_available !== false) ||
          variants.find((variant) => variant?.is_available !== false) ||
          variants[0] ||
          null
        const price =
          toNumber(primaryVariant?.offer_price) ||
          toNumber(item?.offer_price) ||
          toNumber(primaryVariant?.price) ||
          toNumber(item?.price) ||
          299
        const oldPrice = toNumber(primaryVariant?.price) || toNumber(item?.price)

        return {
          _id: String(item?._id || `food-search-${index}`),
          slug: '',
          title: item?.item_name || `Dish ${index + 1}`,
          category: item?.category || 'Chef pick',
          foodType: item?.food_type || 'veg',
          image: getFoodMenuImage(item, MENU_FALLBACKS[index % MENU_FALLBACKS.length]),
          price,
          oldPrice,
          stockQuantity: 10,
          variantId: '',
          href: foodProductPath(String(item?._id || '')),
          isFoodCatalogItem: true,
          foodMenuItemId: String(item?._id || ''),
          selectedVariantName: String(primaryVariant?.name || ''),
          availableAddons: Array.isArray(item?.addons) ? item.addons : [],
          availableVariants: variants,
          description: getRichTextPreview(
            item?.description || 'Freshly prepared bestseller from the current menu.',
            95,
          ),
          rating: 5,
        }
      })
    }

    return topRecipeCards
  }, [foodMenuItems, topRecipeCards, pathname, vendorId])

  const heroSearchResults = useMemo(() => {
    const term = heroSearchText.trim().toLowerCase()
    const source = heroSearchItems.filter((item) => item._id && !item._id.startsWith('fallback-'))

    if (!term) return source.slice(0, 5)

    return source
      .filter((item) => {
        const searchable = [item.title, item.category, item.description]
          .join(' ')
          .toLowerCase()
        return searchable.includes(term)
      })
      .slice(0, 6)
  }, [heroSearchItems, heroSearchText])

  const heroSearchListingHref = (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return allProductsPath
    const separator = allProductsPath.includes('?') ? '&' : '?'
    return `${allProductsPath}${separator}search=${encodeURIComponent(trimmedQuery)}`
  }

  const handleHeroSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = heroSearchText.trim()
    if (!query) {
      setHeroSearchOpen(false)
      return
    }

    const exactMatch = heroSearchItems.find(
      (item) => item.title.trim().toLowerCase() === query.toLowerCase(),
    )
    router.push(exactMatch?.href || heroSearchListingHref(query))
    setHeroSearchOpen(false)
  }

  const newsCards = (blogEntries.length
    ? blogEntries
    : NEWS_FALLBACKS.map((image, index) => ({
        title:
          index === 0
            ? '10 reasons to do a digital detox challenge'
            : index === 1
              ? 'The ultimate hangover burger grilled cheese'
              : 'Traditional soft pretzels with sweet beer cheese',
        image,
        excerpt:
          'Fresh campaigns, bold food styling, and appetite-first storytelling for restaurant brands.',
        slug: '',
        date: index === 0 ? 'September 7, 2020' : 'August 31, 2020',
        category: 'Uncategorized',
        author: 'admin',
      }))).slice(0, 3)

  const testimonials = useMemo<TestimonialCard[]>(() => {
    const faqItems = Array.isArray(faqSection?.faqs) ? faqSection.faqs : []
    if (!faqItems.length) return fallbackTestimonials
    return faqItems.slice(0, 3).map((item: any, index: number) => ({
      name: fallbackTestimonials[index]?.name || `Guest ${index + 1}`,
      role: fallbackTestimonials[index]?.role || 'Customer',
      rating: fallbackTestimonials[index]?.rating || 5,
      text: configuredText(item?.answer, fallbackTestimonials[index]?.text || 'Great food ordering experience.'),
      image: fallbackTestimonials[index]?.image || fallbackTestimonials[0].image,
    }))
  }, [faqSection?.faqs])

  const addressText = [vendor?.street || vendor?.address, vendor?.city, vendor?.state]
    .filter((item) => typeof item === 'string' && item.trim())
    .join(', ')
  const serviceFallbacks = [
    {
      title: 'Accept Card',
      text: 'Easy card payment support for smooth and fast checkout experience.',
      iconWrap: 'bg-[#ff8a7c]',
      icon: <CreditCard className='h-10 w-10 text-white' strokeWidth={2.2} />,
    },
    {
      title: 'Online Booking',
      text: 'Order ahead from the menu and reserve your favorites in seconds.',
      iconWrap: 'bg-[#6db4d8]',
      icon: <CalendarCheck2 className='h-10 w-10 text-white' strokeWidth={2.2} />,
    },
    {
      title: 'Home Delivery',
      text: 'Hot meals delivered quickly with a restaurant-style doorstep experience.',
      iconWrap: 'bg-[#6d8f90]',
      icon: <Bike className='h-10 w-10 text-white' strokeWidth={2.2} />,
    },
    {
      title: 'Best Location',
      text: addressText || 'Convenient outlet locations for pickup, dine-in, and delivery.',
      iconWrap: 'bg-[#f4bf2a]',
      icon: <Store className='h-10 w-10 text-white' strokeWidth={2.2} />,
    },
  ]
  const serviceCards = serviceFallbacks.map((fallback, index) => {
    const configuredCard = Array.isArray(servicesConfig?.cards)
      ? servicesConfig.cards[index]
      : null
    return {
      ...fallback,
      title: configuredDisplayText(configuredCard?.title, fallback.title),
      text: configuredDisplayText(configuredCard?.description, fallback.text),
    }
  })

  const openFoodCustomization = (product: FeaturedDishCard) => {
    const defaultVariantName =
      product.selectedVariantName ||
      product.availableVariants?.find((item) => item?.is_default && item?.is_available !== false)?.name ||
      product.availableVariants?.find((item) => item?.is_available !== false)?.name ||
      ''

    setCustomizingProduct(product)
    setSelectedFoodVariantName(defaultVariantName)
    setSelectedFoodAddons([])
    setCustomizationQuantity(1)
  }

  const closeFoodCustomization = () => {
    setCustomizingProduct(null)
    setSelectedFoodVariantName('')
    setSelectedFoodAddons([])
    setCustomizationQuantity(1)
  }

  const toggleFoodAddon = (addonName: string) => {
    setSelectedFoodAddons((current) =>
      current.includes(addonName)
        ? current.filter((item) => item !== addonName)
        : [...current, addonName],
    )
  }

  const customizationUnitPrice = useMemo(() => {
    if (!customizingProduct) return 0
    const basePrice = getFoodVariantPrice(
      customizingProduct.availableVariants,
      selectedFoodVariantName,
      customizingProduct.price,
    )
    return basePrice + getFoodAddonPrice(customizingProduct.availableAddons, selectedFoodAddons)
  }, [customizingProduct, selectedFoodAddons, selectedFoodVariantName])

  const customizationTotalPrice = customizationUnitPrice * customizationQuantity
  const selectedFoodAddonRecords = useMemo(
    () =>
      getSelectedFoodAddonRecords(
        customizingProduct?.availableAddons || [],
        selectedFoodAddons,
      ),
    [customizingProduct?.availableAddons, selectedFoodAddons],
  )

  const handleAddToCart = async (product: (typeof featuredProducts)[number]) => {
    setActionMessage('')

    if (!vendorId || !product?._id) return
    const auth = getTemplateAuth(vendorId)
    if (!auth?.token) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(allProductsPath)}`
      return
    }
    setAddingId(product._id)
    try {
      if (product.isFoodCatalogItem) {
        if (product.availableVariants?.length || product.availableAddons?.length) {
          openFoodCustomization(product)
          return
        }

        if (!product.foodMenuItemId) {
          setActionMessage('Food item not available for cart.')
          return
        }

        await templateApiFetch(vendorId, '/cart', {
          method: 'POST',
          body: JSON.stringify({
            food_menu_item_id: product.foodMenuItemId,
            variant_name: product.selectedVariantName || '',
            selected_addons: [],
            quantity: 1,
          }),
        })
      } else {
        if (!product.variantId) {
          setActionMessage('Variant not available for this dish.')
          return
        }

        await templateApiFetch(vendorId, '/cart', {
          method: 'POST',
          body: JSON.stringify({
            product_id: product._id,
            variant_id: product.variantId,
            quantity: 1,
          }),
        })
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('template-cart-updated'))
      }
      setActionMessage('Dish added to cart.')
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to add dish.')
    } finally {
      setAddingId(null)
    }
  }

  const addCustomizedFoodToCart = async () => {
    if (!customizingProduct?.foodMenuItemId) return

    const auth = getTemplateAuth(vendorId)
    if (!auth?.token) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(allProductsPath)}`
      return
    }

    setActionMessage('')
    setAddingId(customizingProduct._id)
    try {
      await templateApiFetch(vendorId, '/cart', {
        method: 'POST',
        body: JSON.stringify({
          food_menu_item_id: customizingProduct.foodMenuItemId,
          variant_name: selectedFoodVariantName || '',
          selected_addons: selectedFoodAddonRecords.map((addon) => ({
            name: String(addon?.name || '').trim(),
            price: toNumber(addon?.price),
            is_free: Boolean(addon?.is_free),
          })),
          quantity: customizationQuantity,
        }),
      })
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('template-cart-updated'))
      }
      setActionMessage(`${customizingProduct.title} added to cart.`)
      closeFoodCustomization()
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to add dish.')
    } finally {
      setAddingId(null)
    }
  }

  const addOfferToCart = async (
    offer: FoodStorefrontOffer,
    comboItems: ReturnType<typeof getComboOfferItems>,
  ) => {
    setActionMessage('')

    if (!vendorId) return
    const auth = getTemplateAuth(vendorId)
    if (!auth?.token) {
      window.location.href = `${loginPath}?next=${encodeURIComponent(allProductsPath)}`
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

    const offerId = String(offer?._id || offer?.offer_title || 'combo-offer')
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

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('template-cart-updated'))
      }
      setActionMessage(`${getComboOfferTitle(offer, comboItems)} added to cart. Combo discount will apply in cart.`)
    } catch (error: any) {
      setActionMessage(error?.message || 'Failed to add combo.')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className='template-home template-home-pocofood text-[#171717]'>
      <div className='fixed inset-x-0 top-[84px] z-[45] px-3 lg:hidden'>
        <form
          onSubmit={handleHeroSearchSubmit}
          className='relative mx-auto max-w-[520px]'
        >
          <div className='flex min-h-[54px] overflow-hidden rounded-[16px] border border-[#eadfb7] bg-white shadow-[0_14px_34px_rgba(23,23,23,0.18)] transition focus-within:border-[#ffc222] focus-within:ring-4 focus-within:ring-[#ffc222]/25'>
            <div className='relative flex flex-1 items-center'>
              <Search className='absolute left-4 h-5 w-5 text-[#d94b2b]' />
              <input
                type='text'
                      value={heroSearchText}
                      onChange={(event) => {
                        const value = event.target.value
                        setHeroSearchText(value)
                  setHeroSearchOpen(Boolean(value.trim()))
                      }}
                      placeholder='Search food items...'
                      className='hero-search-input h-full w-full bg-white py-3 pl-12 pr-9 text-sm font-semibold text-[#171717] outline-none placeholder:text-[#7a7a7a]'
                      aria-label='Search food items'
                    />
              {heroSearchText ? (
                <button
                  type='button'
                  onClick={() => {
                    setHeroSearchText('')
                    setHeroSearchOpen(false)
                  }}
                  className='absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full text-[#7a7a7a] transition hover:bg-[#f4efe1] hover:text-[#d94b2b]'
                  aria-label='Clear search'
                >
                  <X className='h-4 w-4' />
                </button>
              ) : null}
            </div>
            <button
              type='submit'
              className='flex w-[56px] shrink-0 items-center justify-center bg-[#ffc222] text-[#171717] transition hover:bg-[#ffae00]'
              aria-label='Search'
            >
              <Search className='h-6 w-6' strokeWidth={2.4} />
            </button>
          </div>

          {heroSearchOpen && heroSearchText.trim() ? (
            <div className='absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[16px] border border-[#eadfb7] bg-white text-[#171717] shadow-[0_24px_70px_rgba(0,0,0,0.28)]'>
              {heroSearchResults.length ? (
                <>
                  <div className='px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a7b38]'>
                    Matching dishes
                  </div>
                  <div className='max-h-[280px] overflow-y-auto'>
                    {heroSearchResults.map((item) => (
                      <Link
                        key={item._id}
                        href={item.href}
                        onClick={() => {
                          setHeroSearchOpen(false)
                          setHeroSearchText('')
                        }}
                        className='flex items-center gap-3 border-t border-[#f1ead6] px-3 py-3 transition hover:bg-[#fff7df]'
                      >
                        <span className='flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#fff2cc]'>
                          <img
                            src={item.image}
                            alt={item.title}
                            className='h-full w-full object-cover'
                          />
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate text-sm font-extrabold text-[#171717]'>
                            {item.title}
                          </span>
                          <span className='mt-1 block truncate text-xs font-semibold text-[#7b7b7b]'>
                            {item.category}
                          </span>
                        </span>
                        <span className='shrink-0 text-xs font-extrabold text-[#d94b2b]'>
                          {formatPrice(item.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                  {heroSearchText.trim() ? (
                    <Link
                      href={heroSearchListingHref(heroSearchText)}
                      onClick={() => setHeroSearchOpen(false)}
                      className='flex items-center justify-between border-t border-[#f1ead6] bg-[#fffbf0] px-4 py-3 text-sm font-extrabold text-[#171717] transition hover:bg-[#fff3cc]'
                    >
                      View all results
                      <ArrowRight className='h-4 w-4' />
                    </Link>
                  ) : null}
                </>
              ) : (
                <div className='px-5 py-6 text-sm font-semibold text-[#6b6257]'>
                  No dishes found. Try another item name or category.
                </div>
              )}
            </div>
          ) : null}
        </form>
      </div>

      <section className='overflow-hidden bg-[#151418] text-white' data-template-section='hero'>
        <div className='relative min-h-[320px] lg:min-h-[390px]'>
          {heroBackdropImages.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={index === 0 ? heroTitle : `${heroTitle} backdrop ${index + 1}`}
              className={`hero-backdrop-layer absolute inset-0 h-full w-full object-cover ${
                index === 0 ? 'object-[82%_center]' : index === 1 ? 'object-center' : 'object-[70%_center]'
              }`}
              style={{ animationDelay: `${index * 6}s` }}
              data-template-path={index === 0 ? 'components.home_page.backgroundImage' : undefined}
              data-template-section={index === 0 ? 'branding' : undefined}
              data-template-component={index === 0 ? 'components.home_page.backgroundImage' : undefined}
            />
          ))}
          <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(32,32,32,0.84)_0%,rgba(35,35,35,0.74)_30%,rgba(27,26,31,0.46)_58%,rgba(27,26,31,0.16)_100%)]' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_18%),radial-gradient(circle_at_bottom_left,rgba(255,194,34,0.14),transparent_30%),radial-gradient(circle_at_left_center,rgba(255,255,255,0.08),transparent_24%)] opacity-95' />
          <div className='absolute inset-y-0 left-0 w-full bg-[url("data:image/svg+xml,%3Csvg width=%27320%27 height=%27320%27 viewBox=%270%200%20320%20320%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.9%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27320%27 height=%27320%27 filter=%27url(%23n)%27 opacity=%270.08%27/%3E%3C/svg%3E")] opacity-30 mix-blend-screen' />

          <div className='relative mx-auto grid min-h-[320px] max-w-[1440px] items-center gap-6 px-4 pb-8 pt-24 lg:min-h-[390px] lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10 lg:py-10'>
            <div id='hero-search' className='max-w-[700px] scroll-mt-28'>
              <form
                onSubmit={handleHeroSearchSubmit}
                className='relative mb-6 hidden max-w-[740px] lg:block'
              >
                <div className='flex min-h-[62px] overflow-hidden rounded-[18px] border border-white/18 bg-white shadow-[0_22px_60px_rgba(0,0,0,0.32)] transition focus-within:border-[#ffc222] focus-within:ring-4 focus-within:ring-[#ffc222]/25'>
                  <div className='hidden min-w-[112px] items-center justify-center border-r border-[#e8e2d7] bg-[#f6f6f6] px-4 text-sm font-bold text-[#555] sm:flex'>
                    All
                  </div>
                  <div className='relative flex flex-1 items-center'>
                    <Search className='absolute left-4 h-5 w-5 text-[#d94b2b]' />
                    <input
                      type='text'
                      value={heroSearchText}
                onChange={(event) => {
                  const value = event.target.value
                  setHeroSearchText(value)
                  setHeroSearchOpen(Boolean(value.trim()))
                      }}
                      placeholder='Search food items, combos, categories...'
                      className='hero-search-input h-full w-full bg-white py-4 pl-12 pr-10 text-base font-semibold text-[#171717] outline-none placeholder:text-[#7a7a7a] sm:text-lg'
                      aria-label='Search food items'
                    />
                    {heroSearchText ? (
                      <button
                        type='button'
                        onClick={() => {
                          setHeroSearchText('')
                          setHeroSearchOpen(false)
                        }}
                        className='absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-[#7a7a7a] transition hover:bg-[#f4efe1] hover:text-[#d94b2b]'
                        aria-label='Clear search'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    ) : null}
                  </div>
                  <button
                    type='submit'
                    className='flex w-[64px] items-center justify-center bg-[#ffc222] text-[#171717] transition hover:bg-[#ffae00] sm:w-[82px]'
                    aria-label='Search'
                  >
                    <Search className='h-7 w-7' strokeWidth={2.4} />
                  </button>
                </div>

                {heroSearchOpen && heroSearchText.trim() ? (
                  <div className='absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-[18px] border border-[#eadfb7] bg-white text-[#171717] shadow-[0_24px_70px_rgba(0,0,0,0.28)]'>
                    {heroSearchResults.length ? (
                      <>
                        <div className='px-4 py-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a7b38]'>
                          Matching dishes
                        </div>
                        <div className='max-h-[320px] overflow-y-auto'>
                          {heroSearchResults.map((item) => (
                            <Link
                              key={item._id}
                              href={item.href}
                              onClick={() => {
                                setHeroSearchOpen(false)
                                setHeroSearchText('')
                              }}
                              className='flex items-center gap-3 border-t border-[#f1ead6] px-4 py-3 transition hover:bg-[#fff7df]'
                            >
                              <span className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#fff2cc]'>
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className='h-full w-full object-cover'
                                />
                              </span>
                              <span className='min-w-0 flex-1'>
                                <span className='block truncate text-sm font-extrabold text-[#171717] sm:text-base'>
                                  {item.title}
                                </span>
                                <span className='mt-1 block truncate text-xs font-semibold text-[#7b7b7b]'>
                                  {item.category}
                                </span>
                              </span>
                              <span className='shrink-0 text-sm font-extrabold text-[#d94b2b]'>
                                {formatPrice(item.price)}
                              </span>
                            </Link>
                          ))}
                        </div>
                        {heroSearchText.trim() ? (
                          <Link
                            href={heroSearchListingHref(heroSearchText)}
                            onClick={() => setHeroSearchOpen(false)}
                            className='flex items-center justify-between border-t border-[#f1ead6] bg-[#fffbf0] px-4 py-3 text-sm font-extrabold text-[#171717] transition hover:bg-[#fff3cc]'
                          >
                            View all results for "{heroSearchText.trim()}"
                            <ArrowRight className='h-4 w-4' />
                          </Link>
                        ) : null}
                      </>
                    ) : (
                      <div className='px-5 py-6 text-sm font-semibold text-[#6b6257]'>
                        No dishes found. Try another item name or category.
                      </div>
                    )}
                  </div>
                ) : null}
              </form>

              <span className='inline-flex w-fit rounded-full border border-[#ffd36a]/30 bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#ffd36a] shadow-[0_12px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm'>
                {heroPromoLabel}
              </span>
              <h1
                className='hero-title mt-4 max-w-[760px] text-[34px] font-black uppercase leading-[0.92] tracking-[-0.05em] sm:text-[48px] lg:text-[68px]'
                style={heroTitleSize ? { fontSize: `${heroTitleSize}px` } : undefined}
                data-template-path='components.home_page.header_text'
                data-template-section='hero'
              >
                <span className='hero-title-main' style={{ color: heroTitleColor }}>{heroTitleWords.primary}</span>
                {heroTitleWords.accent ? (
                  <>
                    {' '}
                    <span className='hero-title-accent' style={{ color: heroAccentColor }}>{heroTitleWords.accent}</span>
                  </>
                ) : null}
              </h1>
              <p
                className='mt-3 max-w-[560px] text-[17px] font-extrabold leading-6 text-[#ff8c42] drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:text-[21px]'
                style={{
                  color: heroSubtitleColor,
                  ...(heroSubtitleSize ? { fontSize: `${heroSubtitleSize}px` } : {}),
                }}
                data-template-path='components.home_page.header_text_small'
                data-template-section='hero'
              >
                {heroSubtitle}
              </p>
                  <p
                    className='mt-3 max-w-[610px] text-sm leading-6 text-white/82 sm:text-[15px]'
                    data-template-path='components.home_page.hero_detail'
                    data-template-section='hero'
                  >
                {heroDetail || promoOfferDisplay.detail}
                  </p>

              <div className='mt-6 flex flex-wrap items-center gap-4'>
                <Link
                  href={vendorId ? menuSectionPath : '#'}
                  className='inline-flex items-center justify-center rounded-[18px] bg-[#ffc222] px-7 py-4 text-base font-extrabold uppercase tracking-[0.05em] text-[#171717] shadow-[0_18px_40px_rgba(255,194,34,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ffae00]'
                  style={{ backgroundColor: heroPrimaryButtonColor }}
                  data-template-path='components.home_page.button_header'
                  data-template-section='hero'
                >
                  {heroButtonPrimary}
                </Link>
                <Link
                  href={vendorId ? menuSectionPath : '#'}
                  className='inline-flex items-center gap-3 rounded-[18px] border border-white/18 bg-white/10 px-6 py-4 text-sm font-extrabold uppercase tracking-[0.08em] text-white backdrop-blur-sm transition hover:border-[#ffc222]/50 hover:bg-white/14'
                  style={{ backgroundColor: heroSecondaryButtonColor }}
                  data-template-path='components.home_page.button_secondary'
                  data-template-section='hero'
                >
                  <span
                    className='flex h-10 w-10 items-center justify-center rounded-full bg-[#d94b2b] text-white shadow-[0_10px_22px_rgba(217,75,43,0.32)]'
                    style={{ backgroundColor: heroPrimaryButtonColor }}
                  >
                    <Play className='h-4 w-4 fill-current' />
                  </span>
                  {heroButtonSecondary}
                </Link>
                <div className='rounded-[18px] border border-white/12 bg-black/20 px-5 py-3 backdrop-blur-sm'>
                  <p
                    className='text-[28px] font-extrabold text-[#ff8c42] sm:text-[40px]'
                    data-template-path='components.home_page.hero_price'
                    data-template-section='hero'
                  >
                    {formatPrice(heroPrice)}
                  </p>
                  <p
                    className='text-base font-bold text-white/55 line-through sm:text-[24px]'
                    data-template-path='components.home_page.hero_old_price'
                    data-template-section='hero'
                  >
                    {formatPrice(heroOldPrice)}
                  </p>
                </div>
              </div>

              <div className='mt-5 flex flex-wrap gap-3 text-sm font-bold text-white/88'>
                {heroFeatures.map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className='rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-sm'
                    data-template-path={`components.home_page.hero_features.${index}`}
                    data-template-section='hero'
                  >
                    {feature}
                  </span>
                ))}
              </div>

            </div>

            <div className='hidden lg:flex lg:justify-end'>
              <div className='relative w-full max-w-[300px] rounded-[24px] border border-white/14 bg-white/10 p-4 text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-md'>
                <div className='overflow-hidden rounded-[22px] border border-white/10 bg-black/30'>
                  <div className='relative'>
                    <img
                      src={heroImage}
                      alt={`${heroTitle} preview`}
                      className='h-[180px] w-full object-cover object-center'
                    />
                    <div className='absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.5))]' />
                    <button
                      type='button'
                      className='absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#171717] shadow-[0_16px_34px_rgba(0,0,0,0.3)]'
                    >
                      <Play className='ml-1 h-6 w-6 fill-current' />
                    </button>
                    <div className='absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-[#111111]/65 px-4 py-3 backdrop-blur-sm'>
                      <div>
                        <p
                          className='text-xs font-bold uppercase tracking-[0.2em] text-[#ffd36a]'
                          data-template-path='components.home_page.hero_card_kicker'
                          data-template-section='hero'
                        >
                          {heroCardKicker}
                        </p>
                        <p
                          className='mt-1 text-lg font-extrabold'
                          data-template-path='components.home_page.hero_card_title'
                          data-template-section='hero'
                        >
                          {heroCardTitle}
                        </p>
                      </div>
                      <span
                        className='rounded-full bg-[#ff8c42] px-3 py-1 text-xs font-extrabold uppercase text-[#2f1305]'
                        data-template-path='components.home_page.hero_card_badge'
                        data-template-section='hero'
                      >
                        {heroCardBadge}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='mt-3 flex items-center justify-between rounded-[18px] bg-[#171717]/60 px-4 py-3'>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-[0.18em] text-white/60'>
                      <span
                        data-template-path='components.home_page.hero_starting_label'
                        data-template-section='hero'
                      >
                        {heroStartingLabel}
                      </span>
                    </p>
                    <p className='mt-1 text-2xl font-extrabold text-[#ffc222]'>{formatPrice(heroPrice)}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs font-bold uppercase tracking-[0.18em] text-white/60'>
                      <span
                        data-template-path='components.home_page.hero_rating_label'
                        data-template-section='hero'
                      >
                        {heroRatingLabel}
                      </span>
                    </p>
                    <p
                      className='mt-1 text-xl font-extrabold text-white'
                      data-template-path='components.home_page.hero_rating_value'
                      data-template-section='hero'
                    >
                      {heroRatingValue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <style jsx>{`
          .hero-backdrop-layer {
            opacity: 0;
            transform: scale(1.04);
            animation: heroCrossfade 18s infinite ease-in-out;
            will-change: opacity, transform;
            filter: saturate(1.05) contrast(1.02);
          }

          .hero-backdrop-layer:first-child {
            opacity: 1;
          }

          .hero-title-main {
            color: #ffffff;
            text-shadow:
              0 4px 0 rgba(0, 0, 0, 0.28),
              0 10px 20px rgba(0, 0, 0, 0.24);
          }

          .hero-title-accent {
            color: #ffc222;
            text-shadow:
              0 4px 0 rgba(118, 74, 0, 0.34),
              0 10px 20px rgba(0, 0, 0, 0.22);
          }

          .hero-search-input::-webkit-search-decoration,
          .hero-search-input::-webkit-search-cancel-button,
          .hero-search-input::-webkit-search-results-button,
          .hero-search-input::-webkit-search-results-decoration {
            display: none;
          }

          @keyframes heroCrossfade {
            0% {
              opacity: 0;
              transform: scale(1.08);
            }
            8% {
              opacity: 1;
            }
            28% {
              opacity: 1;
              transform: scale(1.02);
            }
            36% {
              opacity: 0;
              transform: scale(1.06);
            }
            100% {
              opacity: 0;
              transform: scale(1.08);
            }
          }
        `}</style>
      </section>

      <section className='bg-white py-4 sm:py-5'>
        <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
          <div className='mb-3 flex items-center justify-between gap-4'>
            <h2 className='text-[18px] font-black uppercase tracking-normal text-[#171717] sm:text-[24px]'>
              Our menu
            </h2>
            <Link
              href={vendorId ? allProductsPath : '#'}
              className='inline-flex shrink-0 items-center gap-1.5 text-[12px] font-black text-[#5b2413] transition hover:text-[#d94b2b] sm:text-[13px]'
            >
              See All
              <ArrowRight className='h-3.5 w-3.5' />
            </Link>
          </div>
          <div className='-mx-4 flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden'>
            {menuCategories.map((item, index) => (
              <Link
                key={item.key}
                href={item.href}
                className='group inline-flex w-[88px] shrink-0 snap-start flex-col items-center justify-start text-center transition hover:-translate-y-1 sm:w-[116px] lg:w-[138px]'
              >
                <div className='flex h-[58px] w-full items-end justify-center overflow-hidden rounded-[6px] bg-white sm:h-[70px] lg:h-[78px]'>
                  <img
                    src={item.image || MENU_FALLBACKS[index % MENU_FALLBACKS.length]}
                    alt={item.label}
                    className='h-[50px] w-auto max-w-[82px] object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.14)] transition duration-300 group-hover:scale-105 sm:h-[60px] sm:max-w-[104px] lg:h-[66px] lg:max-w-[120px]'
                  />
                </div>
                <p className='mt-2 min-h-[34px] w-full overflow-hidden text-[12px] font-black leading-[1.12] tracking-normal text-[#171717] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:min-h-[40px] sm:text-[14px]'>
                  {item.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {visibleFoodOffers.length ? (
        <section id='offers' className='scroll-mt-32 bg-[#fff8e8] py-14'>
          <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
            <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
              <div>
                <p className='text-xs font-extrabold uppercase tracking-[0.22em] text-[#d94b2b]'>
                  Live offers
                </p>
                <h2 className='template-section-title mt-2 text-[36px] font-black leading-none tracking-[-0.05em] text-[#171717] sm:text-[52px]'>
                  Today's food deals
                </h2>
              </div>
              <Link
                href={vendorId ? allProductsPath : '#'}
                className='inline-flex w-fit items-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-sm font-extrabold uppercase text-white transition hover:bg-[#d94b2b]'
              >
                View menu
                <ArrowRight className='h-4 w-4' />
              </Link>
            </div>

            <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
              {visibleFoodOffers.slice(0, 4).map((offer, index) => {
                const comboItems = getComboOfferItems(offer, foodMenuItems)
                const isComboOffer = comboItems.length > 0 || offer?.offer_type === 'combo_price'
                const isComboSet =
                  comboItems.length > 1 || comboItems.some((item) => item.quantity > 1)
                const comboTitle = getComboOfferTitle(offer, comboItems)
                const comboWorth = comboItems.reduce(
                  (sum, item) => sum + toNumber(item.originalUnitPrice) * item.quantity,
                  0,
                )
                const comboPrice = toNumber(offer?.combo_price)
                const comboSavings =
                  comboWorth > 0 && comboPrice > 0 && comboWorth > comboPrice
                    ? comboWorth - comboPrice
                    : 0
                const offerId = String(offer?._id || offer?.offer_title || `offer-${index}`)
                const offerAdding = addingId === `offer-${offerId}`

                return (
                  <article
                    key={offer?._id || `${offer?.offer_title || 'offer'}-${index}`}
                    className='overflow-hidden rounded-[26px] border border-[#eadfb7] bg-white shadow-[0_18px_34px_rgba(23,23,23,0.06)]'
                  >
                    {isComboOffer ? (
                      <div className='relative bg-white px-5 pt-5'>
                        <span className='absolute left-5 top-5 z-10 rounded-full bg-[#3c1710] px-4 py-1.5 text-xs font-black uppercase text-white shadow-[0_10px_20px_rgba(60,23,16,0.18)]'>
                          {isComboSet ? 'Combo' : 'Deal'}
                        </span>
                        <div className='flex h-[178px] items-center justify-center pt-5'>
                          {comboItems.length && !isComboSet ? (
                            <img
                              src={comboItems[0].image}
                              alt={comboItems[0].name}
                              className='h-[150px] w-full object-contain drop-shadow-[0_18px_30px_rgba(23,23,23,0.14)]'
                            />
                          ) : comboItems.length ? (
                            comboItems.slice(0, 3).map((item, itemIndex) => (
                              <div
                                key={item.key}
                                className='relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#fff8ef]'
                                style={{ marginLeft: itemIndex ? '-18px' : 0 }}
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className='h-24 w-24 object-contain drop-shadow-[0_14px_24px_rgba(23,23,23,0.16)]'
                                />
                                {item.quantity > 1 ? (
                                  <span className='absolute -right-1 -top-1 rounded-full bg-[#ffc222] px-2 py-1 text-xs font-black text-[#171717]'>
                                    x{item.quantity}
                                  </span>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <img
                              src='/pocofood-categories/combo.png'
                              alt={offer?.offer_title || 'Combo offer'}
                              className='h-32 w-32 object-contain drop-shadow-[0_14px_24px_rgba(23,23,23,0.16)]'
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className='bg-[#171717] px-5 py-5 text-white'>
                        <p className='text-xs font-extrabold uppercase tracking-[0.2em] text-[#ffc222]'>
                          {String(offer?.offer_type || 'offer').replace(/_/g, ' ')}
                        </p>
                        <h3 className='mt-3 min-h-[58px] text-[26px] font-black leading-[1.08] tracking-[-0.04em]'>
                          {offer?.offer_title || 'Food offer'}
                        </h3>
                      </div>
                    )}

                    <div className='p-5'>
                      <p className='text-xs font-extrabold uppercase tracking-[0.18em] text-[#d94b2b]'>
                        {isComboOffer && !isComboSet
                          ? 'special price'
                          : String(offer?.offer_type || 'offer').replace(/_/g, ' ')}
                      </p>
                      <h3 className='mt-2 min-h-[62px] text-[26px] font-black leading-[1.08] tracking-[-0.04em] text-[#171717]'>
                        {isComboOffer ? comboTitle : offer?.offer_title || 'Food offer'}
                      </h3>

                      {comboItems.length ? (
                        <div className='mt-3 flex flex-wrap gap-2'>
                          {comboItems.map((item) => (
                            <span
                              key={`${item.key}-chip`}
                              className='rounded-full bg-[#fff3cf] px-3 py-1 text-xs font-extrabold text-[#5c3324]'
                            >
                              {item.quantity} x {item.name}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <p className='mt-4 text-[30px] font-black leading-none text-[#d94b2b]'>
                        {isComboOffer && !isComboSet && comboPrice > 0
                          ? `Deal ${formatPrice(comboPrice)}`
                          : getFoodOfferValueLabel(offer)}
                      </p>
                      {comboSavings > 0 ? (
                        <p className='mt-2 text-sm font-extrabold text-[#6f6255]'>
                          Worth <span className='line-through'>{formatPrice(comboWorth)}</span>
                          <span className='ml-2 text-[#d94b2b]'>Save {formatPrice(comboSavings)}</span>
                        </p>
                      ) : null}
                      <p className='mt-3 min-h-[44px] text-sm font-semibold leading-6 text-[#6f6255]'>
                        {getFoodOfferFinePrint(offer)}
                      </p>
                      {isComboOffer && comboItems.length ? (
                        <button
                          type='button'
                          onClick={() => void addOfferToCart(offer, comboItems)}
                          disabled={offerAdding}
                          className='mt-5 inline-flex w-full items-center justify-center rounded-[16px] bg-[#ffc222] px-4 py-3 text-sm font-extrabold uppercase text-[#171717] transition hover:bg-[#ffae00] disabled:cursor-not-allowed disabled:bg-[#eadfb7]'
                        >
                          {offerAdding ? 'Adding combo...' : 'Add combo to cart'}
                        </button>
                      ) : (
                        <Link
                          href={vendorId ? menuSectionPath : '#'}
                          className='mt-5 inline-flex w-full items-center justify-center rounded-[16px] bg-[#ffc222] px-4 py-3 text-sm font-extrabold uppercase text-[#171717] transition hover:bg-[#ffae00]'
                        >
                          Order now
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className='bg-white py-4 sm:py-6' data-template-section='description'>
        <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
          <div className='text-center'>
            <p
              className='text-[28px] font-semibold italic tracking-[-0.03em] text-[#ffb81c] sm:text-[42px]'
              data-template-path='components.home_page.benefits.kicker'
              data-template-section='description'
            >
              {configuredDisplayText(servicesConfig?.kicker, 'Our Services')}
            </p>
            <h2
              className='mt-1 text-[34px] font-black tracking-[-0.05em] text-[#171717] sm:text-[54px]'
              data-template-path='components.home_page.benefits.heading'
              data-template-section='description'
            >
              {configuredDisplayText(servicesConfig?.heading, 'Why choose us?')}
            </h2>
            {configuredDisplayText(servicesConfig?.subtitle) ? (
              <p
                className='mx-auto mt-2 max-w-[680px] text-base leading-7 text-[#7c7c7c]'
                data-template-path='components.home_page.benefits.subtitle'
                data-template-section='description'
              >
                {configuredDisplayText(servicesConfig?.subtitle)}
              </p>
            ) : null}
          </div>

          <div className='mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
            {serviceCards.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className='rounded-[28px] border border-[#ece8df] bg-white px-6 py-8 text-center shadow-[0_14px_34px_rgba(23,23,23,0.035)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(23,23,23,0.06)] sm:px-7 sm:py-9'
              >
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${item.iconWrap}`}>
                  {item.icon}
                </div>
                <h3
                  className='mt-6 text-[24px] font-black tracking-[-0.04em] text-[#171717] sm:text-[26px]'
                  data-template-path={`components.home_page.benefits.cards.${index}.title`}
                  data-template-section='description'
                >
                  {item.title}
                </h3>
                <p
                  className='mx-auto mt-3 max-w-[230px] text-[16px] leading-8 text-[#7c7c7c]'
                  data-template-path={`components.home_page.benefits.cards.${index}.description`}
                  data-template-section='description'
                >
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id='food-menu' className='bg-white py-10 sm:py-12 lg:py-14' data-template-section='products'>
        <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
          <div className='mx-auto max-w-[860px] text-center'>
            <p className='text-xs font-black uppercase tracking-[0.22em] text-[#d94b2b]'>
              Menu highlights
            </p>
            <h2
              className='template-section-title mt-2 text-[34px] font-extrabold leading-none tracking-[-0.05em] text-[#171717] sm:text-[44px] lg:text-[52px]'
              data-template-path='components.home_page.products_heading'
              data-template-section='products'
            >
              {productsHeading}
            </h2>
            <p
              className='mx-auto mt-4 max-w-[760px] text-sm font-semibold leading-6 text-[#686868] sm:text-base sm:leading-8'
              data-template-path='components.home_page.products_subtitle'
              data-template-section='products'
            >
              {productsSubtitle}
            </p>
          </div>

          <div className='-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden'>
            {categoryTabs.map((item) => (
              <button
                key={item.key}
                type='button'
                onClick={() => setActiveCategory(item.key)}
                className={`min-w-[148px] shrink-0 snap-start rounded-full border px-6 py-3.5 text-sm font-extrabold uppercase transition sm:min-w-[160px] sm:px-8 sm:py-4 ${
                  activeCategory === item.key
                    ? 'border-[#ffc222] bg-[#ffc222] text-[#171717]'
                    : 'border-[#efe7ca] bg-white text-[#171717] hover:border-[#ffcf4d]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:mt-10 xl:grid-cols-4'>
            {featuredProducts.length ? (
              featuredProducts.map((product, index) => {
                const isWishlisted = wishlistIds.includes(String(product._id || ""))
                return (
                <article
                  key={product._id || `${product.title}-${index}`}
                  className='template-product-card overflow-hidden rounded-[30px] border border-[#efe7ca] bg-white p-4 shadow-[0_20px_40px_rgba(23,23,23,0.05)]'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-1 text-[#ffc222]'>
                      {Array.from({ length: 5 }).map((_, ratingIndex) => (
                        <Star
                          key={ratingIndex}
                          className={`h-4 w-4 ${ratingIndex < product.rating ? 'fill-current' : 'text-[#e9dcc0]'}`}
                        />
                      ))}
                    </div>
                    <button
                      type='button'
                      onClick={() => toggleWishlist(product)}
                      className={`rounded-full bg-[#f6f1df] p-2 transition hover:text-[#ff5a36] ${
                        isWishlisted ? 'text-[#d94b2b]' : 'text-[#d1c6a6]'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <Link
                    href={product.href}
                    className='mt-4 block overflow-hidden rounded-[24px] bg-[#fff7e4]'
                  >
                    <div className='flex aspect-[4/3] items-center justify-center p-5'>
                      <img
                        src={product.image}
                        alt={product.title}
                        className='h-full w-full object-contain transition duration-500 hover:scale-105'
                      />
                    </div>
                  </Link>

                  <div className='mt-5 flex items-center gap-2'>
                    <FoodTypeMark type={product.foodType} />
                    <p className='text-[13px] font-bold uppercase tracking-[0.12em] text-[#d94b2b]'>
                      {product.category}
                    </p>
                  </div>
                  <Link
                    href={product.href}
                    className='mt-2 block text-[30px] font-extrabold leading-[1] tracking-[-0.04em] text-[#171717]'
                  >
                    {product.title}
                  </Link>
                  <p className='mt-3 min-h-[72px] text-sm leading-7 text-[#686868]'>
                    {product.description}
                  </p>

                  <div className='mt-5 flex items-end justify-between gap-3'>
                    <div>
                      <p className='text-[16px] font-bold text-[#ffae00]'>{formatPrice(product.price)}</p>
                      {product.oldPrice > product.price ? (
                        <p className='text-sm text-[#9e9e9e] line-through'>{formatPrice(product.oldPrice)}</p>
                      ) : null}
                    </div>
                    {product.variantId || product.isFoodCatalogItem ? (
                      <button
                        type='button'
                        onClick={() => void handleAddToCart(product)}
                        disabled={
                          (!product.isFoodCatalogItem && product.stockQuantity <= 0) ||
                          addingId === product._id
                        }
                        className='inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#ffc222] text-[#171717] transition hover:bg-[#ffae00] disabled:cursor-not-allowed disabled:bg-[#efe7ca] disabled:text-[#a58f55]'
                      >
                        {addingId === product._id ? (
                          <span className='text-[11px] font-extrabold uppercase'>...</span>
                        ) : (
                          <ShoppingBasket className='h-5 w-5' />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={product.href}
                        className='inline-flex h-14 items-center justify-center rounded-full bg-[#ffc222] px-5 text-sm font-extrabold uppercase text-[#171717] transition hover:bg-[#ffae00]'
                      >
                        View
                      </Link>
                    )}
                  </div>
                </article>
                )
              })
            ) : (
              <div className='rounded-[30px] border border-dashed border-[#eadfb7] bg-[#fffdf6] p-10 text-center text-sm text-[#686868] sm:col-span-2 xl:col-span-4'>
                Food Hub me food items add karo. PocoFood template ab sirf wahi food menu show karega.
              </div>
            )}
          </div>

          {actionMessage ? (
            <p className='mt-6 rounded-2xl bg-[#fff7e4] px-4 py-3 text-sm font-semibold text-[#171717]'>
              {actionMessage}
            </p>
          ) : null}
        </div>
      </section>

      <section
        className='py-6 text-white sm:py-8'
        style={{ backgroundColor: offerSectionBackgroundColor }}
        data-template-path='components.home_page.offer_section_background_color'
      >
        <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
          <div className='relative overflow-hidden rounded-[30px] border border-white/8 shadow-[0_30px_80px_rgba(0,0,0,0.28)]'>
            {hasPromoOfferComboItems ? (
              <div
                className='absolute inset-0 flex items-center justify-center overflow-hidden bg-[#f7f2df]'
                data-template-path='components.home_page.offer_section_background_image'
              >
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_38%_52%,rgba(255,194,34,0.28),transparent_30%),linear-gradient(90deg,rgba(255,255,255,0.42),rgba(255,255,255,0.2))]' />
                <div className='relative flex h-full w-full items-center justify-center gap-0 px-[12%] py-5 sm:py-8 lg:px-[18%]'>
                  {promoOfferComboItems.slice(0, 3).map((item, itemIndex) => (
                    <div
                      key={`${item.key}-offer-background`}
                      className='flex h-full min-w-0 flex-1 items-center justify-center'
                      style={{ marginLeft: itemIndex ? '-4%' : 0 }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className='h-[78%] w-full object-contain drop-shadow-[0_24px_34px_rgba(0,0,0,0.18)] sm:h-[84%] lg:h-[88%]'
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={promoOfferBackgroundImage}
                alt='Offer banner'
                className='absolute inset-0 h-full w-full object-cover object-center'
                data-template-path='components.home_page.offer_section_background_image'
              />
            )}
            <div
              className='absolute inset-0 bg-[#121212]'
              style={{ opacity: hasPromoOfferComboItems ? Math.max(offerSectionOverlayOpacity, 0.42) : offerSectionOverlayOpacity }}
              data-template-path='components.home_page.offer_section_overlay_opacity'
            />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,194,34,0.12),transparent_18%),radial-gradient(circle_at_left_bottom,rgba(255,255,255,0.08),transparent_24%)]' />

            <div className='relative min-h-[230px] px-5 py-6 sm:min-h-[300px] sm:px-8 sm:py-7 lg:min-h-[350px] lg:px-12 lg:py-8'>
              <div className='absolute left-3 top-3 sm:left-[18%] sm:top-8 lg:left-[20%] lg:top-10'>
                <div
                  className='flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full text-center text-[#171717] shadow-[0_18px_34px_rgba(0,0,0,0.18)] sm:h-[122px] sm:w-[122px] lg:h-[148px] lg:w-[148px]'
                  style={{ backgroundColor: offerSectionPriceBackground }}
                  data-template-path='components.home_page.offer_section_price_background'
                >
                  <p className='text-[10px] font-bold italic leading-none text-[#171717] sm:text-[12px] lg:text-[14px]'>
                    {promoOfferDisplay.statPrefix}
                  </p>
                  <p
                    className='mt-1 text-[26px] font-black leading-none sm:text-[36px] lg:text-[46px]'
                    style={{ color: offerSectionPriceColor }}
                    data-template-path='components.home_page.offer_section_price_color'
                  >
                    {promoOfferDisplay.statValue}
                  </p>
                  {promoOfferDisplay.statSuffix ? (
                    <p className='text-[20px] font-black leading-none sm:text-[28px] lg:text-[36px]'>
                      {promoOfferDisplay.statSuffix}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className='ml-auto flex h-full w-full max-w-[680px] flex-col items-center justify-center pt-20 text-center sm:pt-28 lg:max-w-[700px] lg:items-center lg:pt-0 lg:pr-10 xl:pr-16'>
                <p
                  className='text-[19px] font-semibold italic leading-none sm:text-[32px] lg:text-[44px]'
                  style={{
                    color: offerSectionEyebrowColor,
                    textShadow: '0 6px 18px rgba(0,0,0,0.32)',
                  }}
                  data-template-path='components.home_page.offer_section_eyebrow'
                >
                  {offerSectionEyebrow}
                </p>
                <h2
                  className='mt-2 max-w-full text-center text-[31px] font-black uppercase leading-[0.92] tracking-[-0.02em] sm:text-[54px] lg:text-[70px] xl:text-[80px]'
                  style={{
                    color: offerSectionTitleColor,
                    textShadow: '0 10px 28px rgba(0,0,0,0.34)',
                  }}
                  data-template-path='components.home_page.offer_section_title_color'
                >
                  {promoOfferDisplay.headline}
                </h2>
                <Link
                  href={vendorId ? menuSectionPath : '#'}
                  className='mt-4 inline-flex self-center rounded-[16px] bg-white px-6 py-3 text-sm font-extrabold uppercase tracking-[0.04em] text-[#171717] shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#fff2c9] sm:mt-5 sm:px-8 sm:py-4 sm:text-base'
                  style={{
                    backgroundColor: offerSectionButtonBackground,
                    color: offerSectionButtonTextColor,
                  }}
                  data-template-path='components.home_page.offer_section_button_label'
                >
                  {offerSectionButtonLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-white py-16'>
        <div className='mx-auto grid max-w-[1440px] gap-8 px-4 xl:grid-cols-[minmax(0,1.95fr)_460px] lg:px-10'>
          <div>
            <div className='mb-8 flex items-center justify-between gap-4'>
              <h2 className='template-section-title text-[38px] font-extrabold tracking-[-0.05em] text-[#171717] sm:text-[52px]'>
                <span data-template-path='components.home_page.recipe_section_heading'>
                  {recipeSectionHeading}
                </span>
              </h2>
              <Link
                href={vendorId ? menuSectionPath : '#'}
                className='inline-flex items-center gap-2 text-sm font-extrabold uppercase text-[#d94b2b]'
              >
                See all
                <ArrowRight className='h-4 w-4' />
              </Link>
            </div>
            <div className='grid gap-5 md:grid-cols-2'>
              {topRecipeCards.map((product, index) => (
                <article
                  key={`${product.title}-${index}`}
                  className='flex min-h-[168px] items-center gap-4 rounded-[30px] border border-[#ece7dd] bg-[#fff8e8] px-5 py-4 shadow-[0_10px_24px_rgba(23,23,23,0.03)]'
                >
                  <div className='flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_10px_20px_rgba(23,23,23,0.08)]'>
                    <img src={product.image} alt={product.title} className='h-[84px] w-[84px] object-contain' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <FoodTypeMark type={product.foodType} />
                      <p className='text-[15px] text-[#8a8a8a]'>
                        {product.category}
                      </p>
                    </div>
                    <p className='mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.03em] text-[#171717]'>
                      {product.title}
                    </p>
                    <div className='mt-2 flex items-center gap-2'>
                      {product.oldPrice ? (
                        <span className='text-[16px] font-bold text-[#8a8a8a] line-through'>
                          {formatPrice(product.oldPrice)}
                        </span>
                      ) : null}
                      <span className='text-[18px] font-extrabold text-[#ffb81c]'>
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                  {product.variantId || product.isFoodCatalogItem ? (
                    <button
                      type='button'
                      onClick={() => void handleAddToCart(product)}
                      disabled={addingId === product._id}
                      className='inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffc222] text-[#171717] transition hover:bg-[#ffae00] disabled:bg-[#efe7ca]'
                    >
                      <ShoppingBasket className='h-5 w-5' />
                    </button>
                  ) : (
                    <Link
                      href={product.href}
                      className='inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#ffc222] text-[#171717] transition hover:bg-[#ffae00]'
                    >
                      <ArrowRight className='h-5 w-5' />
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </div>

          <aside className='overflow-hidden rounded-[26px] border border-[#f3c957] bg-[#ffc31a] shadow-[0_24px_60px_rgba(255,194,34,0.24)] xl:sticky xl:top-6 xl:self-start'>
            <div className='p-8'>
              <p className='text-center text-[30px] font-bold italic text-white sm:text-[34px]'>{promoSidebarSubtitle}</p>
              <h3 className='mt-3 text-center text-[58px] font-extrabold uppercase leading-[0.92] tracking-[-0.05em] text-[#ff2c14] sm:text-[72px]'>
                {promoSidebarTitle}
              </h3>
              <p className='mt-6 text-center text-[18px] font-extrabold uppercase text-white'>
                Call us now:
              </p>
              <p className='mt-2 text-center text-[34px] font-extrabold text-[#ff2c14] sm:text-[46px]'>
                {promoCallPhone}
              </p>
            </div>
            <div className='px-6 pb-6'>
              <img src={getFoodMenuImage(foodMenuItems[0], '/pocofood-categories/burger.png')} alt='Chicken promo' className='h-[300px] w-full rounded-[30px] object-contain bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.26),transparent_45%)] p-4' />
            </div>
          </aside>
        </div>
      </section>

      <section className='bg-white py-6 sm:py-8'>
        <div className='mx-auto grid max-w-[1440px] items-center gap-8 px-4 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:px-10'>
          <div className='max-w-[560px]'>
            <p
              className='text-[28px] font-semibold italic tracking-[-0.03em] text-[#ffb81c] sm:text-[42px]'
              data-template-path='components.home_page.advantage.kicker'
            >
              {advantageKicker}
            </p>
            <h2
              className='mt-2 text-[34px] font-black leading-[0.98] tracking-[-0.05em] text-[#171717] sm:text-[50px]'
              data-template-path='components.home_page.advantage.heading'
            >
              {advantageHeading}
            </h2>
            <p
              className='mt-5 max-w-[520px] whitespace-pre-line text-[17px] leading-8 text-[#7b7b7b]'
              data-template-path='components.home_page.advantage.subtitle'
            >
              {advantageSubtitle}
            </p>

            <div className='mt-8 space-y-6'>
              {advantageCards.slice(0, 2).map((card, index) => {
                const Icon = index === 0 ? UtensilsCrossed : Leaf
                return (
                  <div key={`advantage-card-${index}`} className='flex items-start gap-5'>
                    <div
                      className='flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-white shadow-[0_14px_24px_rgba(217,75,43,0.2)]'
                      style={{ backgroundColor: advantageAccentColor }}
                      data-template-path='components.home_page.advantage.accentColor'
                    >
                      <Icon className='h-8 w-8' strokeWidth={2.2} />
                    </div>
                    <div className='pt-1'>
                      <h3
                        className='text-[20px] font-black tracking-[-0.03em] text-[#171717]'
                        data-template-path={`components.home_page.advantage.cards.${index}.title`}
                      >
                        {card.title}
                      </h3>
                      <p
                        className='mt-1 text-[17px] leading-7 text-[#7b7b7b]'
                        data-template-path={`components.home_page.advantage.cards.${index}.description`}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {advantageCtaLabel ? (
              <Link
                href={vendorId ? menuSectionPath : '#'}
                className='mt-8 inline-flex rounded-[16px] bg-[#ffc222] px-8 py-4 text-base font-extrabold uppercase tracking-[0.05em] text-[#171717] shadow-[0_16px_30px_rgba(255,194,34,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffae00]'
                data-template-path='components.home_page.advantage.ctaLabel'
              >
                {advantageCtaLabel}
              </Link>
            ) : null}
          </div>

          <div className='relative flex min-h-[320px] items-center justify-center lg:justify-end'>
            <div
              className='absolute inset-x-[12%] top-[18%] h-[210px] rounded-[46%] blur-[2px] lg:inset-x-[10%] lg:top-[20%] lg:h-[250px]'
              style={{
                background: `radial-gradient(circle, ${hexToRgba(advantageGlowColor, 0.96)} 0%, ${hexToRgba(advantageGlowColor, 0.9)} 52%, ${hexToRgba(advantageGlowColor, 0.18)} 100%)`,
              }}
              data-template-path='components.home_page.advantage.glowColor'
            />
            <div className='absolute right-[4%] top-[12%] h-16 w-16 rounded-full border-4 border-[#ffc222] opacity-70' />
            <div className='absolute left-[18%] top-[14%] h-10 w-10 rounded-full border-4 border-[#ffc222] opacity-80' />

            <div className='relative z-10 grid w-full max-w-[620px] gap-4 sm:grid-cols-[1.05fr_0.95fr]'>
              <div className='flex flex-col gap-4 pt-10 sm:pt-16'>
                <div className='rounded-[28px] bg-white/92 p-4 shadow-[0_18px_36px_rgba(23,23,23,0.08)] backdrop-blur-sm'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#fff7df]'>
                      <img
                        src={advantageVisualCardImage}
                        alt={advantageVisualCardTitle}
                        className='h-16 w-16 object-contain'
                        data-template-path='components.home_page.advantage.visualCardImage'
                      />
                    </div>
                    <div>
                      <p
                        className='text-sm font-bold uppercase tracking-[0.16em]'
                        style={{ color: advantageAccentColor }}
                        data-template-path='components.home_page.advantage.topTag'
                      >
                        {advantageTopTag}
                      </p>
                      <p
                        className='mt-1 text-[24px] font-black tracking-[-0.03em] text-[#171717]'
                        data-template-path='components.home_page.advantage.visualCardTitle'
                      >
                        {advantageVisualCardTitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className='ml-6 rounded-[28px] p-5 text-white shadow-[0_18px_36px_rgba(217,75,43,0.2)]'
                  style={{ backgroundColor: advantageAccentColor }}
                  data-template-path='components.home_page.advantage.promiseText'
                >
                  <p className='text-sm font-bold uppercase tracking-[0.16em] text-white/72'>
                    {advantagePromiseLabel}
                  </p>
                  <p className='mt-2 whitespace-pre-line text-[26px] font-black leading-tight tracking-[-0.03em]'>
                    {advantagePromiseText}
                  </p>
                </div>
              </div>

              <div className='relative flex items-center justify-center'>
                <div className='absolute inset-6 rounded-full bg-white/28 blur-xl' />
                <div className='relative flex h-[270px] w-[270px] items-center justify-center rounded-full border-[14px] border-white bg-[radial-gradient(circle_at_top,#fffaf0_0%,#fff5d6_48%,#ffe8a4_100%)] shadow-[0_28px_45px_rgba(23,23,23,0.12)] sm:h-[320px] sm:w-[320px]'>
                  <img
                    src={advantageMainImage}
                    alt={advantageHeading}
                    className='h-[200px] w-[200px] object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.16)] sm:h-[240px] sm:w-[240px]'
                    data-template-path='components.home_page.advantage.image'
                  />
                </div>

                <div className='absolute -bottom-2 right-0 rounded-[22px] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(23,23,23,0.1)]'>
                  <p
                    className='text-xs font-bold uppercase tracking-[0.16em]'
                    style={{ color: advantageAccentColor }}
                    data-template-path='components.home_page.advantage.premiumLabel'
                  >
                    {advantagePremiumLabel}
                  </p>
                  <div className='mt-2 flex items-center gap-3'>
                    <img
                      src={advantagePremiumImageOne}
                      alt='Premium pick one'
                      className='h-12 w-12 object-contain'
                      data-template-path='components.home_page.advantage.premiumImageOne'
                    />
                    <img
                      src={advantagePremiumImageTwo}
                      alt='Premium pick two'
                      className='h-12 w-12 object-contain'
                      data-template-path='components.home_page.advantage.premiumImageTwo'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='bg-[#fbf5de] py-16'>
        <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
          <h2 className='template-section-title text-center text-[38px] font-extrabold tracking-[-0.05em] text-[#171717] sm:text-[56px]'>
            What your client says
          </h2>
          <div className='mt-10 grid gap-6 lg:grid-cols-3'>
            {testimonials.map((item, index) => (
              <article
                key={`${item.name}-${index}`}
                className='rounded-[30px] border border-[#eadfb7] bg-white p-8 shadow-[0_18px_34px_rgba(23,23,23,0.05)]'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-center gap-4'>
                    <img
                      src={item.image}
                      alt={item.name}
                      className='h-16 w-16 rounded-full object-cover'
                    />
                    <div>
                      <p className='text-[28px] font-extrabold leading-none tracking-[-0.03em] text-[#171717]'>
                        {item.name}
                      </p>
                      <p className='mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#d94b2b]'>
                        {item.role}
                      </p>
                    </div>
                  </div>
                  <Quote className='h-8 w-8 text-[#ffc222]' />
                </div>
                <div className='mt-6 flex items-center gap-1 text-[#ffc222]'>
                  {Array.from({ length: 5 }).map((_, ratingIndex) => (
                    <Star
                      key={ratingIndex}
                      className={`h-5 w-5 ${ratingIndex < item.rating ? 'fill-current' : 'text-[#e9dcc0]'}`}
                    />
                  ))}
                </div>
                <p className='mt-6 text-base leading-8 text-[#686868]'>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-white py-16'>
        <div className='mx-auto max-w-[1440px] px-4 lg:px-10'>
          <div className='mb-10 flex items-center justify-between gap-4'>
            <h2 className='template-section-title text-[38px] font-extrabold tracking-[-0.05em] text-[#171717] sm:text-[52px]'>
              Latest news
            </h2>
            <Link href={toTemplatePath('blog')} className='inline-flex items-center gap-2 text-sm font-extrabold uppercase text-[#d94b2b]'>
              See all
              <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
          <div className='grid gap-6 lg:grid-cols-3'>
            {newsCards.map((item: any, index: number) => (
              <article
                key={`${item?.title || 'news'}-${index}`}
                className='overflow-hidden rounded-[30px] border border-[#efe7ca] bg-[#fffdf6]'
              >
                <img
                  src={configuredImage(item?.image, NEWS_FALLBACKS[index % NEWS_FALLBACKS.length])}
                  alt={configuredText(item?.title, 'Latest news')}
                  className='h-[280px] w-full object-cover'
                />
                <div className='p-6'>
                  <p className='text-xs font-bold uppercase tracking-[0.12em] text-[#d94b2b]'>
                    {configuredText(item?.category, 'Uncategorized')} / {configuredText(item?.date, 'September 7, 2020')} / Post by {configuredText(item?.author, 'admin')}
                  </p>
                  <h3 className='mt-4 text-[30px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#171717]'>
                    {configuredText(item?.title, 'Digital restaurant campaign ideas')}
                  </h3>
                  <p className='mt-4 text-base leading-8 text-[#686868]'>
                    {configuredText(item?.excerpt, 'Campaign storytelling, seasonal offers, and food-first visual merchandising for delivery brands.')}
                  </p>
                  <Link
                    href={item?.slug ? toTemplatePath(`blog/${item.slug}`) : toTemplatePath('blog')}
                    className='mt-6 inline-flex rounded-[18px] bg-[#ffc222] px-6 py-3 text-sm font-extrabold uppercase tracking-[0.06em] text-[#171717] transition hover:bg-[#ffae00]'
                  >
                    Read more
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {customizingProduct ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/45 px-3 py-4 sm:px-6'>
          <div className='relative flex max-h-[84dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:max-h-[82vh]'>
            <div className='flex flex-none items-center justify-between bg-white px-4 py-3 sm:px-5'>
              <button
                type='button'
                onClick={closeFoodCustomization}
                className='inline-flex h-9 w-9 items-center justify-center rounded-full text-[#6d382f] transition hover:bg-[#f8efe3]'
                aria-label='Back'
              >
                <span className='text-2xl leading-none'>&larr;</span>
              </button>
              <button
                type='button'
                onClick={closeFoodCustomization}
                className='inline-flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-[#6d382f] transition hover:bg-[#f8efe3]'
                aria-label='Close customization popup'
              >
                <X className='h-4 w-4' />
              </button>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-5 sm:px-6 [scrollbar-gutter:stable]'>
              <div className='mx-auto flex h-32 max-w-sm items-center justify-center bg-white sm:h-36'>
                <img
                  src={customizingProduct.image}
                  alt={customizingProduct.title}
                  className='h-full w-full object-contain'
                />
              </div>

              <div className='mt-3 text-center'>
                <h3 className='text-2xl font-black uppercase leading-tight tracking-[-0.03em] text-black sm:text-[28px]'>
                  {customizingProduct.title}
                </h3>
                <p className='mt-1.5 text-sm font-bold text-black sm:text-base'>
                  Energy - {restaurantPrepTime || 20} mins prep
                </p>
              </div>

              {customizingProduct.availableVariants?.length ? (
                <div className='mt-6'>
                  <h4 className='text-lg font-black text-black sm:text-xl'>Choose Variant</h4>
                  <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                    {customizingProduct.availableVariants
                      .filter((variant) => variant?.is_available !== false)
                      .map((variant, index) => {
                        const variantName = String(variant?.name || `Variant ${index + 1}`)
                        const active = selectedFoodVariantName === variantName
                        const variantPrice =
                          toNumber(variant?.offer_price) || toNumber(variant?.price) || customizingProduct.price
                        const variantOldPrice = toNumber(variant?.price)

                        return (
                          <button
                            key={`${variantName}-${index}`}
                            type='button'
                            onClick={() => setSelectedFoodVariantName(variantName)}
                            className={`rounded-[16px] border-2 px-4 py-3 text-left transition ${
                              active
                                ? 'border-[#7b3127] bg-[#fff8ec]'
                                : 'border-[#d9d9d9] bg-white hover:border-[#7b3127]'
                            }`}
                          >
                            <p className='text-base font-black text-black sm:text-lg'>{variantName}</p>
                            <p className='mt-1 text-sm text-[#555] sm:text-base'>
                              {formatPrice(variantPrice)}
                              {variantOldPrice > variantPrice ? (
                                <span className='ml-2 text-[#777] line-through'>
                                  {formatPrice(variantOldPrice)}
                                </span>
                              ) : null}
                            </p>
                          </button>
                        )
                      })}
                  </div>
                </div>
              ) : null}

              {customizingProduct.availableAddons?.length ? (
                <div className='mt-6'>
                  <h4 className='text-lg font-black text-black sm:text-xl'>Add Extras</h4>
                  <div className='mt-3 space-y-3'>
                    {customizingProduct.availableAddons.map((addon, index) => {
                      const addonName = String(addon?.name || `Addon ${index + 1}`)
                      const checked = selectedFoodAddons.includes(addonName)
                      return (
                        <div
                          key={`${addonName}-${index}`}
                          className='flex items-center justify-between gap-4 rounded-[16px] border border-[#e3e3e3] bg-white px-4 py-3'
                        >
                          <div className='min-w-0'>
                            <p className='text-base font-bold text-black sm:text-lg'>{addonName}</p>
                            <p className='mt-1 text-sm text-black sm:text-base'>
                              {addon?.is_free ? 'Free' : `${formatPrice(addon?.price || 0)} /-`}
                            </p>
                          </div>
                          <button
                            type='button'
                            onClick={() => toggleFoodAddon(addonName)}
                            className={`min-w-[96px] rounded-full px-5 py-2.5 text-sm font-black uppercase text-white transition sm:text-base ${
                              checked ? 'bg-[#4a241c] hover:bg-[#321713]' : 'bg-[#f27a00] hover:bg-[#da6d00]'
                            }`}
                          >
                            {checked ? 'Added' : 'Add'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className='flex-none border-t border-[#ededed] bg-white px-4 py-3 sm:px-6 sm:py-4'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center justify-between gap-4 sm:justify-start'>
                  <div className='inline-flex items-center rounded-full border border-[#d9d9d9]'>
                      <button
                        type='button'
                        onClick={() => setCustomizationQuantity((current) => Math.max(1, current - 1))}
                        className='h-10 w-11 text-2xl font-bold text-black'
                        aria-label='Decrease quantity'
                      >
                        -
                      </button>
                      <span className='min-w-9 text-center text-lg font-black text-black'>
                        {customizationQuantity}
                      </span>
                      <button
                        type='button'
                        onClick={() => setCustomizationQuantity((current) => current + 1)}
                        className='h-10 w-11 text-2xl font-bold text-black'
                        aria-label='Increase quantity'
                      >
                        +
                      </button>
                    </div>

                  <div>
                    <p className='text-2xl font-black text-black sm:text-3xl'>
                      {formatPrice(customizationTotalPrice)}
                    </p>
                    <p className='text-sm text-black'>Price Before Tax</p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={() => void addCustomizedFoodToCart()}
                  disabled={addingId === customizingProduct._id}
                  className='w-full rounded-full bg-[#f27a00] px-8 py-3.5 text-base font-black uppercase tracking-[0.04em] text-white transition hover:bg-[#da6d00] disabled:cursor-not-allowed disabled:bg-[#d7c1a9] sm:w-auto sm:min-w-[260px] sm:text-lg'
                >
                  {addingId === customizingProduct._id ? 'Adding...' : 'Add to cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type='button'
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className='fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#d94b2b] text-white shadow-[0_16px_28px_rgba(217,75,43,0.24)] transition hover:scale-105'
      >
        <Search className='h-4 w-4' />
      </button>
    </div>
  )
}
