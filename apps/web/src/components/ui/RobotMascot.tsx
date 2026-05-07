'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'

type RobotState = 'idle' | 'happy' | 'sad' | 'waving' | 'climbing' | 'celebrating'

interface RobotMascotProps {
  state?: RobotState
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function RobotMascot({ 
  state = 'idle', 
  className,
  size = 'md'
}: RobotMascotProps) {
  
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
  }

  // Animation variants based on state
  const getAnimationProps = () => {
    switch (state) {
      case 'happy':
      case 'celebrating':
        return {
          animate: { y: [0, -15, 0], scale: [1, 1.05, 1] },
          transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
        }
      case 'sad':
        return {
          animate: { y: [0, 5, 0] },
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }
      case 'waving':
        return {
          animate: { rotate: [0, 15, -5, 10, 0] },
          transition: { duration: 1.5, repeat: Infinity }
        }
      case 'climbing':
        return {
          animate: { y: [0, -5, 0], x: [-2, 2, -2] },
          transition: { duration: 0.8, repeat: Infinity }
        }
      case 'idle':
      default:
        return {
          animate: { y: [0, -8, 0] },
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
    }
  }

  return (
    <motion.div 
      className={clsx('relative z-10 drop-shadow-2xl flex items-center justify-center', sizeClasses[size], className)}
      {...getAnimationProps()}
    >
      {/* 
        This is a placeholder SVG for the Robot Mascot. 
        TODO: Replace with actual `img` tag pointing to final assets (e.g., /assets/robot-${state}.png) 
      */}
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,229,255,0.5)]">
        {/* Glow behind */}
        <circle cx="100" cy="100" r="80" fill="url(#robotGlow)" opacity="0.3" />
        
        {/* Head Base */}
        <rect x="50" y="40" width="100" height="80" rx="40" fill="#1E293B" stroke="#00E5FF" strokeWidth="3" />
        <rect x="55" y="45" width="90" height="70" rx="35" fill="#0F172A" />
        
        {/* Ears */}
        <path d="M45 70 Q40 70 40 80 Q40 90 45 90" fill="#334155" stroke="#00E5FF" strokeWidth="2" />
        <path d="M155 70 Q160 70 160 80 Q160 90 155 90" fill="#334155" stroke="#00E5FF" strokeWidth="2" />
        
        {/* Eyes (Varies by state) */}
        {state === 'sad' ? (
          <>
            <path d="M70 75 Q80 65 90 75" stroke="#00E5FF" strokeWidth="5" strokeLinecap="round" />
            <path d="M110 75 Q120 65 130 75" stroke="#00E5FF" strokeWidth="5" strokeLinecap="round" />
            <path d="M90 95 Q100 90 110 95" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : state === 'happy' || state === 'celebrating' ? (
          <>
            <path d="M70 70 Q80 60 90 70" stroke="#00E5FF" strokeWidth="6" strokeLinecap="round" />
            <path d="M110 70 Q120 60 130 70" stroke="#00E5FF" strokeWidth="6" strokeLinecap="round" />
            <path d="M90 90 Q100 100 110 90" stroke="#00E5FF" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="80" cy="70" r="8" fill="#00E5FF" />
            <circle cx="120" cy="70" r="8" fill="#00E5FF" />
            <path d="M90 95 Q100 100 110 95" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {/* Body Base */}
        <path d="M60 130 C60 120 140 120 140 130 L150 180 C150 190 50 190 50 180 Z" fill="#1E293B" stroke="#00E5FF" strokeWidth="3" />
        
        {/* Chest Logo/Glow */}
        <circle cx="100" cy="155" r="15" fill="#0F172A" stroke="#00E5FF" strokeWidth="2" />
        <path d="M95 150 L95 160 L105 160 M105 150 L105 160" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Arms */}
        {state === 'waving' ? (
          <>
            <path d="M50 140 C40 145 35 160 45 170" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
            <path d="M150 140 C165 130 180 110 170 95" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
          </>
        ) : state === 'celebrating' ? (
           <>
            <path d="M50 140 C35 130 20 110 30 95" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
            <path d="M150 140 C165 130 180 110 170 95" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M50 140 C40 145 35 160 45 170" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
            <path d="M150 140 C160 145 165 160 155 170" fill="none" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
          </>
        )}

        <defs>
          <radialGradient id="robotGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  )
}
