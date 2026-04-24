'use client'

import { signIn, useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { Cloud, CloudOff, Settings2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { isGoogleAuthConfiguredPublic } from '@/lib/auth-public'
import { useSimulatorServerGoogleOAuthConfigured } from '@/contexts/simulator-server-auth-context'

export function SimulatorPersistenceBanner() {
  const { t } = useTranslation()
  const { data: session, status } = useSession()
  const googleOnServer = useSimulatorServerGoogleOAuthConfigured()
  const googlePublic = isGoogleAuthConfiguredPublic()
  const oauthUsable = googleOnServer || googlePublic

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

  if (session) {
    return (
      <div className="border-b border-border bg-primary/5">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-5 md:px-6">
          <Cloud className="size-4 shrink-0 text-primary" aria-hidden />
          <p className="text-xs text-muted-foreground sm:text-sm">{t('auth.bannerSynced')}</p>
        </div>
      </div>
    )
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-b border-primary/20 bg-muted/40 py-3 sm:py-3.5">
      <CloudOff className="text-primary" aria-hidden />
      <AlertTitle className="text-sm sm:text-base">{t('auth.bannerGuestTitle')}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="text-pretty">{t('auth.bannerGuestDescription')}</span>
        <Button type="button" size="sm" className="shrink-0 gap-2 self-start sm:self-center" onClick={() => void signIn('google')}>
          {t('auth.signInGoogle')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
