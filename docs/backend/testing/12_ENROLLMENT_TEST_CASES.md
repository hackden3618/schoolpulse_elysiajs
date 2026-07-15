# 12 — Enrollment Test Cases

## Table of Contents

| ID | Title |
|---|---|
| ENR-001 | Enroll Student |
| ENR-002 | Already Enrolled |
| ENR-003 | Promote |
| ENR-004 | Repeat |
| ENR-005 | Transfer |
| ENR-006 | Suspend |
| ENR-007 | Reinstate |
| ENR-008 | Graduate |
| ENR-009 | Rollback |
| ENR-010 | Audit |

---

## ENR-001 Enroll Student

**Objective:** Verify a student can be enrolled in a class and term

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:studentId`
- Class exists with ID `:classId`
- Term exists with ID `:termId`

**Request:**
`POST /api/v1/schools/:schoolId/enrollments`
```json
{
  "studentId": "stu_001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "enr_001",
  "studentId": "stu_001",
  "classId": "cls_001",
  "termId": "trm_001",
  "status": "active",
  "enrolledAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `enrollment` table: new row inserted

**Expected Audit Log:**
- Event type: `EnrollmentCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `enrollment.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created enrollment

---

## ENR-002 Already Enrolled

**Objective:** Verify enrolling a student in the same class and term returns conflict

**Preconditions:**
- Student `stu_001` is already enrolled in class `cls_001` for term `trm_001`

**Request:**
`POST /api/v1/schools/:schoolId/enrollments`
```json
{
  "studentId": "stu_001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "Student is already enrolled in this class and term",
  "field": "studentId"
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

## ENR-003 Promote

**Objective:** Verify a student can be promoted to the next class

**Preconditions:**
- Authenticated school admin
- Student `stu_001` is enrolled in class `cls_001`
- Class `cls_002` is the next grade level

**Request:**
`POST /api/v1/schools/:schoolId/enrollments/:id/promote`
```json
{
  "toClassId": "cls_002",
  "termId": "trm_002"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "previousEnrollmentId": "enr_001",
  "newEnrollmentId": "enr_002",
  "fromClass": "cls_001",
  "toClass": "cls_002",
  "promotedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `enrollment` table: original enrollment `status` set to `completed`, `endDate` set
- `enrollment` table: new enrollment for `cls_002` created

**Expected Audit Log:**
- Event type: `StudentPromoted`
- Actor: Authenticated admin user ID
- Changes recorded: `cls_001 -> cls_002`

**Expected WebSocket Event:**
- `student.promoted`

**Cleanup:**
- Remove new enrollment, restore original

---

## ENR-004 Repeat

**Objective:** Verify a student can repeat the same class

**Preconditions:**
- Authenticated school admin
- Student `stu_001` completed class `cls_001` last year
- Same class `cls_001` exists for new term

**Request:**
`POST /api/v1/schools/:schoolId/enrollments`
```json
{
  "studentId": "stu_001",
  "classId": "cls_001",
  "termId": "trm_003"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "enr_003",
  "studentId": "stu_001",
  "classId": "cls_001",
  "termId": "trm_003",
  "status": "active"
}
```

**Expected Database Changes:**
- `enrollment` table: new row for same student and class but different term

**Expected Audit Log:**
- Event type: `EnrollmentCreated`
- Actor: Authenticated admin user ID

**Cleanup:**
- Delete created enrollment

---

## ENR-005 Transfer

**Objective:** Verify a student can transfer to a different class mid-term

**Preconditions:**
- Authenticated school admin
- Student `stu_001` is enrolled in class `cls_001`
- Class `cls_003` exists

**Request:**
`POST /api/v1/schools/:schoolId/enrollments/:id/transfer`
```json
{
  "toClassId": "cls_003",
  "reason": "Subject specialization"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "previousEnrollmentId": "enr_001",
  "newEnrollmentId": "enr_004",
  "fromClass": "cls_001",
  "toClass": "cls_003",
  "reason": "Subject specialization"
}
```

**Expected Database Changes:**
- `enrollment` table: original enrollment ended with reason
- `enrollment` table: new enrollment created for `cls_003`

**Expected Audit Log:**
- Event type: `EnrollmentTransferred`
- Actor: Authenticated admin user ID
- Changes recorded: `cls_001 -> cls_003`, reason

**Cleanup:**
- Reverse transfer

---

## ENR-006 Suspend

**Objective:** Verify an enrollment can be suspended

**Preconditions:**
- Authenticated school admin
- Enrollment exists with ID `:id` and status `active`

**Request:**
`PATCH /api/v1/schools/:schoolId/enrollments/:id`
```json
{
  "status": "suspended",
  "reason": "Extended absence"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "enr_001",
  "status": "suspended",
  "reason": "Extended absence",
  "suspendedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `enrollment` table: `status` set to `suspended`, `suspendedAt` set

**Expected Audit Log:**
- Event type: `EnrollmentSuspended`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active -> suspended`

**Cleanup:**
- Reinstate enrollment

---

## ENR-007 Reinstate

**Objective:** Verify a suspended enrollment can be reactivated

**Preconditions:**
- Authenticated school admin
- Enrollment exists with ID `:id` and status `suspended`

**Request:**
`PATCH /api/v1/schools/:schoolId/enrollments/:id`
```json
{
  "status": "active"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "enr_001",
  "status": "active",
  "reinstatedAt": "2026-07-15T13:00:00.000Z"
}
```

**Expected Database Changes:**
- `enrollment` table: `status` set to `active`, `suspendedAt` cleared

**Expected Audit Log:**
- Event type: `EnrollmentReinstated`
- Actor: Authenticated admin user ID
- Changes recorded: `status: suspended -> active`

**Cleanup:**
- None required

---

## ENR-008 Graduate

**Objective:** Verify an enrollment can be finalized as graduated

**Preconditions:**
- Authenticated school admin
- Enrollment exists with ID `:id` and status `active`

**Request:**
`POST /api/v1/schools/:schoolId/enrollments/:id/graduate`
```json
{
  "completionYear": "2026",
  "remarks": "Completed satisfactorily"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "enr_001",
  "status": "graduated",
  "completionYear": "2026",
  "remarks": "Completed satisfactorily"
}
```

**Expected Database Changes:**
- `enrollment` table: `status` set to `graduated`, `endDate` set
- `student` table: `status` set to `graduated`

**Expected Audit Log:**
- Event type: `EnrollmentGraduated`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active -> graduated`

**Cleanup:**
- Revert graduation status

---

## ENR-009 Rollback

**Objective:** Verify database failure during enrollment creation rolls back

**Preconditions:**
- Authenticated school admin
- Database failure simulated during enrollment transaction

**Request:**
`POST /api/v1/schools/:schoolId/enrollments`
```json
{
  "studentId": "stu_001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Scenario:** Simulate DB error after inserting enrollment row

**Expected HTTP Status:** 500 Internal Server Error

**Expected Response Body:**
```json
{
  "error": "Internal Server Error",
  "message": "Failed to create enrollment. Transaction rolled back."
}
```

**Expected Database Changes:**
- None (transaction rolled back)

**Expected Audit Log:**
- None

**Cleanup:**
- None required

---

## ENR-010 Audit

**Objective:** Verify enrollment changes are logged

**Preconditions:**
- Enrollment `enr_001` has been created and suspended

**Request:**
`GET /api/v1/schools/:schoolId/enrollments/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "EnrollmentCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "studentId": "stu_001", "classId": "cls_001" }
    },
    {
      "event": "EnrollmentSuspended",
      "actor": "usr_001",
      "timestamp": "2026-07-15T12:00:00.000Z",
      "changes": { "status": { "from": "active", "to": "suspended" }, "reason": "Extended absence" }
    }
  ],
  "meta": { "total": 2 }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required
