# SchoolPulse Engineering Specification

Version: 1.1.0  
Audience: Backend engineers, frontend engineers, QA engineers, DevOps engineers, technical leadership  
Status: Implementation baseline

## 1. Engineering Intent

SchoolPulse v1.1.0 is a production-grade, multi-tenant school management platform. The engineering goal is not to add every possible school feature. The goal is to implement the bounded v1.1.0 modules reliably enough that real schools can run daily operations on the system.

This document separates engineering concerns from product and sales concerns. Product language explains value; this document explains decisions, constraints, contracts, APIs, database rules, events, validation, and implementation structure.

## 2. Current Codebase Assessment

Current backend stack:

- Bun
- TypeScript
- Elysia
- Prisma 7
- PostgreSQL
- bcrypt
- `@elysia/openapi`

Current started endpoints:

- `GET /schools`
- `POST /schools`
- `GET /users`
- `POST /users`
- `GET /students`
- `POST /students`
- `GET /streams` placeholder

Current implementation gaps to close:

- Validation is mostly defined inside routes instead of module schema files.
- `students/schema.ts` and `students/repository.ts` are empty.
- Student service directly uses Prisma, which violates the required layering.
- Several modules have READMEs but no implementation.
- Authentication, authorization, tenant middleware, audit logs, event outbox, and error handling are not yet implemented.
- Prisma schema is a strong start but finance uses `Float`; v1.1.0 must use `Decimal` for money.

## 2.1 Model Plan Decisions

`MODEL_PLAN.md` is accepted as a database modeling note for v1.1.0. The following decisions are adopted:

- The Lucidchart/current target database remains the source of truth.
- Older Prisma enum ideas are retained where they strengthen the model.
- Every formerly generic database enum must become an explicit PostgreSQL enum and Prisma enum before model implementation.
- Prisma model fields should use clean TypeScript-friendly names such as `createdAt`, `updatedAt`, and `deletedAt`, mapped to snake_case database columns using `@map`.
- Financial, messaging, assessment, attendance, event, and audit models must use enums instead of free-form strings where the state is controlled by the system.
- Academic structure should use the simpler `classes` + `class_instances` model. A stream remains a school concept, but v1.1.0 stores it as `class_instances.stream_name` instead of introducing a separate stream aggregate.
- Event outbox remains intentionally small for v1.1.0; fields such as `workerId`, `correlationId`, and `causationId` are deferred.

## 3. Required Module Structure

Every backend module must follow this structure:

```text
backend/src/<module>/
  schema.ts
  repository.ts
  service.ts
  controller.ts
  route.ts
  README.md
```

Responsibilities:

| File | Responsibility |
| --- | --- |
| `schema.ts` | Elysia/TypeBox validation schemas, DTO types, query schemas, response schemas. No database calls. |
| `repository.ts` | Prisma queries and transactions only. No HTTP logic. No business decision logic. |
| `service.ts` | Business rules, transactional orchestration, tenant checks, event creation, audit intent. |
| `controller.ts` | Convert HTTP request context into service calls and response objects. No direct Prisma calls. |
| `route.ts` | Register Elysia routes, validation schemas, auth middleware, OpenAPI metadata. |
| `README.md` | Local module ownership, behavior, endpoints, events, and known constraints. |

Forbidden patterns:

- Controllers importing Prisma.
- Routes containing business logic.
- Services returning raw database errors to controllers.
- Repositories deciding permissions.
- Any query that can return cross-school data without a tenant filter.

## 4. Architecture

Pattern: modular monolith with domain modules and a shared PostgreSQL database.

Primary runtime:

- Bun runtime
- Elysia HTTP API
- Prisma database access
- PostgreSQL persistence
- Redis for rate limiting, queues, locks, and background workers
- Transactional outbox for domain events

Deployment baseline:

- API container on Azure
- PostgreSQL managed database
- Redis managed cache/queue
- Cloudflare for DNS, WAF, CDN, and frontend hosting
- Object storage for logos, exports, and generated reports

