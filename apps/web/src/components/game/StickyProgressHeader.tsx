'use client'

import { motion } from 'framer-motion'
import type { RemedialProgressState } from '@/lib/hooks/useRemedialProgress'

interface StickyProgressHeaderProps {
  progress: RemedialProgressState
  onContinue: () => void
}

/**
 * StickyProgressHeader — glassmorphism sticky header for Wajib Belajar.
 *
 * - Sticks to top-0 z-50 when scrolling
 * - bg-[rgba(10,17,40,0.65)] + backdrop-blur-[16px] + border-cyan
 * - 3 visual indicators: scroll bar, quiz badge, timer badge
 */
export function StickyProgressHeader({ progress, onContinue }: StickyProgressHeaderProps) {
  const { scrollProgress, quizAnswered, quizTotal, timeRemaining, isUnlocked, unlockReason } = progress

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="sticky top-0 z-[60] w-full">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="backdrop-blur-[16px] bg-[rgba(10,17,40,0.65)] border-b border-cyan-400/30 shadow-[0_8px_32px_-8px_rgba(0,229,255,0.12)]"
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
          {/* Top row: indicators */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Scroll progress bar */}
            <div className="flex-1 min-w-[100px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] sm:text-xs text-cyan-300/70 font-medium tracking-wide">📖 Baca</span>
                <span className="text-[10px] sm:text-xs text-white tabular-nums font-semibold">{scrollProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-cyan-400/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-uni-primary to-cyan-300"
                  animate={{ width: `${scrollProgress}%` }}
                  transition={{ duration: 0.15, ease: 'linear' }}
                  style={{ boxShadow: '0 0 12px rgba(6,182,212,0.5)' }}
                />
              </div>
            </div>

            {/* Quiz badge */}
            <div className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
              quizAnswered >= quizTotal
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>
              <span>🧠</span>
              <span>Kuis: {quizAnswered}/{quizTotal}</span>
            </div>

            {/* Timer badge */}
            <div className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 tabular-nums ${
              timeRemaining <= 0
                ? 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                : timeRemaining <= 30
                ? 'bg-red-500/15 text-red-300 border border-red-400/30 animate-pulse'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>
              <span>⏱️</span>
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>

          {/* Bottom row: status text + unlock button */}
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-[10px] sm:text-xs text-slate-400 flex-1 line-clamp-1">
              {isUnlocked
                ? unlockReason === 'timer'
                  ? '⏰ Waktu habis — kamu bisa lanjut latihan!'
                  : '🎉 Hebat! Scroll & kuis selesai. Siap lanjut!'
                : quizAnswered >= quizTotal && scrollProgress < 100
                ? '📖 Kuis selesai! Lanjut baca sampai 100% untuk unlock.'
                : scrollProgress >= 100 && quizAnswered < quizTotal
                ? `🧠 Bacaan selesai! Jawab ${quizTotal - quizAnswered} kuis lagi.`
                : `📚 Baca sampai habis & jawab kuis — atau tunggu ${formatTime(timeRemaining)}`
              }
            </p>

            {isUnlocked && (
              <button
                onClick={onContinue}
                className="shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-[0_0_20px_-4px_rgba(16,185,129,0.8)] hover:shadow-[0_0_28px_-4px_rgba(16,185,129,1)] active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span>🚀</span>
                <span>Lanjut</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
