# 6 — Stream Test Cases

## Table of Contents

| ID | Title |
|---|---|
| STR-001 | Create Stream |
| STR-002 | Duplicate Stream |
| STR-003 | Rename Stream |
| STR-004 | Archive Stream |
| STR-005 | Restore Stream |
| STR-006 | Delete Stream |
| STR-007 | Stream Statistics |
| STR-008 | Search |
| STR-009 | Pagination |
| STR-010 | Audit |

---

## STR-001 Create Stream

**Objective:** Verify a stream can be created within a class

**Preconditions:**
- Authenticated school admin
- Class exists with ID `:id` in school `:schoolId`

**Request:**
`POST /api/v1/schools/:schoolId/classes/:id/streams`
```json
{
  "name": "East"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "str_001",
  "name": "East",
  "classId": "cls_001",
  "schoolId": "clx...",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `stream` table: new row inserted

**Expected Audit Log:**
- Event type: `StreamCreated`
- Actor: Authenticated admin user ID
- Changes recorded: Stream creation details

**Expected WebSocket Event:**
- `stream.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created stream

---

## STR-002 Duplicate Stream

**Objective:** Verify creating a stream with duplicate name in same class returns conflict

**Preconditions:**
- Stream named "East" already exists in class `cls_001`

**Request:**
`POST /api/v1/schools/:schoolId/classes/:id/streams`
```json
{
  "name": "East"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A stream with this name already exists in this class",
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

## STR-003 Rename Stream

**Objective:** Verify a stream can be renamed

**Preconditions:**
- Authenticated school admin
- Stream exists with ID `:id`

**Request:**
`PATCH /api/v1/schools/:schoolId/classes/:classId/streams/:id`
```json
{
  "name": "West"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "str_001",
  "name": "West",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `stream` table: `name` updated from "East" to "West"

**Expected Audit Log:**
- Event type: `StreamUpdated`
- Actor: Authenticated admin user ID
- Changes recorded: `name: East → West`

**Expected WebSocket Event:**
- `stream.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Revert stream name to "East"

---

## STR-004 Archive Stream

**Objective:** Verify a stream can be soft-deleted

**Preconditions:**
- Authenticated school admin
- Stream exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:schoolId/classes/:classId/streams/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Stream archived successfully",
  "id": "str_001"
}
```

**Expected Database Changes:**
- `stream` table: `deletedAt` set to current timestamp

**Expected Audit Log:**
- Event type: `StreamArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `stream.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore stream

---

## STR-005 Restore Stream

**Objective:** Verify an archived stream can be restored

**Preconditions:**
- Authenticated school admin
- Stream exists with ID `:id` and `deletedAt` is set

**Request:**
`POST /api/v1/schools/:schoolId/classes/:classId/streams/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Stream restored successfully",
  "id": "str_001",
  "status": "active"
}
```

**Expected Database Changes:**
- `stream` table: `deletedAt` cleared to `null`

**Expected Audit Log:**
- Event type: `StreamRestored`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: <timestamp> → null`

**Expected WebSocket Event:**
- `stream.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive stream if needed

---

## STR-006 Delete Stream

**Objective:** Verify a stream can only be hard-deleted if it has no students

**Preconditions:**
- Authenticated school admin
- Stream exists with ID `:id` that has no enrolled students

**Request:**
`DELETE /api/v1/schools/:schoolId/classes/:classId/streams/:id?hard=true`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Stream permanently deleted",
  "id": "str_001"
}
```

**Expected Database Changes:**
- `stream` table: row permanently deleted

**Expected Audit Log:**
- Event type: `StreamDeleted`
- Actor: Authenticated admin user ID
- Changes recorded: Stream permanently deleted

**Expected WebSocket Event:**
- `stream.deleted`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-create stream if needed

---

## STR-007 Stream Statistics

**Objective:** Verify stream statistics show correct student count

**Preconditions:**
- Stream exists with ID `:id`
- Stream has 25 enrolled students

**Request:**
`GET /api/v1/schools/:schoolId/classes/:classId/streams/:id/stats`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "streamId": "str_001",
  "name": "East",
  "totalStudents": 25,
  "maleStudents": 14,
  "femaleStudents": 11,
  "attendanceRate": 95.5
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

## STR-008 Search

**Objective:** Verify streams can be searched by name

**Preconditions:**
- Authenticated school admin
- Multiple streams exist with names containing "East"

**Request:**
`GET /api/v1/schools/:schoolId/classes/:classId/streams?q=East`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "str_001", "name": "East", "studentCount": 25 },
    { "id": "str_002", "name": "East-A", "studentCount": 20 }
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

## STR-009 Pagination

**Objective:** Verify streams are paginated

**Preconditions:**
- Authenticated school admin
- Class has 25+ streams

**Request:**
`GET /api/v1/schools/:schoolId/classes/:classId/streams?page=1&limit=20`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "str_001", "name": "East" },
    { "id": "str_002", "name": "West" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 25,
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

## STR-010 Audit

**Objective:** Verify stream CRUD operations are logged

**Preconditions:**
- Stream with ID `:id` has been created, renamed, and archived

**Request:**
`GET /api/v1/schools/:schoolId/classes/:classId/streams/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "StreamCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "name": "East" }
    },
    {
      "event": "StreamUpdated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "name": { "from": "East", "to": "West" } }
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
- Retrieval is optionally logged

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required
