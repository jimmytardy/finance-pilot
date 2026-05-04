'use client'

import { Suspense, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { FinancePilotLogo } from '@/components/finance-pilot-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isGoogleAuthConfiguredPublic } from '@/lib/auth-public'
import { useSimulatorServerGoogleOAuthConfigured } from '@/contexts/simulator-server-auth-context'

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/donnees'
  return raw
}

function ConnexionContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const googleOnServer = useSimulatorServerGoogleOAuthConfigured()
  const oauthReady = googleOnServer || isGoogleAuthConfiguredPublic()

  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'))

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl)
    }
  }, [status, router, callbackUrl])

  if (status === 'loading') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="mt-8 h-40 w-full" />
      </div>
    )
  }

  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <FinancePilotLogo />
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          {t('auth.signInRequired')}
        </p>
      </div>

      <Card className="w-full max-w-md border-border/80 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-xl sm:text-2xl">{t('auth.signInPageTitle')}</CardTitle>
          <CardDescription className="text-pretty">{t('auth.signInPageLead')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            type="button"
            size="lg"
            className="w-full gap-2"
            disabled={!oauthReady}
            onClick={() => {
              if (oauthReady) void signIn('google', { callbackUrl })
            }}
          >
            {t('auth.signInGoogle')}
          </Button>
          {!oauthReady ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-sm text-muted-foreground">
              {t('auth.signInUnavailable')}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="mt-8 h-40 w-full" />
        </div>
      }
    >
      <ConnexionContent />
    </Suspense>
  )
}
