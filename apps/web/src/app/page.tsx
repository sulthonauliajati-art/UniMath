'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { StarryBackground } from '@/components/ui/StarryBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { NeonButton } from '@/components/ui/NeonButton'

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <StarryBackground />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 sm:p-8 text-center">
            {/* Logo/Title */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 sm:mb-8"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-1 sm:mb-2">
                UniMath
              </h1>
              <p className="text-text-secondary text-xs sm:text-sm">
                Platform Latihan Numerasi Gamified
              </p>
            </motion.div>

            {/* Robot illustration placeholder */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-6 sm:mb-8"
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-uni-primary/20 to-uni-accent/20 rounded-full flex items-center justify-center">
                <span className="text-5xl sm:text-6xl">🤖</span>
              </div>
            </motion.div>

            {/* Welcome text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-white text-base sm:text-lg mb-6 sm:mb-8"
            >
              Selamat Datang!
            </motion.p>

            {/* Login buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-3 sm:space-y-4"
            >
              <Link href="/student/login" className="block">
                <NeonButton variant="primary" size="lg" className="w-full">
                  Login Siswa
                </NeonButton>
              </Link>
              
              <Link href="/teacher/login" className="block">
                <NeonButton variant="secondary" size="lg" className="w-full">
                  Login Guru
                </NeonButton>
              </Link>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
