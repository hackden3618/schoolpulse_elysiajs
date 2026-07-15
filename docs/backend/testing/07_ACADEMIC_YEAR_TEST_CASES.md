# 7 — Academic Year Test Cases

## Table of Contents

| ID | Title |
|---|---|
| ACY-001 | Create Year |
| ACY-002 | Duplicate Year |
| ACY-003 | Activate Year |
| ACY-004 | Close Year |
| ACY-005 | Archive Year |
| ACY-006 | Restore Year |
| ACY-007 | Year Transition |
| ACY-008 | Validation |
| ACY-009 | Audit |
| ACY-010 | Events |

---

## ACY-001 Create Year

**Objective:** Verify an academic year can be created

**Preconditions:**
- Authenticated school admin
- School exists with ID `:schoolId`
- No year with same name exists

**Request:**
`POST /api/v1/schools/:schoolId/academic-years`
```json
{
  "name": "2026-2027",
  "startDate": "2026-01-15",
  "endDate": "2026-12-20"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "acy_001",
  "name": "2026-2027",
  "startDate": "2026-01-15",
  "endDate": "2026-12-20",
  "status": "inactive",
  "isCurrent": false,
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `academic_year` table: new row inserted

**Expected Audit Log:**
- Event type: `AcademicYearCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `academic-year.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created academic year

---

## ACY-002 Duplicate Year

**Objective:** Verify creating a year with an existing name returns conflict

**Preconditions:**
- Academic year "2026-2027" already exists in school

**Request:**
`POST /api/v1/schools/:schoolId/academic-years`
```json
{
  "name": "2026-2027",
  "startDate": "2026-01-15",
  "endDate": "2026-12-20"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "An academic year with this name already exists",
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

## ACY-003 Activate Year

**Objective:** Verify an academic year can be activated as current

**Preconditions:**
- Authenticated school admin
- Academic year exists with ID `:id` and status `inactive`
- No other year is currently active

**Request:**
`PATCH /api/v1/schools/:schoolId/academic-years/:id`
```json
{
  "isCurrent": true
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "acy_001",
  "name": "2026-2027",
  "status": "active",
  "isCurrent": true,
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `academic_year` table: `isCurrent` set to `true`, `status` set to `active`

**Expected Audit Log:**
- Event type: `AcademicYearActivated`
- Actor: Authenticated admin user ID
- Changes recorded: `isCurrent: false → true`, `status: inactive → active`

**Expected WebSocket Event:**
- `academic-year.activated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Deactivate year

---

## ACY-004 Close Year

**Objective:** Verify an academic year can be closed

**Preconditions:**
- Authenticated school admin
- Academic year exists with ID `:id` and status `active`

**Request:**
`PATCH /api/v1/schools/:schoolId/academic-years/:id`
```json
{
  "status": "closed"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "acy_001",
  "name": "2026-2027",
  "status": "closed",
  "isCurrent": false,
  "updatedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `academic_year` table: `status` set to `closed`, `isCurrent` set to `false`

**Expected Audit Log:**
- Event type: `AcademicYearClosed`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active → closed`

**Expected WebSocket Event:**
- `academic-year.closed`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Reopen year

---

## ACY-005 Archive Year

**Objective:** Verify an academic year can be soft-deleted

**Preconditions:**
- Authenticated school admin
- Academic year exists with ID `:id` and status `closed`

**Request:**
`DELETE /api/v1/schools/:schoolId/academic-years/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Academic year archived successfully",
  "id": "acy_001"
}
```

**Expected Database Changes:**
- `academic_year` table: `deletedAt` set to current timestamp

**Expected Audit Log:**
- Event type: `AcademicYearArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `academic-year.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore year

---

## ACY-006 Restore Year

**Objective:** Verify an archived academic year can be restored

**Preconditions:**
- Authenticated school admin
- Academic year exists with ID `:id` and `deletedAt` set

**Request:**
`POST /api/v1/schools/:schoolId/academic-years/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Academic year restored successfully",
  "id": "acy_001"
}
```

**Expected Database Changes:**
- `academic_year` table: `deletedAt` cleared to `null`

**Expected Audit Log:**
- Event type: `AcademicYearRestored`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: <timestamp> → null`

**Expected WebSocket Event:**
- `academic-year.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive if needed

---

## ACY-007 Year Transition

**Objective:** Verify activating a year auto-creates default terms

**Preconditions:**
- Authenticated school admin
- Academic year "2026-2027" exists with status `inactive`
- School has default term templates configured (Term 1, Term 2, Term 3)

**Request:**
`PATCH /api/v1/schools/:schoolId/academic-years/:id`
```json
{
  "isCurrent": true
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "acy_001",
  "status": "active",
  "isCurrent": true,
  "terms": [
    { "name": "Term 1", "startDate": "2026-01-15", "endDate": "2026-04-15" },
    { "name": "Term 2", "startDate": "2026-05-01", "endDate": "2026-08-15" },
    { "name": "Term 3", "startDate": "2026-09-01", "endDate": "2026-12-20" }
  ]
}
```

**Expected Database Changes:**
- `academic_year` table: `isCurrent` set to `true`
- `term` table: three default terms inserted

**Expected Audit Log:**
- Event type: `AcademicYearActivated`
- Actor: Authenticated admin user ID
- Changes recorded: Terms auto-created

**Expected WebSocket Event:**
- `academic-year.activated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete auto-created terms and deactivate year

---

## ACY-008 Validation

**Objective:** Verify end date after start date and no overlapping years

**Preconditions:**
- Authenticated school admin
- Academic year "2025-2026" exists with dates 2025-01-15 to 2025-12-20

**Request:**
`POST /api/v1/schools/:schoolId/academic-years`
```json
{
  "name": "2026-2027",
  "startDate": "2026-12-01",
  "endDate": "2026-01-15"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "End date must be after start date"
}
```

**Request (overlap):**
`POST /api/v1/schools/:schoolId/academic-years`
```json
{
  "name": "2025-2026-B",
  "startDate": "2025-06-01",
  "endDate": "2025-12-20"
}
```

**Expected HTTP Status (overlap):** 400 Validation Error

**Expected Response Body (overlap):**
```json
{
  "error": "Validation Error",
  "message": "Academic year dates overlap with existing year"
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

## ACY-009 Audit

**Objective:** Verify academic year lifecycle is logged

**Preconditions:**
- Academic year `acy_001` has been through create, activate, close lifecycle

**Request:**
`GET /api/v1/schools/:schoolId/academic-years/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "AcademicYearCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "name": "2026-2027", "status": "inactive" }
    },
    {
      "event": "AcademicYearActivated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "status": { "from": "inactive", "to": "active" } }
    },
    {
      "event": "AcademicYearClosed",
      "actor": "usr_001",
      "timestamp": "2026-07-15T12:00:00.000Z",
      "changes": { "status": { "from": "active", "to": "closed" } }
    }
  ],
  "meta": {
    "total": 3
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

## ACY-010 Events

**Objective:** Verify AcademicYearActivated event is emitted via outbox

**Preconditions:**
- Authenticated school admin
- Academic year exists with ID `:id` and status `inactive`

**Request:**
`PATCH /api/v1/schools/:schoolId/academic-years/:id`
```json
{
  "isCurrent": true
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `academic_year` table: `isCurrent` set to `true`
- `event_outbox` table: new row with event type `AcademicYearActivated`

**Expected Audit Log:**
- Event type: `AcademicYearActivated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `academic-year.activated` (after outbox processor publishes)

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Deactivate year and remove outbox event
