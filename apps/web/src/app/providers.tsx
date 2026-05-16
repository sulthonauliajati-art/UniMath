'use client'

import { AuthProvider } from '@/lib/auth/context'
import { ToastProvider } from '@/components/ui/Toast'
import { BgmProvider } from '@/components/ui/BgmProvider'
import { FontSizeProvider } from '@/components/ui/FontSizeProvider'
import { DisplayModeProvider } from '@/components/ui/DisplayModeProvider'
import { SettingsPanel } from '@/components/ui/SettingsPanel'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <BgmProvider>
          <FontSizeProvider>
            <DisplayModeProvider>
              {children}
              <SettingsPanel />
            </DisplayModeProvider>
          </FontSizeProvider>
        </BgmProvider>
      </ToastProvider>
    </AuthProvider>
  )
}
