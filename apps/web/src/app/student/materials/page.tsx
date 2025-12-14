'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAuth } from '@/lib/auth/context'
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-uni-bg">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/student/dashboard" className="text-text-secondary hover:text-white text-sm sm:text-base">
            ← Kembali
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Daftar Materi</h1>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="text-center text-text-secondary py-8 text-sm">Loading...</div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {materials.map((material, index) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1 truncate">
                        {material.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-text-secondary">
                        Materi {material.order}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-uni-primary font-bold text-sm sm:text-base">
                        {material.progress}%
                      </span>
                    </div>
                  </div>

                  <ProgressBar value={material.progress} className="mb-3 sm:mb-4" />

                  {/* Action Button */}
                  <Link href={`/student/materials/${material.id}`}>
                    <NeonButton variant="secondary" size="sm" className="w-full text-sm">
                      📚 Buka Materi
                    </NeonButton>
                  </Link>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
