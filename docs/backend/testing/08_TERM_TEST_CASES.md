# 8 — Term Test Cases

## Table of Contents

| ID | Title |
|---|---|
| TRM-001 | Create Term |
| TRM-002 | Duplicate Term |
| TRM-003 | Activate Term |
| TRM-004 | Close Term |
| TRM-005 | Archive Term |
| TRM-006 | Restore Term |
| TRM-007 | Invalid Dates |
| TRM-008 | Overlapping Terms |
| TRM-009 | Audit |
| TRM-010 | Events |

---

## TRM-001 Create Term

**Objective:** Verify a term can be created within an academic year

**Preconditions:**
- Authenticated school admin
- Academic year exists with ID `:yearId` in school `:schoolId`

**Request:**
`POST /api/v1/schools/:schoolId/terms`
```json
{
  "academicYearId": "acy_001",
  "name": "Term 1",
  "startDate": "2026-01-15",
  "endDate": "2026-04-15"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "trm_001",
  "academicYearId": "acy_001",
  "name": "Term 1",
  "startDate": "2026-01-15",
  "endDate": "2026-04-15",
  "status": "inactive",
  "isCurrent": false,
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `term` table: new row inserted

**Expected Audit Log:**
- Event type: `TermCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `term.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created term

---

## TRM-002 Duplicate Term

**Objective:** Verify creating a term with duplicate name in the same year returns conflict

**Preconditions:**
- Term "Term 1" already exists in academic year `acy_001`

**Request:**
`POST /api/v1/schools/:schoolId/terms`
```json
{
  "academicYearId": "acy_001",
  "name": "Term 1",
  "startDate": "2026-05-01",
  "endDate": "2026-08-15"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A term with this name already exists in this academic year",
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

## TRM-003 Activate Term

**Objective:** Verify a term can be activated as current term

**Preconditions:**
- Authenticated school admin
- Term exists with ID `:id` and status `inactive`
- No other term is current

**Request:**
`PATCH /api/v1/schools/:schoolId/terms/:id`
```json
{
  "isCurrent": true
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "trm_001",
  "name": "Term 1",
  "status": "active",
  "isCurrent": true,
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `term` table: `isCurrent` set to `true`, `status` set to `active`

**Expected Audit Log:**
- Event type: `TermActivated`
- Actor: Authenticated admin user ID
- Changes recorded: `isCurrent: false → true`, `status: inactive → active`

**Expected WebSocket Event:**
- `term.activated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Deactivate term

---

## TRM-004 Close Term

**Objective:** Verify a term can be closed

**Preconditions:**
- Authenticated school admin
- Term exists with ID `:id` and status `active`

**Request:**
`PATCH /api/v1/schools/:schoolId/terms/:id`
```json
{
  "status": "closed"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "trm_001",
  "name": "Term 1",
  "status": "closed",
  "isCurrent": false,
  "updatedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `term` table: `status` set to `closed`, `isCurrent` set to `false`

**Expected Audit Log:**
- Event type: `TermClosed`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active → closed`

**Expected WebSocket Event:**
- `term.closed`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Reopen term

---

## TRM-005 Archive Term

**Objective:** Verify a term can be soft-deleted

**Preconditions:**
- Authenticated school admin
- Term exists with ID `:id` and status `closed`

**Request:**
`DELETE /api/v1/schools/:schoolId/terms/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Term archived successfully",
  "id": "trm_001"
}
```

**Expected Database Changes:**
- `term` table: `deletedAt` set to current timestamp

**Expected Audit Log:**
- Event type: `TermArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `term.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore term

---

## TRM-006 Restore Term

**Objective:** Verify an archived term can be restored

**Preconditions:**
- Authenticated school admin
- Term exists with ID `:id` and `deletedAt` set

**Request:**
`POST /api/v1/schools/:schoolId/terms/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Term restored successfully",
  "id": "trm_001"
}
```

**Expected Database Changes:**
- `term` table: `deletedAt` cleared to `null`

**Expected Audit Log:**
- Event type: `TermRestored`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: <timestamp> → null`

**Expected WebSocket Event:**
- `term.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive if needed

---

## TRM-007 Invalid Dates

**Objective:** Verify creating a term with end date before start date returns 400

**Preconditions:**
- Authenticated school admin
- Academic year exists

**Request:**
`POST /api/v1/schools/:schoolId/terms`
```json
{
  "academicYearId": "acy_001",
  "name": "Invalid Term",
  "startDate": "2026-04-15",
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

## TRM-008 Overlapping Terms

**Objective:** Verify terms within the same academic year cannot overlap

**Preconditions:**
- Term "Term 1" exists with dates 2026-01-15 to 2026-04-15 in year `acy_001`

**Request:**
`POST /api/v1/schools/:schoolId/terms`
```json
{
  "academicYearId": "acy_001",
  "name": "Term 1b",
  "startDate": "2026-03-01",
  "endDate": "2026-06-01"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Term dates overlap with existing term 'Term 1' (2026-01-15 to 2026-04-15)"
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

## TRM-009 Audit

**Objective:** Verify term lifecycle is logged

**Preconditions:**
- Term `trm_001` has been created, activated, and closed

**Request:**
`GET /api/v1/schools/:schoolId/terms/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "TermCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "name": "Term 1", "status": "inactive" }
    },
    {
      "event": "TermActivated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "status": { "from": "inactive", "to": "active" } }
    },
    {
      "event": "TermClosed",
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

## TRM-010 Events

**Objective:** Verify TermActivated event is emitted via outbox

**Preconditions:**
- Authenticated school admin
- Term exists with ID `:id` and status `inactive`

**Request:**
`PATCH /api/v1/schools/:schoolId/terms/:id`
```json
{
  "isCurrent": true
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `term` table: `isCurrent` set to `true`
- `event_outbox` table: new row with event type `TermActivated`

**Expected Audit Log:**
- Event type: `TermActivated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `term.activated` (after outbox processor publishes)

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Deactivate term and remove outbox event
