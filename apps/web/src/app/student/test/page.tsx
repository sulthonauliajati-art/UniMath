'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/lib/auth/context'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

/**
 * Landing page for Pre-test / Post-test: lists every available material and
 * lets the student jump into the corresponding `/student/test/[id]/[type]`
 * flow. Replaces the previous 404s at /student/pretest & /student/posttest.
 *
 * Query: ?type=pretest|posttest   (default: pretest)
 */
interface MaterialRow {
  id: string
  title: string
  grade: string
  description: string | null
}

function StudentTestLandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token, isLoading } = useAuth()

  const rawType = searchParams.get('type')?.toLowerCase()
  const type: 'pretest' | 'posttest' = rawType === 'posttest' ? 'posttest' : 'pretest'

  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'STUDENT')) {
      router.push('/student/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchMaterials = async () => {
      if (!token) return
      try {
        const res = await fetch('/api/student/materials', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (res.ok) {
          setMaterials(data.materials || [])
        }
      } catch (err) {
        console.error('Failed to fetch materials:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMaterials()
  }, [token])

  if (isLoading || !user) return <LoadingScreen />

  const title = type === 'pretest' ? 'Pre-test' : 'Post-test'
  const description =
    type === 'pretest'
      ? 'Uji pemahaman awal sebelum belajar materi.'
      : 'Ukur peningkatan kamu setelah belajar materi.'

  const startPath = (materialId: string) =>
    `/student/test/${materialId}/${type === 'pretest' ? 'PRETEST' : 'POSTTEST'}`

  return (
    <main className="relative min-h-screen overflow-hidden">
      <StarryBackground />

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <Link
          href="/student/dashboard"
          className="text-text-secondary hover:text-white text-sm mb-2 inline-block"
        >
          ← Kembali ke Dashboard
        </Link>

        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
          <h1 className="text-2xl font-bold text-white">
            {type === 'pretest' ? '📝' : '✅'} {title}
          </h1>
          <div className="flex gap-2">
            <TabLink
              href="/student/test?type=pretest"
              active={type === 'pretest'}
              label="Pre-test"
            />
            <TabLink
              href="/student/test?type=posttest"
              active={type === 'posttest'}
              label="Post-test"
            />
          </div>
        </div>
        <p className="text-sm text-text-secondary mb-2">{description}</p>

        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
          ⚠️ <b>Mode Tes Steril:</b> tidak ada hint, tidak ada poin, tidak ada gamifikasi.
          Kerjakan dengan jujur — timer berjalan dari server, refresh tidak me-reset waktu.
        </div>

        {loading ? (
          <div className="text-center text-text-secondary py-8">Memuat materi…</div>
        ) : materials.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <div className="text-5xl mb-3">{type === 'pretest' ? '📝' : '✅'}</div>
            <p className="text-text-secondary mb-2">
              Soal {title} belum tersedia.
            </p>
            <p className="text-xs text-text-muted">
              Hubungi guru atau admin untuk meminta akses ke materi tes.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {materials.map((mat, idx) => (
              <motion.div
                key={mat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.3) }}
              >
                <Link href={startPath(mat.id)} className="block group">
                  <GlassCard hover className="p-4 h-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white mb-1 truncate">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {mat.description || 'Kelas ' + mat.grade}
                        </p>
                      </div>
                      <span className="text-xs bg-uni-primary/20 text-uni-primary px-2 py-0.5 rounded shrink-0">
                        Kelas {mat.grade}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-uni-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Mulai {title} →
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function StudentTestLandingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <StudentTestLandingContent />
    </Suspense>
  )
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? 'bg-uni-primary/20 text-uni-primary border border-uni-primary/30'
          : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10 border border-white/10'
      }`}
    >
      {label}
    </Link>
  )
}
