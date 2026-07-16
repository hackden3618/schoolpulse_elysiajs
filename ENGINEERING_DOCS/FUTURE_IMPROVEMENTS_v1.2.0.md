# SchoolPulse — Future Improvements (v1.2.0)

Version: 1.2.0 (proposed)  
Status: Candidate backlog — not part of the v1.1.0 feature freeze  
Last updated: 2026-07-16

---

## Purpose

This document captures product and engineering improvements discovered during
v1.1.0 development that are **out of scope for the v1.1.0 freeze** and must not
be implemented until v1.2.0 is officially opened (per AGENTS.md §2 and §18).

Every item below references the current v1.1.0 implementation so the v1.2.0
team can pick it up without rediscovery.

---

## FI-01 — Dedicated Guardian Payments Page (M-Pesa Self-Service)

### Why

In v1.1.0, guardians reach fee balances only by drilling into the shared
`StudentDetail` page (`frontend/src/pages/students/StudentDetail.tsx`), which is
a staff+guardian hybrid view. The Guardian dashboard "Fee Balance" tile links
into a student profile rather than a purpose-built payment surface. This is
confusing and mixes staff-only affordances with parent-facing ones.

The M-Pesa STK Push backend already works for guardians (`POST
/api/v1/schools/:schoolId/finance/mpesa/stk-push`, guarded by
`payment:record`). Bursars and all admin-type roles already hold
`payment:record`, so the school-counter M-Pesa flow is functional.

### Proposed change

Provide a dedicated, guardian-only **Fee Payments** experience:

- New route `/payments` (Guardian role only).
- Lists the guardian's linked children (`studentsApi.my`).
- Per child: total outstanding balance + per-invoice table with status badges.
- **Pay** (single invoice) and **Pay All** (bulk) buttons reuse the existing
  `MpesaPaymentModal` / `BulkMpesaPaymentModal` components.
- Auto-fill the registered guardian phone (prefer `isPrimary && canPay`, then any
  `canPay` guardian).
- Reference the prototype parent portal
  (`SchoolPulse_Prototype_.../apps/api/src/modules/parent/parent.routes.ts` —
  `can_pay` gating, balance display, and the stubbed STK flow at
  `fees.routes.ts` `POST /fees/payment/stk-push`).

### Files touched (v1.2.0)

- `frontend/src/pages/guardian/GuardianPaymentsPage.tsx` (new)
- `frontend/src/App.tsx` (route `/payments`)
- `frontend/src/lib/constants.ts` (add `/payments` to `NAV_BY_ROLE.Guardian`)
- `frontend/src/pages/dashboards/GuardianDashboard.tsx` (point Fee Balance tile
  to `/payments`)

### Backend changes required (delivered in v1.1.0 patch, not a new feature)

The shared `GET /finance/invoices` is guarded by `finance:report`, which
guardians do not hold. A guardian-scoped endpoint was added so the parent view
does not need staff reporting permission:

- `common/permissions/index.ts`: added `finance:guardian_view` permission,
  granted to `Guardian` and `Parent` roles.
- `modules/finance/repository.ts`: `findGuardianStudentLink` verifies the
  `StudentGuardian` link (`guardianId = authUser.userId`, school-scoped,
  not deleted).
- `modules/finance/policy.ts`: `canViewGuardianInvoices` throws 403 if the
  caller is not linked to the student (server-side parent-child enforcement,
  mirroring the prototype's `assertParentChildLink`).
- `modules/finance/service.ts`: `listGuardianInvoices(schoolId, studentId,
  userId)`.
- `modules/finance/controller.ts` + `route.ts`: `GET
  /finance/invoices/guardian/:studentId` guarded by `finance:guardian_view`.
- `frontend/src/lib/api.ts`: `financeApi.invoices.guardianList`.

### Definition of Done (v1.2.0)

✓ Guardian can view all linked children balances  
✓ Guardian can initiate single + bulk M-Pesa STK from a dedicated page  
✓ Navigation reflects Guardian role only (hidden from staff)  
✓ Server-side `can_pay` / school-isolation still enforced by backend  
✓ No staff-only affordances leak into the guardian view  

---

## FI-02 — Guardian `can_pay` Enforcement (server-side, follow prototype)

### Why

The prototype enforces `guardian.can_pay === true` both on the balance display
and on STK initiation (`parent.routes.ts:189`, `fees.routes.ts:148`). v1.1.0
relies on the frontend hiding buttons; the backend M-Pesa routes do not yet
re-check `can_pay` per guardian.

### Proposed change

When a guardian initiates M-Pesa, the finance service should verify the calling
membership is a linked guardian of the student with `can_pay = true` before
dispatching STK. (v1.1.0 already scopes by `schoolId`; this adds the
relationship check.)

### Definition of Done (v1.2.0)

✓ STK initiation rejected (403) if guardian `can_pay` is false  
✓ Audit log entry on every guardian-initiated payment  

---

## FI-03 — Receipt / Confirmation Polish for Guardian Payments

### Why

v1.1.0 M-Pesa modals show "waiting for Safaricom" but do not surface the
confirmed receipt number back to the guardian after the webhook confirms.

### Proposed change

After `processMpesaCallback`, emit a guardian-visible confirmation (payment
ledger row + optional SMS/receipt) so the parent sees the M-Pesa receipt
reference. Reference prototype `daraja-webhook.worker.ts` receipt-SMS queue.

---

## Out of scope (explicitly deferred)

- C2B paybill-by-admission-number flow (prototype has it; v1.1.0 STK only).
- Parent OTP login / PIN (prototype `auth.routes.ts` parent OTP) — v1.1.0 uses
  the shared membership login.
- Split/family payments across multiple children in one transaction (prototype
  `fees/payment/split`).
