import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { bundleFromApiJson, bundleToApiJson } from '@/lib/simulator-payload'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const row = await prisma.simulatorState.findUnique({
    where: { userId },
  })

  if (!row) {
    return Response.json(null)
  }

  return Response.json(row.payload)
}

export async function PUT(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const bundle = bundleFromApiJson(json)
  if (!bundle) {
    return Response.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const payload = bundleToApiJson(bundle)

  await prisma.simulatorState.upsert({
    where: { userId },
    create: {
      userId,
      payload,
    },
    update: { payload },
  })

  return Response.json({ ok: true })
}
