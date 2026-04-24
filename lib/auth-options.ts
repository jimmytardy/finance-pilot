/**
 * Backend NextAuth (v4) : sessions en base (Prisma) + Google OAuth.
 * Données simulateur : GET/PUT `/api/simulator/state` (JSON Prisma `SimulatorState`), réservé aux utilisateurs connectés.
 * Variables : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
 * Optionnel côté client : `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (même valeur que l’ID client) pour afficher le bouton de connexion.
 */
import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

/** Placeholders si les variables manquent : OAuth échouera tant que les vraies clés ne sont pas définies. */
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || 'unset-google-client-id'
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || 'unset-google-client-secret'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
}
