'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { StarryBackground, TowerBackground, RobotMascot, GlassCard } from '@/components/ui'

export default function LandingPage() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col">
      <StarryBackground density="high" />
      <TowerBackground variant="landing" />
      
      {/* Top Logo Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex items-center">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Unimath</span>
        </div>
      </div>

      <div className="relative z-10 w-full flex-grow flex flex-col items-center justify-center px-4 pt-10 pb-4">
        
        {/* Main Glass Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg mt-auto mb-8 relative"
        >
          {/* Top Hexagon Badge */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20">
            <div className="w-16 h-16 bg-uni-bg-secondary rounded-xl border border-uni-primary shadow-[0_0_15px_rgba(0,229,255,0.5)] rotate-45 flex items-center justify-center">
              <span className="-rotate-45 text-uni-primary font-bold text-2xl">U</span>
            </div>
          </div>

          <GlassCard className="pt-12 pb-8 px-6 sm:px-10 text-center glass-strong">
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
              Selamat Datang
            </h1>
            
            {/* Divider Line */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="h-px w-12 bg-uni-primary/50" />
              <div className="w-2 h-2 rotate-45 bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]" />
              <div className="h-px w-12 bg-uni-primary/50" />
            </div>

            <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-6 max-w-sm mx-auto">
              Platform latihan numerasi interaktif untuk pembelajaran yang <span className="text-uni-primary font-medium">lebih menarik.</span>
            </p>

            {/* ── How to Login Guide ─────────────────────────── */}
            <div className="mb-6">
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-uni-accent/10 border border-uni-accent/30 text-uni-accent text-sm font-medium hover:bg-uni-accent/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showGuide ? 'Tutup Panduan' : 'Bagaimana cara login?'}
                <motion.svg
                  animate={{ rotate: showGuide ? 180 : 0 }}
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 text-left space-y-3">
                      {/* Step 1 */}
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-cyan-300 font-bold text-xs">1</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Masukkan NISN</p>
                          <p className="text-text-secondary text-xs leading-relaxed">
                            Jika guru sudah mendaftarkan kamu, cukup masukkan NISN dan buat password baru.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-300 font-bold text-xs">2</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Sudah Punya Akun?</p>
                          <p className="text-text-secondary text-xs leading-relaxed">
                            Langsung masukkan NISN lalu password yang sudah dibuat sebelumnya.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-amber-300 font-bold text-xs">3</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">Belum Terdaftar?</p>
                          <p className="text-text-secondary text-xs leading-relaxed">
                            Kamu bisa daftar sendiri! Masukkan NISN → sistem akan tahu kamu belum terdaftar → klik &quot;Daftar Sekarang&quot;.
                          </p>
                        </div>
                      </div>

                      {/* Guru info */}
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-400/20">
                        <span className="text-lg mt-0.5">👨‍🏫</span>
                        <div>
                          <p className="text-emerald-300 font-semibold text-sm">Guru?</p>
                          <p className="text-text-secondary text-xs leading-relaxed">
                            Klik &quot;Login Guru&quot; lalu masukkan email dan password yang diberikan admin.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Buttons Layout - Side by Side on larger screens, stacked on small */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
              <Link href="/student/login" className="w-full sm:w-1/2">
                <button className="w-full relative group overflow-hidden rounded-xl bg-[#0F203B] border border-uni-accent/50 p-4 transition-all hover:bg-uni-accent/20 hover:border-uni-accent hover:shadow-[0_0_15px_rgba(0,119,255,0.4)] flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-uni-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-white font-medium">Login Siswa</span>
                  <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
              
              <Link href="/teacher/login" className="w-full sm:w-1/2">
                <button className="w-full relative group overflow-hidden rounded-xl bg-[#0A261E] border border-uni-success/50 p-4 transition-all hover:bg-uni-success/20 hover:border-uni-success hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 text-uni-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-9-5-9 5" />
                  </svg>
                  <span className="text-white font-medium">Login Guru</span>
                  <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            
            {/* Bottom Bottom Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-uni-bg-secondary px-3 py-1 rounded-full border border-uni-primary/30 z-20">
               <svg className="w-4 h-4 text-uni-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
               </svg>
            </div>

          </GlassCard>

          <div className="text-center mt-6 flex items-center justify-center gap-2 text-text-secondary text-xs sm:text-sm">
             <svg className="w-4 h-4 text-uni-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
             <span>Belajar, berlatih, dan berkembang bersama.</span>
          </div>

        </motion.div>
        
        {/* Robot Mascot at the bottom */}
        <motion.div
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4, duration: 0.6 }}
           className="mt-auto"
        >
          <RobotMascot state="waving" size="lg" className="-mb-8" />
        </motion.div>

      </div>
    </main>
  )
}
