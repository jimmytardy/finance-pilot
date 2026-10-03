import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { serializePayslip } from '@/lib/salary-json'
import { computeSalaryStats } from '@/lib/salary-stats'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const rows = await prisma.payslip.findMany({
    where: { userId },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
    include: { lines: true },
  })

  return Response.json(computeSalaryStats(rows.map(serializePayslip)))
}
