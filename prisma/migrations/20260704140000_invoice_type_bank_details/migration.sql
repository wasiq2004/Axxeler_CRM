-- AlterTable: invoice type + payment terms
ALTER TABLE "Invoice" ADD COLUMN "invoiceType" TEXT NOT NULL DEFAULT 'Tax',
ADD COLUMN "paymentTerms" TEXT;

-- AlterTable: company bank details
ALTER TABLE "CompanySetting" ADD COLUMN "bankDetails" TEXT NOT NULL DEFAULT '';
