'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

interface BgmContextType {
  isPlaying: boolean
  volume: number
  isMuted: boolean
  togglePlay: () => void
  setVolume: (v: number) => void
  toggleMute: () => void
}

const BgmContext = createContext<BgmContextType>({
  isPlaying: false,
  volume: 0.5,
  isMuted: false,
  togglePlay: () => {},
  setVolume: () => {},
  toggleMute: () => {},
})

export const useBgm = () => useContext(BgmContext)

const STORAGE_KEY = 'unimath_bgm_prefs'

interface BgmPrefs {
  isPlaying: boolean
  volume: number
  isMuted: boolean
}

function loadPrefs(): BgmPrefs {
  if (typeof window === 'undefined') return { isPlaying: true, volume: 0.5, isMuted: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { isPlaying: true, volume: 0.5, isMuted: false }
}

function savePrefs(prefs: BgmPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch { /* ignore */ }
}

export function BgmProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const userInteracted = useRef(false)

  // Load prefs on mount
  useEffect(() => {
    const prefs = loadPrefs()
    setIsPlaying(prefs.isPlaying)
    setVolumeState(prefs.volume)
    setIsMuted(prefs.isMuted)
    setInitialized(true)
  }, [])

  // Create and manage audio element
  useEffect(() => {
    if (!initialized) return

    if (!audioRef.current) {
      const audio = new Audio('/bgm.mp3')
      audio.loop = true
      audio.preload = 'auto'
      audioRef.current = audio
    }

    const audio = audioRef.current
    audio.volume = isMuted ? 0 : volume

    if (isPlaying) {
      // Browsers block autoplay without user interaction.
      // We attempt to play; if it fails (autoplay policy), we wait
      // for the first user click anywhere on the page, then retry.
      const tryPlay = () => {
        audio.play().catch(() => {
          // Autoplay blocked — listen for first interaction
          const resumeOnClick = () => {
            audio.play().catch(() => {})
            userInteracted.current = true
            document.removeEventListener('click', resumeOnClick)
            document.removeEventListener('keydown', resumeOnClick)
            document.removeEventListener('touchstart', resumeOnClick)
          }
          if (!userInteracted.current) {
            document.addEventListener('click', resumeOnClick, { once: false })
            document.addEventListener('keydown', resumeOnClick, { once: false })
            document.addEventListener('touchstart', resumeOnClick, { once: false })
          }
        })
      }
      tryPlay()
    } else {
      audio.pause()
    }

    return () => {
      // Don't destroy audio on re-render — just control play state
    }
  }, [isPlaying, volume, isMuted, initialized])

  // Persist changes
  useEffect(() => {
    if (initialized) {
      savePrefs({ isPlaying, volume, isMuted })
    }
  }, [isPlaying, volume, isMuted, initialized])

  const togglePlay = useCallback(() => {
    userInteracted.current = true
    setIsPlaying(prev => !prev)
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev
      if (audioRef.current) {
        audioRef.current.volume = next ? 0 : volume
      }
      return next
    })
  }, [volume])

  return (
    <BgmContext.Provider value={{ isPlaying, volume, isMuted, togglePlay, setVolume, toggleMute }}>
      {children}
    </BgmContext.Provider>
  )
}
