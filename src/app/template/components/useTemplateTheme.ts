'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'

const DEFAULT_THEME = {
  templateColor: '#0f172a',
  bannerColor: '#0f172a',
  fontScale: 1,
}

type ThemePayload = {
  templateColor?: string
  bannerColor?: string
  fontScale?: number
  headingFont?: string
  bodyFont?: string
  textColor?: string
  headingColor?: string
  surfaceColor?: string
  surfaceMutedColor?: string
  borderColor?: string
}

export function useTemplateTheme() {
  const theme = useSelector(
    (state: any) => state?.alltemplatepage?.data?.components?.theme
  ) as ThemePayload | undefined

  return useMemo(() => {
    const templateColor = theme?.templateColor || DEFAULT_THEME.templateColor
    const bannerColor = theme?.bannerColor || DEFAULT_THEME.bannerColor
    const requestedFontScale =
      typeof theme?.fontScale === 'number' && Number.isFinite(theme.fontScale)
        ? theme.fontScale
        : DEFAULT_THEME.fontScale
    const fontScale = Math.min(1.4, Math.max(0.8, requestedFontScale))
    const getValue = (value: unknown) =>
      typeof value === 'string' && value.trim() ? value.trim() : undefined

    const headingFont = getValue(theme?.headingFont)
    const bodyFont = getValue(theme?.bodyFont)
    const textColor = getValue(theme?.textColor)
    const headingColor = getValue(theme?.headingColor)
    const surfaceColor = getValue(theme?.surfaceColor)
    const surfaceMutedColor = getValue(theme?.surfaceMutedColor)
    const borderColor = getValue(theme?.borderColor)

    return {
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
    }
  }, [
    theme?.templateColor,
    theme?.bannerColor,
    theme?.fontScale,
    theme?.headingFont,
    theme?.bodyFont,
    theme?.textColor,
    theme?.headingColor,
    theme?.surfaceColor,
    theme?.surfaceMutedColor,
    theme?.borderColor,
  ])
}
