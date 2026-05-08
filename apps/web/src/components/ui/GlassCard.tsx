'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

type GlowColor = 'cyan' | 'emerald' | 'amber' | 'red' | 'purple'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  glowColor?: GlowColor
  hover?: boolean
  /**
   * Strength of the ambient glow ring around the card.
   * - `subtle` (default) → thin border + soft halo (resting state)
   * - `strong` → prominent neon ring (active/selected/modal state)
   */
  intensity?: 'subtle' | 'strong'
}

const GLOW_TOKENS: Record<
  GlowColor,
  { border: string; shadowSubtle: string; shadowStrong: string; shadowHover: string }
> = {
  cyan: {
    border: 'border-[rgba(6,182,212,0.55)]',
    shadowSubtle:
      '0 0 0 1px rgba(6,182,212,0.25), 0 0 24px -6px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    shadowStrong:
      '0 0 0 1px rgba(6,182,212,0.7), 0 0 40px -4px rgba(6,182,212,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
    shadowHover:
      '0 0 0 1px rgba(6,182,212,0.85), 0 0 48px -4px rgba(6,182,212,0.75), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  emerald: {
    border: 'border-[rgba(16,185,129,0.55)]',
    shadowSubtle:
      '0 0 0 1px rgba(16,185,129,0.25), 0 0 24px -6px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    shadowStrong:
      '0 0 0 1px rgba(16,185,129,0.7), 0 0 40px -4px rgba(16,185,129,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
    shadowHover:
      '0 0 0 1px rgba(16,185,129,0.85), 0 0 48px -4px rgba(16,185,129,0.75), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  amber: {
    border: 'border-[rgba(245,158,11,0.55)]',
    shadowSubtle:
      '0 0 0 1px rgba(245,158,11,0.25), 0 0 24px -6px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    shadowStrong:
      '0 0 0 1px rgba(245,158,11,0.7), 0 0 40px -4px rgba(245,158,11,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
    shadowHover:
      '0 0 0 1px rgba(245,158,11,0.85), 0 0 48px -4px rgba(245,158,11,0.7), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  red: {
    border: 'border-[rgba(239,68,68,0.55)]',
    shadowSubtle:
      '0 0 0 1px rgba(239,68,68,0.3), 0 0 24px -6px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    shadowStrong:
      '0 0 0 1px rgba(239,68,68,0.7), 0 0 40px -4px rgba(239,68,68,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
    shadowHover:
      '0 0 0 1px rgba(239,68,68,0.85), 0 0 48px -4px rgba(239,68,68,0.75), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
  purple: {
    border: 'border-[rgba(139,92,246,0.55)]',
    shadowSubtle:
      '0 0 0 1px rgba(139,92,246,0.25), 0 0 24px -6px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
    shadowStrong:
      '0 0 0 1px rgba(139,92,246,0.7), 0 0 40px -4px rgba(139,92,246,0.65), inset 0 1px 0 rgba(255,255,255,0.12)',
    shadowHover:
      '0 0 0 1px rgba(139,92,246,0.85), 0 0 48px -4px rgba(139,92,246,0.75), inset 0 1px 0 rgba(255,255,255,0.15)',
  },
}

/**
 * Glassmorphic container with a precise neon cyan (or coloured) ring, used for
 * question cards, modals, dashboard panels — essentially every surface that
 * sits on top of the 3D background.
 *
 * Key design tokens (from the final sci-fi mock):
 *  - translucent navy fill    →   `rgba(7, 17, 36, 0.72)`
 *  - backdrop-blur(20px)
 *  - 1px border + 0 0 24-40px outer neon + subtle inset highlight
 */
export function GlassCard({
  children,
  className,
  glowColor = 'cyan',
  hover = false,
  intensity = 'subtle',
  style,
  ...props
}: GlassCardProps) {
  const tokens = GLOW_TOKENS[glowColor]
  const shadow = intensity === 'strong' ? tokens.shadowStrong : tokens.shadowSubtle

  return (
    <motion.div
      className={clsx(
        'relative rounded-2xl border backdrop-blur-xl',
        'bg-[rgba(7,17,36,0.72)]',
        tokens.border,
        hover && 'transition-[box-shadow,transform] duration-300 cursor-pointer',
        className
      )}
      style={{
        boxShadow: shadow,
        WebkitBackdropFilter: 'blur(20px)',
        ...style,
      }}
      whileHover={
        hover
          ? { boxShadow: tokens.shadowHover, y: -2 }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  )
}
