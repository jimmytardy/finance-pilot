-- CreateTable
CREATE TABLE "SalaryNonIncludedPrime" (
    "id" TEXT NOT NULL,
    "salaryMonthId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryNonIncludedPrime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryNonIncludedPrime_salaryMonthId_idx" ON "SalaryNonIncludedPrime"("salaryMonthId");

-- AddForeignKey
ALTER TABLE "SalaryNonIncludedPrime" ADD CONSTRAINT "SalaryNonIncludedPrime_salaryMonthId_fkey" FOREIGN KEY ("salaryMonthId") REFERENCES "SalaryMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
