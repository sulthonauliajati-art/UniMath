'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface RemedialProgressState {
  scrollProgress: number
  quizAnswered: number
  quizTotal: number
  timeRemaining: number
  isUnlocked: boolean
  unlockReason: 'scroll+quiz' | 'timer' | null
}

export interface RemedialProgressActions {
  markQuizAnswered: () => void
  unlock: (reason: 'scroll+quiz' | 'timer') => void
  reset: () => void
}

/**
 * useRemedialProgress — solid state management for Wajib Belajar mode.
 *
 * Tracks 3 indicators:
 *   1. scrollProgress  (0–100%)
 *   2. quizAnswered    (answered / total — any answer counts)
 *   3. timeRemaining   (countdown seconds)
 *
 * UNLOCK LOGIC:
 *   Terbuka jika:
 *     (scrollProgress >= 100  DAN  quizAnswered >= quizTotal)
 *        ATAU
 *     (timeRemaining <= 0)
 *   Timer adalah bypass jika siswa terlalu lama membaca.
 */
export function useRemedialProgress(
  totalQuizItems: number,
  initialTimeSeconds: number = 65
): [RemedialProgressState, RemedialProgressActions] {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(initialTimeSeconds)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [unlockReason, setUnlockReason] = useState<'scroll+quiz' | 'timer' | null>(null)

  const quizMarkedRef = useRef(false)

  // Scroll tracking
  useEffect(() => {
    if (isUnlocked) return
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (docHeight <= 0) { setScrollProgress(100); return }
      setScrollProgress(Math.min(100, Math.round((scrollTop / docHeight) * 100)))
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isUnlocked])

  // Timer countdown
  useEffect(() => {
    if (isUnlocked || timeRemaining <= 0) return
    const t = setTimeout(() => setTimeRemaining((prev) => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [isUnlocked, timeRemaining])

  // Unlock check
  useEffect(() => {
    if (isUnlocked) return
    if (scrollProgress >= 100 && quizAnswered >= totalQuizItems) {
      setIsUnlocked(true)
      setUnlockReason('scroll+quiz')
      return
    }
    if (timeRemaining <= 0 && initialTimeSeconds > 0) {
      setIsUnlocked(true)
      setUnlockReason('timer')
      return
    }
  }, [scrollProgress, quizAnswered, timeRemaining, totalQuizItems, initialTimeSeconds, isUnlocked])

  // Actions
  const markQuizAnswered = useCallback(() => {
    if (quizMarkedRef.current) return
    quizMarkedRef.current = true
    setQuizAnswered((prev) => Math.min(prev + 1, totalQuizItems))
    setTimeout(() => { quizMarkedRef.current = false }, 100)
  }, [totalQuizItems])

  const unlock = useCallback((reason: 'scroll+quiz' | 'timer') => {
    setIsUnlocked(true)
    setUnlockReason(reason)
  }, [])

  const reset = useCallback(() => {
    setScrollProgress(0)
    setQuizAnswered(0)
    setTimeRemaining(initialTimeSeconds)
    setIsUnlocked(false)
    setUnlockReason(null)
  }, [initialTimeSeconds])

  return [
    { scrollProgress, quizAnswered, quizTotal: totalQuizItems, timeRemaining, isUnlocked, unlockReason },
    { markQuizAnswered, unlock, reset },
  ]
}
