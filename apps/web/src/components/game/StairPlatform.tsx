'use client'

import { motion } from 'framer-motion'

interface StairPlatformProps {
  isClimbing: boolean
  floor: number
}

export function StairPlatform({ isClimbing, floor }: StairPlatformProps) {
  return (
    <div className="relative w-full">
      {/* Horizontal neon lines - platform steps */}
      <motion.div 
        className="relative"
        animate={isClimbing ? { y: [0, 20, 0] } : { y: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="relative h-6 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Main horizontal line */}
            <div 
              className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              style={{
                boxShadow: '0 0 10px rgba(0,212,170,0.6), 0 0 20px rgba(0,212,170,0.3)',
              }}
            />
            {/* Side glow effects */}
            <div className="absolute left-0 w-8 h-[3px] bg-gradient-to-r from-cyan-400/80 to-transparent" />
            <div className="absolute right-0 w-8 h-[3px] bg-gradient-to-l from-cyan-400/80 to-transparent" />
          </motion.div>
        ))}
      </motion.div>
      
      {/* Floor label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/80 text-lg font-medium tracking-wider">
        Lantai {floor}
      </div>
    </div>
  )
}
