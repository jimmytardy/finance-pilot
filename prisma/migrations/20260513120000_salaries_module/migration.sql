-- CreateEnum
CREATE TYPE "SalaryBonusBasis" AS ENUM ('BRUT', 'NET');

-- CreateEnum
CREATE TYPE "SalaryBonusFlow" AS ENUM ('FIXE', 'VARIABLE');

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentPeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryMonth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employerId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "brut" DECIMAL(14,2) NOT NULL,
    "netImposable" DECIMAL(14,2) NOT NULL,
    "netPaye" DECIMAL(14,2) NOT NULL,
    "prelevementSource" DECIMAL(14,2) NOT NULL,
    "ticketRestaurant" DECIMAL(14,2) NOT NULL,
    "primesIndemnitesIncluses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "primesIndemnitesNonIncluses" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryMonth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryBonus" (
    "id" TEXT NOT NULL,
    "salaryMonthId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" DECIMAL(14,2) NOT NULL,
    "basis" "SalaryBonusBasis" NOT NULL,
    "flow" "SalaryBonusFlow" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryBonus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Employer_userId_idx" ON "Employer"("userId");

-- CreateIndex
CREATE INDEX "EmploymentPeriod_userId_idx" ON "EmploymentPeriod"("userId");

-- CreateIndex
CREATE INDEX "EmploymentPeriod_employerId_idx" ON "EmploymentPeriod"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryMonth_userId_year_month_key" ON "SalaryMonth"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "SalaryMonth_userId_year_idx" ON "SalaryMonth"("userId", "year");

-- CreateIndex
CREATE INDEX "SalaryBonus_salaryMonthId_idx" ON "SalaryBonus"("salaryMonthId");

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentPeriod" ADD CONSTRAINT "EmploymentPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentPeriod" ADD CONSTRAINT "EmploymentPeriod_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryMonth" ADD CONSTRAINT "SalaryMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryMonth" ADD CONSTRAINT "SalaryMonth_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryBonus" ADD CONSTRAINT "SalaryBonus_salaryMonthId_fkey" FOREIGN KEY ("salaryMonthId") REFERENCES "SalaryMonth"("id") ON DELETE CASCADE ON UPDATE CASCADE;