## 5. Multi-Tenancy Rules

SchoolPulse is school-tenant isolated. A school is the tenant boundary.

Rules:

- Every tenant-owned table must include `school_id`, directly or through a parent aggregate that includes `school_id`.
- Every authenticated request must resolve an active `schoolMembership`.
- Every list query must filter by `school_id`.
- Every detail query must prove the record belongs to the requesting school.
- Cross-school access must return `403 Forbidden`, not empty success, when ownership violation is detected.
- Unique constraints for operational records must usually include `school_id`.

Examples:

- Student admission numbers are unique per school: `(school_id, admission_number)`.
- Class template names are unique per school: `(school_id, name)`.
- Payment references are unique per school/provider: `(school_id, provider, transaction_ref)`.

## 6. Domain Aggregates

| Aggregate | Root | Owns / Coordinates |
| --- | --- | --- |
| School | `schools` | school settings, subscription state, branding, tenant identity |
| User | `users` | identity, credentials, account status |
| Membership | `school_memberships` | school-specific user access and roles |
| Student | `students` | student profile, guardians, lifecycle |
| AcademicYear | `academic_years` | terms and yearly structure |
| Class | `classes` | reusable class level within a school |
| ClassInstance | `class_instances` | class + stream name + academic year |
| Enrollment | `enrollments` | student placement in academic structure |
| AttendanceSession | `attendance_sessions` | attendance records for one class/date/session |
| Exam | `exams` | assessment group and publishing workflow |
| Invoice | `invoices` | fee obligation and balance |
| Payment | `payments` | immutable payment receipt source |
| Conversation | `conversations` | messages and participants |
| EventOutbox | `event_outbox` | durable asynchronous event delivery |

## 7. v1.1.0 Modules

### School Management

Responsibilities:

- Register school tenant.
- Manage profile, settings, subscription state, branding, timezone, currency, and academic configuration.
- Own tenant boundary.

Key rules:

- A school cannot be hard-deleted.
- Suspended/defaulted subscriptions may become read-only but data remains accessible according to contract.
- `school_code` must be unique.

### User Management

Responsibilities:

- Staff and guardian identity.
- Password hashing for staff.
- OTP/PIN-ready identity model for guardians.
- Account lifecycle.
- Membership and role assignment.

Key rules:

- Users are global identities; memberships make them school-specific.
- Roles are assigned to memberships, not directly to users.
- Staff cannot assign roles higher than their own authority.
- Password hashes never leave the service boundary.

### Student Management

Responsibilities:

- Admission.
- Profile.
- Guardians.
- Enrollment.
- Transfer, graduation, archiving.
- Lifecycle status.

Key rules:

- Admission number is unique per school.
- A student must have at least one guardian before full admission is complete.
- A student cannot have two active enrollments for the same academic year and class instance.
- Archived students are excluded from normal operational lists but retained for finance, attendance, and audit history.

### Academic Structure

Responsibilities:

- Academic years.
- Terms.
- Classes.
- Stream names on class instances.
- Class instances.
- Subjects.
- Teacher assignments.

Key rules:

- Only one active academic year per school.
- Only one active term per academic year.
- A class instance is uniquely identified by class, academic year, and stream name.

### Attendance

Responsibilities:

- Attendance sessions.
- Attendance records.
- Late and absent alerts.
- Attendance analytics.
- Attendance reports.

Key rules:

- One attendance session per class instance, date, and session type.
- Attendance records are unique per session and student.
- Only assigned teachers, deputy principals, principals, or authorized admins may mark or edit attendance.
- Post-lock edits require a reason and generate an audit event.

### Assessments

Responsibilities:

- Exams.
- Assessments.
- Results.
- Publishing.
- Grading.
- Report cards.

Key rules:

- Marks cannot exceed assessment total marks.
- Published results are immutable except through correction workflow.
- Parents only see published results.

