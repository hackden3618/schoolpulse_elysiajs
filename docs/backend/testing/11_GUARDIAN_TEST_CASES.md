# 11 — Guardian Test Cases

## Table of Contents

| ID | Title |
|---|---|
| GRD-001 | Link Guardian |
| GRD-002 | Multiple Children |
| GRD-003 | Multiple Schools |
| GRD-004 | Primary Guardian |
| GRD-005 | Remove Guardian |
| GRD-006 | Duplicate Guardian |
| GRD-007 | SMS Preferences |
| GRD-008 | Email Preferences |
| GRD-009 | Search |
| GRD-010 | Audit |

---

## GRD-001 Link Guardian

**Objective:** Verify a guardian can be linked to a student

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:studentId`
- Guardian user exists with ID `usr_005`

**Request:**
`POST /api/v1/schools/:schoolId/students/:studentId/guardians`
```json
{
  "guardianId": "usr_005",
  "relationship": "mother",
  "isPrimary": true
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "grd_001",
  "studentId": "stu_001",
  "guardianId": "usr_005",
  "relationship": "mother",
  "isPrimary": true,
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `student_guardian` table: new row linking guardian to student

**Expected Audit Log:**
- Event type: `GuardianLinked`
- Actor: Authenticated admin user ID
- Changes recorded: Guardian linked to student

**Expected WebSocket Event:**
- `guardian.linked`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `guardian_linked`

**Cleanup:**
- Remove guardian link

---

## GRD-002 Multiple Children

**Objective:** Verify a guardian can be linked to multiple students

**Preconditions:**
- Authenticated school admin
- Guardian `usr_005` is linked to student `stu_001`
- Student `stu_002` exists

**Request:**
`POST /api/v1/schools/:schoolId/students/stu_002/guardians`
```json
{
  "guardianId": "usr_005",
  "relationship": "mother",
  "isPrimary": false
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "grd_002",
  "studentId": "stu_002",
  "guardianId": "usr_005",
  "relationship": "mother",
  "isPrimary": false
}
```

**Expected Database Changes:**
- `student_guardian` table: new row linking same guardian to second student

**Expected Audit Log:**
- Event type: `GuardianLinked`
- Actor: Authenticated admin user ID

**Cleanup:**
- Remove both guardian links

---

## GRD-003 Multiple Schools

**Objective:** Verify a guardian can be linked to students in different schools

**Preconditions:**
- Authenticated platform super admin
- Guardian `usr_005` exists
- Student `stu_001` in school A, student `stu_050` in school B

**Request:**
`POST /api/v1/schools/school_b/students/stu_050/guardians`
```json
{
  "guardianId": "usr_005",
  "relationship": "father",
  "isPrimary": true
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "grd_003",
  "studentId": "stu_050",
  "guardianId": "usr_005",
  "relationship": "father"
}
```

**Expected Database Changes:**
- `student_guardian` table: new row cross-school

**Expected Audit Log:**
- Event type: `GuardianLinked`

**Cleanup:**
- Remove guardian link from school B

---

## GRD-004 Primary Guardian

**Objective:** Verify only one primary guardian per student is allowed

**Preconditions:**
- Authenticated school admin
- Student `stu_001` has guardian `usr_005` as primary

**Request:**
`PATCH /api/v1/schools/:schoolId/students/:studentId/guardians/:id`
```json
{
  "isPrimary": true
}
```
where `:id` points to a different guardian's link for the same student

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "grd_002",
  "isPrimary": true,
  "previousPrimary": "usr_005"
}
```

**Expected Database Changes:**
- `student_guardian` table: previous primary guardian `isPrimary` set to `false`
- `student_guardian` table: new primary guardian `isPrimary` set to `true`

**Expected Audit Log:**
- Event type: `PrimaryGuardianChanged`
- Actor: Authenticated admin user ID
- Changes recorded: Primary guardian changed from `usr_005` to new guardian

**Cleanup:**
- Revert primary guardian to original

---

## GRD-005 Remove Guardian

**Objective:** Verify a guardian link can be removed

**Preconditions:**
- Authenticated school admin
- Guardian link exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:schoolId/students/:studentId/guardians/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Guardian link removed successfully"
}
```

**Expected Database Changes:**
- `student_guardian` table: row soft-deleted (`deletedAt` set)

**Expected Audit Log:**
- Event type: `GuardianRemoved`
- Actor: Authenticated admin user ID
- Changes recorded: Guardian unlinked from student

**Expected WebSocket Event:**
- `guardian.removed`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore guardian link

---

## GRD-006 Duplicate Guardian

**Objective:** Verify linking the same guardian to the same student returns conflict

**Preconditions:**
- Guardian `usr_005` is already linked to student `stu_001`

**Request:**
`POST /api/v1/schools/:schoolId/students/:studentId/guardians`
```json
{
  "guardianId": "usr_005",
  "relationship": "mother"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "This guardian is already linked to this student",
  "field": "guardianId"
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

## GRD-007 SMS Preferences

**Objective:** Verify guardian who opted out of SMS does not receive SMS

**Preconditions:**
- Guardian `usr_005` has `smsNotifications` set to `false`
- Student `stu_001` is registered

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "NoSMS",
  "lastName": "Child",
  "admissionNumber": "ADM-NOSMS-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "guardianIds": ["usr_005"]
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `student` table: new row
- `sms_queue` table: no row for guardian (opted out)

**Expected Audit Log:**
- Event type: `StudentCreated`

**Expected SMS/Email Notification:**
- None (guardian opted out)

**Cleanup:**
- Archive student

---

## GRD-008 Email Preferences

**Objective:** Verify guardian who opted out of email does not receive email

**Preconditions:**
- Guardian `usr_005` has `emailNotifications` set to `false`
- Email notification would normally be triggered

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "NoEmail",
  "lastName": "Child",
  "admissionNumber": "ADM-NOEMAIL-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "guardianIds": ["usr_005"]
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `student` table: new row
- `email_queue` table: no row for guardian (opted out)

**Expected Audit Log:**
- Event type: `StudentCreated`

**Expected SMS/Email Notification:**
- None (guardian opted out)

**Cleanup:**
- Archive student

---

## GRD-009 Search

**Objective:** Verify guardians can be searched by student, phone, or name

**Preconditions:**
- Authenticated school admin
- Guardians exist linked to students

**Request:**
`GET /api/v1/schools/:schoolId/guardians?q=Jane`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "guardianId": "usr_005",
      "firstName": "Jane",
      "lastName": "Mwangi",
      "phone": "+254712345679",
      "studentCount": 2
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required

---

## GRD-010 Audit

**Objective:** Verify guardian link changes are logged

**Preconditions:**
- Guardian link for student `stu_001` and guardian `usr_005` has been created and modified

**Request:**
`GET /api/v1/schools/:schoolId/students/:studentId/guardians/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "GuardianLinked",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "guardianId": "usr_005", "relationship": "mother" }
    },
    {
      "event": "PrimaryGuardianChanged",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "isPrimary": { "from": false, "to": true } }
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
