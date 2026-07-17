# 3 — User Test Cases

## Table of Contents

| ID | Title |
|---|---|
| USR-001 | Create User |
| USR-002 | Duplicate Email |
| USR-003 | Duplicate Phone |
| USR-004 | Update User |
| USR-005 | Archive User |
| USR-006 | Restore User |
| USR-007 | Change Password |
| USR-008 | Reset Password |
| USR-009 | View Profile |
| USR-010 | Edit Profile |
| USR-011 | Invalid Email |
| USR-012 | Invalid Phone |
| USR-013 | Upload Avatar |
| USR-014 | Delete User |
| USR-015 | Soft Delete |
| USR-016 | Pagination |
| USR-017 | Search |
| USR-018 | Filters |
| USR-019 | Audit |
| USR-020 | Events |

---

## USR-001 Create User

**Objective:** Verify a new user can be created within a school context

**Preconditions:**
- Authenticated school admin
- School exists with ID `:id`
- No user with the same email or phone exists

**Request:**
`POST /api/v1/schools/:id/users`
```json
{
  "firstName": "Jane",
  "lastName": "Wanjiku",
  "email": "jane.wanjiku@greenvalley.school",
  "phone": "+254712345679",
  "password": "SecurePass123!",
  "role": "teacher"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "usr_002",
  "firstName": "Jane",
  "lastName": "Wanjiku",
  "email": "jane.wanjiku@greenvalley.school",
  "phone": "+254712345679",
  "role": "teacher",
  "status": "active",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `user` table: new row inserted
- `school_membership` table: new row linking user to school with specified role

**Expected Audit Log:**
- Event type: `UserCreated`
- Actor: Authenticated admin user ID
- Changes recorded: Full user object creation

**Expected WebSocket Event:**
- `user.created`

**Expected SMS/Email Notification:**
- Recipient: jane.wanjiku@greenvalley.school
- Template: `welcome_user` with login credentials

**Cleanup:**
- Archive created user and remove membership

---

## USR-002 Duplicate Email

**Objective:** Verify creating a user with an existing email returns conflict

**Preconditions:**
- A user with email "jane.wanjiku@greenvalley.school" already exists

**Request:**
`POST /api/v1/schools/:id/users`
```json
{
  "firstName": "Jane",
  "lastName": "Wanjiku",
  "email": "jane.wanjiku@greenvalley.school",
  "phone": "+254723456780",
  "password": "SecurePass123!"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A user with this email already exists",
  "field": "email"
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

## USR-003 Duplicate Phone

**Objective:** Verify creating a user with an existing phone number returns conflict

**Preconditions:**
- A user with phone "+254712345679" already exists

**Request:**
`POST /api/v1/schools/:id/users`
```json
{
  "firstName": "John",
  "lastName": "Kamau",
  "email": "john.kamau@greenvalley.school",
  "phone": "+254712345679",
  "password": "SecurePass123!"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A user with this phone number already exists",
  "field": "phone"
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

## USR-004 Update User

**Objective:** Verify a user's details can be updated

**Preconditions:**
- Authenticated school admin
- User exists with ID `:id`

**Request:**
`PATCH /api/v1/users/:id`
```json
{
  "firstName": "Jane",
  "lastName": "Nyambura",
  "phone": "+254712345680"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "usr_002",
  "firstName": "Jane",
  "lastName": "Nyambura",
  "email": "jane.wanjiku@greenvalley.school",
  "phone": "+254712345680",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `user` table: `lastName`, `phone` updated
- `updatedAt` timestamp refreshed

**Expected Audit Log:**
- Event type: `UserUpdated`
- Actor: Authenticated admin user ID
- Changes recorded: `lastName: Wanjiku → Nyambura`, `phone: +254712345679 → +254712345680`

**Expected WebSocket Event:**
- `user.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Revert user details to original values

---

## USR-005 Archive User

**Objective:** Verify a user can be soft-deleted (archived)

**Preconditions:**
- Authenticated school admin
- User exists with ID `:id`

**Request:**
`DELETE /api/v1/users/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "User archived successfully",
  "id": "usr_002"
}
```

**Expected Database Changes:**
- `user` table: `deletedAt` set to current timestamp
- `user` table: `status` set to `archived`

**Expected Audit Log:**
- Event type: `UserArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`, `status: active → archived`

**Expected WebSocket Event:**
- `user.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore user by clearing `deletedAt`

---

## USR-006 Restore User

**Objective:** Verify an archived user can be restored

**Preconditions:**
- Authenticated school admin
- User exists with ID `:id` and `deletedAt` is set

**Request:**
`POST /api/v1/users/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "User restored successfully",
  "id": "usr_002",
  "status": "active"
}
```

**Expected Database Changes:**
- `user` table: `deletedAt` set to `null`
- `user` table: `status` set to `active`

**Expected Audit Log:**
- Event type: `UserRestored`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: <timestamp> → null`, `status: archived → active`

**Expected WebSocket Event:**
- `user.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive user if needed

---

## USR-007 Change Password

**Objective:** Verify a user can change their own password

**Preconditions:**
- Authenticated as the user to change
- Current password known

**Request:**
`POST /api/v1/users/:id/change-password`
```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Password changed successfully"
}
```

**Expected Database Changes:**
- `user` table: `passwordHash` updated with bcrypt hash of new password

**Expected Audit Log:**
- Event type: `PasswordChanged`
- Actor: User ID (self)
- Changes recorded: `passwordHash: updated`

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- Recipient: User email
- Template: `password_changed` (notification only, not the new password)

**Cleanup:**
- Reset password to original value

---

## USR-008 Reset Password

**Objective:** Verify an admin can reset another user's password

**Preconditions:**
- Authenticated school admin
- Target user exists with ID `:id`

**Request:**
`POST /api/v1/users/:id/reset-password`
```json
{
  "newPassword": "TemporaryPass789!"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "Password reset successfully. User must change password on next login."
}
```

**Expected Database Changes:**
- `user` table: `passwordHash` updated
- `user` table: `mustChangePassword` set to `true`

**Expected Audit Log:**
- Event type: `PasswordReset`
- Actor: Authenticated admin user ID
- Changes recorded: `passwordHash: updated`, `mustChangePassword: false → true`

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- Recipient: Target user email
- Template: `password_reset` with instructions

**Cleanup:**
- Reset password to original value

---

## USR-009 View Profile

**Objective:** Verify a user can view their own profile

**Preconditions:**
- Authenticated as the user
- User exists with ID `:id`

**Request:**
`GET /api/v1/users/:id/profile`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "usr_002",
  "firstName": "Jane",
  "lastName": "Wanjiku",
  "email": "jane.wanjiku@greenvalley.school",
  "phone": "+254712345679",
  "avatarUrl": null,
  "role": "teacher",
  "schools": [
    {
      "id": "clx...",
      "name": "Green Valley Primary School",
      "role": "teacher"
    }
  ],
  "createdAt": "2026-07-15T10:00:00.000Z"
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

## USR-010 Edit Profile

**Objective:** Verify a user can edit their own profile (name, phone)

**Preconditions:**
- Authenticated as the user
- User exists with ID `:id`

**Request:**
`PATCH /api/v1/users/:id/profile`
```json
{
  "firstName": "Jane",
  "lastName": "Wanjiku-Kamau",
  "phone": "+254712345681"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "usr_002",
  "firstName": "Jane",
  "lastName": "Wanjiku-Kamau",
  "phone": "+254712345681",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `user` table: `lastName`, `phone` updated

**Expected Audit Log:**
- Event type: `ProfileUpdated`
- Actor: User ID (self)
- Changes recorded: `lastName: Wanjiku → Wanjiku-Kamau`, `phone: +254712345679 → +254712345681`

**Expected WebSocket Event:**
- `user.profile.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Revert profile changes

---

## USR-011 Invalid Email

**Objective:** Verify creating a user with a malformed email returns validation error

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:id/users`
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "not-an-email",
  "phone": "+254712345682",
  "password": "SecurePass123!"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Invalid email format",
  "field": "email"
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

## USR-012 Invalid Phone

**Objective:** Verify creating a user with an invalid phone format returns validation error

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:id/users`
```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@test.com",
  "phone": "12345",
  "password": "SecurePass123!"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Invalid phone number format. Must be in international format (e.g., +254712345678)",
  "field": "phone"
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

## USR-013 Upload Avatar

**Objective:** Verify a user can upload a profile avatar

**Preconditions:**
- Authenticated as the user
- User exists with ID `:id`
- Valid image file under 2MB

**Request:**
`POST /api/v1/users/:id/avatar`
```
Content-Type: multipart/form-data
file: [binary image data]
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "avatarUrl": "https://cdn.schoolpulse.com/avatars/usr_002-1721059200.png"
}
```

**Expected Database Changes:**
- `user` table: `avatarUrl` field updated

**Expected Audit Log:**
- Event type: `AvatarUpdated`
- Actor: User ID (self)
- Changes recorded: `avatarUrl: null → <url>`

**Expected WebSocket Event:**
- `user.avatar.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Remove uploaded avatar file