### Finance

Responsibilities:

- Fee structures.
- Fee items.
- Invoices.
- Payments.
- Balances.
- Receipts.
- Parent statements.
- Outstanding fees.
- Financial audit logs.

Key rules:

- Use `Decimal`, never `Float`, for money.
- Confirmed payments are immutable.
- Corrections use reversals.
- An invoice balance cannot become negative; surplus becomes credit.
- Only one current invoice per student/enrollment/term.
- Payment receipts must be generated for confirmed payments.
- Fee reminders are configurable by school and must respect guardian notification preferences.

Fee issue prevention workflow:

- School config defines fee reminder thresholds and escalation timing.
- System detects students with outstanding balances.
- Guardian receives an early warning before school action.
- Payment or manual receipt updates the ledger.
- Staff can verify the receipt/payment state before sending a student away from learning.

### Communication

Responsibilities:

- Conversations.
- Messages.
- Recipients.
- Read receipts.
- Announcements.
- Parent messaging.
- Teacher messaging.
- Administrative messaging.

Key rules:

- Messages are tenant-scoped.
- Automated messages must be generated from events.
- Every outbound SMS/WhatsApp/email attempt is logged.
- Guardians only receive messages for linked students unless it is a school-wide announcement.

### Event System

Responsibilities:

- Transactional outbox.
- Domain events.
- Retries.
- Background workers.
- Notification events.
- Audit events.

Key rules:

- Domain events produced inside database transactions must be written to `event_outbox` in the same transaction.
- Workers process outbox rows asynchronously.
- Failed events retry with backoff.
- Poison events are retained with error details.

### Reporting

Responsibilities:

- Attendance reports.
- Finance reports.
- Academic reports.
- Student reports.
- Operational reports.

Key rules:

- Reports are tenant-filtered.
- Reports must support CSV export at minimum.
- PDF export is required for receipts, statements, and report cards.

## 8. REST API Conventions

Base path: `/api/v1`

Current code does not yet use this prefix. v1.1.0 routes must migrate to versioned paths.

Conventions:

- JSON request and response bodies.
- `camelCase` JSON fields.
- UUID path params.
- Pagination on all collection endpoints.
- Consistent error object.
- Idempotency key support for payment-sensitive writes.

Standard collection query:

```text
?page=1&pageSize=25&search=mutua&sort=createdAt:desc&filter[status]=active
```

Standard success response:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "schoolId": "uuid"
  }
}
```

Standard paginated response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 100,
    "totalPages": 4
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

Standard error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Admission number is already in use for this school.",
    "details": [
      {
        "field": "admissionNumber",
        "issue": "duplicate"
      }
    ],
    "requestId": "req_123"
  }
}
```

## 9. API Surface

### Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Staff login with phone/email and password. |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token and issue new access token. |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token. |
| `POST` | `/api/v1/auth/parent/request-otp` | Send parent OTP. |
| `POST` | `/api/v1/auth/parent/verify-otp` | Verify parent OTP and issue session. |

### Schools

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools` | Platform admin list schools. |
| `POST` | `/api/v1/schools` | Create school tenant. |
| `GET` | `/api/v1/schools/:schoolId` | Get school profile. |
| `PATCH` | `/api/v1/schools/:schoolId` | Update school profile/settings. |
| `GET` | `/api/v1/schools/:schoolId/subscription` | Get subscription state. |
| `PATCH` | `/api/v1/schools/:schoolId/subscription` | Update subscription state. |

### Users and Memberships

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/users` | List users in school. |
| `POST` | `/api/v1/schools/:schoolId/users` | Create staff or guardian identity. |
| `GET` | `/api/v1/schools/:schoolId/users/:userId` | Get user profile in school context. |
| `PATCH` | `/api/v1/schools/:schoolId/users/:userId` | Update user profile/status. |
| `GET` | `/api/v1/schools/:schoolId/memberships` | List memberships. |
| `POST` | `/api/v1/schools/:schoolId/memberships` | Add user to school. |
| `PATCH` | `/api/v1/schools/:schoolId/memberships/:membershipId` | Update membership status. |
| `PUT` | `/api/v1/schools/:schoolId/memberships/:membershipId/roles` | Replace membership roles. |

