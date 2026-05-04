'use client'

import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { Cloud, Settings2 } from 'lucide-react'
import { useSimulatorServerGoogleOAuthConfigured } from '@/contexts/simulator-server-auth-context'

export function SimulatorPersistenceBanner() {
  const { t } = useTranslation()
  const { status } = useSession()
  const oauthUsable = useSimulatorServerGoogleOAuthConfigured()

  if (status === 'loading') {
    return null
  }

  if (!oauthUsable) {
    return (
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-2.5 sm:px-5 md:px-6">
          <Settings2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{t('auth.bannerBackendDisabled')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b border-border bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-5 md:px-6">
        <Cloud className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-xs text-muted-foreground sm:text-sm">{t('auth.bannerSynced')}</p>
      </div>
    </div>
  )
}
