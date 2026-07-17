# 5 — Role Test Cases

## Table of Contents

| ID | Title |
|---|---|
| ROL-001 | Assign Role |
| ROL-002 | Remove Role |
| ROL-003 | Multiple Roles |
| ROL-004 | Principal Permissions |
| ROL-005 | Teacher Permissions |
| ROL-006 | Bursar Permissions |
| ROL-007 | Deputy Permissions |
| ROL-008 | Parent Permissions |
| ROL-009 | Super Admin (platform) |
| ROL-010 | Role Conflict |

---

## ROL-001 Assign Role

**Objective:** Verify a role can be assigned to a membership

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id` in school `:schoolId`

**Request:**
`POST /api/v1/schools/:schoolId/memberships/:id/roles`
```json
{
  "role": "teacher"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "membershipId": "mem_001",
  "userId": "usr_003",
  "roles": ["teacher"],
  "updatedAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `membership_role` table: new row linking membership to teacher role

**Expected Audit Log:**
- Event type: `RoleAssigned`
- Actor: Authenticated admin user ID
- Changes recorded: `roles: [] → [teacher]`

**Expected WebSocket Event:**
- `role.assigned`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Remove assigned role

---

## ROL-002 Remove Role

**Objective:** Verify a role can be removed from a membership

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id` that has role `teacher` assigned
- Role ID `:roleId` is the teacher role

**Request:**
`DELETE /api/v1/schools/:schoolId/memberships/:id/roles/:roleId`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "membershipId": "mem_001",
  "userId": "usr_003",
  "roles": [],
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `membership_role` table: link row deleted

**Expected Audit Log:**
- Event type: `RoleRemoved`
- Actor: Authenticated admin user ID
- Changes recorded: `roles: [teacher] → []`

**Expected WebSocket Event:**
- `role.removed`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-assign role if needed

---

## ROL-003 Multiple Roles

**Objective:** Verify a user can hold multiple roles

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id`

**Request:**
`POST /api/v1/schools/:schoolId/memberships/:id/roles`
```json
{
  "roles": ["teacher", "bursar"]
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "membershipId": "mem_001",
  "userId": "usr_003",
  "roles": ["teacher", "bursar"],
  "updatedAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `membership_role` table: two rows inserted linking membership to teacher and bursar roles

**Expected Audit Log:**
- Event type: `RolesAssigned`
- Actor: Authenticated admin user ID
- Changes recorded: `roles: [] → [teacher, bursar]`

**Expected WebSocket Event:**
- `roles.assigned`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Remove both roles

---

## ROL-004 Principal Permissions

**Objective:** Verify Principal role can access all school endpoints

**Preconditions:**
- Authenticated user with Principal role in school `:schoolId`
- Principal role has full access permissions

**Request:**
`GET /api/v1/schools/:schoolId/students?page=1`
`POST /api/v1/schools/:schoolId/fee-structures`
`GET /api/v1/schools/:schoolId/reports/academic`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": []
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None (read operations)

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## ROL-005 Teacher Permissions

**Objective:** Verify Teacher can mark attendance and view students but cannot manage fees

**Preconditions:**
- Authenticated user with Teacher role in school `:schoolId`
- Teacher has permission to mark attendance and view students

**Request (allowed):**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "present"
}
```

**Request (forbidden):**
`POST /api/v1/schools/:schoolId/fee-structures`
```json
{
  "name": "Tuition Fee",
  "amount": 50000
}
```

**Expected HTTP Status (attendance):** 201 Created

**Expected HTTP Status (fee):** 403 Forbidden

**Expected Response Body (fee):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to manage fees"
}
```

**Expected Database Changes:**
- `attendance` table: new row (for the allowed request)

**Expected Audit Log:**
- Event type: `AttendanceMarked`
- Actor: Teacher user ID

**Expected WebSocket Event:**
- `attendance.marked` (for the allowed request)

**Cleanup:**
- Delete created attendance record

---

## ROL-006 Bursar Permissions

**Objective:** Verify Bursar can manage fees and payments but cannot manage students

**Preconditions:**
- Authenticated user with Bursar role in school `:schoolId`
- Bursar has permission to manage fees and payments

**Request (allowed):**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_001",
  "amount": 25000,
  "method": "cash"
}
```

**Request (forbidden):**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Test",
  "lastName": "Student"
}
```

**Expected HTTP Status (payment):** 201 Created

**Expected HTTP Status (student):** 403 Forbidden

**Expected Response Body (student):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to manage students"
}
```

**Expected Database Changes:**
- `payment` table: new row (for the allowed request)

**Expected Audit Log:**
- Event type: `PaymentRecorded`
- Actor: Bursar user ID

**Expected WebSocket Event:**
- `payment.received`

**Cleanup:**
- Delete created payment record

---

## ROL-007 Deputy Permissions

**Objective:** Verify Deputy can manage students and attendance but cannot delete records

**Preconditions:**
- Authenticated user with Deputy role in school `:schoolId`
- Deputy has permission to manage students and attendance

**Request (allowed):**
`PATCH /api/v1/students/:id`
```json
{
  "firstName": "Updated"
}
```

**Request (forbidden):**
`DELETE /api/v1/students/:id`

**Expected HTTP Status (update):** 200 OK

**Expected HTTP Status (delete):** 403 Forbidden

**Expected Response Body (delete):**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to delete student records"
}
```

**Expected Database Changes:**
- `student` table: `firstName` updated (for allowed request)

**Expected Audit Log:**
- Event type: `StudentUpdated`
- Actor: Deputy user ID

**Expected WebSocket Event:**
- `student.updated`

**Cleanup:**
- Revert student name change

---

## ROL-008 Parent Permissions

**Objective:** Verify Parent can only view their own children

**Preconditions:**
- Authenticated user with Parent role in school `:schoolId`
- Parent is linked to student `stu_001` but not to `stu_002`

**Request:**
`GET /api/v1/schools/:schoolId/students/stu_001`
`GET /api/v1/schools/:schoolId/students/stu_002`

**Expected HTTP Status (own child):** 200 OK

**Expected HTTP Status (other student):** 403 Forbidden

**Expected Response Body (own child):**
```json
{
  "id": "stu_001",
  "firstName": "Child",
  "lastName": "OfParent"
}
```

**Expected Response Body (other student):**
```json
{
  "error": "Forbidden",
  "message": "You can only view your own children's records"
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

## ROL-009 Super Admin (platform)

**Objective:** Verify Super Admin has full access to platform-level endpoints

**Preconditions:**
- Authenticated platform super admin

**Request:**
`GET /api/v1/platform/schools?page=1`
`POST /api/v1/platform/schools`
`GET /api/v1/platform/stats`

**Expected HTTP Status:** 200 OK (all)

**Expected Response Body:**
```json
{
  "data": []
}
```

**Expected Database Changes:**
- None (read operations)

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## ROL-010 Role Conflict

**Objective:** Verify user cannot be assigned mutually exclusive roles

**Preconditions:**
- Authenticated school admin
- Membership exists with ID `:id`
- System defines `student` and `teacher` as mutually exclusive

**Request:**
`POST /api/v1/schools/:schoolId/memberships/:id/roles`
```json
{
  "roles": ["teacher", "student"]
}
```

**Expected HTTP Status:** 400 Bad Request

**Expected Response Body:**
```json
{
  "error": "Bad Request",
  "message": "Roles 'teacher' and 'student' are mutually exclusive and cannot be assigned together"
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None (request rejected)

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required
