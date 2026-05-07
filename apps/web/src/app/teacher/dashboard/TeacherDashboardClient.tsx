'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground, TowerBackground, RobotMascot, GlassCard, NeonButton } from '@/components/ui'
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
    <main className="relative min-h-[100dvh] bg-uni-bg overflow-hidden flex flex-col">
      <StarryBackground density="high" />
      <TowerBackground variant="dashboard" className="absolute top-10" />

      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-30 flex justify-between items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-uni-primary to-uni-accent flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            <span className="text-white font-bold text-lg leading-none">U</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide hidden sm:block">Unimath</span>
        </div>

        {/* Right: Teacher Profile Dropdown & Avatar */}
        <div className="flex items-center gap-3">
          <div className="text-right">
             <div className="text-white font-semibold text-sm">{user.name}</div>
             <div className="text-uni-primary text-xs">Guru</div>
          </div>
          <div className="w-10 h-10 rounded-full border border-uni-primary bg-uni-bg-secondary flex items-center justify-center shadow-[0_0_10px_rgba(0,229,255,0.2)] overflow-hidden">
             {/* Avatar Placeholder */}
             <span className="text-xl">🧑‍🏫</span>
          </div>
          <button onClick={handleLogout} className="ml-2 text-text-muted hover:text-white transition-colors" title="Logout">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
          </button>
        </div>
      </div>

      {/* Center Building Graphic - We position the TowerBackground slightly down */}

      {/* Main Glass Card Area */}
      <div className="relative z-20 w-full flex-grow flex flex-col items-center justify-center px-4 pt-32 pb-20">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-2xl mt-auto relative"
        >
          {/* Top Hexagon Badge */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-30">
            <div className="w-16 h-16 bg-uni-bg-secondary rounded-xl border border-uni-primary shadow-[0_0_15px_rgba(0,229,255,0.5)] rotate-45 flex items-center justify-center">
              <span className="-rotate-45 text-uni-primary font-bold text-2xl">U</span>
            </div>
          </div>

          <GlassCard className="pt-12 pb-8 px-6 sm:px-10 text-center glass-strong">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">
              Selamat Datang <br className="sm:hidden" />Bapak/Ibu Guru
            </h1>
            
            <p className="text-text-secondary text-sm sm:text-base mb-8 max-w-md mx-auto">
              Semangat membimbing numerasi Indonesia <span className="text-uni-primary font-medium">hari ini.</span>
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
               {/* Kelas Aktif */}
               <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
                  <div className="text-uni-primary text-2xl">👨‍🏫</div>
                  <div>
                     <div className="text-2xl font-bold text-white leading-none mb-1">{stats.totalClasses}</div>
                     <div className="text-xs text-text-secondary">Kelas Aktif</div>
                  </div>
               </div>

               {/* Murid Terdaftar */}
               <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
                  <div className="text-uni-primary text-2xl">👥</div>
                  <div>
                     <div className="text-2xl font-bold text-white leading-none mb-1">{stats.totalStudents}</div>
                     <div className="text-xs text-text-secondary">Murid Terdaftar</div>
                  </div>
               </div>

               {/* Sekolah (using point UI logic from mockup temporarily) */}
               <div className="bg-uni-bg-secondary/40 border border-uni-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
                  <div className="text-uni-primary text-2xl">🏫</div>
                  <div>
                     <div className="text-2xl font-bold text-white leading-none mb-1">{stats.totalSchools}</div>
                     <div className="text-xs text-text-secondary">Sekolah Terdaftar</div>
                  </div>
               </div>

               {/* Points/Warning (Mockup has 'Butuh bimbingan' with warning icon) */}
               <div className="bg-uni-bg-secondary/40 border border-uni-warning/20 rounded-xl p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-uni-warning/5 rounded-bl-full"></div>
                  <div className="text-uni-warning text-2xl z-10">⭐</div>
                  <div className="z-10">
                     <div className="text-2xl font-bold text-white leading-none mb-1">{stats.points}</div>
                     <div className="text-xs text-text-secondary">Poin Guru</div>
                  </div>
               </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/teacher/classes" className="w-full sm:w-1/2">
                <button className="w-full py-3 bg-gradient-to-r from-uni-primary to-uni-accent hover:from-uni-primary-dark hover:to-uni-primary rounded-xl text-white font-semibold transition-all shadow-[0_0_15px_rgba(0,229,255,0.3)] hover:shadow-[0_0_20px_rgba(0,229,255,0.5)] flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21l-9-5-9 5" />
                  </svg>
                  Lihat Semua Kelas
                  <span className="ml-1">›</span>
                </button>
              </Link>
              
              <Link href="/teacher/reports" className="w-full sm:w-1/2">
                <button className="w-full py-3 bg-transparent border border-white/20 hover:border-white/50 hover:bg-white/5 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Lihat Rekap
                  <span className="ml-1">›</span>
                </button>
              </Link>
            </div>

          </GlassCard>

        </motion.div>
        
        {/* Robot Mascot at the bottom */}
        <motion.div
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.4, duration: 0.6 }}
           className="mt-6 sm:mt-8"
        >
          <RobotMascot state="waving" size="lg" className="-mb-8" />
        </motion.div>

      </div>
    </main>
  )
}
