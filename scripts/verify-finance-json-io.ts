/**
 * Vérification rapide export/import JSON (sans navigateur).
 * Exécuter depuis la racine : pnpm dlx tsx scripts/verify-finance-json-io.ts
 */
import assert from 'node:assert/strict'
import { parseFinanceDataJson, financeDataToFormattedJson } from '../lib/finance-json-io'
import { EXAMPLE_FINANCE_DATA } from '../lib/finance-defaults'

function assertOk<T>(
  r: { ok: true; data: T } | { ok: false; error: string },
): asserts r is { ok: true; data: T } {
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error}`)
}

// Round-trip export → parse
const exported = financeDataToFormattedJson(EXAMPLE_FINANCE_DATA)
const round = parseFinanceDataJson(exported)
assertOk(round)
assert.equal(round.data.revenues.length, EXAMPLE_FINANCE_DATA.revenues.length)
assert.equal(round.data.fixedExpenses.length, EXAMPLE_FINANCE_DATA.fixedExpenses.length)
assert.equal(round.data.annexBudgets.length, EXAMPLE_FINANCE_DATA.annexBudgets.length)
assert.equal(round.data.rentalProperties.length, EXAMPLE_FINANCE_DATA.rentalProperties.length)
assert.equal(round.data.investments.length, EXAMPLE_FINANCE_DATA.investments.length)

// Enveloppe { data: { … } }
const wrapped = JSON.stringify({ data: EXAMPLE_FINANCE_DATA, meta: { v: 1 } })
const fromWrap = parseFinanceDataJson(wrapped)
assertOk(fromWrap)
assert.equal(fromWrap.data.revenues.length, EXAMPLE_FINANCE_DATA.revenues.length)

// Erreurs attendues
const invalid = parseFinanceDataJson('not json')
assert.equal(invalid.ok, false)
if (!invalid.ok) assert.equal(invalid.error, 'invalid_json')
const bad1 = parseFinanceDataJson('[]')
assert.equal(bad1.ok, false)
if (!bad1.ok) assert.equal(bad1.error, 'not_object')

const bad2 = parseFinanceDataJson('{}')
assert.equal(bad2.ok, false)
if (!bad2.ok) assert.equal(bad2.error, 'unexpected_shape')

console.log('verify-finance-json-io: OK')
