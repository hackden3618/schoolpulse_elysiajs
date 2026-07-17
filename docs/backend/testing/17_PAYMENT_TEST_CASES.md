# 17 — Payment Test Cases

## Table of Contents

| ID | Title |
|---|---|
| PAY-001 | Cash Payment |
| PAY-002 | M-Pesa Payment |
| PAY-003 | Bank Payment |
| PAY-004 | Partial Payment |
| PAY-005 | Overpayment |
| PAY-006 | Reversal |
| PAY-007 | Duplicate Callback |
| PAY-008 | Receipt |
| PAY-009 | Statement |
| PAY-010 | Audit |

---

## PAY-001 Cash Payment

**Objective:** Verify a cash payment can be recorded

**Preconditions:**
- Authenticated bursar
- Invoice exists with ID `:invoiceId` with balance 50000

**Request:**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_001",
  "amount": 50000,
  "method": "cash",
  "reference": "CASH-20260715-001",
  "notes": "Paid in person at accounts office"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "pay_001",
  "invoiceId": "inv_001",
  "amount": 50000,
  "method": "cash",
  "status": "completed",
  "receivedAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `payment` table: new row inserted
- `invoice` table: `paidAmount` increased, `balance` decreased accordingly
- If balance is 0, invoice `status` set to `paid`

**Expected Audit Log:**
- Event type: `PaymentRecorded`
- Actor: Authenticated bursar user ID
- Changes recorded: Amount 50000, method cash, invoice inv_001

**Expected WebSocket Event:**
- `payment.received`

**Expected SMS/Email Notification:**
- Recipient: Student's guardian
- Template: `payment_received`

**Cleanup:**
- Reverse payment and restore invoice

---

## PAY-002 M-Pesa Payment

**Objective:** Verify M-Pesa STK Push payment can be initiated

**Preconditions:**
- Authenticated parent/bursar
- Invoice exists with ID `:invoiceId`
- Student's guardian has phone `+254712345679` registered for M-Pesa

**Request:**
`POST /api/v1/schools/:schoolId/payments/mpesa`
```json
{
  "invoiceId": "inv_001",
  "amount": 50000,
  "phone": "+254712345679"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "pay_002",
  "status": "pending",
  "method": "mpesa",
  "mpesaReference": "WSK-ABC123",
  "message": "STK Push sent to +254712345679. Customer needs to enter PIN on their phone."
}
```

**Expected Database Changes:**
- `payment` table: new row with status `pending`
- `mpesa_transaction` table: new row with STK Push details

**Expected Audit Log:**
- Event type: `PaymentInitiated`
- Actor: Authenticated user ID
- Changes recorded: M-Pesa payment initiated

**Expected WebSocket Event:**
- `payment.initiated`

**Expected SMS/Email Notification:**
- Recipient: +254712345679
- Template: `mpesa_stk_push` (M-Pesa sends this, not the system)

**Cleanup:**
- Reverse M-Pesa transaction if test environment

---

## PAY-003 Bank Payment

**Objective:** Verify a bank transfer payment can be recorded

**Preconditions:**
- Authenticated bursar
- Invoice exists with ID `:invoiceId`

**Request:**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_001",
  "amount": 50000,
  "method": "bank_transfer",
  "reference": "BANK-TRF-789012",
  "bankName": "Equity Bank",
  "transactionDate": "2026-07-14"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "pay_003",
  "method": "bank_transfer",
  "amount": 50000,
  "status": "completed",
  "bankReference": "BANK-TRF-789012"
}
```

**Expected Database Changes:**
- `payment` table: new row
- `invoice` table: balance updated

**Expected Audit Log:**
- Event type: `PaymentRecorded`
- Actor: Authenticated bursar user ID

**Cleanup:**
- Reverse payment

---

## PAY-004 Partial Payment

**Objective:** Verify partial payment correctly shows remaining invoice balance

**Preconditions:**
- Invoice exists with total 50000, paid 0, balance 50000

**Request:**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_001",
  "amount": 30000,
  "method": "cash",
  "reference": "PARTIAL-001"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "pay_004",
  "amount": 30000,
  "invoiceBalance": 20000
}
```

**Expected Database Changes:**
- `payment` table: new row
- `invoice` table: `paidAmount` = 30000, `balance` = 20000, `status` stays `partial`

**Expected Audit Log:**
- Event type: `PaymentRecorded`
- Changes recorded: Partial payment 30000 of 50000

**Cleanup:**
- Reverse payment

---

## PAY-005 Overpayment

**Objective:** Verify overpayment records excess as credit

