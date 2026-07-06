-- Indexes on foreign-key / frequently-filtered columns (Postgres does not
-- auto-index FK columns).
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_campaignId_idx" ON "Lead"("campaignId");
CREATE INDEX "LeadNote_leadId_idx" ON "LeadNote"("leadId");
CREATE INDEX "LeadNote_authorId_idx" ON "LeadNote"("authorId");
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");
CREATE INDEX "LeadAttachment_leadId_idx" ON "LeadAttachment"("leadId");
CREATE INDEX "Deal_accountId_idx" ON "Deal"("accountId");
CREATE INDEX "Deal_ownerId_idx" ON "Deal"("ownerId");
CREATE INDEX "Deal_stage_idx" ON "Deal"("stage");
CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "CampaignRecipient_campaignId_idx" ON "CampaignRecipient"("campaignId");
CREATE INDEX "CampaignRecipient_status_idx" ON "CampaignRecipient"("status");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_templateId_idx" ON "Invoice"("templateId");

-- Referential integrity for the invoice → template link (null out on delete).
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "InvoiceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
