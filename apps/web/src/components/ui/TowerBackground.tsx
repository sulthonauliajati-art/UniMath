'use client'

import Image from 'next/image'
import { Children } from 'react'
import { clsx } from 'clsx'

type TowerVariant = 'practice' | 'teacher' | 'dashboard' | 'landing' | 'flat'

interface TowerBackgroundProps {
  /**
   * Determines which pre-rendered 3D scene is used as the base background layer.
   * - `practice` / `landing` → tower + robot (student perspective)
   * - `teacher` / `dashboard` → isometric building (teacher perspective)
   * - `flat` → no image, just the deep-space gradient (use on auth/modal screens)
   */
  variant?: TowerVariant
  children?: React.ReactNode
  className?: string
  /**
   * Darken the top/bottom bands so content/cards remain readable over the
   * 3D scene. Default: true.
   */
  overlay?: boolean
}

const SCENE_MAP: Record<TowerVariant, string | null> = {
  practice: '/bg-practice.png',
  landing: '/bg-practice.png',
  teacher: '/bg-teacher.png',
  dashboard: '/bg-teacher.png',
  flat: null,
}

/**
 * Background layer rendered as a `fixed inset-0 -z-10` element so it sits
 * behind every other paint without taking up layout flow.
 *
 * This is split out so the component can be used in two ways:
 *  1. As a page wrapper:    <TowerBackground variant="practice">{children}</TowerBackground>
 *  2. As a background-only sibling inside someone else's <main> (legacy call
 *     sites):               <TowerBackground variant="flat" />
 *
 * In mode (2) we skip the wrapping div entirely so we don't inject an empty
 * 100dvh block into the layout flow.
 */
function BackgroundLayer({
  variant,
  overlay,
}: {
  variant: TowerVariant
  overlay: boolean
}) {
  const src = SCENE_MAP[variant] ?? null

  if (!src) {
    // Fallback: solid radial gradient for `flat` / unknown variants.
    return (
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#0A1128_0%,_#040914_70%)] pointer-events-none"
      />
    )
  }

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none select-none"
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {overlay && (
        <>
          {/* Top shade for header legibility */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#040914]/80 via-[#040914]/40 to-transparent" />
          {/* Bottom shade to anchor CTA / floor bars */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#040914]/85 via-[#040914]/35 to-transparent" />
        </>
      )}
    </div>
  )
}

/**
 * Base visual layer for all UniMath routes. Renders the authored 3D sci-fi
 * artwork (robot + tower for students, isometric classroom building for
 * teachers) as the deepest layer, behind any foreground content.
 */
export function TowerBackground({
  variant = 'practice',
  children,
  className,
  overlay = true,
}: TowerBackgroundProps) {
  const hasChildren = Children.count(children) > 0

  // Legacy call-site mode: used only for its background visual, children live
  // elsewhere in the layout. Render nothing in the flow.
  if (!hasChildren) {
    return <BackgroundLayer variant={variant} overlay={overlay} />
  }

  // Wrapper mode: provides a flex column container that owns the page layout.
  return (
    <div
      className={clsx(
        'relative w-full min-h-[100dvh] flex flex-col',
        className
      )}
    >
      <BackgroundLayer variant={variant} overlay={overlay} />
      {children}
    </div>
  )
}
