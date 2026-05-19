'use client'

import { AuthProvider } from '@/lib/auth/context'
import { ToastProvider } from '@/components/ui/Toast'
import { BgmProvider } from '@/components/ui/BgmProvider'
import { FontSizeProvider } from '@/components/ui/FontSizeProvider'
import { DisplayModeProvider, useDisplayMode } from '@/components/ui/DisplayModeProvider'
import { SettingsPanel } from '@/components/ui/SettingsPanel'

/**
 * Wraps page content in a width-constrained container based on
 * the active display mode. In "mobile" mode the entire page
 * (including backgrounds) is squeezed to 390px and centered,
 * simulating a phone viewport on desktop. "wide" mode expands
 * the viewport to fill more horizontal space.
 */
function DisplayModeContainer({ children }: { children: React.ReactNode }) {
  const { displayMode } = useDisplayMode()

  if (displayMode === 'mobile') {
    return (
      <div
        className="mx-auto overflow-hidden relative"
        style={{
          maxWidth: '390px',
          minHeight: '100dvh',
          boxShadow: '0 0 60px -10px rgba(0,229,255,0.15), 40px 0 80px -20px rgba(0,0,0,0.8), -40px 0 80px -20px rgba(0,0,0,0.8)',
          transition: 'max-width 0.3s ease',
        }}
      >
        {children}
      </div>
    )
  }

  // Normal and wide modes — no wrapper constraint for normal,
  // wide mode is handled via CSS overrides in globals.css
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <BgmProvider>
          <FontSizeProvider>
            <DisplayModeProvider>
              <DisplayModeContainer>
                {children}
              </DisplayModeContainer>
              <SettingsPanel />
            </DisplayModeProvider>
          </FontSizeProvider>
        </BgmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
