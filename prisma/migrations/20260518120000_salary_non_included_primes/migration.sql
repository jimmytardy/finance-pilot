-- Table déjà créée par 20260518120000_add_salary_non_included_prime
-- Reprise des montants scalaires existants (idempotent)
INSERT INTO "SalaryNonIncludedPrime" ("id", "salaryMonthId", "category", "description", "amount", "createdAt", "updatedAt")
SELECT "id" || '_legacy_ni', "id", 'Montant existant', '', "primesIndemnitesNonIncluses", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "SalaryMonth"
WHERE "primesIndemnitesNonIncluses" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "SalaryNonIncludedPrime" AS nip
    WHERE nip."salaryMonthId" = "SalaryMonth"."id"
  );
