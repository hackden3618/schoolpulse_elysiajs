# 21 — Audit Log Test Cases

## Table of Contents

| ID | Title |
|---|---|
| AUD-001 | Login |
| AUD-002 | Logout |
| AUD-003 | Student Update |
| AUD-004 | Fee Payment |
| AUD-005 | Role Assignment |
| AUD-006 | Archive |
| AUD-007 | Restore |
| AUD-008 | Permission Change |
| AUD-009 | Export |
| AUD-010 | Delete |

---

## AUD-001 Login

**Objective:** Verify successful login is recorded with user, IP, and timestamp

**Preconditions:**
- User exists with valid credentials

**Request:**
`POST /api/v1/auth/login`
```json
{
  "email": "admin@greenvalley.school",
  "password": "ValidPassword123!"
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `UserLogin`
- Record includes: userId, email, IP address, user agent, timestamp, status `success`

**Expected Audit Log:**
- Event type: `UserLogin`
- Actor: User ID
- Details: `{ "ip": "192.168.1.100", "userAgent": "Mozilla/5.0...", "method": "password" }`

**Cleanup:**
- None required

---

## AUD-002 Logout

**Objective:** Verify logout is recorded

**Preconditions:**
- Authenticated user

**Request:**
`POST /api/v1/auth/logout`

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `UserLogout`
- Record includes: userId, timestamp, session duration if tracked

**Expected Audit Log:**
- Event type: `UserLogout`
- Actor: User ID
- Details: `{ "sessionId": "sess_001", "duration": 3600 }`

**Cleanup:**
- None required

---

## AUD-003 Student Update

**Objective:** Verify before/after state is captured when a student is updated

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id`

**Request:**
`PATCH /api/v1/schools/:schoolId/students/:id`
```json
{
  "firstName": "Alice",
  "lastName": "Nyambura",
  "phone": "+254712345680"
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `StudentUpdated`
- `changes` field contains JSON diff:
```json
{
  "lastName": { "from": "Wanjiku", "to": "Nyambura" },
  "phone": { "from": "+254712345679", "to": "+254712345680" }
}
```

**Expected Audit Log:**
- Event type: `StudentUpdated`
- Actor: Authenticated admin user ID
- Changes: Full before/after diff of modified fields

**Cleanup:**
- Revert student changes

---

## AUD-004 Fee Payment

**Objective:** Verify fee payment is logged with amount, method, and invoice

**Preconditions:**
- Authenticated bursar
- Invoice exists with ID `:invoiceId`

**Request:**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_001",
  "amount": 50000,
  "method": "cash"
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `audit_log` table: new row with event type `PaymentRecorded`
- Changes include:
```json
{
  "amount": 50000,
  "method": "cash",
  "invoiceId": "inv_001",
  "studentId": "stu_001",
  "receiptNumber": "RCP-001"
}
```

**Expected Audit Log:**
- Event type: `PaymentRecorded`
- Actor: Authenticated bursar user ID
- Details: Amount, method, invoice reference

**Cleanup:**
- Reverse payment

---

## AUD-005 Role Assignment

**Objective:** Verify admin assigning Teacher role to a user is logged

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:membershipId`

**Request:**
`POST /api/v1/schools/:schoolId/memberships/:membershipId/roles`
```json
{
  "role": "teacher"
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `RoleAssigned`
- Changes include:
```json
{
  "membershipId": "mem_001",
  "userId": "usr_003",
  "role": "teacher",
  "assignedBy": "usr_001"
}
```

**Expected Audit Log:**
- Event type: `RoleAssigned`
- Actor: usr_001 (admin)
- Details: Teacher role assigned to usr_003

**Cleanup:**
- Remove role assignment

---

## AUD-006 Archive

**Objective:** Verify student archive is logged with reason

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:schoolId/students/:id`

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `StudentArchived`
- Changes include:
```json
{
  "studentId": "stu_001",
  "reason": "Transferred to another school",
  "status": { "from": "active", "to": "archived" },
  "deletedAt": { "from": null, "to": "2026-07-15T12:00:00.000Z" }
}
```

**Expected Audit Log:**
- Event type: `StudentArchived`
- Actor: Authenticated admin user ID
- Details: Archive reason, before/after status

**Cleanup:**
- Restore student

---

## AUD-007 Restore

**Objective:** Verify student restore is logged

**Preconditions:**
- Authenticated school admin
- Student exists with ID `:id` and `deletedAt` set

**Request:**
`POST /api/v1/schools/:schoolId/students/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `StudentRestored`
- Changes include:
```json
{
  "studentId": "stu_001",
  "deletedAt": { "from": "2026-07-15T12:00:00.000Z", "to": null },
  "status": { "from": "archived", "to": "active" }
}
```

**Expected Audit Log:**
- Event type: `StudentRestored`
- Actor: Authenticated admin user ID
- Details: Restoration timestamp, before/after status

**Cleanup:**
- None required

---

## AUD-008 Permission Change

**Objective:** Verify role permission modifications are logged

**Preconditions:**
- Authenticated platform super admin
- Role exists with ID `:roleId`

**Request:**
`PATCH /api/v1/platform/roles/:roleId/permissions`
```json
{
  "permissions": {
    "student:delete": false,
    "student:archive": true
  }
}
```

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `RolePermissionsModified`
- Changes include:
```json
{
  "roleId": "role_001",
  "roleName": "Teacher",
  "permissions": {
    "student:delete": { "from": true, "to": false },
    "student:archive": { "from": false, "to": true }
  }
}
```

**Expected Audit Log:**
- Event type: `RolePermissionsModified`
- Actor: Authenticated super admin user ID
- Details: Modified permissions diff

**Cleanup:**
- Revert permission changes

---

## AUD-009 Export

**Objective:** Verify data export is logged

**Preconditions:**
- Authenticated school admin

**Request:**
`GET /api/v1/schools/:schoolId/students/export?format=csv`

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `DataExported`
- Changes include:
```json
{
  "exportType": "students",
  "format": "csv",
  "recordCount": 50,
  "filters": { "status": "active" }
}
```

**Expected Audit Log:**
- Event type: `DataExported`
- Actor: Authenticated user ID
- Details: Export type, format, record count

**Cleanup:**
- None required

---

## AUD-010 Delete

**Objective:** Verify soft delete is logged with actor information

**Preconditions:**
- Authenticated school admin
- Entity (e.g., class) exists with ID `:id`

**Request:**
`DELETE /api/v1/schools/:schoolId/classes/:id`

**Expected HTTP Status:** 200 OK

**Expected Database Changes:**
- `audit_log` table: new row with event type `ClassArchived`
- Changes include:
```json
{
  "entityType": "class",
  "entityId": "cls_001",
  "entityName": "Grade 7",
  "action": "soft_delete",
  "deletedAt": { "from": null, "to": "2026-07-15T12:00:00.000Z" },
  "status": { "from": "active", "to": "archived" },
  "actorIp": "192.168.1.100"
}
```

**Expected Audit Log:**
- Event type: `ClassArchived`
- Actor: Authenticated admin user ID
- Details: Entity type, ID, name, action, actor IP

**Cleanup:**
- Restore class
