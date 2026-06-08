'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TowerBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'

export default function PracticeStartPage() {
  const params = useParams()
  const materialId = params.materialId as string
  const router = useRouter()
  const { user, isLoading, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [materialTitle, setMaterialTitle] = useState('Latihan')
  const [fetchingTitle, setFetchingTitle] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  // Fetch material title from API instead of mock data
  useEffect(() => {
    async function fetchMaterial() {
      try {
        const res = await fetch(`/api/student/materials`)
        if (res.ok) {
          const data = await res.json()
          const found = data.materials?.find((m: { id: string; title: string }) => m.id === materialId)
          if (found) {
            setMaterialTitle(found.title)
          }
        }
      } catch (err) {
        console.error('Failed to fetch material title:', err)
      } finally {
        setFetchingTitle(false)
      }
    }
    if (materialId) {
      fetchMaterial()
    }
  }, [materialId])

  const handleStartPractice = async () => {
    setLoading(true)
    setError('')
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/practice/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({ materialId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error?.message || 'Gagal memulai latihan. Coba lagi.')
        return
      }

      if (data.sessionId) {
        sessionStorage.setItem(
          'practiceSession',
          JSON.stringify({
            ...data,
            materialName: materialTitle,
          })
        )
        router.push(`/student/practice/${materialId}/play`)
      } else {
        setError('Session tidak valid. Coba lagi.')
      }
    } catch (err) {
      console.error('Failed to start practice:', err)
      setError('Terjadi kesalahan jaringan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = (testType: 'PRETEST' | 'POSTTEST') => {
    router.push(`/student/test/${materialId}/${testType}`)
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
              {fetchingTitle ? '...' : materialTitle}
            </motion.h1>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Bantu robot naik gedung dengan menjawab soal!
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Practice Button - Primary CTA */}
            <button
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-bold text-base shadow-[0_0_24px_-4px_rgba(6,182,212,0.8)] hover:shadow-[0_0_32px_-4px_rgba(6,182,212,1)] disabled:opacity-60 disabled:cursor-not-allowed transition-shadow mb-4"
              onClick={handleStartPractice}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyiapkan…
                </span>
              ) : '🚀 Mulai Latihan'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">atau</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Pre-test / Post-test Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleStartTest('PRETEST')}
                className="py-2.5 rounded-xl bg-black/40 border border-amber-400/40 text-amber-300 font-semibold text-sm hover:bg-amber-500/10 hover:border-amber-400/60 transition-all"
              >
                📝 Pre-Test
              </button>
              <button
                onClick={() => handleStartTest('POSTTEST')}
                className="py-2.5 rounded-xl bg-black/40 border border-emerald-400/40 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/10 hover:border-emerald-400/60 transition-all"
              >
                📋 Post-Test
              </button>
            </div>

            <Link
              href="/student/materials"
              className="block mt-2 text-slate-400 hover:text-white text-xs sm:text-sm transition-colors"
            >
              ← Kembali ke Daftar Materi
            </Link>
          </GlassCard>
        </motion.div>
      </section>
    </TowerBackground>
  )
}