### Students

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/students` | Search/list students. |
| `POST` | `/api/v1/schools/:schoolId/students` | Admit student. |
| `GET` | `/api/v1/schools/:schoolId/students/:studentId` | Get student profile. |
| `PATCH` | `/api/v1/schools/:schoolId/students/:studentId` | Update student profile. |
| `POST` | `/api/v1/schools/:schoolId/students/:studentId/archive` | Archive student. |
| `POST` | `/api/v1/schools/:schoolId/students/:studentId/guardians` | Link guardian. |
| `DELETE` | `/api/v1/schools/:schoolId/students/:studentId/guardians/:guardianId` | Remove guardian link. |
| `POST` | `/api/v1/schools/:schoolId/students/bulk-import` | Validate and import CSV. |

### Academic Structure

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/academic-years` | List academic years. |
| `POST` | `/api/v1/schools/:schoolId/academic-years` | Create academic year. |
| `PATCH` | `/api/v1/schools/:schoolId/academic-years/:academicYearId` | Update academic year. |
| `POST` | `/api/v1/schools/:schoolId/academic-years/:academicYearId/activate` | Activate academic year. |
| `GET` | `/api/v1/schools/:schoolId/terms` | List terms. |
| `POST` | `/api/v1/schools/:schoolId/terms` | Create term. |
| `POST` | `/api/v1/schools/:schoolId/terms/:termId/activate` | Activate term. |
| `GET` | `/api/v1/schools/:schoolId/classes` | List classes and class instances. |
| `POST` | `/api/v1/schools/:schoolId/classes` | Create class. |
| `POST` | `/api/v1/schools/:schoolId/class-instances` | Create class instance. |
| `GET` | `/api/v1/schools/:schoolId/subjects` | List subjects. |
| `POST` | `/api/v1/schools/:schoolId/subjects` | Create subject. |
| `PUT` | `/api/v1/schools/:schoolId/class-instances/:classInstanceId/subjects` | Assign subjects and teachers. |

### Attendance

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/attendance/sessions` | List sessions. |
| `POST` | `/api/v1/schools/:schoolId/attendance/sessions` | Create/open session. |
| `GET` | `/api/v1/schools/:schoolId/attendance/sessions/:sessionId` | Get session with records. |
| `PUT` | `/api/v1/schools/:schoolId/attendance/sessions/:sessionId/records` | Save attendance records. |
| `POST` | `/api/v1/schools/:schoolId/attendance/sessions/:sessionId/lock` | Lock session. |
| `PATCH` | `/api/v1/schools/:schoolId/attendance/records/:recordId` | Edit record with reason. |
| `GET` | `/api/v1/schools/:schoolId/reports/attendance` | Attendance reports. |

### Assessments

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/exams` | List exams. |
| `POST` | `/api/v1/schools/:schoolId/exams` | Create exam. |
| `PATCH` | `/api/v1/schools/:schoolId/exams/:examId` | Update exam. |
| `POST` | `/api/v1/schools/:schoolId/assessments` | Create assessment. |
| `PUT` | `/api/v1/schools/:schoolId/assessments/:assessmentId/results` | Enter marks. |
| `POST` | `/api/v1/schools/:schoolId/exams/:examId/publish` | Publish exam results. |
| `GET` | `/api/v1/schools/:schoolId/students/:studentId/report-card` | Generate report card. |

