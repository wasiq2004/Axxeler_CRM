---
name: crm-audit-findings
description: Deep-audit results for the Axxeler CRM — architecture, standalone readiness, and the register of flaws/mocks/incomplete features
metadata:
  type: project
---

Axxeler CRM (Phase 1): React 19 + Vite (HashRouter, ~17 nested Context providers, no react-query) frontend in `src/`; Express 5 + Prisma (Postgres) + BullMQ/Redis backend in `server/src/`. Bearer JWT in localStorage (no cookies). Runs standalone via `docker-compose.local.yml` (auto migrate+seed) with only Postgres required; Redis optional (`ENABLE_WORKERS=false` default, lazyConnect). All SaaS integrations (Meta/WhatsApp, Google Sheets, Razorpay, Resend) are optional/runtime-configured.

**Verified 2026-07-04:** frontend `vite build` passes; server has ~40 tsc errors but runs under `tsx` (Dockerfile.backend uses `tsc || true`). Zero automated tests.

**Non-obvious structural facts:**
- `permissions` JSON on User is decorative — NO backend route ever reads it; only role (admin/manager/team_member) is checked, and only on `users`/`settings`/one google route. All crudFactory entities are open to any authenticated user.
- Two parallel campaign systems: `CampaignsContext` vs `CampaignModuleContext` with inconsistent fields. Whole Campaigns/Templates UI module is built but routes are COMMENTED OUT in `App.tsx`.
- Reports are hardwired to year 2025 (today is 2026) → all report charts render empty. Reports compute client-side; the 5 `/reports/*` endpoints all return identical data.
- Razorpay backend is complete but UI "Pay Now" is a setTimeout simulation. WhatsApp send can't work: `phoneNumberId`/`wabaId` are never persisted from the connect form. AccountsPage OAuth/verify are setTimeout mocks. Campaign scheduling has no scheduler. Non-manual campaign audiences send to nobody.
- Lead timeline never loads (loadLeadTimeline defined but never called). Contact email is unsettable in UI so ComposeEmail is dead. Lead attachments modeled but no route/UI.

**Committed secrets** (must rotate): real JWT secrets + live Resend key in `.env` and `docker-compose.yml`.

**FIXES APPLIED (2026-07-04 cleanup pass — payment excluded, security included):**
- All TS errors → 0 on both tsconfigs; `vite build` + `build:server` clean. (req.params cast to string; queues.ts uses `new Redis()` typed any; zod v4 `z.record(k,v)`; removed dead `src/hooks/useCrmApi.ts`.)
- RBAC now enforced: `server/src/utils/permissions.ts` `can()` + `requirePermission()` middleware; leads gated view/edit/delete, deals view/edit, users manageTeam, invoices/campaigns/templates admin+manager. Manager can no longer create/promote admins; last-admin delete/demote blocked; GET /users/:id gated.
- Auth: logout revokes server session; change-password + reset revoke refresh tokens; prod boot guard rejects default JWT secrets; refresh 500→401; real JWT-based forgot/reset flow + ForgotPasswordPage/ResetPasswordPage + ProtectedRoute hydration race fixed.
- Secrets: `.env` untracked (git rm --cached, local kept); docker-compose secrets → `${VAR}` interpolation. USER MUST rotate exposed secrets (still in git history) and set POSTGRES_PASSWORD/DATABASE_URL/JWT_*/RESEND_API_KEY in Dokploy env.
- Core: lead timeline loads; pipeline includes Qualified/Lost; deal accountName required + empty accountId/ownerId → undefined; contact email field added (customFields.email); reports dynamic year + selector, fake trends removed, dashboard revenue = paid invoices (matches reports).
- Invoices: payment UI removed (Razorpay backend kept dormant), draft no longer emailed, currency symbol instead of $, invoice number assigned server-side (collision-safe).

**Custom HTML invoices (added 2026-07-04):** New `InvoiceTemplate` model + `Invoice.templateId/customHtml` (migration `20260704120000_add_invoice_templates`). Backend `invoice-templates.routes.ts` CRUD (admin+manager). Frontend: reusable templates at `/invoices/templates` (InvoiceTemplatesPage) + per-invoice `InvoiceDesignerModal` on InvoiceDetailPage ("Custom Design" button). Merge fields ({{clientName}}, {{itemsTable}}, {{total}}, etc.) rendered by `src/features/invoices/utils/invoiceTemplate.ts`; client-side PDF via html2canvas+jsPDF in `htmlToPdf.ts`. Requires `npm run db:migrate` (or docker migrate deploy) to apply the new migration.

