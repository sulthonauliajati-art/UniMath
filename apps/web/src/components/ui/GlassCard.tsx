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
    border: 'border-[rgba(0,229,255,0.35)]',
    shadowSubtle: '0 0 20px rgba(0,229,255,0.35)',
    shadowStrong: '0 0 30px rgba(0,229,255,0.5)',
    shadowHover: '0 0 30px rgba(0,229,255,0.5), 0 0 15px rgba(0,119,255,0.5)',
  },
  emerald: {
    border: 'border-[rgba(16,185,129,0.35)]',
    shadowSubtle: '0 0 20px rgba(16,185,129,0.35)',
    shadowStrong: '0 0 30px rgba(16,185,129,0.5)',
    shadowHover: '0 0 30px rgba(16,185,129,0.5)',
  },
  amber: {
    border: 'border-[rgba(245,158,11,0.35)]',
    shadowSubtle: '0 0 20px rgba(245,158,11,0.35)',
    shadowStrong: '0 0 30px rgba(245,158,11,0.5)',
    shadowHover: '0 0 30px rgba(245,158,11,0.5)',
  },
  red: {
    border: 'border-[rgba(239,68,68,0.35)]',
    shadowSubtle: '0 0 20px rgba(239,68,68,0.35)',
    shadowStrong: '0 0 30px rgba(239,68,68,0.5)',
    shadowHover: '0 0 30px rgba(239,68,68,0.5)',
  },
  purple: {
    border: 'border-[rgba(139,92,246,0.35)]',
    shadowSubtle: '0 0 20px rgba(139,92,246,0.35)',
    shadowStrong: '0 0 30px rgba(139,92,246,0.5)',
    shadowHover: '0 0 30px rgba(139,92,246,0.5)',
  },
}

/**
 * Glassmorphic container — the signature UI surface of The Arcade Lab.
 *
 * DESIGN.md §5 — Glass Card:
 *   background: rgba(10, 17, 40, 0.65)
 *   backdrop-filter: blur(16px)
 *   border: 1px solid rgba(0, 229, 255, 0.35)
 *   border-radius: 24px
 *   box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5)  (structural card shadow)
 *
 * Key design principles:
 *   - translucent navy fill with backdrop-blur for depth
 *   - neon border + glow aura driven by glowColor prop
 *   - structural shadow for separation from background
 *   - hover: intensifies glow (The Neon Depth Rule)
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
        'relative rounded-2xl border backdrop-blur-glass',
        'bg-[rgba(10,17,40,0.65)]',
        tokens.border,
        'shadow-card',
        hover && 'transition-[box-shadow,transform] duration-200 cursor-pointer',
        className
      )}
      style={{
        boxShadow: [shadow, 'var(--shadow-card)'].filter(Boolean).join(', '),
        ...style,
      }}
      whileHover={
        hover
          ? { boxShadow: [tokens.shadowHover, 'var(--shadow-card)'].join(', '), y: -2 }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  )
}
