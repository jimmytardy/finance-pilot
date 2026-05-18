import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { aggregateByYear, evolutionRows } from '@/lib/salary-aggregates'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const months = await prisma.salaryMonth.findMany({
    where: { userId },
    include: { bonuses: true, nonIncludedPrimes: true },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
  })

  return Response.json({
    byYear: aggregateByYear(months),
    evolution: evolutionRows(months),
  })
}
