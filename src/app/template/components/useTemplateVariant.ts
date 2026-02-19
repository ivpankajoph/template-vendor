'use client'

import { useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useParams, usePathname, useSearchParams } from 'next/navigation'

export type TemplateVariantKey =
  | 'classic'
  | 'studio'
  | 'minimal'
  | 'trend'
  | 'mquiq'
  | 'poupqz'
  | 'oragze'
  | 'whiterose'

export type TemplateVariant = {
  key: TemplateVariantKey
  name: string
  description: string
}

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  {
    key: 'classic',
    name: 'Classic Luxe',
    description: 'Elegant hero-first layout with refined serif accents.',
  },
  {
    key: 'studio',
    name: 'Studio Bold',
    description: 'Editorial grid, high-contrast panels, bold CTAs.',
  },
  {
    key: 'minimal',
    name: 'Minimal Market',
    description: 'Clean, airy, product-forward storefront.',
  },
  {
    key: 'trend',
    name: 'Trend Bazaar',
    description: 'Meesho/Myntra-inspired marketplace with deal-first merchandising.',
  },
  {
    key: 'mquiq',
    name: 'StorageMax Gold',
    description:
      'Industrial storage layout with bold yellow highlights and sectioned storytelling.',
  },
  {
    key: 'poupqz',
    name: 'RackFlow Blue',
    description:
      'Industrial rack layout with clean blue-white sections and dense content blocks.',
  },
  {
    key: 'oragze',
    name: 'Organic Freshmart',
    description:
      'Organic storefront style with vibrant grocery promotions and editorial product blocks.',
  },
  {
    key: 'whiterose',
    name: 'White Rose',
    description:
      'Modern furniture storefront with premium category rails, launch cards, and clean utility navigation.',
  },
]

export const DEFAULT_TEMPLATE_VARIANT: TemplateVariantKey = 'classic'

const normalizeVariantKey = (value: unknown): TemplateVariantKey | undefined => {
  if (typeof value !== 'string') return undefined
  const key = value.trim().toLowerCase()
  const collapsed = key.replace(/%20/g, '').replace(/[\s_-]+/g, '')
  if (!key) return undefined
  if (key.includes('studio')) return 'studio'
  if (key.includes('minimal')) return 'minimal'
  if (
    key.includes('trend') ||
    key.includes('myntra') ||
    key.includes('meesho') ||
    key.includes('fashion')
  )
    return 'trend'
  if (key.includes('mquiq') || key.includes('mquick')) return 'mquiq'
  if (key.includes('poupqz') || key.includes('poup')) return 'poupqz'
  if (key.includes('oragze') || key.includes('organic')) return 'oragze'
  if (collapsed.includes('whiterose'))
    return 'whiterose'
  if (key.includes('classic')) return 'classic'
  if (key === '0') return 'classic'
  if (key === '1') return 'studio'
  if (key === '2') return 'minimal'
  if (key === '3') return 'trend'
  if (key === '4') return 'mquiq'
  if (key === '5') return 'poupqz'
  if (key === '6') return 'oragze'
  if (key === '7') return 'whiterose'
  return undefined
}

const getTemplateVariantStorageKey = (vendorId?: string) =>
  `template_variant_${vendorId || 'default'}`

const readStoredVariant = (vendorId?: string) => {
  if (typeof window === 'undefined') return undefined
  try {
    return normalizeVariantKey(
      window.sessionStorage.getItem(getTemplateVariantStorageKey(vendorId))
    )
  } catch {
    return undefined
  }
}

const persistStoredVariant = (vendorId: string | undefined, key?: string) => {
  if (typeof window === 'undefined' || !key) return
  try {
    window.sessionStorage.setItem(getTemplateVariantStorageKey(vendorId), key)
  } catch {
    return
  }
}

export function useTemplateVariant() {
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const vendorId =
    typeof (params as any)?.vendor_id === 'string'
      ? ((params as any).vendor_id as string)
      : undefined
  const templateQuery = searchParams?.get('template')
  const rawKey = useSelector(
    (state: any) =>
      state?.alltemplatepage?.data?.template_key ||
      state?.alltemplatepage?.data?.templateKey
  )

  const variant = useMemo(() => {
    const segments = (pathname || '').split('/').filter(Boolean)
    const previewKeyFromSlug =
      segments[0] === 'template' &&
      segments[2] === 'preview' &&
      typeof segments[3] === 'string'
        ? segments[3]
        : undefined
    const storedKey = readStoredVariant(vendorId)
    const key =
      normalizeVariantKey(previewKeyFromSlug) ||
      normalizeVariantKey(templateQuery) ||
      storedKey ||
      normalizeVariantKey(rawKey)
    const match = TEMPLATE_VARIANTS.find((item) => item.key === key)
    return match || TEMPLATE_VARIANTS[0]
  }, [pathname, rawKey, templateQuery, vendorId])

  useEffect(() => {
    persistStoredVariant(vendorId, variant.key)
  }, [vendorId, variant.key])

  return variant
}