---

## USR-014 Delete User

**Objective:** Verify hard delete is not allowed for users with history

**Preconditions:**
- Authenticated school admin
- User exists with ID `:id` that has associated activity (attendance marks, enrollments, etc.)

**Request:**
`DELETE /api/v1/users/:id?hard=true`

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "Cannot permanently delete user with 15 associated records. Soft delete instead."
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

## USR-015 Soft Delete

**Objective:** Verify soft delete sets deletedAt but preserves user data

**Preconditions:**
- Authenticated school admin
- User exists with ID `:id`

**Request:**
`DELETE /api/v1/users/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "User archived successfully",
  "id": "usr_002"
}
```

**Expected Database Changes:**
- `user` table: `deletedAt` set to current timestamp
- `user` table: `status` set to `archived`
- All user data preserved in database

**Expected Audit Log:**
- Event type: `UserArchived`
- Actor: Authenticated admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`

**Expected WebSocket Event:**
- `user.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore user

---

## USR-016 Pagination

**Objective:** Verify users can be paginated within a school

**Preconditions:**
- Authenticated school admin
- School has 25+ users

**Request:**
`GET /api/v1/schools/:id/users?page=1&limit=20`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "usr_001", "firstName": "John", "lastName": "Kamau", "email": "john@school.com" },
    { "id": "usr_002", "firstName": "Jane", "lastName": "Wanjiku", "email": "jane@school.com" }
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

