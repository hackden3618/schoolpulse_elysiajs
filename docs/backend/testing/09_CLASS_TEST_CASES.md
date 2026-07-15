# 9 — Class Test Cases

## Table of Contents

| ID | Title |
|---|---|
| CLS-001 | Create Class |
| CLS-002 | Duplicate Class |
| CLS-003 | Assign Teacher |
| CLS-004 | Remove Teacher |
| CLS-005 | Change Teacher |
| CLS-006 | Archive |
| CLS-007 | Restore |
| CLS-008 | Capacity |
| CLS-009 | Search |
| CLS-010 | Audit |

---

## CLS-001 Create Class

**Objective:** Verify a class can be created in a school

**Preconditions:**
- Authenticated school admin
- School exists with ID `:schoolId`

**Request:**
`POST /api/v1/schools/:schoolId/classes`
```json
{
  "name": "Grade 7",
  "maxCapacity": 45,
  "level": "junior_secondary"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "cls_001",
  "name": "Grade 7",
  "maxCapacity": 45,
  "level": "junior_secondary",
  "schoolId": "clx...",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `class` table: new row inserted

**Expected Audit Log:**
- Event type: `ClassCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `class.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created class

---

## CLS-002 Duplicate Class

**Objective:** Verify creating a class with same name returns conflict

**Preconditions:**
- Class "Grade 7" already exists in school

**Request:**
`POST /api/v1/schools/:schoolId/classes`
```json
{
  "name": "Grade 7",
  "maxCapacity": 40,
  "level": "junior_secondary"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A class with this name already exists",
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

## CLS-003 Assign Teacher

**Objective:** Verify a teacher can be assigned to a class

**Preconditions:**
- Authenticated school admin
- Class exists with ID `:id`
- Teacher user exists with membership in school

**Request:**
`POST /api/v1/schools/:schoolId/classes/:id/teachers`
```json
{
  "teacherId": "usr_003"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "classId": "cls_001",
  "teacherId": "usr_003",
  "assignedAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `class_teacher` table: new row linking teacher to class

**Expected Audit Log:**
- Event type: `TeacherAssignedToClass`
- Actor: Authenticated admin user ID
- Changes recorded: `teacherId: usr_003 assigned to class cls_001`

**Expected WebSocket Event:**
- `class.teacher.assigned`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Remove teacher from class

---

## CLS-004 Remove Teacher

**Objective:** Verify a teacher can be removed from a class

**Preconditions:**
- Authenticated school admin
- Teacher `usr_003` is assigned to class `cls_001`

**Request:**
`DELETE /api/v1/schools/:schoolId/classes/:id/teachers/:teacherId`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Teacher removed from class successfully"
}
```

**Expected Database Changes:**
- `class_teacher` table: link row deleted

**Expected Audit Log:**
- Event type: `TeacherRemovedFromClass`
- Actor: Authenticated admin user ID
- Changes recorded: `teacherId: usr_003 removed from class cls_001`

**Expected WebSocket Event:**
- `class.teacher.removed`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Reassign teacher if needed

---

## CLS-005 Change Teacher

**Objective:** Verify a teacher can be reassigned to a different class

**Preconditions:**
- Authenticated school admin
- Teacher `usr_003` is assigned to class `cls_001`
- Class `cls_002` exists

**Request:**
`PATCH /api/v1/schools/:schoolId/classes/:id/teachers/:teacherId`
```json
{
  "fromClassId": "cls_001",
  "toClassId": "cls_002"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "teacherId": "usr_003",
  "previousClass": "cls_001",
  "newClass": "cls_002",
  "transferredAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `class_teacher` table: link from `cls_001` deleted
- `class_teacher` table: new link to `cls_002` inserted

**Expected Audit Log:**
- Event type: `TeacherReassigned`
- Actor: Authenticated admin user ID
- Changes recorded: `class: cls_001 → cls_002`

**Expected WebSocket Event:**
- `class.teacher.reassigned`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Reverse teacher assignment

---

## CLS-006 Archive

**Objective:** Verify a class can be soft-deleted

**Preconditions:**
- Authenticated school admin
- Class exists with ID `:id`
- Class has no active enrollments

**Request:**
`DELETE /api/v1/schools/:schoolId/classes/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Class archived successfully",
  "id": "cls_001"
}
```

**Expected Database Changes:**
- `class` table: `deletedAt` set to current timestamp
- `class` table: `status` set to `archived`

**Expected Audit Log:**
- Event type: `ClassArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `class.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore class

---

## CLS-007 Restore

**Objective:** Verify an archived class can be restored

**Preconditions:**
- Authenticated school admin
- Class exists with ID `:id` and `deletedAt` set

**Request:**
`POST /api/v1/schools/:schoolId/classes/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Class restored successfully",
  "id": "cls_001",
  "status": "active"
}
```

**Expected Database Changes:**
- `class` table: `deletedAt` cleared to `null`
- `class` table: `status` set to `active`

**Expected Audit Log:**
- Event type: `ClassRestored`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: <timestamp> → null`

**Expected WebSocket Event:**
- `class.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive if needed

---

## CLS-008 Capacity

**Objective:** Verify enrollment cannot exceed class maximum capacity

**Preconditions:**
- Class exists with `maxCapacity = 45`
- Class already has 45 enrolled students

**Request:**
`POST /api/v1/schools/:schoolId/enrollments`
```json
{
  "studentId": "stu_050",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "Class 'Grade 7' has reached maximum capacity of 45 students"
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

## CLS-009 Search

**Objective:** Verify classes can be searched by name

**Preconditions:**
- Authenticated school admin
- Multiple classes exist

**Request:**
`GET /api/v1/schools/:schoolId/classes?q=Grade`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "cls_001", "name": "Grade 7", "studentCount": 45 },
    { "id": "cls_002", "name": "Grade 8", "studentCount": 42 }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20
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

## CLS-010 Audit

**Objective:** Verify class modifications are logged

**Preconditions:**
- Class `cls_001` has been created and updated

**Request:**
`GET /api/v1/schools/:schoolId/classes/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "ClassCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "name": "Grade 7" }
    },
    {
      "event": "TeacherAssignedToClass",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "teacherId": "usr_003" }
    }
  ],
  "meta": {
    "total": 2
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
