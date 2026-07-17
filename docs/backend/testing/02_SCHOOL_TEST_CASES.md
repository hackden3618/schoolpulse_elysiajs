# 2 — School Test Cases

## Table of Contents

| ID | Title |
|---|---|
| SCH-001 | Create School |
| SCH-002 | Duplicate Name |
| SCH-003 | Duplicate Phone |
| SCH-004 | Duplicate Email |
| SCH-005 | Invalid Website |
| SCH-006 | Upload Logo |
| SCH-007 | Update School |
| SCH-008 | Archive School |
| SCH-009 | Restore School |
| SCH-010 | Subscription Activated |
| SCH-011 | Subscription Expired |
| SCH-012 | Subscription Suspended |
| SCH-013 | School Statistics |
| SCH-014 | Delete Forbidden |
| SCH-015 | Soft Delete |
| SCH-016 | Pagination |
| SCH-017 | Search |
| SCH-018 | Filters |
| SCH-019 | Sorting |
| SCH-020 | Audit Log |

---

## SCH-001 Create School

**Objective:** Verify a new school can be created with required fields

**Preconditions:**
- Authenticated platform super admin
- No school with the same name, phone, or email exists

**Request:**
`POST /api/v1/schools`
```json
{
  "name": "Green Valley Primary School",
  "phone": "+254712345678",
  "email": "info@greenvalley.school",
  "website": "https://greenvalley.school",
  "level": "primary",
  "address": "123 Valley Road, Nairobi",
  "country": "Kenya",
  "timezone": "Africa/Nairobi",
  "currency": "KES"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "clx...",
  "name": "Green Valley Primary School",
  "phone": "+254712345678",
  "email": "info@greenvalley.school",
  "website": "https://greenvalley.school",
  "level": "primary",
  "address": "123 Valley Road, Nairobi",
  "country": "Kenya",
  "timezone": "Africa/Nairobi",
  "currency": "KES",
  "status": "active",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `school` table: new row inserted with all provided fields
- `subscription` table: new row created with status `trial`, tier `free`, 30-day trial end date

**Expected Audit Log:**
- Event type: `SchoolCreated`
- Actor: Authenticated admin user ID
- Changes recorded: Full school object creation

**Expected WebSocket Event:**
- `school.created`

**Expected SMS/Email Notification:**
- Not applicable

**Cleanup:**
- Delete created school and associated subscription

---

## SCH-002 Duplicate Name

**Objective:** Verify creating a school with an existing name returns conflict

**Preconditions:**
- A school with name "Green Valley Primary School" already exists

**Request:**
`POST /api/v1/schools`
```json
{
  "name": "Green Valley Primary School",
  "phone": "+254723456789",
  "email": "info@gvps2.school"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A school with this name already exists",
  "field": "name"
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None (request rejected before any mutation)

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required

---

## SCH-003 Duplicate Phone

**Objective:** Verify creating a school with an existing phone returns conflict

**Preconditions:**
- A school with phone "+254712345678" already exists

**Request:**
`POST /api/v1/schools`
```json
{
  "name": "Sunrise Academy",
  "phone": "+254712345678",
  "email": "info@sunrise.school"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A school with this phone number already exists",
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

## SCH-004 Duplicate Email

**Objective:** Verify creating a school with an existing email returns conflict

**Preconditions:**
- A school with email "info@greenvalley.school" already exists

**Request:**
`POST /api/v1/schools`
```json
{
  "name": "Hilltop School",
  "phone": "+254734567890",
  "email": "info@greenvalley.school"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "A school with this email already exists",
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

## SCH-005 Invalid Website

**Objective:** Verify creating a school with an invalid website URL returns validation error

**Preconditions:**
- Authenticated platform super admin

**Request:**
`POST /api/v1/schools`
```json
{
  "name": "Test School",
  "phone": "+254745678901",
  "email": "test@test.school",
  "website": "not-a-url"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Invalid website URL format",
  "field": "website"
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

## SCH-006 Upload Logo

**Objective:** Verify school logo can be uploaded and stored

**Preconditions:**
- Authenticated school admin
- School exists with ID `:id`
- Valid image file (PNG, JPEG, WEBP) under 2MB

**Request:**
`POST /api/v1/schools/:id/logo`
```
Content-Type: multipart/form-data
file: [binary image data]
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "logoUrl": "https://cdn.schoolpulse.com/schools/clx.../logo-1721059200.png"
}
```

**Expected Database Changes:**
- `school` table: `logoUrl` field updated with CDN URL

**Expected Audit Log:**
- Event type: `SchoolLogoUpdated`
- Actor: Authenticated admin user ID
- Changes recorded: `logoUrl` before → after

**Expected WebSocket Event:**
- `school.logo.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete uploaded logo file from CDN/storage

---

## SCH-007 Update School

**Objective:** Verify school details can be updated

**Preconditions:**
- Authenticated school admin
- School exists with ID `:id`

**Request:**
`PATCH /api/v1/schools/:id`
```json
{
  "name": "Green Valley Academy",
  "address": "456 Valley Road, Nairobi",
  "website": "https://greenvalleyacademy.school"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "clx...",
  "name": "Green Valley Academy",
  "address": "456 Valley Road, Nairobi",
  "website": "https://greenvalleyacademy.school",
  "updatedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `school` table: `name`, `address`, `website` fields updated
- `updatedAt` timestamp refreshed

**Expected Audit Log:**
- Event type: `SchoolUpdated`
- Actor: Authenticated admin user ID
- Changes recorded: `name: Green Valley Primary School → Green Valley Academy`, `address: 123 Valley Road → 456 Valley Road`

**Expected WebSocket Event:**
- `school.updated`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Revert school details to original values

---

## SCH-008 Archive School

**Objective:** Verify school can be soft-deleted (archived)

**Preconditions:**
- Authenticated platform super admin
- School exists with ID `:id`
- School has no active students or memberships

**Request:**
`DELETE /api/v1/schools/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "School archived successfully",
  "id": "clx..."
}
```

**Expected Database Changes:**
- `school` table: `deletedAt` field set to current timestamp
- `school` table: `status` set to `archived`

**Expected Audit Log:**
- Event type: `SchoolArchived`
- Actor: Authenticated super admin user ID
- Changes recorded: `deletedAt: null → <timestamp>`, `status: active → archived`

**Expected WebSocket Event:**
- `school.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore school by clearing `deletedAt`