**Preconditions:**
- Invoice exists with balance 50000

**Request:**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_001",
  "amount": 60000,
  "method": "cash",
  "reference": "OVERPAY-001"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "pay_005",
  "amount": 60000,
  "invoiceBalance": 0,
  "creditBalance": 10000,
  "message": "Payment exceeds invoice by 10000. Credit applied to student account."
}
```

**Expected Database Changes:**
- `payment` table: new row for 60000
- `invoice` table: `paidAmount` = 50000, `balance` = 0, `status` = `paid`
- `student_credit` table: new row with credit of 10000

**Expected Audit Log:**
- Event type: `PaymentRecorded`
- Changes recorded: Overpayment of 10000 credited

**Cleanup:**
- Reverse payment and remove credit

---

## PAY-006 Reversal

**Objective:** Verify a payment can be reversed, restoring invoice balance

**Preconditions:**
- Authenticated bursar/admin
- Payment exists with ID `:id`
- Payment was for invoice `inv_001`, amount 50000

**Request:**
`POST /api/v1/schools/:schoolId/payments/:id/reverse`
```json
{
  "reason": "Incorrect amount entered",
  "approvedBy": "usr_001"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "paymentId": "pay_001",
  "status": "reversed",
  "invoiceBalance": 50000,
  "reversedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `payment` table: `status` set to `reversed`, `reversedAt` set
- `invoice` table: balance restored to original amount

**Expected Audit Log:**
- Event type: `PaymentReversed`
- Actor: Authenticated user ID
- Changes recorded: Payment reversed, reason, invoice restored

**Expected WebSocket Event:**
- `payment.reversed`

**Cleanup:**
- Re-apply payment if needed

---

## PAY-007 Duplicate Callback

**Objective:** Verify duplicate M-Pesa callback is ignored (idempotency)

**Preconditions:**
- M-Pesa payment exists with transaction ID `MPESA-ABC123` and status `completed`

**Request (sent twice):**
`POST /api/v1/schools/:schoolId/payments/mpesa/callback`
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "MR-001",
      "CheckoutRequestID": "WSK-ABC123",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "MpesaReceiptNumber", "Value": "MPESA-ABC123" },
          { "Name": "TransactionDate", "Value": "20260715100000" },
          { "Name": "PhoneNumber", "Value": 254712345679 }
        ]
      }
    }
  }
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body (second call):**
```json
{
  "status": "duplicate",
  "message": "Payment with this M-Pesa reference has already been processed"
}
```

**Expected Database Changes:**
- None (second callback is idempotent)

**Expected Audit Log:**
- Event type: `DuplicatePaymentCallback`
- Actor: System
- Changes recorded: Duplicate callback ignored

**Cleanup:**
- None required

---

## PAY-008 Receipt

**Objective:** Verify a payment receipt PDF can be generated

**Preconditions:**
- Payment exists with ID `:id` and status `completed`

**Request:**
`GET /api/v1/schools/:schoolId/payments/:id/receipt`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
PDF binary content with:
- School name, logo
- Receipt number
- Student name
- Payment date, amount, method
- Invoice reference
- Bursar signature line

**Expected Database Changes:**
- None

**Expected Audit Log:**
- Event type: `ReceiptGenerated`
- Actor: Authenticated user ID

**Cleanup:**
- None required

---

## PAY-009 Statement

**Objective:** Verify a student's full payment history can be retrieved

**Preconditions:**
- Authenticated bursar/parent
- Student has multiple payments recorded

**Request:**
`GET /api/v1/schools/:schoolId/students/:studentId/payment-statement`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "studentId": "stu_001",
  "studentName": "Alice Wanjiku",
  "payments": [
    {
      "id": "pay_001",
      "date": "2026-01-20",
      "method": "cash",
      "amount": 50000,
      "reference": "CASH-001",
      "invoice": "Tuition Fee - Term 1"
    },
    {
      "id": "pay_002",
      "date": "2026-02-15",
      "method": "mpesa",
      "amount": 25000,
      "reference": "MPESA-ABC123",
      "invoice": "Activity Fee"
    }
  ],
  "totalPaid": 75000
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## PAY-010 Audit

**Objective:** Verify payment is recorded with actor, amount, and method

**Preconditions:**
- Payment exists with ID `:id`

**Request:**
`GET /api/v1/schools/:schoolId/payments/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "PaymentRecorded",
      "actor": "usr_002",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": {
        "amount": 50000,
        "method": "cash",
        "invoiceId": "inv_001",
        "status": "completed"
      }
    }
  ],
  "meta": { "total": 1 }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required
