# 4 — Membership Test Cases

## Table of Contents

| ID | Title |
|---|---|
| MEM-001 | Add User to School |
| MEM-002 | Duplicate Membership |
| MEM-003 | Suspend Membership |
| MEM-004 | Resume Membership |
| MEM-005 | Remove Membership |
| MEM-006 | Multiple Schools |
| MEM-007 | Membership Permissions |
| MEM-008 | Transfer Membership |
| MEM-009 | Archive Membership |
| MEM-010 | Audit |

---

## MEM-001 Add User to School

**Objective:** Verify a user can be added as a member of a school

**Preconditions:**
- Authenticated school admin
- School exists with ID `:id`
- User exists with ID `usr_003`
- User is not already a member of this school

**Request:**
`POST /api/v1/schools/:id/memberships`
```json
{
  "userId": "usr_003",
  "role": "teacher"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "mem_001",
  "userId": "usr_003",
  "schoolId": "clx...",
  "role": "teacher",
  "status": "active",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `school_membership` table: new row inserted with user, school, role, status

**Expected Audit Log:**
- Event type: `MembershipCreated`
- Actor: Authenticated admin user ID
- Changes recorded: User added to school with role

**Expected WebSocket Event:**
- `membership.created`

**Expected SMS/Email Notification:**
- Recipient: User email
- Template: `added_to_school`

**Cleanup:**
- Remove created membership

---

## MEM-002 Duplicate Membership

**Objective:** Verify adding the same user to the same school returns conflict

**Preconditions:**
- User `usr_003` is already a member of school `clx...`

**Request:**
`POST /api/v1/schools/:id/memberships`
```json
{
  "userId": "usr_003",
  "role": "teacher"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "User is already a member of this school",
  "field": "userId"
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

## MEM-003 Suspend Membership

**Objective:** Verify a membership can be suspended

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id` and status `active`

**Request:**
`PATCH /api/v1/schools/:id/memberships/:id`
```json
{
  "status": "suspended"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "mem_001",
  "status": "suspended",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `school_membership` table: `status` changed from `active` to `suspended`

**Expected Audit Log:**
- Event type: `MembershipSuspended`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active → suspended`

**Expected WebSocket Event:**
- `membership.suspended`

**Expected SMS/Email Notification:**
- Recipient: Member user email
- Template: `membership_suspended`

**Cleanup:**
- Resume membership to active

---

## MEM-004 Resume Membership

**Objective:** Verify a suspended membership can be resumed

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id` and status `suspended`

**Request:**
`PATCH /api/v1/schools/:id/memberships/:id`
```json
{
  "status": "active"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "mem_001",
  "status": "active",
  "updatedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `school_membership` table: `status` changed from `suspended` to `active`

**Expected Audit Log:**
- Event type: `MembershipResumed`
- Actor: Authenticated admin user ID
- Changes recorded: `status: suspended → active`

**Expected WebSocket Event:**
- `membership.resumed`

**Expected SMS/Email Notification:**
- Recipient: Member user email
- Template: `membership_resumed`

**Cleanup:**
- None required

---

## MEM-005 Remove Membership

**Objective:** Verify a membership can be soft-deleted

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:id/memberships/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Membership removed successfully",
  "id": "mem_001"
}
```

**Expected Database Changes:**
- `school_membership` table: `deletedAt` set to current timestamp
- `school_membership` table: `status` set to `removed`

**Expected Audit Log:**
- Event type: `MembershipRemoved`
- Actor: Authenticated admin user ID
- Changes recorded: `status: active → removed`, `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `membership.removed`

**Expected SMS/Email Notification:**
- Recipient: Member user email
- Template: `membership_removed`

**Cleanup:**
- Restore membership

---

## MEM-006 Multiple Schools

**Objective:** Verify a user can belong to multiple schools

**Preconditions:**
- Authenticated platform super admin
- User `usr_003` exists
- Two schools exist: `clx_school_a` and `clx_school_b`

**Request:**
`POST /api/v1/schools/clx_school_b/memberships`
```json
{
  "userId": "usr_003",
  "role": "teacher"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "mem_002",
  "userId": "usr_003",
  "schoolId": "clx_school_b",
  "role": "teacher",
  "status": "active"
}
```

**Expected Database Changes:**
- `school_membership` table: new row for user `usr_003` in school `clx_school_b`
- User now has two active memberships

**Expected Audit Log:**
- Event type: `MembershipCreated`
- Actor: Authenticated user ID

**Expected WebSocket Event:**
- `membership.created`

**Expected SMS/Email Notification:**
- Recipient: usr_003 email
- Template: `added_to_school`

**Cleanup:**
- Remove membership from school B

---

## MEM-007 Membership Permissions

**Objective:** Verify permissions cascade correctly from membership roles

**Preconditions:**
- User `usr_003` has membership in school `clx...` with role `teacher`
- Teacher role has permission to mark attendance but not manage fees

**Request:**
`POST /api/v1/schools/:id/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "present"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "att_001",
  "status": "present",
  "marked": true
}
```

**Expected Database Changes:**
- `attendance` table: new row inserted

**Expected Audit Log:**
- Event type: `AttendanceMarked`
- Actor: usr_003

**Cleanup:**
- Delete created attendance record

---

## MEM-008 Transfer Membership

**Objective:** Verify a user can be transferred from one school to another

**Preconditions:**
- Authenticated platform super admin
- User `usr_003` is a member of school A
- School B exists

**Request:**
`POST /api/v1/schools/:id/memberships/:id/transfer`
```json
{
  "targetSchoolId": "clx_school_b"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "newMembershipId": "mem_003",
  "userId": "usr_003",
  "schoolId": "clx_school_b",
  "status": "active"
}
```

**Expected Database Changes:**
- `school_membership` table: original membership archived (`deletedAt` set)
- `school_membership` table: new membership created for school B

**Expected Audit Log:**
- Event type: `MembershipTransferred`
- Actor: Authenticated user ID
- Changes recorded: from school A to school B

**Expected WebSocket Event:**
- `membership.transferred`

**Expected SMS/Email Notification:**
- Recipient: User email
- Template: `membership_transferred`

**Cleanup:**
- Reverse transfer or clean up both memberships

---

## MEM-009 Archive Membership

**Objective:** Verify membership soft delete preserves data

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:id/memberships/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Membership removed successfully",
  "id": "mem_001"
}
```

**Expected Database Changes:**
- `school_membership` table: `deletedAt` set to current timestamp
- All associated data preserved

**Expected Audit Log:**
- Event type: `MembershipRemoved`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `membership.removed`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore membership

---

## MEM-010 Audit

**Objective:** Verify all membership status changes are logged

**Preconditions:**
- Authenticated school admin
- Membership with ID `:id` has undergone status changes

**Request:**
`GET /api/v1/schools/:id/memberships/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "MembershipCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "status": "active" }
    },
    {
      "event": "MembershipSuspended",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "status": { "from": "active", "to": "suspended" } }
    },
    {
      "event": "MembershipResumed",
      "actor": "usr_001",
      "timestamp": "2026-07-15T12:00:00.000Z",
      "changes": { "status": { "from": "suspended", "to": "active" } }
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
- Retrieval of audit logs is optionally logged

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required