### Finance

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/fee-structures` | List fee structures. |
| `POST` | `/api/v1/schools/:schoolId/fee-structures` | Create fee structure. |
| `POST` | `/api/v1/schools/:schoolId/invoices/generate` | Generate term invoices. |
| `GET` | `/api/v1/schools/:schoolId/invoices` | List/search invoices. |
| `GET` | `/api/v1/schools/:schoolId/students/:studentId/statement` | Student fee statement. |
| `POST` | `/api/v1/schools/:schoolId/payments/manual` | Record manual payment. |
| `POST` | `/api/v1/schools/:schoolId/payments/mpesa/stk` | Initiate STK push. |
| `POST` | `/api/v1/payments/mpesa/callback` | M-Pesa callback endpoint. |
| `POST` | `/api/v1/schools/:schoolId/payments/:paymentId/reverse` | Reverse payment. |
| `GET` | `/api/v1/schools/:schoolId/reports/finance` | Finance reports. |
| `POST` | `/api/v1/schools/:schoolId/fee-reminders/send` | Send fee reminders. |

### Communication

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/conversations` | List conversations. |
| `POST` | `/api/v1/schools/:schoolId/conversations` | Create conversation. |
| `GET` | `/api/v1/schools/:schoolId/conversations/:conversationId/messages` | List messages. |
| `POST` | `/api/v1/schools/:schoolId/conversations/:conversationId/messages` | Send message. |
| `POST` | `/api/v1/schools/:schoolId/announcements` | Broadcast announcement. |
| `GET` | `/api/v1/schools/:schoolId/notifications` | Notification delivery log. |