**Second fix pass (2026-07-04, from 4-agent review) — all rectified:**
- Security: blocked SVG uploads + nosniff (S1); DOMPurify sanitize on all invoice-template HTML injection points + PDF (S2); public signup gated by `ALLOW_PUBLIC_SIGNUP` env, OFF in production by default (S3); role gates added — Google routes admin-only, Meta routes admin+manager, notifications admin+manager (S4/S5/S8); destructive contacts/accounts/tasks delete + contacts bulk-delete restricted to admin+manager via new crudFactory `guards.remove` (S6); signed+expiring OAuth `state` verified in Meta+Google callbacks via tokenService.signOAuthState/verifyOAuthState (S7); rate limiters on login (10/min) + forgot/reset (5/15min) (S9).
- Build/data: Dockerfile.backend dropped `|| true` + server tsconfig noEmitOnError:true (D1); added @@index on all FK/filter cols + Invoice.templateId FK relation (onDelete SetNull), migration `20260704130000_add_indexes_and_template_fk` (D2/D3); seed user upsert update→{} so it won't revert admin edits (D5).
- Frontend/logic: crudFactory `all=true` bypass + Deals/Contacts/Tasks contexts request it (fixes silent 50-row cap L1); new `src/hooks/useCan.ts` mirrors backend permissions — Leads UI (LeadsPage/LeadsTable/LeadsPipelineView/LeadDetailPage) hides create/edit/delete/drag for users lacking editLeads/deleteLeads, and create/edit/delete handlers now try/catch+alert (F1/F2); main invoice "Download PDF" renders saved customHtml/template client-side (L2); invoice template can reset to Standard — schema keeps explicit null (L3); contacts pagination wired (F3); invoice-templates API tightened to admin (L6); task dates formatted (F6); deleted orphaned LeadsToolbar.tsx (F7). Invoice create wizard now has a template selector + live preview (Task 2).

**Invoice types + fields + UI fixes (2026-07-04):**
- Invoice types General/Tax: `Invoice.invoiceType` (default Tax) + `Invoice.paymentTerms`; `CompanySetting.bankDetails`; migration `20260704140000_invoice_type_bank_details`. General = no tax, enforced server-side via `enforceTaxRule` in invoices.routes. Create wizard (ClientDetailsStep) has a General/Tax card selector + Payment Ref/Terms field; InvoiceItemsStep hides tax when General; EditInvoicePage has a type toggle + terms + conditional tax; InvoiceDetailPage shows type label, payment terms, bank details, hides tax when 0; PDFKit renders "TAX INVOICE"/"INVOICE" + payment terms + bank details.
- Bank details are company-level (Settings → Company tab, new textarea) — shown on every invoice + as `{{bankDetails}}` merge field.
- Template system extended: new merge fields {{invoiceType}}, {{invoiceTypeLabel}}, {{taxRow}} (empty for General), {{paymentTerms}}, {{paymentTermsBlock}}, {{bankDetails}}, {{bankDetailsBlock}}; DEFAULT_INVOICE_TEMPLATE is now type-aware. Invoice create wizard Review step has a template selector + live preview.
- UI fixes: (1) profile picture now updates immediately — AuthContext exposes `refreshUser()`, called in SettingsPage.handleSaveProfile (Header reads AuthContext.user, which was previously never refreshed after save). (2) `.stagger-container` reveal animation was referenced (Login/Signup forms) but undefined — now defined in index.css with nth-child stagger + reduced-motion guard. SettingsPage company form now syncs from companyInfo via useEffect.

**Still open (need external setup or larger effort):**
- Full per-record ownership scoping for contacts/tasks/search (needs ownerId on Contact + query scoping) — currently shared-workspace reads, destructive ops gated.
- Integration tokens (Meta/Google/WhatsApp) still plaintext at rest (S10); sheet-webhook token in query string (S11). Campaigns/WhatsApp module left disabled (needs Meta WABA creds + phoneNumberId form + embedded signup); Meta webhook signature optional + OAuth state unverified (only matters once Meta configured); WhatsApp/Meta/Google tokens stored plaintext (no at-rest encryption); Leads UI still shows create/edit buttons to team_members who now get 403 (per-permission button hiding is a follow-up). User will direct further changes.
