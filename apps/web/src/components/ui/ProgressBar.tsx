'use client'

import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface ProgressBarProps {
  value: number // 0-100
  color?: 'cyan' | 'green'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressBar({
  value,
  color = 'green',
  showLabel = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  const colors = {
    cyan: 'from-uni-accent to-blue-400',
    green: 'from-uni-primary to-emerald-400',
  }

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-text-secondary">Progress</span>
          <span className="text-xs text-uni-primary font-medium">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div className={clsx(
        'w-full bg-uni-bg-secondary/50 rounded-full overflow-hidden',
        sizes[size]
      )}>
        <motion.div
          className={clsx(
            'h-full rounded-full bg-gradient-to-r',
            colors[color]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
