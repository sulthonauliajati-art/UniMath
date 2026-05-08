'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TowerBackground, GlassCard } from '@/components/ui'
import { useAuth } from '@/lib/auth/context'

interface Stats {
  totalStudents: number
  totalClasses: number
  totalSchools: number
  points: number
}

export default function TeacherDashboardClient({ stats }: { stats: Stats }) {
  const router = useRouter()
  const { user, logout } = useAuth()

  if (!user) return null

  const handleLogout = async () => {
    await logout()
    router.push('/teacher/login')
  }

  return (
    <TowerBackground variant="teacher">
      {/* Top Header */}
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
          <div className="text-right">
            <div className="text-white font-semibold text-sm">{user.name}</div>
            <div className="text-cyan-300 text-xs">Guru</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-cyan-400/50 bg-gradient-to-br from-[#1E293B] to-[#0F172A] flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.25)]">
            <span className="text-xl">🧑‍🏫</span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main glass card */}
      <section className="relative z-20 flex-1 w-full flex items-center justify-center px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-2xl relative"
        >
          {/* Hexagon badge on top */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30">
            <div className="w-14 h-14 bg-[#0A1128] rounded-xl border border-cyan-400 rotate-45 flex items-center justify-center shadow-[0_0_18px_-2px_rgba(6,182,212,0.8)]">
              <span className="-rotate-45 text-cyan-300 font-extrabold text-xl">
                U
              </span>
            </div>
          </div>

          <GlassCard glowColor="cyan" intensity="strong" className="pt-12 pb-8 px-6 sm:px-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              Selamat Datang
              <br className="sm:hidden" /> Bapak/Ibu Guru
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mb-7 max-w-md mx-auto">
              Semangat membimbing numerasi Indonesia{' '}
              <span className="text-cyan-300 font-semibold">hari ini.</span>
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-7 text-left">
              <StatCard icon="👨‍🏫" value={stats.totalClasses} label="Kelas Aktif" />
              <StatCard icon="👥" value={stats.totalStudents} label="Murid Terdaftar" />
              <StatCard icon="🏫" value={stats.totalSchools} label="Sekolah Terdaftar" />
              <StatCard icon="⭐" value={stats.points} label="Poin Guru" tone="amber" />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/teacher/classes" className="w-full sm:w-1/2">
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-bold text-sm sm:text-base shadow-[0_0_20px_-4px_rgba(6,182,212,0.8)] hover:shadow-[0_0_28px_-4px_rgba(6,182,212,1)] transition-shadow flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                  </svg>
                  Lihat Semua Kelas
                  <span className="ml-0.5">›</span>
                </button>
              </Link>

              <Link href="/teacher/reports" className="w-full sm:w-1/2">
                <button className="w-full py-3 rounded-xl bg-black/40 border border-cyan-400/50 text-white font-semibold text-sm sm:text-base hover:bg-cyan-500/10 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Lihat Rekap
                  <span className="ml-0.5">›</span>
                </button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </TowerBackground>
  )
}

function StatCard({
  icon,
  value,
  label,
  tone = 'cyan',
}: {
  icon: string
  value: number
  label: string
  tone?: 'cyan' | 'amber'
}) {
  const accent =
    tone === 'amber'
      ? 'border-amber-400/30 shadow-[0_0_14px_-6px_rgba(245,158,11,0.6)]'
      : 'border-cyan-400/25 shadow-[0_0_14px_-6px_rgba(6,182,212,0.6)]'
  return (
    <div
      className={`bg-black/40 border rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm ${accent}`}
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white leading-none mb-1">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  )
}
