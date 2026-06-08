'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TowerBackground, GlassCard, StarryBackground } from '@/components/ui'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

interface Material {
  id: string
  title: string
  order: number
  progress: number
}

/**
 * ✅ FIX #3 & #15: Halaman /student/practice sekarang menampilkan DAFTAR MATERI
 * untuk dipilih siswa secara eksplisit — bukan langsung memulai dengan materi pertama.
 * Setiap materi memiliki tombol "Mulai Latihan" yang mengarah ke start page materi itu.
 */
export default function PracticePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch('/api/student/materials')
        const data = await res.json()
        setMaterials(data.materials || [])
      } catch (error) {
        console.error('Failed to fetch materials:', error)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchMaterials()
  }, [user])

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <TowerBackground variant="practice">
      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pt-8 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/student/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-cyan-400/30 bg-black/40 text-white hover:bg-cyan-500/10 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Pilih Materi Latihan</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Pilih materi yang ingin kamu latih sekarang
            </p>
          </div>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingScreen fullScreen={false} />
          </div>
        ) : materials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-white font-semibold mb-1">Belum ada materi</p>
            <p className="text-slate-400 text-sm">Tunggu guru menambahkan materi latihan</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {materials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <GlassCard className="p-4 sm:p-5 border-cyan-500/20 hover:border-cyan-400/40 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Number badge */}
                    <div className="w-14 h-14 rounded-xl bg-black/50 border border-cyan-400/30 flex items-center justify-center flex-shrink-0 shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]">
                      <span className="text-2xl font-bold text-cyan-300">{material.order}</span>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-2 truncate">
                        {material.title}
                      </h3>
                      {/* Progress bar */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">Progress latihan</span>
                        <span className="text-xs font-bold text-cyan-300">{material.progress}%</span>
                      </div>
                      <ProgressBar value={material.progress} size="sm" />
                    </div>

                    {/* Start button */}
                    <div className="w-full sm:w-auto flex-shrink-0">
                      <Link href={`/student/practice/${material.id}/start`}>
                        <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-bold text-sm shadow-[0_0_16px_-4px_rgba(6,182,212,0.6)] hover:shadow-[0_0_22px_-4px_rgba(6,182,212,0.9)] transition-shadow whitespace-nowrap">
                          🚀 Mulai
                        </button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </TowerBackground>
  )
}
