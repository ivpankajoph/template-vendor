'use client'

import { useCallback, useEffect, useRef } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  clearTemplate,
  fetchAlltemplatepageTemplate,
} from '@/store/slices/alltemplateslice'
import { fetchVendorProfile } from '@/store/slices/vendorProfileSlice'
import type { AppDispatch, RootState } from '@/store'
import { getTemplateCityFromPath } from '@/lib/template-route'
import { buildStorefrontScopedPath } from '@/lib/template-route'
import { getTemplateWebsiteIdFromSearch } from '@/lib/template-website'

type Props = {
  vendorId?: string
  websiteId?: string
}

const DATA_STALE_MS = 2 * 60 * 1000
const FOCUS_REFRESH_COOLDOWN_MS = 20 * 1000
const REQUEST_RETRY_COOLDOWN_MS = 30 * 1000

const selectTemplateLoaderState = (state: RootState) => ({
  templateData: state.alltemplatepage?.data,
  templateLoading: Boolean(state.alltemplatepage?.loading),
  templateVendorId: state.alltemplatepage?.currentVendorId || null,
  templateCitySlug: state.alltemplatepage?.currentCitySlug || null,
  templateWebsiteId: state.alltemplatepage?.currentWebsiteId || null,
  templateLastFetchedAt: state.alltemplatepage?.lastFetchedAt || null,
  templateProducts: state.alltemplatepage?.data?.products || null,
  vendorProfile: state.vendorprofilepage?.vendor,
  vendorLoading: Boolean(state.vendorprofilepage?.loading),
  vendorVendorId: state.vendorprofilepage?.currentVendorId || null,
  vendorLastFetchedAt: state.vendorprofilepage?.lastFetchedAt || null,
})

export function TemplateDataLoader({ vendorId, websiteId: websiteIdProp }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusRefreshRef = useRef(0)
  const handledRefreshTokenRef = useRef('')
  const templateRequestByVendorRef = useRef<Record<string, number>>({})
  const vendorRequestByVendorRef = useRef<Record<string, number>>({})
  const emptyHomeFallbackRef = useRef<string | null>(null)
  const citySlug = getTemplateCityFromPath(pathname || '/', vendorId)
  const routeWebsiteId = getTemplateWebsiteIdFromSearch(pathname || '/', searchParams)
  const websiteId = routeWebsiteId || websiteIdProp || undefined
  const refreshToken = String(searchParams.get('template_refresh') || '').trim()
  const isPreviewRoute = (pathname || '/').split('/').filter(Boolean).includes('preview')
  const templateRequestKey = `${vendorId || ''}::${citySlug}::${websiteId || 'default'}`
  const {
    templateData,
    templateLoading,
    templateProducts,
    templateVendorId,
    templateCitySlug,
    templateWebsiteId,
    templateLastFetchedAt,
    vendorProfile,
    vendorLoading,
    vendorVendorId,
    vendorLastFetchedAt,
  } = useSelector(selectTemplateLoaderState, shallowEqual)

  useEffect(() => {
    emptyHomeFallbackRef.current = null
  }, [pathname, vendorId, citySlug, websiteId])

  const canDispatchRequest = (
    requestMap: Record<string, number>,
    key: string,
    now: number
  ) => {
    const lastRequestedAt = requestMap[key] || 0
    if (now - lastRequestedAt < REQUEST_RETRY_COOLDOWN_MS) return false
    requestMap[key] = now
    return true
  }

  const refreshIfStale = useCallback(() => {
    if (!vendorId) return
    const now = Date.now()

    const templateIsFresh =
      !isPreviewRoute &&
      templateVendorId === vendorId &&
      (templateCitySlug || 'all') === citySlug &&
      (templateWebsiteId || '') === (websiteId || '') &&
      Boolean(templateData) &&
      typeof templateLastFetchedAt === 'number' &&
      now - templateLastFetchedAt < DATA_STALE_MS

    const vendorIsFresh =
      vendorVendorId === vendorId &&
      Boolean(vendorProfile) &&
      typeof vendorLastFetchedAt === 'number' &&
      now - vendorLastFetchedAt < DATA_STALE_MS

    if (
      !templateIsFresh &&
      !templateLoading &&
      canDispatchRequest(templateRequestByVendorRef.current, templateRequestKey, now)
    ) {
      dispatch(fetchAlltemplatepageTemplate({ vendorId, citySlug, websiteId }))
    }
    if (
      !vendorIsFresh &&
      !vendorLoading &&
      canDispatchRequest(vendorRequestByVendorRef.current, vendorId, now)
    ) {
      dispatch(fetchVendorProfile(vendorId))
    }
  }, [
    dispatch,
    templateData,
    templateCitySlug,
    templateLastFetchedAt,
    templateLoading,
    templateVendorId,
    templateWebsiteId,
    vendorId,
    citySlug,
    websiteId,
    isPreviewRoute,
    templateRequestKey,
    vendorLastFetchedAt,
    vendorLoading,
    vendorProfile,
    vendorVendorId,
  ])

  const refreshIfStaleRef = useRef(refreshIfStale)
  useEffect(() => {
    refreshIfStaleRef.current = refreshIfStale
  }, [refreshIfStale])

  useEffect(() => {
    if (!vendorId) return
    if (refreshToken && handledRefreshTokenRef.current !== refreshToken) {
      handledRefreshTokenRef.current = refreshToken
      templateRequestByVendorRef.current = {}
      dispatch(clearTemplate())
      dispatch(fetchAlltemplatepageTemplate({ vendorId, citySlug, websiteId }))
      return
    }

    refreshIfStaleRef.current()

    const handleFocus = () => {
      const now = Date.now()
      if (now - focusRefreshRef.current < FOCUS_REFRESH_COOLDOWN_MS) return
      focusRefreshRef.current = now
      refreshIfStaleRef.current()
    }
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return
      handleFocus()
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [citySlug, dispatch, refreshToken, vendorId, websiteId])

  useEffect(() => {
    if (!vendorId || !pathname) return
    if (templateLoading) return
    if (citySlug === 'all') return
    if (templateVendorId !== vendorId) return
    if ((templateCitySlug || 'all') !== citySlug) return
    if ((templateWebsiteId || '') !== (websiteId || '')) return
    if (!templateData) return
    if (Array.isArray(templateProducts) && templateProducts.length > 0) return

    const currentHomePath = buildStorefrontScopedPath({
      vendorId,
      pathname,
    })
    const normalizedPathname = String(pathname || '').replace(/\/+$/, '')
    const normalizedHomePath = String(currentHomePath || '').replace(/\/+$/, '')
    if (normalizedPathname !== normalizedHomePath) return

    const vendorDefaultCitySlug = String(
      (vendorProfile as { default_city_slug?: string } | null)?.default_city_slug || ''
    )
      .trim()
      .toLowerCase()
    const fallbackCity =
      vendorDefaultCitySlug && vendorDefaultCitySlug !== citySlug
        ? vendorDefaultCitySlug
        : 'all'
    if (fallbackCity === citySlug) return

    const fallbackHomePath = buildStorefrontScopedPath({
      vendorId,
      pathname,
      citySlugOverride: fallbackCity,
    })

    if (!fallbackHomePath || emptyHomeFallbackRef.current === fallbackHomePath) return

    emptyHomeFallbackRef.current = fallbackHomePath
    router.replace(fallbackHomePath, { scroll: false })
  }, [
    citySlug,
    pathname,
    router,
    templateCitySlug,
    templateData,
    templateLoading,
    templateProducts,
    templateVendorId,
    templateWebsiteId,
    vendorId,
    vendorProfile,
    websiteId,
  ])

  return null
}
