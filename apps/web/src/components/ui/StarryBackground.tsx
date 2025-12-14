'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface StarryBackgroundProps {
  density?: 'low' | 'medium' | 'high'
  withNeonStreaks?: boolean
}

export function StarryBackground({ 
  density = 'medium', 
  withNeonStreaks = true 
}: StarryBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const starCounts = { low: 50, medium: 100, high: 150 }
  const starCount = starCounts[density]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Create stars
    const stars: { x: number; y: number; size: number; opacity: number; speed: number }[] = []
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.5 + 0.1,
      })
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.fillStyle = '#0a0e27'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw stars
      stars.forEach((star) => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.fill()

        // Twinkle effect
        star.opacity += (Math.random() - 0.5) * 0.02
        star.opacity = Math.max(0.2, Math.min(1, star.opacity))
      })

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [starCount])

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-uni-bg/50" />
      
      {/* Neon streaks */}
      {withNeonStreaks && (
        <>
          <motion.div
            className="absolute w-[2px] h-32 bg-gradient-to-b from-transparent via-uni-primary to-transparent opacity-30"
            style={{ left: '20%', top: '10%' }}
            animate={{ 
              y: [0, 100, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[2px] h-24 bg-gradient-to-b from-transparent via-uni-accent to-transparent opacity-20"
            style={{ right: '15%', top: '30%' }}
            animate={{ 
              y: [0, -80, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
          <motion.div
            className="absolute w-[2px] h-40 bg-gradient-to-b from-transparent via-uni-primary to-transparent opacity-25"
            style={{ left: '70%', bottom: '20%' }}
            animate={{ 
              y: [0, 60, 0],
              opacity: [0.25, 0.5, 0.25]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          />
        </>
      )}
    </div>
  )
}
