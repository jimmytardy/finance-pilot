import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { bundleFromApiJson, bundleToApiJson } from '@/lib/simulator-payload'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const row = await prisma.simulatorState.findUnique({
    where: { userId: session.user.id },
  })

  if (!row) {
    return Response.json(null)
  }

  return Response.json(row.payload)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
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
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      payload,
    },
    update: { payload },
  })

  return Response.json({ ok: true })
}
