# 10 — Student Test Cases

## Table of Contents

| ID | Title |
|---|---|
| STU-001 | Register Student |
| STU-002 | Duplicate Admission |
| STU-003 | Edit Student |
| STU-004 | Archive |
| STU-005 | Restore |
| STU-006 | Graduate |
| STU-007 | Transfer |
| STU-008 | Expel |
| STU-009 | Search |
| STU-010 | Pagination |
| STU-011 | Filters |
| STU-012 | Bulk Import |
| STU-013 | Bulk Export |
| STU-014 | Rollback |
| STU-015 | Audit |
| STU-016 | Events |
| STU-017 | SMS |
| STU-018 | WebSocket |
| STU-019 | Validation |
| STU-020 | Concurrency |

---

## STU-001 Register Student

**Objective:** Verify a new student can be registered with enrollment

**Preconditions:**
- Authenticated school admin
- School exists with ID `:schoolId`
- Class and term exist
- Guardian exists with ID `:guardianId`

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Alice",
  "lastName": "Wanjiku",
  "dateOfBirth": "2012-05-15",
  "gender": "female",
  "admissionNumber": "ADM-2026-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "guardianIds": ["grd_001"]
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "stu_001",
  "firstName": "Alice",
  "lastName": "Wanjiku",
  "admissionNumber": "ADM-2026-001",
  "status": "active",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `student` table: new row inserted
- `enrollment` table: new row linking student to class and term

**Expected Audit Log:**
- Event type: `StudentCreated`
- Actor: Authenticated admin user ID
- Changes recorded: Full student object, enrollment details

**Expected WebSocket Event:**
- `student.created`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `student_registered`

**Cleanup:**
- Archive student and enrollment

---

## STU-002 Duplicate Admission

**Objective:** Verify duplicate admission number returns conflict

**Preconditions:**
- Student with admission number "ADM-2026-001" already exists

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Bob",
  "lastName": "Kamau",
  "dateOfBirth": "2011-03-10",
  "gender": "male",
  "admissionNumber": "ADM-2026-001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A student with this admission number already exists",
  "field": "admissionNumber"
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-003 Edit Student

