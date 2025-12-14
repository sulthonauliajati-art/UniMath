'use client'

import { motion, HTMLMotionProps } from 'framer-motion'
import { clsx } from 'clsx'

interface NeonButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  loading?: boolean
}

export function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  loading = false,
  className,
  disabled,
  ...props
}: NeonButtonProps) {
  const variants = {
    primary: 'btn-gradient text-white',
    secondary: 'bg-uni-bg-secondary border border-uni-primary/50 text-uni-primary hover:bg-uni-primary/10',
    ghost: 'bg-transparent text-uni-primary hover:bg-uni-primary/10',
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
    xl: 'px-10 py-5 text-xl rounded-2xl',
  }

  const glowEffect = glow && variant === 'primary' 
    ? 'shadow-glow hover:shadow-[0_0_30px_var(--primary-glow)]' 
    : ''

  return (
    <motion.button
      className={clsx(
        'font-semibold transition-all duration-300',
        variants[variant],
        sizes[size],
        glowEffect,
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}
