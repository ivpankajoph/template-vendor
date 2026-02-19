'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useTemplateTheme } from './useTemplateTheme'
import { useTemplateVariant } from './useTemplateVariant'

type Props = {
  children: ReactNode
}

export function TemplateThemeProvider({ children }: Props) {
  const {
    templateColor,
    bannerColor,
    fontScale,
    headingFont,
    bodyFont,
    textColor,
    headingColor,
    surfaceColor,
    surfaceMutedColor,
    borderColor,
  } = useTemplateTheme()
  const variant = useTemplateVariant()
  const setOrRemove = (
    style: CSSStyleDeclaration,
    key: string,
    value: string | undefined
  ) => {
    if (value && value.trim()) {
      style.setProperty(key, value)
      return
    }
    style.removeProperty(key)
  }
  const initialStyles = useRef<{
    fontSize: string
    templateColor: string
    bannerColor: string
    fontScale: string
    textColor: string
    headingColor: string
    surfaceColor: string
    surfaceMutedColor: string
    borderColor: string
    headingFont: string
    bodyFont: string
  } | null>(null)

  useEffect(() => {
    const root = document.documentElement
    if (!initialStyles.current) {
      initialStyles.current = {
        fontSize: root.style.fontSize,
        templateColor: root.style.getPropertyValue('--template-color'),
        bannerColor: root.style.getPropertyValue('--template-banner-color'),
        fontScale: root.style.getPropertyValue('--template-font-scale'),
        textColor: root.style.getPropertyValue('--template-text-color'),
        headingColor: root.style.getPropertyValue('--template-heading-color'),
        surfaceColor: root.style.getPropertyValue('--template-surface'),
        surfaceMutedColor: root.style.getPropertyValue('--template-surface-muted'),
        borderColor: root.style.getPropertyValue('--template-border'),
        headingFont: root.style.getPropertyValue('--template-heading-font'),
        bodyFont: root.style.getPropertyValue('--template-body-font'),
      }
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--template-color', templateColor)
    root.style.setProperty('--template-banner-color', bannerColor)
    root.style.setProperty('--template-font-scale', String(fontScale))
    setOrRemove(root.style, '--template-text-color', textColor)
    setOrRemove(root.style, '--template-heading-color', headingColor)
    setOrRemove(root.style, '--template-surface', surfaceColor)
    setOrRemove(root.style, '--template-surface-muted', surfaceMutedColor)
    setOrRemove(root.style, '--template-border', borderColor)
    setOrRemove(root.style, '--template-heading-font', headingFont)
    setOrRemove(root.style, '--template-body-font', bodyFont)
    root.style.fontSize = `${16 * fontScale}px`
  }, [
    templateColor,
    bannerColor,
    fontScale,
    textColor,
    headingColor,
    surfaceColor,
    surfaceMutedColor,
    borderColor,
    headingFont,
    bodyFont,
  ])

  useEffect(() => {
    return () => {
      if (!initialStyles.current) return
      const root = document.documentElement
      root.style.fontSize = initialStyles.current.fontSize
      root.style.setProperty('--template-color', initialStyles.current.templateColor)
      root.style.setProperty(
        '--template-banner-color',
        initialStyles.current.bannerColor
      )
      root.style.setProperty(
        '--template-font-scale',
        initialStyles.current.fontScale
      )
      root.style.setProperty('--template-text-color', initialStyles.current.textColor)
      root.style.setProperty(
        '--template-heading-color',
        initialStyles.current.headingColor
      )
      root.style.setProperty('--template-surface', initialStyles.current.surfaceColor)
      root.style.setProperty(
        '--template-surface-muted',
        initialStyles.current.surfaceMutedColor
      )
      root.style.setProperty('--template-border', initialStyles.current.borderColor)
      root.style.setProperty(
        '--template-heading-font',
        initialStyles.current.headingFont
      )
      root.style.setProperty('--template-body-font', initialStyles.current.bodyFont)
    }
  }, [])

  const wrapperStyle: CSSProperties = {
    ['--template-color' as any]: templateColor,
    ['--template-banner-color' as any]: bannerColor,
    ['--template-font-scale' as any]: String(fontScale),
    ...(textColor ? ({ ['--template-text-color' as any]: textColor } as CSSProperties) : {}),
    ...(headingColor
      ? ({ ['--template-heading-color' as any]: headingColor } as CSSProperties)
      : {}),
    ...(surfaceColor
      ? ({ ['--template-surface' as any]: surfaceColor } as CSSProperties)
      : {}),
    ...(surfaceMutedColor
      ? ({ ['--template-surface-muted' as any]: surfaceMutedColor } as CSSProperties)
      : {}),
    ...(borderColor ? ({ ['--template-border' as any]: borderColor } as CSSProperties) : {}),
    ...(headingFont
      ? ({ ['--template-heading-font' as any]: headingFont } as CSSProperties)
      : {}),
    ...(bodyFont ? ({ ['--template-body-font' as any]: bodyFont } as CSSProperties) : {}),
  }

  return (
    <div
      className={`template-theme template-variant-${variant.key}`}
      style={wrapperStyle}
    >
      {children}
    </div>
  )
}
