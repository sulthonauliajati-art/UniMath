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
            className="absolute bottom-14 right-0 w-72 rounded-2xl border border-cyan-400/30 bg-[rgba(4,9,20,0.92)] backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8),0_0_20px_-4px_rgba(6,182,212,0.3)] overflow-hidden"
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
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">🎵 Musik</span>
                  <button
                    onClick={togglePlay}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isPlaying
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-600/40'
                    }`}
                  >
                    {isPlaying ? 'ON' : 'OFF'}
                  </button>
                </div>

                {isPlaying && (
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleMute}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                        isMuted
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
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
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(volume * 100)}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-slate-700 cursor-pointer accent-cyan-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(6,182,212,0.7)] [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 tabular-nums w-8 text-right">{Math.round(volume * 100)}%</span>
                  </div>
                )}
              </div>

              {/* ── Font Size Section ────────────────────────────── */}
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">🔤 Ukuran Teks</span>
                <div className="flex gap-1.5">
                  {FONT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setFontSizeLevel(opt.key)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        fontSizeLevel === opt.key
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-600/30 hover:border-slate-500/50 hover:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Display Mode Section ─────────────────────────── */}
              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2.5">📐 Tampilan</span>
                <div className="flex gap-1.5">
                  {DISPLAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setDisplayMode(opt.key)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                        displayMode === opt.key
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-800/50 text-slate-400 border border-slate-600/30 hover:border-slate-500/50 hover:text-slate-300'
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
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)] ${
          isOpen
            ? 'bg-cyan-500/20 border-2 border-cyan-400/60 text-cyan-300 shadow-[0_0_20px_-4px_rgba(6,182,212,0.6)]'
            : 'bg-[rgba(4,9,20,0.85)] border border-cyan-400/30 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50'
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
