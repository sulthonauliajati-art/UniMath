'use client'

import { motion } from 'framer-motion'

interface TowerBuildingProps {
  currentFloor: number
  robotState: 'idle' | 'climbing' | 'celebrating'
  isClimbing: boolean
}

export function TowerBuilding({ currentFloor, robotState, isClimbing }: TowerBuildingProps) {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Stars/Meteors in background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-16 bg-gradient-to-b from-white/60 to-transparent"
            style={{
              left: `${10 + i * 12}%`,
              top: `${5 + (i % 3) * 10}%`,
              transform: 'rotate(-45deg)',
            }}
            animate={{
              y: [0, 200],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Main Tower Structure */}
      <div className="relative w-full max-w-md h-full">
        {/* Tower perspective container */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
          {/* Left building panel */}
          <div 
            className="absolute left-0 w-1/3 h-full"
            style={{ 
              background: 'linear-gradient(to right, rgba(0,180,216,0.1), rgba(0,180,216,0.05))',
              borderRight: '2px solid rgba(0,212,170,0.3)',
              transform: 'rotateY(15deg)',
              transformOrigin: 'right center',
            }}
          >
            {/* Grid lines */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-b border-cyan-400/20"
                style={{ top: `${i * 8.33}%` }}
              />
            ))}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full border-r border-cyan-400/20"
                style={{ left: `${i * 33}%` }}
              />
            ))}
          </div>

          {/* Right building panel */}
          <div 
            className="absolute right-0 w-1/3 h-full"
            style={{ 
              background: 'linear-gradient(to left, rgba(0,180,216,0.1), rgba(0,180,216,0.05))',
              borderLeft: '2px solid rgba(0,212,170,0.3)',
              transform: 'rotateY(-15deg)',
              transformOrigin: 'left center',
            }}
          >
            {/* Grid lines */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-full border-b border-cyan-400/20"
                style={{ top: `${i * 8.33}%` }}
              />
            ))}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full border-l border-cyan-400/20"
                style={{ left: `${i * 33}%` }}
              />
            ))}
          </div>

          {/* Center zigzag stairs */}
          <motion.div 
            className="absolute inset-x-1/4 w-1/2 h-full flex flex-col items-center justify-end"
            animate={isClimbing ? { y: [0, 40] } : { y: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {/* Zigzag stair pattern */}
            <svg 
              viewBox="0 0 200 400" 
              className="w-full h-full"
              preserveAspectRatio="xMidYMax slice"
            >
              <defs>
                <linearGradient id="stairGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0,212,170,0.8)" />
                  <stop offset="50%" stopColor="rgba(0,180,216,0.6)" />
                  <stop offset="100%" stopColor="rgba(0,212,170,0.8)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Zigzag stairs going up */}
              {[...Array(10)].map((_, i) => {
                const y = 380 - i * 35
                const isLeft = i % 2 === 0
                return (
                  <g key={i} filter="url(#glow)">
                    {/* Horizontal step */}
                    <line
                      x1={isLeft ? 40 : 100}
                      y1={y}
                      x2={isLeft ? 100 : 160}
                      y2={y}
                      stroke="url(#stairGlow)"
                      strokeWidth="3"
                    />
                    {/* Diagonal connector */}
                    {i < 9 && (
                      <line
                        x1={isLeft ? 100 : 100}
                        y1={y}
                        x2={isLeft ? 100 : 100}
                        y2={y - 35}
                        stroke="url(#stairGlow)"
                        strokeWidth="2"
                        opacity="0.5"
                      />
                    )}
                    {/* Zigzag diagonal */}
                    {i < 9 && (
                      <line
                        x1={isLeft ? 100 : 100}
                        y1={y}
                        x2={!isLeft ? 40 : 160}
                        y2={y - 35}
                        stroke="url(#stairGlow)"
                        strokeWidth="2"
                        opacity="0.6"
                      />
                    )}
                  </g>
                )
              })}
            </svg>
          </motion.div>

          {/* Neon edge lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-400/80 via-cyan-400/40 to-cyan-400/80 shadow-[0_0_10px_rgba(0,212,170,0.5)]" />
          <div className="absolute right-1/4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-400/80 via-cyan-400/40 to-cyan-400/80 shadow-[0_0_10px_rgba(0,212,170,0.5)]" />
        </div>
      </div>
    </div>
  )
}
