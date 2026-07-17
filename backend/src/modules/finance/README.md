# Finance Module

## Purpose
Handles school fee structures, invoices, payments, and M-Pesa integrations.

## Responsibilities
- Manage fee structures for academic years and terms.
- Generate invoices for students.
- Record payments and update balances.
- Support M-Pesa payment initiation and callbacks.
- Emit finance events for notifications and downstream processing.

## Dependencies
- `PrismaClient` for finance records.
- `Students Module` for student and enrollment validation.
- `Classes Module` for terms and academic context.
- `Messaging` and `WebSocket` infrastructure for notifications.

## Public API
- `GET /schools/:schoolId/finance/fee-structures`
- `POST /schools/:schoolId/finance/fee-structures`
- `POST /schools/:schoolId/finance/invoices`
- `GET /schools/:schoolId/finance/invoices`
- `GET /schools/:schoolId/finance/invoices/:invoiceId`
- `POST /schools/:schoolId/finance/payments`
- `GET /schools/:schoolId/finance/payments`
- `POST /schools/:schoolId/finance/mpesa/stk-push`
- `POST /schools/:schoolId/finance/mpesa/bulk-stk-push`