---

## SCH-009 Restore School

**Objective:** Verify an archived school can be restored

**Preconditions:**
- Authenticated platform super admin
- School exists with ID `:id` and `deletedAt` is set

**Request:**
`POST /api/v1/schools/:id/restore`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "School restored successfully",
  "id": "clx...",
  "status": "active"
}
```

**Expected Database Changes:**
- `school` table: `deletedAt` set to `null`
- `school` table: `status` set to `active`

**Expected Audit Log:**
- Event type: `SchoolRestored`
- Actor: Authenticated super admin user ID
- Changes recorded: `deletedAt: <timestamp> → null`, `status: archived → active`

**Expected WebSocket Event:**
- `school.restored`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Re-archive school if needed

---

## SCH-010 Subscription Activated

**Objective:** Verify subscription status changes to active after payment

**Preconditions:**
- School exists with ID `:id`
- Subscription exists with status `trial` or `pending`
- Payment received for subscription plan

**Request:**
`POST /api/v1/schools/:id/subscriptions/activate`
```json
{
  "plan": "professional",
  "paymentReference": "MPESA-ABC123"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "schoolId": "clx...",
  "plan": "professional",
  "status": "active",
  "startDate": "2026-07-15T00:00:00.000Z",
  "endDate": "2027-07-15T00:00:00.000Z"
}
```

**Expected Database Changes:**
- `subscription` table: `status` changed from `trial` to `active`
- `subscription` table: `plan` set to `professional`
- `subscription` table: `startDate`, `endDate` set

**Expected Audit Log:**
- Event type: `SubscriptionActivated`
- Actor: System (automatic)
- Changes recorded: `status: trial → active`, `plan: free → professional`

**Expected WebSocket Event:**
- `subscription.activated`

**Expected SMS/Email Notification:**
- Recipient: School admin email
- Template: `subscription_activated`

**Cleanup:**
- Revert subscription to previous state

---

## SCH-011 Subscription Expired

**Objective:** Verify expired subscription blocks school access

**Preconditions:**
- School exists with ID `:id`
- Subscription `endDate` is in the past
- Subscription `status` is `expired`

**Request:**
`GET /api/v1/schools/:id/students?page=1`

**Expected HTTP Status:** 403 Forbidden

**Expected Response Body:**
```json
{
  "error": "Forbidden",
  "message": "School subscription has expired. Please renew to continue using SchoolPulse."
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None (access blocked at middleware level)

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- Recipient: School admin
- Template: `subscription_expired`

**Cleanup:**
- Reactivate subscription for testing

---

## SCH-012 Subscription Suspended

**Objective:** Verify non-payment suspension blocks school access

**Preconditions:**
- School exists with ID `:id`
- Subscription `status` is `suspended` due to non-payment

**Request:**
`POST /api/v1/schools/:id/students`
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected HTTP Status:** 403 Forbidden

**Expected Response Body:**
```json
{
  "error": "Forbidden",
  "message": "School access is suspended due to non-payment. Please contact support."
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- Recipient: School admin
- Template: `subscription_suspended`

**Cleanup:**
- Reactivate subscription

---

## SCH-013 School Statistics

**Objective:** Verify school statistics endpoint returns correct aggregate data

**Preconditions:**
- School exists with ID `:id`
- School has 50 students, 10 teachers, 5 classes, 3 active terms

**Request:**
`GET /api/v1/schools/:id/stats`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "studentCount": 50,
  "teacherCount": 10,
  "classCount": 5,
  "activeTermCount": 3,
  "maleStudentCount": 28,
  "femaleStudentCount": 22,
  "attendanceRate": 94.5,
  "totalFeeCollected": 1250000.00,
  "outstandingFees": 350000.00,
  "subscription": {
    "plan": "professional",
    "status": "active",
    "endDate": "2027-07-15"
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

## SCH-014 Delete Forbidden

**Objective:** Verify school with active records cannot be deleted

**Preconditions:**
- School exists with ID `:id`
- School has active students and/or active memberships

**Request:**
`DELETE /api/v1/schools/:id`

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "Cannot delete school with 50 active student(s) and 10 active membership(s). Archive all records first."
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

## SCH-015 Soft Delete

**Objective:** Verify soft delete preserves all data in database

**Preconditions:**
- School exists with ID `:id`
- School has associated students, classes, terms, and subscriptions
- No active students or memberships (all archived)

**Request:**
`DELETE /api/v1/schools/:id`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "message": "School archived successfully",
  "id": "clx..."
}
```

**Expected Database Changes:**
- `school` table: `deletedAt` set, but row still exists
- All related data (students, classes, terms) remain in database with their data intact
- `school` table: `status` set to `archived`

**Expected Audit Log:**
- Event type: `SchoolArchived`
- Actor: Authenticated super admin user ID
- Changes recorded: soft delete with timestamp

**Expected WebSocket Event:**
- `school.archived`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Restore school

---

## SCH-016 Pagination

**Objective:** Verify platform admin can paginate through all schools

**Preconditions:**
- Authenticated platform super admin
- At least 25 schools exist in the database

**Request:**
`GET /api/v1/platform/schools?page=1&limit=20`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "clx...", "name": "School 1", "status": "active" },
    { "id": "clx...", "name": "School 2", "status": "active" }
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

