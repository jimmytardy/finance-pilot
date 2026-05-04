/**
 * Backend NextAuth (v4) : Prisma (comptes) + sessions JWT + Google OAuth.
 * Accès aux pages : middleware (`middleware.ts`) ; token JWT vérifié en Edge.
 * Données simulateur : GET/PUT `/api/simulator/state`, réservé aux utilisateurs connectés.
 * Variables : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
 * Optionnel client : `NEXT_PUBLIC_GOOGLE_CLIENT_ID` pour afficher le bouton Google.
 */
import type { NextAuthOptions } from 'next-auth'
import { decode as jwtDecodeRaw } from 'next-auth/jwt'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

/** Placeholders si les variables manquent : OAuth échouera tant que les vraies clés ne sont pas définies. */
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || 'unset-google-client-id'
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || 'unset-google-client-secret'

/**
 * Obligatoire pour chiffrer/déchiffrer le cookie JWT (JWE).
 * Si tu changes NEXTAUTH_SECRET ou que le build n’avait pas la même valeur qu’au runtime,
 * les cookies existants deviennent invalides → erreur `Invalid Compact JWE` : supprime les cookies du site
 * (ex. `next-auth.session-token`) puis reconnecte-toi.
 */
const authSecret = process.env.NEXTAUTH_SECRET?.trim()

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  /** JWT : compatible middleware Edge + contrôle d’accès global (sessions DB seules ne fournissent pas de token Edge). */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  /**
   * Cookie JWT invalide (secret changé, migration, corruption) → évite l’erreur `Invalid Compact JWE`
   * sur `/api/auth/session` : on renvoie « pas de session » au lieu de faire planter la route.
   */
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
    async decode(params) {
      try {
        return await jwtDecodeRaw(params)
      } catch {
        return null
      }
    },
  },
  pages: {
    signIn: '/connexion',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },
}
