# 14 — Subject Test Cases

## Table of Contents

| ID | Title |
|---|---|
| SUB-001 | Create Subject |
| SUB-002 | Duplicate Subject |
| SUB-003 | Assign Teacher |
| SUB-004 | Remove Teacher |
| SUB-005 | Archive |
| SUB-006 | Restore |
| SUB-007 | Subject Allocation |
| SUB-008 | Search |
| SUB-009 | Audit |
| SUB-010 | Events |

---

## SUB-001 Create Subject

**Objective:** Verify a subject can be created

**Preconditions:**
- Authenticated school admin
- School exists with ID `:schoolId`

**Request:**
`POST /api/v1/schools/:schoolId/subjects`
```json
{
  "name": "Mathematics",
  "code": "MAT",
  "level": "junior_secondary"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "sub_001",
  "name": "Mathematics",
  "code": "MAT",
  "level": "junior_secondary",
  "schoolId": "clx...",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `subject` table: new row inserted

**Expected Audit Log:**
- Event type: `SubjectCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `subject.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created subject

---

## SUB-002 Duplicate Subject

**Objective:** Verify creating a subject with duplicate name returns conflict

**Preconditions:**
- Subject "Mathematics" already exists in school

**Request:**
`POST /api/v1/schools/:schoolId/subjects`
```json
{
  "name": "Mathematics",
  "code": "MTH",
  "level": "junior_secondary"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A subject with this name already exists",
  "field": "name"
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

## SUB-003 Assign Teacher

**Objective:** Verify a teacher can be assigned to a subject

**Preconditions:**
- Authenticated school admin
- Subject exists with ID `:id`
- Teacher user exists with ID `usr_003`

**Request:**
`POST /api/v1/schools/:schoolId/subjects/:id/teachers`
```json
{
  "teacherId": "usr_003"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "subjectId": "sub_001",
  "teacherId": "usr_003",
  "assignedAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `subject_teacher` table: new row linking teacher to subject

**Expected Audit Log:**
- Event type: `TeacherAssignedToSubject`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `subject.teacher.assigned`

**Cleanup:**
- Remove teacher from subject

---

## SUB-004 Remove Teacher

**Objective:** Verify a teacher can be removed from a subject

**Preconditions:**
- Authenticated school admin
- Teacher `usr_003` is assigned to subject `sub_001`

**Request:**
`DELETE /api/v1/schools/:schoolId/subjects/:id/teachers/:teacherId`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Teacher removed from subject successfully"
}
```

**Expected Database Changes:**
- `subject_teacher` table: link row deleted

**Expected Audit Log:**
- Event type: `TeacherRemovedFromSubject`
- Actor: Authenticated admin user ID

**WebSocket Event:**
- `subject.teacher.removed`

**Cleanup:**
- Reassign teacher if needed

---

## SUB-005 Archive

**Objective:** Verify a subject can be soft-deleted

**Preconditions:**
- Authenticated school admin
- Subject exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:schoolId/subjects/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Subject archived successfully",
  "id": "sub_001"
}
```

**Expected Database Changes:**
- `subject` table: `deletedAt` set

**Expected Audit Log:**
- Event type: `SubjectArchived`
- Actor: Authenticated admin user ID

**Cleanup:**
- Restore subject

---

## SUB-006 Restore

**Objective:** Verify an archived subject can be restored

**Preconditions:**
- Authenticated school admin
- Subject exists with ID `:id` and `deletedAt` set

**Request:**
`POST /api/v1/schools/:schoolId/subjects/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Subject restored successfully",
  "id": "sub_001"
}
```

**Expected Database Changes:**
- `subject` table: `deletedAt` cleared

**Expected Audit Log:**
- Event type: `SubjectRestored`
- Actor: Authenticated admin user ID

**Cleanup:**
- Re-archive if needed

---

## SUB-007 Subject Allocation

**Objective:** Verify a teacher can be assigned to subject+class combination

**Preconditions:**
- Authenticated school admin
- Subject `sub_001` and class `cls_001` exist

**Request:**
`POST /api/v1/schools/:schoolId/allocations`
```json
{
  "teacherId": "usr_003",
  "subjectId": "sub_001",
  "classId": "cls_001"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "alc_001",
  "teacherId": "usr_003",
  "subjectId": "sub_001",
  "classId": "cls_001",
  "allocatedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `subject_allocation` table: new row for teacher-subject-class combination

**Expected Audit Log:**
- Event type: `SubjectAllocationCreated`
- Actor: Authenticated admin user ID

**Cleanup:**
- Remove allocation

---

## SUB-008 Search

**Objective:** Verify subjects can be searched by name

**Preconditions:**
- Authenticated school admin
- Subjects exist with names containing "Math"

**Request:**
`GET /api/v1/schools/:schoolId/subjects?q=Math`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "sub_001", "name": "Mathematics", "code": "MAT" },
    { "id": "sub_002", "name": "Mathematics (Advanced)", "code": "MAT-ADV" }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20 }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## SUB-009 Audit

**Objective:** Verify subject changes are logged

**Preconditions:**
- Subject `sub_001` has been created and a teacher assigned

**Request:**
`GET /api/v1/schools/:schoolId/subjects/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "SubjectCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "name": "Mathematics" }
    },
    {
      "event": "TeacherAssignedToSubject",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "teacherId": "usr_003" }
    }
  ],
  "meta": { "total": 2 }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## SUB-010 Events

**Objective:** Verify TeacherAssigned event is emitted

**Preconditions:**
- Authenticated school admin
- Subject exists with ID `:id`
- Teacher exists with ID `usr_003`

**Request:**
`POST /api/v1/schools/:schoolId/subjects/:id/teachers`
```json
{
  "teacherId": "usr_003"
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `subject_teacher` table: new row
- `event_outbox` table: new row with event type `TeacherAssignedToSubject`

**Expected Audit Log:**
- Event type: `TeacherAssignedToSubject`

**Expected WebSocket Event:**
- `subject.teacher.assigned` (after outbox processor publishes)

**Cleanup:**
- Remove teacher from subject and outbox event
