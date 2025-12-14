'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface GameRobotProps {
  state: 'idle' | 'climbing' | 'celebrating'
  floor: number
}

export function GameRobot({ state, floor }: GameRobotProps) {
  return (
    <motion.div
      className="relative z-20"
      animate={{
        y: state === 'climbing' ? -60 : 0,
        scale: state === 'celebrating' ? [1, 1.1, 1] : 1,
      }}
      transition={{
        y: { duration: 0.8, ease: 'easeOut' },
        scale: { duration: 0.5, repeat: state === 'celebrating' ? 2 : 0 },
      }}
    >
      {/* Robot glow effect */}
      <div className="absolute -inset-4 bg-cyan-400/20 rounded-full blur-xl" />
      
      {/* Robot body */}
      <div className="relative w-16 h-20 flex flex-col items-center">
        {/* Head */}
        <motion.div 
          className="relative w-12 h-10 bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-full border-2 border-cyan-400/50"
          animate={state === 'celebrating' ? { rotate: [-5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {/* Eyes */}
          <div className="absolute top-3 left-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,212,170,0.8)]" />
          <div className="absolute top-3 right-2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,212,170,0.8)]" />
          {/* Antenna */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-500">
            <motion.div 
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
        
        {/* Body */}
        <div className="relative w-10 h-8 bg-gradient-to-b from-slate-600 to-slate-700 rounded-lg border-2 border-cyan-400/50 mt-0.5">
          {/* Chest light */}
          <motion.div 
            className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-sm"
            animate={{ 
              boxShadow: state === 'celebrating' 
                ? ['0 0 10px rgba(0,212,170,0.8)', '0 0 20px rgba(0,212,170,1)', '0 0 10px rgba(0,212,170,0.8)']
                : '0 0 10px rgba(0,212,170,0.8)'
            }}
            transition={{ duration: 0.3, repeat: state === 'celebrating' ? Infinity : 0 }}
          />
        </div>
        
        {/* Tracks/Wheels */}
        <div className="flex gap-1 mt-0.5">
          <motion.div 
            className="w-4 h-2 bg-slate-800 rounded-full border border-cyan-400/30"
            animate={state === 'climbing' ? { rotate: 360 } : {}}
            transition={{ duration: 0.5, repeat: state === 'climbing' ? 2 : 0 }}
          />
          <motion.div 
            className="w-4 h-2 bg-slate-800 rounded-full border border-cyan-400/30"
            animate={state === 'climbing' ? { rotate: 360 } : {}}
            transition={{ duration: 0.5, repeat: state === 'climbing' ? 2 : 0 }}
          />
        </div>
      </div>
      
      {/* Floor indicator below robot */}
      <motion.div 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-cyan-400 text-sm font-bold whitespace-nowrap"
        key={floor}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Lantai {floor}
      </motion.div>
    </motion.div>
  )
}
