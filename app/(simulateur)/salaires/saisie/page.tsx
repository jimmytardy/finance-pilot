import { SalarySaisieClient } from '@/components/salaires/salary-saisie-client'
import { isPayslipExtractionConfigured } from '@/lib/payslip-ai-config'

export default function SalairesSaisiePage() {
  return <SalarySaisieClient payslipExtractionEnabled={isPayslipExtractionConfigured()} />
}
