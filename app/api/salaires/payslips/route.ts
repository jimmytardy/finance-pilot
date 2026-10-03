import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { payslipBodySchema } from '@/lib/salary-schemas'
import { serializePayslip } from '@/lib/salary-json'
import { payslipLinesData, payslipScalarData } from '@/lib/payslip-db'
import { reconcilePayslipEmployersForUser } from '@/lib/salary-employer-period'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const yearParam = request.nextUrl.searchParams.get('year')
  const kind = request.nextUrl.searchParams.get('kind')
  const year = yearParam ? Number(yearParam) : null

  const rows = await prisma.payslip.findMany({
    where: {
      userId,
      ...(year != null && Number.isInteger(year) ? { year } : {}),
      ...(kind === 'BULLETIN' || kind === 'EPARGNE_SALARIALE' ? { kind } : {}),
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { kind: 'asc' }],
    include: { lines: true },
  })

  return Response.json(rows.map(serializePayslip))
}

/** Crée un document et ses lignes. `?overwrite=1` remplace le bulletin existant du même mois. */
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = payslipBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }
  const d = parsed.data
  const overwrite = request.nextUrl.searchParams.get('overwrite') === '1'

  // Un seul bulletin par mois ; plusieurs fiches d'épargne salariale possibles.
  const clash =
    d.kind === 'BULLETIN'
      ? await prisma.payslip.findFirst({
          where: { userId, kind: 'BULLETIN', year: d.year, month: d.month },
          select: { id: true },
        })
      : null
  if (clash && !overwrite) {
    return Response.json({ error: 'duplicate_year_month', existingId: clash.id }, { status: 409 })
  }

  let data: ReturnType<typeof payslipScalarData>
  try {
    data = payslipScalarData(d)
  } catch {
    return Response.json({ error: 'invalid_decimal' }, { status: 400 })
  }

  let createdId: string
  try {
    createdId = await prisma.$transaction(async (tx) => {
      if (clash) await tx.payslip.delete({ where: { id: clash.id } })
      const created = await tx.payslip.create({ data: { ...data, userId }, select: { id: true } })
      await tx.payslipLine.createMany({ data: payslipLinesData(created.id, d.lines) })
      return created.id
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'invalid_decimal') {
      return Response.json({ error: 'invalid_decimal' }, { status: 400 })
    }
    throw err
  }

  await reconcilePayslipEmployersForUser(userId)

  const row = await prisma.payslip.findFirstOrThrow({
    where: { id: createdId },
    include: { lines: true },
  })
  return Response.json(serializePayslip(row))
}
