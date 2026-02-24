'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname } from 'next/navigation'
import { fetchAlltemplatepageTemplate } from '@/store/slices/alltemplateslice'
import { fetchVendorProfile } from '@/store/slices/vendorProfileSlice'
import type { AppDispatch, RootState } from '@/store'
import { getTemplateCityFromPath } from '@/lib/template-route'

type Props = {
  vendorId?: string
}

const DATA_STALE_MS = 2 * 60 * 1000
const FOCUS_REFRESH_COOLDOWN_MS = 20 * 1000
const REQUEST_RETRY_COOLDOWN_MS = 30 * 1000

export function TemplateDataLoader({ vendorId }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const pathname = usePathname()
  const focusRefreshRef = useRef(0)
  const templateRequestByVendorRef = useRef<Record<string, number>>({})
  const vendorRequestByVendorRef = useRef<Record<string, number>>({})
  const citySlug = getTemplateCityFromPath(pathname || '/', vendorId)
  const templateRequestKey = `${vendorId || ''}::${citySlug}`
  const {
    templateData,
    templateLoading,
    templateVendorId,
    templateCitySlug,
    templateLastFetchedAt,
    vendorProfile,
    vendorLoading,
    vendorVendorId,
    vendorLastFetchedAt,
  } = useSelector((state: RootState) => ({
    templateData: state.alltemplatepage?.data,
    templateLoading: Boolean(state.alltemplatepage?.loading),
    templateVendorId: state.alltemplatepage?.currentVendorId || null,
    templateCitySlug: state.alltemplatepage?.currentCitySlug || null,
    templateLastFetchedAt: state.alltemplatepage?.lastFetchedAt || null,
    vendorProfile: state.vendorprofilepage?.vendor,
    vendorLoading: Boolean(state.vendorprofilepage?.loading),
    vendorVendorId: state.vendorprofilepage?.currentVendorId || null,
    vendorLastFetchedAt: state.vendorprofilepage?.lastFetchedAt || null,
  }))

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
      templateVendorId === vendorId &&
      (templateCitySlug || 'all') === citySlug &&
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
      dispatch(fetchAlltemplatepageTemplate({ vendorId, citySlug }))
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
    vendorId,
    citySlug,
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
  }, [vendorId])

  return null
}
