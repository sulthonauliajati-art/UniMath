'use client'

import { useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin route error:', error)
  }, [error])

  return (
    <div className="min-h-[100dvh] bg-[#0a0a1a] flex items-center justify-center px-4">
      <GlassCard className="p-8 text-center max-w-md w-full" glowColor="cyan">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-3">
          Terjadi Kesalahan
        </h2>
        <p className="text-text-secondary text-sm mb-6 leading-relaxed">
          Maaf, terjadi kesalahan saat memuat halaman admin. Coba muat ulang atau kembali ke dashboard.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-uni-primary hover:bg-uni-primary/80 rounded-xl text-white font-semibold text-sm transition-colors"
          >
            Coba Lagi
          </button>
          <button
            onClick={() => (window.location.href = '/admin/dashboard')}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-white text-sm transition-colors"
          >
            Ke Dashboard
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
