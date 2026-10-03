-- CreateEnum
CREATE TYPE "PayslipKind" AS ENUM ('BULLETIN', 'EPARGNE_SALARIALE');

-- CreateEnum
CREATE TYPE "PayslipBloc" AS ENUM ('REMUNERATION', 'PARTAGE_VALEUR', 'FIN_CONTRAT', 'COTISATION', 'IMPOT', 'AJUSTEMENT_NET');

-- CreateEnum
CREATE TYPE "PayslipFrequence" AS ENUM ('MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE', 'PONCTUELLE');

-- CreateEnum
CREATE TYPE "PayslipRegimeSocial" AS ENUM ('NORMAL', 'REDUIT', 'EXONERE', 'SPECIFIQUE');

-- CreateEnum
CREATE TYPE "PayslipModeEpargne" AS ENUM ('PLACE', 'PERCU', 'INCONNU');

-- DropForeignKey
ALTER TABLE "SalaryMonth" DROP CONSTRAINT "SalaryMonth_userId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryMonth" DROP CONSTRAINT "SalaryMonth_employerId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryNonIncludedPrime" DROP CONSTRAINT "SalaryNonIncludedPrime_salaryMonthId_fkey";

-- DropForeignKey
ALTER TABLE "SalaryBonus" DROP CONSTRAINT "SalaryBonus_salaryMonthId_fkey";

-- DropTable
DROP TABLE "SalaryMonth";

-- DropTable
DROP TABLE "SalaryNonIncludedPrime";

-- DropTable
DROP TABLE "SalaryBonus";

-- DropEnum
DROP TYPE "SalaryBonusBasis";

-- DropEnum
DROP TYPE "SalaryBonusFlow";

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employerId" TEXT,
    "kind" "PayslipKind" NOT NULL DEFAULT 'BULLETIN',
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "label" TEXT,
    "brut" DECIMAL(14,2) NOT NULL,
    "netAvantImpot" DECIMAL(14,2) NOT NULL,
    "netImposable" DECIMAL(14,2) NOT NULL,
    "netSocial" DECIMAL(14,2),
    "netPaye" DECIMAL(14,2) NOT NULL,
    "prelevementSource" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tauxPas" DECIMAL(6,3),
    "totalCotisationsSalariales" DECIMAL(14,2),
    "totalCotisationsPatronales" DECIMAL(14,2),
    "coutEmployeur" DECIMAL(14,2),
    "heuresTravaillees" DECIMAL(8,2),
    "plafondSS" DECIMAL(14,2),
    "cumuls" JSONB,
    "notes" TEXT,
    "extractedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipLine" (
    "id" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "bloc" "PayslipBloc" NOT NULL,
    "categorie" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "base" DECIMAL(14,2),
    "quantite" DECIMAL(10,2),
    "tauxSalarial" DECIMAL(8,4),
    "montantSalarial" DECIMAL(14,2),
    "tauxPatronal" DECIMAL(8,4),
    "montantPatronal" DECIMAL(14,2),
    "montant" DECIMAL(14,2),
    "frequence" "PayslipFrequence",
    "regimeSocial" "PayslipRegimeSocial",
    "imposable" BOOLEAN,
    "exonerationIr" BOOLEAN,
    "verseEnNumeraire" BOOLEAN NOT NULL DEFAULT true,
    "modeEpargne" "PayslipModeEpargne",
    "csgCrds" DECIMAL(14,2),
    "periodeRattachement" TEXT,

    CONSTRAINT "PayslipLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payslip_userId_year_month_idx" ON "Payslip"("userId", "year", "month");

-- CreateIndex
CREATE INDEX "PayslipLine_payslipId_idx" ON "PayslipLine"("payslipId");

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipLine" ADD CONSTRAINT "PayslipLine_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

