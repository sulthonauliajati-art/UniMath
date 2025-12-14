'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  glowColor?: 'cyan' | 'green' | 'purple'
  hover?: boolean
}

export function GlassCard({ 
  children, 
  className,
  glowColor = 'cyan',
  hover = false,
  ...props 
}: GlassCardProps) {
  const glowColors = {
    cyan: 'hover:shadow-[0_0_30px_rgba(0,180,216,0.3)]',
    green: 'hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]',
    purple: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
  }

  const borderColors = {
    cyan: 'border-uni-accent/30',
    green: 'border-uni-primary/30',
    purple: 'border-purple-500/30',
  }

  return (
    <motion.div
      className={clsx(
        'glass rounded-2xl',
        borderColors[glowColor],
        hover && glowColors[glowColor],
        hover && 'transition-shadow duration-300 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