### Events and Operations

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/schools/:schoolId/audit-logs` | Query audit logs. |
| `GET` | `/api/v1/admin/outbox` | Platform admin view of outbox status. |
| `POST` | `/api/v1/admin/outbox/:eventId/retry` | Retry failed event. |
| `GET` | `/api/v1/health` | Liveness check. |
| `GET` | `/api/v1/ready` | Readiness check. |

## 10. Domain Events

| Event | Producer | Primary Consumers |
| --- | --- | --- |
| `SchoolCreated` | School service | Audit, onboarding |
| `UserCreated` | User service | Audit, notification |
| `MembershipCreated` | Membership service | Audit |
| `RoleAssigned` | Membership service | Audit |
| `StudentAdmitted` | Student service | Audit, finance, notification |
| `GuardianAdded` | Student service | Audit, notification |
| `StudentTransferred` | Enrollment service | Audit, reporting |
| `StudentArchived` | Student service | Audit |
| `AcademicYearActivated` | Academic service | Audit |
| `TermActivated` | Academic service | Audit, finance |
| `TeacherAssigned` | Academic service | Audit, notification |
| `AttendanceMarked` | Attendance service | Notification, reporting |
| `AttendanceEdited` | Attendance service | Audit, principal alert |
| `InvoiceGenerated` | Finance service | Audit, notification |
| `PaymentReceived` | Finance service | Receipt, ledger, notification |
| `PaymentReversed` | Finance service | Audit, notification |
| `FeeReminderQueued` | Finance service | Notification |
| `ExamCreated` | Assessment service | Audit |
| `AssessmentPublished` | Assessment service | Notification, parent portal |
| `ConversationCreated` | Communication service | Audit |
| `MessageSent` | Communication service | Receipt tracking |
| `SubscriptionExpired` | Subscription service | Access control, notification |

Outbox payload standard:

```json
{
  "eventId": "uuid",
  "eventType": "PaymentReceived",
  "aggregateType": "Payment",
  "aggregateId": "uuid",
  "schoolId": "uuid",
  "occurredAt": "2026-07-08T08:00:00.000Z",
  "actorId": "uuid",
  "payload": {}
}
```

## 11. Security

Authentication:

- Staff: phone/email + password.
- Parent: phone + OTP, optional device PIN later.
- JWT access tokens with refresh token rotation.
- Password hashing with bcrypt or Argon2id; bcrypt cost must be configurable.

Authorization:

- RBAC is membership-scoped.
- Permissions are enforced server-side.
- Frontend visibility is convenience only, not security.

Tenant isolation:

- Tenant context is derived from authenticated membership and route `schoolId`.
- Repository queries must include tenant constraints.

Input validation:

- All request bodies and query params use `schema.ts`.
- Unknown fields are rejected on write endpoints.

Sensitive data:

- Phone numbers and personal details are PII.
- Minor data receives highest internal handling standard.
- Logs must not include passwords, OTPs, full tokens, or raw payment secrets.

## 12. Error Codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Request failed schema or business validation. |
| `UNAUTHENTICATED` | 401 | Missing or invalid authentication. |
| `FORBIDDEN` | 403 | Authenticated user lacks permission or tenant access. |
| `NOT_FOUND` | 404 | Resource not found in tenant scope. |
| `CONFLICT` | 409 | Unique constraint or state transition conflict. |
| `RATE_LIMITED` | 429 | Request exceeded configured limit. |
| `INTERNAL_ERROR` | 500 | Unexpected server error. |
| `PROVIDER_ERROR` | 502 | External provider failure. |

## 13. Coding Standards

- TypeScript strict mode should be enabled.
- Avoid `any` in services and repositories.
- Use schema-derived types where possible.
- Repositories return domain data, not HTTP responses.
- Services throw typed application errors.
- Controllers map application errors to standard error objects.
- Prisma transactions wrap multi-write workflows.
- Monetary values use Decimal-compatible types and database `numeric`.

## 14. Testing Strategy

Minimum test layers:

- Unit tests for services and business rules.
- Repository integration tests against PostgreSQL test database.
- API tests for validation, auth, tenant isolation, and error shape.
- Event worker tests for outbox retry and idempotency.
- Finance tests for decimal arithmetic, duplicate payment prevention, reversals, and receipts.
- Permission tests for every role-sensitive endpoint.

Definition of done for a module:

- All routes have schema validation.
- All list/detail queries are tenant-scoped.
- CRUD happy path and major error paths are tested.
- Domain events are emitted where specified.
- Audit logs are generated for writes.
- OpenAPI metadata is present.

## 15. Deployment and Operations

Required environments:

- Local
- Staging
- Production

Required checks:

- `DATABASE_URL` present.
- Migrations applied.
- Prisma client generated.
- Redis reachable.
- Provider secrets configured only in secure environment storage.
- Health and readiness checks pass.

Operational requirements:

- Daily database backups.
- Point-in-time recovery where provider supports it.
- Structured request logs with request ID.
- Error monitoring.
- Queue/outbox monitoring.
- Alert on failed payment webhook processing.
- Alert on outbox backlog growth.

## 16. Migration Strategy

- Use Prisma migrations as the canonical migration mechanism.
- Never manually edit production schema outside migrations.
- Backfill scripts must be idempotent.
- Destructive migrations require backup verification.
- Financial and audit tables must never be truncated in production.

## 17. Frontend Contract

Frontend must assume:

- API is authoritative for permissions.
- Parent portal is simpler than staff dashboard.
- Staff workflows are optimized for repeated daily use.
- Empty states should guide the next operational action.
- Error states should be plain, actionable, and non-technical.
- Every page must be school-context aware.

Primary staff navigation:

- Dashboard
- Students
- Attendance
- Finance
- Academics
- Communication
- Reports
- Settings

Primary parent navigation:

- Overview
- Fees
- Attendance
- Academics
- Messages

## 18. Implementation Priority

Recommended build order:

1. Shared errors, auth, tenant middleware, response helpers.
2. Schools, users, memberships, roles.
3. Academic structure.
4. Students and guardians.
5. Finance core: fee structures, invoices, payments, receipts.
6. Attendance core and alerts.
7. Communication and notification logs.
8. Assessments and publishing.
9. Reporting.
10. Outbox workers, monitoring, hardening.

This order supports real pilot value early while preserving production architecture.
