'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { LogIn, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { isGoogleAuthConfiguredPublic } from '@/lib/auth-public'
import { useSimulatorServerGoogleOAuthConfigured } from '@/contexts/simulator-server-auth-context'

export function SimulatorAuthMenu() {
  const { data: session, status } = useSession()
  const { t } = useTranslation()
  const googleOnServer = useSimulatorServerGoogleOAuthConfigured()
  const showGoogleAuth = googleOnServer || isGoogleAuthConfiguredPublic()

  if (!showGoogleAuth) {
    return null
  }

  if (status === 'loading') {
    return (
      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 md:h-9 md:w-9" disabled aria-busy>
        <span className="sr-only">{t('auth.sessionLoading')}</span>
        <UserRound className="h-5 w-5 shrink-0 opacity-50" aria-hidden />
      </Button>
    )
  }

  if (!session) {
    return (
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void signIn('google')}>
        <LogIn className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{t('auth.signInGoogle')}</span>
        <span className="sm:hidden">Google</span>
      </Button>
    )
  }

  const displayName = session.user?.name?.trim() || session.user?.email || '—'
  const email = session.user?.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0 md:h-9 md:w-9"
          title={t('navigation.accountMenu')}
          aria-label={t('navigation.accountMenu')}
        >
          <UserRound className="h-5 w-5 shrink-0" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem] max-w-[min(100vw-2rem,18rem)]">
        <DropdownMenuLabel className="space-y-1 font-normal">
          <span className="block truncate text-sm font-medium leading-tight">{displayName}</span>
          {email && session.user?.name ? (
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="gap-2" onClick={() => void signOut()}>
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
