'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type FontSizeLevel = 'small' | 'normal' | 'large'

interface FontSizeContextType {
  fontSizeLevel: FontSizeLevel
  setFontSizeLevel: (level: FontSizeLevel) => void
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSizeLevel: 'normal',
  setFontSizeLevel: () => {},
})

export const useFontSize = () => useContext(FontSizeContext)

const STORAGE_KEY = 'unimath_font_size'

const FONT_SIZE_MAP: Record<FontSizeLevel, string> = {
  small: '14px',
  normal: '16px',
  large: '18px',
}

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSizeLevel, setFontSizeLevelState] = useState<FontSizeLevel>('normal')
  const [initialized, setInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontSizeLevel | null
      if (saved && FONT_SIZE_MAP[saved]) {
        setFontSizeLevelState(saved)
      }
    } catch { /* ignore */ }
    setInitialized(true)
  }, [])

  // Apply CSS variable to html element
  useEffect(() => {
    if (!initialized) return
    document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[fontSizeLevel])
    document.documentElement.setAttribute('data-font-size', fontSizeLevel)
  }, [fontSizeLevel, initialized])

  // Persist
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, fontSizeLevel)
      } catch { /* ignore */ }
    }
  }, [fontSizeLevel, initialized])

  const setFontSizeLevel = useCallback((level: FontSizeLevel) => {
    if (FONT_SIZE_MAP[level]) {
      setFontSizeLevelState(level)
    }
  }, [])

  return (
    <FontSizeContext.Provider value={{ fontSizeLevel, setFontSizeLevel }}>
      {children}
    </FontSizeContext.Provider>
  )
}
