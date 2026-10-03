import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { payslipBodySchema } from '@/lib/salary-schemas'
import { serializePayslip } from '@/lib/salary-json'
import { payslipLinesData, payslipScalarData } from '@/lib/payslip-db'
import { reconcilePayslipEmployersForUser } from '@/lib/salary-employer-period'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await ctx.params

  const row = await prisma.payslip.findFirst({ where: { id, userId }, include: { lines: true } })
  if (!row) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json(serializePayslip(row))
}

/** Remplace les totaux et toutes les lignes du document. */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await ctx.params

  const existing = await prisma.payslip.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

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

  if (d.kind === 'BULLETIN') {
    const clash = await prisma.payslip.findFirst({
      where: { userId, kind: 'BULLETIN', year: d.year, month: d.month, NOT: { id } },
      select: { id: true },
    })
    if (clash) return Response.json({ error: 'duplicate_year_month' }, { status: 409 })
  }

  try {
    const data = payslipScalarData(d)
    const lines = payslipLinesData(id, d.lines)
    await prisma.$transaction([
      prisma.payslip.update({ where: { id }, data }),
      prisma.payslipLine.deleteMany({ where: { payslipId: id } }),
      prisma.payslipLine.createMany({ data: lines }),
    ])
  } catch (err) {
    if (err instanceof Error && err.message === 'invalid_decimal') {
      return Response.json({ error: 'invalid_decimal' }, { status: 400 })
    }
    throw err
  }

  await reconcilePayslipEmployersForUser(userId)

  const row = await prisma.payslip.findFirstOrThrow({ where: { id }, include: { lines: true } })
  return Response.json(serializePayslip(row))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await ctx.params

  const deleted = await prisma.payslip.deleteMany({ where: { id, userId } })
  if (deleted.count === 0) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json({ ok: true })
}