**Objective:** Verify a student's details can be updated

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id`

**Request:**
`PATCH /api/v1/schools/:schoolId/students/:id`
```json
{
  "firstName": "Alice",
  "lastName": "Nyambura",
  "dateOfBirth": "2012-05-15"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "stu_001",
  "firstName": "Alice",
  "lastName": "Nyambura",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `student` table: `lastName` updated

**Expected Audit Log:**
- Event type: `StudentUpdated`
- Actor: Authenticated admin user ID
- Changes recorded: `lastName: Wanjiku -> Nyambura`

**Expected WebSocket Event:**
- `student.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Revert student name

---

## STU-004 Archive

**Objective:** Verify a student can be soft-deleted, ending enrollment

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id` with active enrollment

**Request:**
`DELETE /api/v1/schools/:schoolId/students/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Student archived successfully",
  "id": "stu_001"
}
```

**Expected Database Changes:**
- `student` table: `deletedAt` set to current timestamp, `status` set to `archived`
- `enrollment` table: enrollment `endDate` set, status changed to `ended`

**Expected Audit Log:**
- Event type: `StudentArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null -> <timestamp>`, enrollment ended

**Expected WebSocket Event:**
- `student.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore student

---

## STU-005 Restore

**Objective:** Verify an archived student can be restored

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id` and `deletedAt` set

**Request:**
`POST /api/v1/schools/:schoolId/students/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Student restored successfully",
  "id": "stu_001",
  "status": "active"
}
```

**Expected Database Changes:**
- `student` table: `deletedAt` cleared to `null`, `status` set to `active`

**Expected Audit Log:**
- Event type: `StudentRestored`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: <timestamp> -> null`

**Expected WebSocket Event:**
- `student.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive if needed

---

## STU-006 Graduate

**Objective:** Verify a student can be graduated with finalized enrollment

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id` with active enrollment

**Request:**
`POST /api/v1/schools/:schoolId/students/:id/graduate`
```json
{
  "completionYear": "2026"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "stu_001",
  "status": "graduated",
  "graduationYear": "2026",
  "message": "Student graduated successfully"
}
```

**Expected Database Changes:**
- `student` table: `status` set to `graduated`, `graduationYear` set to 2026
- `enrollment` table: status set to `completed`, `endDate` set

**Expected Audit Log:**
- Event type: `StudentGraduated`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active -> graduated`

**Expected WebSocket Event:**
- `student.graduated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Revert student status to active

---

## STU-007 Transfer

**Objective:** Verify a student can be transferred to a new class while preserving enrollment history

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id` enrolled in class `cls_001`
- Class `cls_002` exists

**Request:**
`POST /api/v1/schools/:schoolId/students/:id/transfer`
```json
{
  "fromClassId": "cls_001",
  "toClassId": "cls_002",
  "reason": "Academic level promotion",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "stu_001",
  "previousClass": "cls_001",
  "newClass": "cls_002",
  "transferDate": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `enrollment` table: current enrollment for `cls_001` `endDate` set
- `enrollment` table: new enrollment row for `cls_002` inserted
- `transfer_history` table: new row with reason and dates

**Expected Audit Log:**
- Event type: `StudentTransferred`
- Actor: Authenticated admin user ID
- Changes recorded: From class `cls_001` to `cls_002`

**Expected WebSocket Event:**
- `student.transferred`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `student_transferred`

**Cleanup:**
- Reverse transfer, clean up enrollment history

---

## STU-008 Expel

**Objective:** Verify a student can be expelled with reason and archived

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id` with active enrollment

**Request:**
`POST /api/v1/schools/:schoolId/students/:id/expel`
```json
{
  "reason": "Repeated disciplinary violations",
  "effectiveDate": "2026-07-15"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "stu_001",
  "status": "expelled",
  "expulsionReason": "Repeated disciplinary violations",
  "effectiveDate": "2026-07-15"
}
```

**Expected Database Changes:**
- `student` table: `status` set to `expelled`, `deletedAt` set, `expulsionReason` stored
- `enrollment` table: enrollment ended

**Expected Audit Log:**
- Event type: `StudentExpelled`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active -> expelled`, reason recorded

**Expected WebSocket Event:**
- `student.expelled`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `student_expelled`

**Cleanup:**
- Restore student and enrollment

---

## STU-009 Search

**Objective:** Verify students can be searched by name

**Preconditions:**
- Authenticated school admin
- Students exist with names containing "Alice"

**Request:**
`GET /api/v1/schools/:schoolId/students?q=Alice`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "stu_001", "firstName": "Alice", "lastName": "Wanjiku", "admissionNumber": "ADM-2026-001" },
    { "id": "stu_010", "firstName": "Alice", "lastName": "Muthoni", "admissionNumber": "ADM-2026-010" }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20 }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-010 Pagination

**Objective:** Verify students are paginated

**Preconditions:**
- Authenticated school admin
- School has 60+ students

**Request:**
`GET /api/v1/schools/:schoolId/students?page=1&limit=50`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 60,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-011 Filters

**Objective:** Verify students can be filtered by class, gender, and status

**Preconditions:**
- Authenticated school admin
- Students exist with various classes, genders, and statuses

**Request:**
`GET /api/v1/schools/:schoolId/students?classId=cls_001&gender=female&status=active`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "stu_001", "firstName": "Alice", "gender": "female", "classId": "cls_001", "status": "active" }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-012 Bulk Import

**Objective:** Verify students can be bulk imported via CSV or JSON array

**Preconditions:**
- Authenticated school admin
- Valid CSV/JSON file with student data

**Request:**
`POST /api/v1/schools/:schoolId/students/bulk`
```json
{
  "students": [
    {
      "firstName": "Student1",
      "lastName": "Test",
      "admissionNumber": "ADM-BULK-001",
      "classId": "cls_001",
      "termId": "trm_001"
    },
    {
      "firstName": "Student2",
      "lastName": "Test",
      "admissionNumber": "ADM-BULK-002",
      "classId": "cls_001",
      "termId": "trm_001"
    }
  ]
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "imported": 2,
  "failed": 0,
  "errors": []
}
```

**Expected Database Changes:**
- `student` table: 2 new rows inserted
- `enrollment` table: 2 new enrollment rows

**Expected Audit Log:**
- Event type: `StudentBulkImport`
- Actor: Authenticated admin user ID
- Changes recorded: 2 students imported

**Expected WebSocket Event:**
- `student.bulk.created`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone (for each student if guardian specified)

**Cleanup:**
- Archive imported students

---

## STU-013 Bulk Export

**Objective:** Verify students can be exported as CSV

**Preconditions:**
- Authenticated school admin
- School has students

**Request:**
`GET /api/v1/schools/:schoolId/students/export?format=csv`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```
firstName,lastName,admissionNumber,gender,classId,status
Alice,Wanjiku,ADM-2026-001,female,cls_001,active
Bob,Kamau,ADM-2026-002,male,cls_001,active
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- Event type: `StudentExport`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-014 Rollback

**Objective:** Verify database failure during registration rolls back all changes

**Preconditions:**
- Authenticated school admin
- Database connection will be interrupted mid-transaction

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Rollback",
  "lastName": "Test",
  "admissionNumber": "ADM-ROLLBACK-001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Scenario:** Simulate DB failure after student insert but before enrollment insert

**Expected HTTP Status:** 500 Internal Server Error

**Expected Response Body:**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to complete student registration. All changes have been rolled back."
}
```

**Expected Database Changes:**
- None (transaction rolled back)

**Expected Audit Log:**
- None (transaction rolled back)

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-015 Audit

**Objective:** Verify StudentCreated event logs actor, timestamp, IP, school, and changes

**Preconditions:**
- Student with ID `:id` was created

**Request:**
`GET /api/v1/schools/:schoolId/students/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "StudentCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "ipAddress": "192.168.1.100",
      "schoolId": "clx...",
      "changes": {
        "firstName": "Alice",
        "lastName": "Wanjiku",
        "admissionNumber": "ADM-2026-001",
        "classId": "cls_001",
        "status": "active"
      }
    }
  ],
  "meta": { "total": 1 }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-016 Events

