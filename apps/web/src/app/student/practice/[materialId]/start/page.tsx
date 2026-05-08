'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TowerBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'
import { mockMaterials } from '@/data/mock/seed'

export default function PracticeStartPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [mode, setMode] = useState<'pretest' | 'posttest'>('pretest')
  const [loading, setLoading] = useState(false)

  const material = mockMaterials.find((m) => m.id === materialId)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  const handleStart = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId, mode }),
      })
      const data = await res.json()
      if (data.sessionId) {
        sessionStorage.setItem(
          'practiceSession',
          JSON.stringify({
            ...data,
            materialName: material?.title || 'Matematika',
          })
        )
        router.push(`/student/practice/${materialId}/play`)
      }
    } catch (error) {
      console.error('Failed to start practice:', error)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <TowerBackground variant="practice">
        <div className="min-h-[100dvh] flex items-center justify-center">
          <div className="text-white/80 text-sm animate-pulse">Loading…</div>
        </div>
      </TowerBackground>
    )
  }

  return (
    <TowerBackground variant="practice">
      {/* Header */}
      <header className="relative z-30 w-full px-4 pt-4 sm:px-6 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.4)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">
            Unimath
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-white font-semibold text-sm">{user.name}</div>
            <div className="text-cyan-300 text-xs">Siswa Aktif</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.25)]">
            <span className="text-xl">🤖</span>
          </div>
        </div>
      </header>

      {/* Card */}
      <section className="relative z-20 flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <GlassCard glowColor="cyan" intensity="strong" className="p-6 sm:p-8 text-center">
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {material?.title || 'Latihan'}
            </motion.h1>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Bantu robot naik gedung dengan menjawab soal!
            </p>

            {/* Mode toggle */}
            <div className="flex gap-1.5 mb-6 p-1.5 bg-black/40 border border-cyan-500/20 rounded-xl">
              {(['pretest', 'posttest'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={[
                    'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all',
                    mode === m
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 text-slate-900 shadow-[0_0_16px_-4px_rgba(6,182,212,0.8)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5',
                  ].join(' ')}
                >
                  {m === 'pretest' ? 'Pre-test' : 'Post-test'}
                </button>
              ))}
            </div>

            <button
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-bold text-base shadow-[0_0_24px_-4px_rgba(6,182,212,0.8)] hover:shadow-[0_0_32px_-4px_rgba(6,182,212,1)] disabled:opacity-60 disabled:cursor-not-allowed transition-shadow"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? 'Menyiapkan…' : '🚀 Mulai Latihan'}
            </button>

            <Link
              href="/student/materials"
              className="block mt-4 text-slate-400 hover:text-white text-xs sm:text-sm transition-colors"
            >
              ← Kembali ke Daftar Materi
            </Link>
          </GlassCard>
        </motion.div>
      </section>
    </TowerBackground>
  )
}
