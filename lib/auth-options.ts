/**
 * Backend NextAuth (v4) : Prisma (comptes) + sessions JWT + Google OAuth.
 * Variables : contrat unique dans `lib/env.ts` (`getCanonicalEnv`).
 */
import type { NextAuthOptions } from 'next-auth'
import { decode as jwtDecodeRaw } from 'next-auth/jwt'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { getCanonicalEnv } from '@/lib/env'
import { prisma } from '@/lib/prisma'

const env = getCanonicalEnv()

/**
 * Obligatoire pour chiffrer/déchiffrer le cookie JWT (JWE).
 * Si le secret change, les cookies existants deviennent invalides → supprimer les cookies du site puis reconnecter.
 */
export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
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