**Objective:** Verify StudentCreated event is emitted via outbox

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Event",
  "lastName": "Test",
  "admissionNumber": "ADM-EVENT-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "guardianIds": []
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `student` table: new row inserted
- `event_outbox` table: new row with event type `StudentCreated`

**Expected Audit Log:**
- Event type: `StudentCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `student.created` (after outbox processor publishes)

**Expected SMS/Email Notification:**
- None (no guardian specified)

**Cleanup:**
- Archive student and remove outbox event

---

## STU-017 SMS

**Objective:** Verify guardian receives SMS notification on student registration

**Preconditions:**
- Authenticated school admin
- Guardian exists with ID `grd_001` and has SMS notifications enabled
- Guardian phone number is `+254712345679`

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "SMS",
  "lastName": "Test",
  "admissionNumber": "ADM-SMS-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "guardianIds": ["grd_001"]
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `student` table: new row
- `enrollment` table: new row
- `sms_queue` table: new row with recipient `+254712345679`, template `student_registered`

**Expected Audit Log:**
- Event type: `StudentCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `student.created`

**Expected SMS/Email Notification:**
- Recipient: +254712345679
- Template: `student_registered`

**Cleanup:**
- Archive student and remove queued SMS

---

## STU-018 WebSocket

**Objective:** Verify StudentCreated event broadcasts to school room

**Preconditions:**
- Authenticated school admin
- WebSocket client connected to school room `school:clx...`

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "WS",
  "lastName": "Test",
  "admissionNumber": "ADM-WS-001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 201 Created

**Expected WebSocket Event:**
- `student.created` with student ID, name, admission number, school ID

**Expected Database Changes:**
- `student` table: new row

**Expected Audit Log:**
- Event type: `StudentCreated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Archive student

---

## STU-019 Validation

**Objective:** Verify missing required fields return 400

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "lastName": "Incomplete"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Missing required fields",
  "fields": ["firstName", "admissionNumber"]
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## STU-020 Concurrency

**Objective:** Verify two simultaneous registrations with same admission number - one succeeds, one gets 409

**Preconditions:**
- Authenticated school admin
- Two concurrent requests sent

**Request (both threads):**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Concurrent",
  "lastName": "Test",
  "admissionNumber": "ADM-CONCUR-001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status (first):** 201 Created

**Expected HTTP Status (second):** 409 Conflict

**Expected Response Body (second):**
```json
{
  "error": "Conflict",
  "message": "A student with this admission number already exists",
  "field": "admissionNumber"
}
```

**Expected Database Changes:**
- `student` table: exactly 1 new row (not 2)

**Expected Audit Log:**
- Event type: `StudentCreated` for the successful request only

**Expected WebSocket Event:**
- `student.created` for the successful request only

**Expected SMS/Email Notification:**
- Only for the successful registration

**Cleanup:**
- Archive the created student
