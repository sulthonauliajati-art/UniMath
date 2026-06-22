'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBgm } from './BgmProvider'
import { useFontSize, type FontSizeLevel } from './FontSizeProvider'
import { useDisplayMode, type DisplayMode } from './DisplayModeProvider'

const FONT_OPTIONS: { key: FontSizeLevel; label: string }[] = [
  { key: 'small', label: 'A⁻' },
  { key: 'normal', label: 'A' },
  { key: 'large', label: 'A⁺' },
]

const DISPLAY_OPTIONS: { key: DisplayMode; label: string; icon: string }[] = [
  { key: 'mobile', label: 'Mobile', icon: '📱' },
  { key: 'normal', label: 'Normal', icon: '💻' },
  { key: 'wide', label: 'Wide', icon: '🖥️' },
]

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { isPlaying, volume, isMuted, togglePlay, setVolume, toggleMute } = useBgm()
  const { fontSizeLevel, setFontSizeLevel } = useFontSize()
  const { displayMode, setDisplayMode } = useDisplayMode()

  return (
    <div className="fixed bottom-4 right-4 z-[60]" style={{ pointerEvents: 'auto' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-14 right-0 w-72 rounded-2xl border border-uni-primary/30 bg-[rgba(4,9,20,0.92)] backdrop-blur-xl shadow-card overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="text-base">⚙️</span> Pengaturan
              </h3>
            </div>

            <div className="p-4 space-y-5">
              {/* ── BGM Section ──────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">🎵 Musik</span>
                  <button
                    onClick={togglePlay}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isPlaying
                        ? 'bg-uni-success/20 text-uni-success border border-uni-success/40'
                        : 'bg-uni-bg-secondary/50 text-text-muted border border-white/10'
                    }`}
                  >
                    {isPlaying ? 'ON' : 'OFF'}
                  </button>
                </div>

                {isPlaying && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleMute}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all duration-200 ${
                        isMuted
                          ? 'bg-uni-error/15 text-uni-error border border-uni-error/30'
                          : 'bg-uni-primary/15 text-uni-primary border border-uni-primary/30'
                      }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                      )}
                    </button>
                    <label htmlFor="bgm-volume-slider" className="sr-only">Volume Musik</label>
                    <input
                      id="bgm-volume-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(volume * 100)}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-uni-bg-secondary cursor-pointer accent-uni-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-uni-primary [&::-webkit-slider-thumb]:shadow-glow [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-xs text-text-muted tabular-nums w-8 text-right" aria-hidden="true">{Math.round(volume * 100)}%</span>
                  </div>
                )}
              </div>

              {/* ── Font Size Section ────────────────────────────── */}
              <div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2.5">🔤 Ukuran Teks</span>
                <div className="flex gap-1.5">
                  {FONT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setFontSizeLevel(opt.key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                        fontSizeLevel === opt.key
                          ? 'bg-uni-primary/20 text-uni-primary border border-uni-primary/50 shadow-glow'
                          : 'bg-uni-bg-secondary/50 text-text-muted border border-white/10 hover:border-white/20 hover:text-text-secondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Display Mode Section ─────────────────────────── */}
              <div>
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-2.5">📐 Tampilan</span>
                <div className="flex gap-1.5">
                  {DISPLAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setDisplayMode(opt.key)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex flex-col items-center gap-0.5 ${
                        displayMode === opt.key
                          ? 'bg-uni-primary/20 text-uni-primary border border-uni-primary/50 shadow-glow'
                          : 'bg-uni-bg-secondary/50 text-text-muted border border-white/10 hover:border-white/20 hover:text-text-secondary'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.92 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-card ${
          isOpen
            ? 'bg-uni-primary/20 border-2 border-uni-primary/60 text-uni-primary shadow-glow'
            : 'bg-[rgba(4,9,20,0.85)] border border-uni-primary/30 text-text-secondary hover:text-uni-primary hover:border-uni-primary/50'
        } backdrop-blur-md`}
        title="Pengaturan"
      >
        <motion.svg
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </motion.svg>
      </motion.button>
    </div>
  )
}
