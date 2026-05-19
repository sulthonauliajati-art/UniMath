'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type DisplayMode = 'mobile' | 'normal' | 'wide'

interface DisplayModeContextType {
  displayMode: DisplayMode
  setDisplayMode: (mode: DisplayMode) => void
  /** Tailwind max-width class for the current mode */
  containerClass: string
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  displayMode: 'normal',
  setDisplayMode: () => {},
  containerClass: 'max-w-lg',
})

export const useDisplayMode = () => useContext(DisplayModeContext)

const STORAGE_KEY = 'unimath_display_mode'

const CONTAINER_MAP: Record<DisplayMode, string> = {
  mobile: 'max-w-sm',
  normal: 'max-w-lg',
  wide: 'max-w-5xl',
}

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [displayMode, setDisplayModeState] = useState<DisplayMode>('normal')
  const [initialized, setInitialized] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as DisplayMode | null
      if (saved && CONTAINER_MAP[saved]) {
        setDisplayModeState(saved)
      }
    } catch { /* ignore */ }
    setInitialized(true)
  }, [])

  // Persist + apply to DOM
  useEffect(() => {
    if (initialized) {
      try {
        localStorage.setItem(STORAGE_KEY, displayMode)
      } catch { /* ignore */ }
      // Apply data attribute to html for CSS targeting
      document.documentElement.setAttribute('data-display-mode', displayMode)
    }
  }, [displayMode, initialized])

  const setDisplayMode = useCallback((mode: DisplayMode) => {
    if (CONTAINER_MAP[mode]) {
      setDisplayModeState(mode)
    }
  }, [])

  const containerClass = CONTAINER_MAP[displayMode]

  return (
    <DisplayModeContext.Provider value={{ displayMode, setDisplayMode, containerClass }}>
      {children}
    </DisplayModeContext.Provider>
  )
}
