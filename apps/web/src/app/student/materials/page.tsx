'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, RobotMascot, GlassCard, NeonButton } from '@/components/ui'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Material } from '@/lib/types'

export default function MaterialsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [materials, setMaterials] = useState<(Material & { progress: number })[]>([])
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
    if (user) {
      fetchMaterials()
    }
  }, [user])

  if (isLoading || !user) {
    return <LoadingScreen />
  }

  return (
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col pb-24">
      <StarryBackground density="high" />
      <TowerBackground variant="flat" />
      
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Siswa Aktif</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-uni-primary bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden">
             <span className="text-xl">🤖</span>
          </div>
        </div>
      </div>

      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 pt-28 pb-8 flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/student/dashboard" className="w-10 h-10 flex items-center justify-center rounded-xl border border-uni-primary/30 bg-uni-bg-secondary text-white hover:bg-uni-primary/20 transition-colors shadow-[0_0_10px_rgba(0,229,255,0.1)]">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
             </svg>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
              Daftar Materi
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
               <div className="h-px w-12 bg-uni-primary/50" />
               <div className="w-2 h-2 rotate-45 bg-uni-primary shadow-[0_0_5px_var(--primary-glow)]" />
               <div className="h-px w-12 bg-uni-primary/50" />
            </div>
          </div>
          <div className="w-10 h-10"></div> {/* Spacer for centering */}
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
             <LoadingScreen fullScreen={false} />
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard hover className="p-4 sm:p-6 glass-strong border-uni-primary/30 group">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    {/* Material Icon/Number */}
                    <div className="w-16 h-16 rounded-xl bg-uni-bg/50 border border-uni-primary/40 flex items-center justify-center flex-shrink-0 shadow-[inset_0_0_10px_rgba(0,229,255,0.2)]">
                       <span className="text-2xl font-bold text-uni-primary">{material.order}</span>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate group-hover:text-uni-primary transition-colors">
                        {material.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-xs text-text-secondary">Progress:</span>
                         <span className="text-xs font-bold text-uni-primary">{material.progress}%</span>
                      </div>
                      <ProgressBar value={material.progress} size="sm" className="mb-4 sm:mb-0" />
                    </div>

                    <div className="w-full sm:w-auto flex-shrink-0">
                      <Link href={`/student/materials/${material.id}`}>
                        <button className="w-full sm:w-auto px-6 py-3 bg-transparent border border-uni-primary hover:bg-uni-primary/20 text-white font-medium rounded-xl transition-all shadow-[0_0_10px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2">
                          Mulai <span className="text-uni-primary">›</span>
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
      
      {/* Robot Mascot Bottom Right */}
      <div className="fixed bottom-4 right-4 z-40 pointer-events-none hidden sm:block opacity-60">
         <RobotMascot state="idle" size="sm" />
      </div>
    </main>
  )
}
