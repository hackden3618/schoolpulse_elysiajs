# 16 — Fee Test Cases

## Table of Contents

| ID | Title |
|---|---|
| FEE-001 | Fee Structure |
| FEE-002 | Update Fee |
| FEE-003 | Waiver |
| FEE-004 | Discount |
| FEE-005 | Arrears |
| FEE-006 | Balance |
| FEE-007 | Statement |
| FEE-008 | Bulk Generation |
| FEE-009 | Validation |
| FEE-010 | Audit |

---

## FEE-001 Fee Structure

**Objective:** Verify a fee structure can be created

**Preconditions:**
- Authenticated school admin
- School exists with ID `:schoolId`
- Class exists with ID `:classId`
- Term exists with ID `:termId`

**Request:**
`POST /api/v1/schools/:schoolId/fee-structures`
```json
{
  "name": "Tuition Fee",
  "amount": 50000,
  "classId": "cls_001",
  "termId": "trm_001",
  "dueDate": "2026-02-15",
  "type": "tuition",
  "isOptional": false
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "fee_001",
  "name": "Tuition Fee",
  "amount": 50000,
  "classId": "cls_001",
  "termId": "trm_001",
  "dueDate": "2026-02-15",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `fee_structure` table: new row inserted

**Expected Audit Log:**
- Event type: `FeeStructureCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `fee-structure.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created fee structure

---

## FEE-002 Update Fee

**Objective:** Verify fee amount can be updated

**Preconditions:**
- Authenticated school admin
- Fee structure exists with ID `:id`

**Request:**
`PATCH /api/v1/schools/:schoolId/fee-structures/:id`
```json
{
  "amount": 55000,
  "dueDate": "2026-02-20"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "fee_001",
  "amount": 55000,
  "dueDate": "2026-02-20",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `fee_structure` table: `amount` updated from 50000 to 55000, `dueDate` updated

**Expected Audit Log:**
- Event type: `FeeStructureUpdated`
- Actor: Authenticated admin user ID
- Changes recorded: `amount: 50000 -> 55000`

**Cleanup:**
- Revert fee amount to 50000

---

## FEE-003 Waiver

**Objective:** Verify a full waiver can be applied to a student's fee

**Preconditions:**
- Authenticated bursar
- Fee structure exists with ID `:id`
- Student exists with ID `:studentId`
- Invoice exists for this student and fee structure

**Request:**
`POST /api/v1/schools/:schoolId/fee-structures/:id/waiver`
```json
{
  "studentId": "stu_001",
  "reason": "Full scholarship - orphan support program",
  "approvedBy": "usr_001"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "studentId": "stu_001",
  "feeStructureId": "fee_001",
  "originalAmount": 50000,
  "waivedAmount": 50000,
  "reason": "Full scholarship - orphan support program",
  "status": "waived"
}
```

**Expected Database Changes:**
- `fee_waiver` table: new waiver row
- `invoice` table: student's invoice balance set to 0

**Expected Audit Log:**
- Event type: `FeeWaiverApplied`
- Actor: Authenticated bursar user ID
- Changes recorded: Full waiver of 50000

**Cleanup:**
- Remove waiver and restore invoice balance

---

## FEE-004 Discount

**Objective:** Verify a percentage discount can be applied

**Preconditions:**
- Authenticated bursar
- Fee structure exists with ID `:id`
- Student exists with ID `:studentId`

**Request:**
`POST /api/v1/schools/:schoolId/fee-structures/:id/discount`
```json
{
  "studentId": "stu_001",
  "percentage": 25,
  "reason": "Sibling discount",
  "approvedBy": "usr_001"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "studentId": "stu_001",
  "feeStructureId": "fee_001",
  "originalAmount": 50000,
  "discountPercentage": 25,
  "discountAmount": 12500,
  "netAmount": 37500
}
```

**Expected Database Changes:**
- `fee_discount` table: new discount row
- `invoice` table: student's invoice balance adjusted

**Expected Audit Log:**
- Event type: `FeeDiscountApplied`
- Actor: Authenticated bursar user ID
- Changes recorded: 25% discount applied

**Cleanup:**
- Remove discount and restore invoice

---

## FEE-005 Arrears

**Objective:** Verify fee defaulters list can be retrieved

**Preconditions:**
- Authenticated bursar
- Some invoices are overdue

**Request:**
`GET /api/v1/schools/:schoolId/fees/arrears?termId=trm_001`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "termId": "trm_001",
  "totalDefaulters": 10,
  "totalOutstanding": 375000,
  "defaulters": [
    {
      "studentId": "stu_010",
      "studentName": "John Doe",
      "className": "Grade 7",
      "outstandingBalance": 50000,
      "daysOverdue": 30
    },
    {
      "studentId": "stu_015",
      "studentName": "Jane Smith",
      "className": "Grade 7",
      "outstandingBalance": 25000,
      "daysOverdue": 15
    }
  ]
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## FEE-006 Balance

**Objective:** Verify a student's fee balance is correct

**Preconditions:**
- Authenticated bursar
- Student has invoices and payments recorded

**Request:**
`GET /api/v1/schools/:schoolId/students/:studentId/fee-balance`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "studentId": "stu_001",
  "totalInvoiced": 150000,
  "totalPaid": 100000,
  "totalWaived": 0,
  "totalDiscounted": 12500,
  "outstandingBalance": 37500,
  "status": "partial"
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## FEE-007 Statement

**Objective:** Verify a full fee statement can be retrieved

**Preconditions:**
- Authenticated bursar
- Student has multiple fee transactions

**Request:**
`GET /api/v1/schools/:schoolId/students/:studentId/fee-statement`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "studentId": "stu_001",
  "studentName": "Alice Wanjiku",
  "statement": [
    {
      "date": "2026-01-15",
      "description": "Tuition Fee - Term 1",
      "debit": 50000,
      "credit": 0,
      "balance": 50000
    },
    {
      "date": "2026-01-20",
      "description": "Payment - Cash",
      "debit": 0,
      "credit": 50000,
      "balance": 0
    },
    {
      "date": "2026-02-01",
      "description": "Activity Fee",
      "debit": 25000,
      "credit": 0,
      "balance": 25000
    }
  ],
  "closingBalance": 25000
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## FEE-008 Bulk Generation

**Objective:** Verify invoices can be generated for an entire class

**Preconditions:**
- Authenticated bursar
- Fee structure exists for class `cls_001`
- Class has 45 enrolled students

**Request:**
`POST /api/v1/schools/:schoolId/fees/generate-invoices`
```json
{
  "feeStructureId": "fee_001",
  "classId": "cls_001",
  "termId": "trm_001",
  "dueDate": "2026-02-15"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "invoicesGenerated": 45,
  "skipped": 0,
  "totalAmount": 2250000
}
```

**Expected Database Changes:**
- `invoice` table: 45 new rows (one per student in class)

**Expected Audit Log:**
- Event type: `InvoicesBulkGenerated`
- Actor: Authenticated bursar user ID
- Changes recorded: 45 invoices generated, total 2,250,000

**Cleanup:**
- Delete generated invoices

---

## FEE-009 Validation

**Objective:** Verify negative amounts are rejected

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:schoolId/fee-structures`
```json
{
  "name": "Negative Fee",
  "amount": -1000,
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Amount must be a positive number",
  "field": "amount"
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required

---

## FEE-010 Audit

**Objective:** Verify fee structure changes are logged

**Preconditions:**
- Fee structure `fee_001` has been created and updated

**Request:**
`GET /api/v1/schools/:schoolId/fee-structures/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "FeeStructureCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "name": "Tuition Fee", "amount": 50000 }
    },
    {
      "event": "FeeStructureUpdated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "amount": { "from": 50000, "to": 55000 } }
    }
  ],
  "meta": { "total": 2 }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required