## SCH-017 Search

**Objective:** Verify platform admin can search schools by keyword

**Preconditions:**
- Authenticated platform super admin
- Schools exist with names containing "Green"

**Request:**
`GET /api/v1/platform/schools?q=Green`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "clx...", "name": "Green Valley Primary School" },
    { "id": "clx...", "name": "Green Hills Academy" },
    { "id": "clx...", "name": "Greenwood Junior School" }
  ],
  "meta": {
    "total": 3,
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

## SCH-018 Filters

**Objective:** Verify schools can be filtered by status, level, and subscription tier

**Preconditions:**
- Authenticated platform super admin
- Schools exist with various statuses, levels, and subscription tiers

**Request:**
`GET /api/v1/platform/schools?status=active&level=primary&tier=professional`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "clx...", "name": "Green Valley Primary", "status": "active", "level": "primary" }
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

## SCH-019 Sorting

**Objective:** Verify schools can be sorted by name, date, and student count

**Preconditions:**
- Authenticated platform super admin
- Multiple schools exist

**Request:**
`GET /api/v1/platform/schools?sortBy=name&sortOrder=asc`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    { "id": "clx...", "name": "Amani Primary School" },
    { "id": "clx...", "name": "Green Valley Primary School" },
    { "id": "clx...", "name": "Zion Academy" }
  ],
  "meta": {
    "total": 3,
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

## SCH-020 Audit Log

**Objective:** Verify all school CRUD operations are recorded in the audit trail

**Preconditions:**
- Authenticated platform super admin
- School exists with ID `:id`

**Request:**
`GET /api/v1/schools/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "SchoolCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "action": "create", "entity": "school" }
    },
    {
      "event": "SchoolUpdated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "name": { "from": "Green Valley Primary", "to": "Green Valley Academy" } }
    },
    {
      "event": "SchoolArchived",
      "actor": "usr_001",
      "timestamp": "2026-07-15T12:00:00.000Z",
      "changes": { "status": { "from": "active", "to": "archived" } }
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
- The retrieval of audit logs is itself optionally logged

**Expected WebSocket Event:**
- None

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- None required
