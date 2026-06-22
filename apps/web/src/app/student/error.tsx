'use client'

import { useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { TowerBackground } from '@/components/ui/TowerBackground'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Student route error:', error)
  }, [error])

  return (
    <TowerBackground variant="practice">
      <div className="min-h-[100dvh] flex items-center justify-center px-4">
        <GlassCard className="p-8 text-center max-w-md w-full" glowColor="cyan">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-3">
            Terjadi Kesalahan
          </h2>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Maaf, terjadi kesalahan saat memuat halaman. Coba muat ulang atau kembali ke dashboard.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-uni-primary hover:bg-uni-primary/80 rounded-xl text-white font-semibold text-sm transition-colors"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => (window.location.href = '/student/dashboard')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-white text-sm transition-colors"
            >
              Ke Dashboard
            </button>
          </div>
        </GlassCard>
      </div>
    </TowerBackground>
  )
}
