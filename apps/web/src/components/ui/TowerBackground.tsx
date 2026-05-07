'use client'

import { clsx } from 'clsx'

interface TowerBackgroundProps {
  variant?: 'landing' | 'practice' | 'dashboard' | 'flat'
  children?: React.ReactNode
  className?: string
  floorLevel?: number
}

export function TowerBackground({ 
  variant = 'landing',
  children,
  className,
  floorLevel = 1
}: TowerBackgroundProps) {
  
  return (
    <div className={clsx('relative w-full min-h-screen flex flex-col items-center overflow-hidden', className)}>
      
      {/* Base Grid & Grid Perspective */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 w-full h-[50vh] perspective-origin-bottom perspective-[800px]">
          <div className="w-[200%] h-[200%] -ml-[50%] bg-[linear-gradient(rgba(0,229,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px] transform rotateX-[60deg] translate-y-24 opacity-40"></div>
        </div>
      </div>

      {/* Building / Tower Central Column */}
      {(variant === 'landing' || variant === 'practice') && (
        <div className="absolute inset-0 z-0 flex justify-center pointer-events-none opacity-80">
          <svg className="w-full h-full max-w-4xl" viewBox="0 0 800 1000" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Tower Body */}
            <path d="M 250 0 L 550 0 L 600 1000 L 200 1000 Z" fill="url(#towerGradient)" />
            <path d="M 250 0 L 550 0 L 600 1000 L 200 1000 Z" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.5" />
            
            {/* Tower Core / Neon Zigzag (Based on design) */}
            <path d="M 400 0 L 350 150 L 450 300 L 350 450 L 450 600 L 350 750 L 450 900 L 400 1000" stroke="#00E5FF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_15px_rgba(0,229,255,1)]" />
            
            {/* Windows / Tech lines */}
            <line x1="280" y1="200" x2="330" y2="200" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            <line x1="470" y1="200" x2="520" y2="200" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            
            <line x1="270" y1="400" x2="320" y2="400" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            <line x1="480" y1="400" x2="530" y2="400" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            
            <line x1="260" y1="600" x2="310" y2="600" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            <line x1="490" y1="600" x2="540" y2="600" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            
            <line x1="240" y1="800" x2="290" y2="800" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />
            <line x1="510" y1="800" x2="560" y2="800" stroke="#00E5FF" strokeWidth="2" strokeOpacity="0.4" />

            <defs>
              <linearGradient id="towerGradient" x1="400" y1="0" x2="400" y2="1000" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#040914" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Practice Mode Stairs (Dynamic based on floorLevel) */}
      {variant === 'practice' && (
        <div className="absolute bottom-0 w-full h-[40vh] flex flex-col items-center justify-end pb-8 pointer-events-none z-0">
          <div className="relative w-full max-w-2xl flex flex-col gap-2 opacity-80 perspective-[800px] transform-gpu">
             {/* Render stairs, wider at bottom, narrower at top */}
             {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="mx-auto h-8 bg-[#0F172A] border-t-2 border-[#00E5FF] drop-shadow-[0_-5px_10px_rgba(0,229,255,0.3)] flex justify-center items-center"
                  style={{ 
                    width: `${100 - (i * 10)}%`,
                    transform: `translateZ(${i * -50}px) translateY(${i * -10}px)`,
                    opacity: 1 - (i * 0.15)
                  }}
                >
                  {i === 0 && <div className="absolute inset-0 bg-[#00E5FF] opacity-10 animate-pulse-glow" />}
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full flex-grow flex flex-col">
        {children}
      </div>

    </div>
  )
}
