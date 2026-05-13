import { SALARY_CSV_TEMPLATE_EXAMPLE, SALARY_CSV_TEMPLATE_HEADER } from '@/lib/salary-csv-import'

const BOM = '\uFEFF'

export async function GET() {
  const body = [SALARY_CSV_TEMPLATE_HEADER, SALARY_CSV_TEMPLATE_EXAMPLE].join('\n')
  return new Response(BOM + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="modele-salaires.csv"',
    },
  })
}
