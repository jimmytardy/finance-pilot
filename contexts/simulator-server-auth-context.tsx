'use client'

import { createContext, useContext, type ReactNode } from 'react'

const SimulatorServerAuthContext = createContext(false)

export function SimulatorServerAuthProvider({
  children,
  googleOAuthConfigured,
}: {
  children: ReactNode
  googleOAuthConfigured: boolean
}) {
  return (
    <SimulatorServerAuthContext.Provider value={googleOAuthConfigured}>
      {children}
    </SimulatorServerAuthContext.Provider>
  )
}

export function useSimulatorServerGoogleOAuthConfigured(): boolean {
  return useContext(SimulatorServerAuthContext)
}
