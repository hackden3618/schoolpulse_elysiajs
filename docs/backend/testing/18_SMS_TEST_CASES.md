# 18 — SMS Test Cases

## Table of Contents

| ID | Title |
|---|---|
| SMS-001 | Queue SMS |
| SMS-002 | Delivery Success |
| SMS-003 | Delivery Failure |
| SMS-004 | Retry |
| SMS-005 | Bulk SMS |
| SMS-006 | Parent Notification |
| SMS-007 | Attendance Alert |
| SMS-008 | Fee Reminder |
| SMS-009 | Exam Alert |
| SMS-010 | Opt-Out |

---

## SMS-001 Queue SMS

**Objective:** Verify an SMS can be queued for delivery

**Preconditions:**
- Authenticated school admin
- Valid recipient phone number

**Request:**
`POST /api/v1/schools/:schoolId/sms`
```json
{
  "recipient": "+254712345679",
  "message": "Dear parent, your child Alice Wanjiku has been registered successfully at Green Valley Primary School.",
  "templateId": "student_registered",
  "priority": "normal"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "sms_001",
  "status": "queued",
  "recipient": "+254712345679",
  "queuedAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `sms_queue` table: new row with status `queued`

**Expected Audit Log:**
- Event type: `SMSQueued`
- Actor: Authenticated user ID

**Cleanup:**
- Remove queued SMS or mark as processed

---

## SMS-002 Delivery Success

**Objective:** Verify SMS delivery status updates to delivered

**Preconditions:**
- SMS exists with ID `:id` and status `sent`
- SMS gateway confirms delivery

**Request (simulated callback):**
`POST /api/v1/schools/:schoolId/sms/:id/callback`
```json
{
  "status": "delivered",
  "providerReference": "PROV-REF-001",
  "deliveredAt": "2026-07-15T10:01:00.000Z"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "sms_001",
  "status": "delivered",
  "deliveredAt": "2026-07-15T10:01:00.000Z"
}
```

**Expected Database Changes:**
- `sms_queue` table: `status` changed from `sent` to `delivered`

**Expected Audit Log:**
- Event type: `SMSDelivered`
- Actor: System

**Cleanup:**
- None required

---

## SMS-003 Delivery Failure

**Objective:** Verify SMS delivery failure is recorded

**Preconditions:**
- SMS exists with ID `:id` and status `sent`
- SMS gateway returns error

**Request (simulated callback):**
`POST /api/v1/schools/:schoolId/sms/:id/callback`
```json
{
  "status": "failed",
  "errorCode": "ERR-1001",
  "errorMessage": "Invalid phone number"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "sms_001",
  "status": "failed",
  "errorMessage": "Invalid phone number"
}
```

**Expected Database Changes:**
- `sms_queue` table: `status` changed to `failed`, error details stored

**Expected Audit Log:**
- Event type: `SMSFailed`
- Actor: System

**Cleanup:**
- None required

---

## SMS-004 Retry

**Objective:** Verify failed SMS is retried with exponential backoff, max 3 retries

**Preconditions:**
- SMS exists with ID `:id` and status `failed`
- Retry count is 0

**Action:**
System retry mechanism triggers after retry interval

**Expected Behavior:**
- First retry after 5 minutes
- Second retry after 25 minutes
- Third retry after 125 minutes
- After 3 retries, status set to `permanently_failed`

**Expected Database Changes:**
- `sms_queue` table: `retryCount` incremented each retry
- `sms_queue` table: `nextRetryAt` updated with exponential backoff
- After 3 failures: `status` set to `permanently_failed`

**Expected Audit Log:**
- Event type: `SMSRetryScheduled`
- Actor: System

**Cleanup:**
- Reset SMS retry state

---

## SMS-005 Bulk SMS

**Objective:** Verify bulk SMS can be queued for 500 recipients

**Preconditions:**
- Authenticated school admin
- 500 valid recipient phone numbers

**Request:**
`POST /api/v1/schools/:schoolId/sms/bulk`
```json
{
  "recipients": ["+254712345679", "+254723456780", "..."],
  "message": "School will be closed on Friday for staff training.",
  "templateId": "general_notice"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "batchId": "bat_001",
  "totalRecipients": 500,
  "queued": 500,
  "failed": 0,
  "estimatedCost": 2500
}
```

**Expected Database Changes:**
- `sms_queue` table: 500 new rows inserted with batch ID

**Expected Audit Log:**
- Event type: `SMSBulkQueued`
- Actor: Authenticated user ID
- Changes recorded: 500 SMS queued

**Cleanup:**
- Remove queued SMS batch

---

## SMS-006 Parent Notification

**Objective:** Verify parent notification SMS is triggered on student registration

**Preconditions:**
- Student is registered with guardian phone +254712345679
- Guardian has SMS notifications enabled

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "New",
  "lastName": "Student",
  "admissionNumber": "ADM-PARENT-NOTIF-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "guardianIds": ["grd_001"]
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `sms_queue` table: new row with guardian phone and template `student_registered`

**Expected SMS/Email Notification:**
- Recipient: +254712345679
- Template: `student_registered`

**Cleanup:**
- Archive student and remove queued SMS

---

## SMS-007 Attendance Alert

**Objective:** Verify SMS is sent when student is marked absent

**Preconditions:**
- Student has guardian with SMS enabled
- Teacher marks student absent

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "absent"
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `sms_queue` table: new row with guardian phone, template `student_absent`
- Message includes student name, date, and school name

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `student_absent`

**Cleanup:**
- Delete attendance record and SMS

---

## SMS-008 Fee Reminder

**Objective:** Verify SMS is sent for overdue fees

**Preconditions:**
- Invoice is overdue by 30+ days
- Student has guardian with SMS enabled

**Action:**
Fee reminder system job runs

**Expected Database Changes:**
- `sms_queue` table: new row with template `fee_reminder`
- Message includes amount overdue, due date, and payment instructions

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `fee_reminder`

**Cleanup:**
- Remove queued SMS

---

## SMS-009 Exam Alert

**Objective:** Verify SMS is sent with exam schedule

**Preconditions:**
- Exam is published
- Student has guardian with SMS enabled

**Action:**
Exam published event triggers SMS notification

**Expected Database Changes:**
- `sms_queue` table: new row with template `exam_alert`
- Message includes exam subject, date, and time

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `exam_alert`

**Cleanup:**
- Remove queued SMS

---

## SMS-010 Opt-Out

**Objective:** Verify no SMS is sent when guardian has opted out

**Preconditions:**
- Guardian has `smsNotifications` set to `false`
- Event that normally triggers SMS occurs (student absent)

**Action:**
Mark student absent

**Expected Database Changes:**
- `sms_queue` table: no new row for this guardian

**Expected SMS/Email Notification:**
- None

**Expected Audit Log:**
- Event type: `SMSSuppressed`
- Actor: System
- Changes recorded: SMS suppressed due to opt-out preference

**Cleanup:**
- None required