## USR-017 Search

**Objective:** Verify users can be searched by name, email, or phone

**Preconditions:**
- Authenticated school admin
- Users exist matching search criteria

**Request:**
`GET /api/v1/schools/:id/users?q=Jane`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "usr_002", "firstName": "Jane", "lastName": "Wanjiku", "email": "jane@school.com" },
    { "id": "usr_005", "firstName": "Janet", "lastName": "Muthoni", "email": "janet@school.com" }
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

## USR-018 Filters

**Objective:** Verify users can be filtered by role and status

**Preconditions:**
- Authenticated school admin
- Users exist with various roles and statuses

**Request:**
`GET /api/v1/schools/:id/users?role=teacher&status=active`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "usr_002", "firstName": "Jane", "role": "teacher", "status": "active" }
  ],
  "meta": {
    "total": 1,
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

## USR-019 Audit

**Objective:** Verify user creation and modification events are logged

**Preconditions:**
- Authenticated school admin
- User with ID `:id` exists and has been modified

**Request:**
`GET /api/v1/users/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "UserCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "action": "create", "entity": "user" }
    },
    {
      "event": "UserUpdated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "lastName": { "from": "Wanjiku", "to": "Nyambura" } }
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
- The retrieval itself is optionally logged

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## USR-020 Events

**Objective:** Verify UserCreated event is emitted via the outbox pattern

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:id/users`
```json
{
  "firstName": "Peter",
  "lastName": "Mwangi",
  "email": "peter.mwangi@greenvalley.school",
  "phone": "+254712345683",
  "password": "SecurePass123!",
  "role": "teacher"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "usr_010",
  "firstName": "Peter",
  "lastName": "Mwangi",
  "email": "peter.mwangi@greenvalley.school",
  "status": "active"
}
```

**Expected Database Changes:**
- `user` table: new row inserted
- `event_outbox` table: new row with event type `UserCreated`, aggregate ID, and payload

**Expected Audit Log:**
- Event type: `UserCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `user.created` (after outbox processor publishes)

**Expected SMS/Email Notification:**
- Recipient: peter.mwangi@greenvalley.school
- Template: `welcome_user`

**Cleanup:**
- Archive created user and remove outbox event
