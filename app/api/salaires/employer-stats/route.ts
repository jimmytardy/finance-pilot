import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { employerStats } from '@/lib/salary-stats'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const employers = await prisma.employer.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  const payslips = await prisma.payslip.findMany({
    where: { userId, kind: 'BULLETIN' },
    select: { employerId: true, kind: true, year: true, netPaye: true },
  })

  return Response.json(
    employerStats(
      employers,
      payslips.map((p) => ({ ...p, netPaye: p.netPaye.toString() })),
    ),
  )
}
