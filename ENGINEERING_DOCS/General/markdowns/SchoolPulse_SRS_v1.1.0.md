# SchoolPulse System Requirements Specification

Version: 1.1.0  
Status: Baselined scope for production-grade v1.1.0  
Audience: Product, engineering, QA, DevOps

## Requirement Conventions

| Prefix | Meaning |
| --- | --- |
| `FR` | Functional requirement |
| `NFR` | Non-functional requirement |
| `US` | User story |

## Global Requirements

### Functional

- `FR-SYS-01`: The system shall support multiple schools as isolated tenants.
- `FR-SYS-02`: The system shall require authenticated access for all operational endpoints except health checks, login, OTP request, OTP verification, and external payment callbacks.
- `FR-SYS-03`: The system shall enforce role-based permissions on every protected endpoint.
- `FR-SYS-04`: The system shall generate audit logs for create, update, delete, archive, publish, payment, and role-assignment actions.
- `FR-SYS-05`: The system shall write domain events to a transactional outbox for asynchronous processing.

### Non-Functional

- `NFR-SYS-01`: API responses shall follow the standard success, pagination, and error envelope in the engineering specification.
- `NFR-SYS-02`: 95th percentile API response time shall be below 2 seconds under normal school operating load.
- `NFR-SYS-03`: Tenant isolation shall be enforced at service and repository boundaries.
- `NFR-SYS-04`: The system shall not expose raw stack traces, database errors, provider secrets, OTPs, passwords, or tokens to end users.
- `NFR-SYS-05`: Production data shall be backed up daily with at least 90 days of backup retention.

## School Management

- `FR-SCH-01`: The system shall create a school tenant with name, code, phone, county, town, country, currency, timezone, subscription status, and subscription plan.
- `FR-SCH-02`: The system shall allow authorized users to update school profile, branding, and settings.
- `FR-SCH-03`: The system shall track subscription status as trial, active, suspended, pending review, defaulted, or terminated.
- `FR-SCH-04`: The system shall prevent hard deletion of schools.
- `FR-SCH-05`: The system shall expose the active school settings to authorized users.
- `FR-SCH-06`: The system shall classify schools by level: pre-primary, primary, junior secondary, senior secondary, or mixed.
- `NFR-SCH-01`: `schoolCode` shall be unique globally.
- `NFR-SCH-02`: All school timestamps shall be stored in UTC and displayed using the school timezone.
- `US-SCH-01`: As a founder/admin, I want to register a new school so that it can begin onboarding.
- `US-SCH-02`: As a principal, I want to update school settings so that SchoolPulse reflects our real school operations.

## User Management, Memberships, Roles

- `FR-USR-01`: The system shall create staff and guardian user accounts.
- `FR-USR-02`: The system shall hash staff passwords before storage.
- `FR-USR-03`: The system shall support staff login using phone/email and password.
- `FR-USR-04`: The system shall support parent login using phone and OTP.
- `FR-USR-05`: The system shall link users to schools through memberships.
- `FR-USR-06`: The system shall assign roles to memberships.
- `FR-USR-07`: The system shall allow authorized users to suspend, reactivate, or archive user access.
- `NFR-USR-01`: Password hashes shall never be returned by any API.
- `NFR-USR-02`: OTP requests shall be rate-limited.
- `NFR-USR-03`: A user cannot access school data without an active membership for that school.
- `US-USR-01`: As a principal, I want to create staff accounts and assign roles so that each person has appropriate access.
- `US-USR-02`: As a parent, I want to log in using my phone so that I do not need an email account.

## Student Management and Guardians

- `FR-STU-01`: The system shall create student records with admission number, name, date of birth, school, and status.
- `FR-STU-02`: The system shall enforce admission number uniqueness within a school.
- `FR-STU-03`: The system shall link one or more guardians to a student.
- `FR-STU-04`: The system shall support guardian relationship types including father, mother, sibling, emergency, sponsor, legal guardian, step-parent, relative, and other.
- `FR-STU-05`: The system shall support student enrollment into a class instance for an academic year and optional term.
- `FR-STU-06`: The system shall support transfer, graduation, archiving, and lifecycle status changes.
- `FR-STU-07`: The system shall search students by name, admission number, class, status, and guardian phone.
- `FR-STU-08`: The system shall provide a student profile showing guardians, enrollment, attendance summary, finance summary, and published academic summary.
- `FR-STU-09`: The system shall record student gender as male or female where required by the school.
- `FR-STU-10`: The system shall optionally record a performance expectation for student support and academic intervention planning.
- `NFR-STU-01`: Student list and search endpoints shall always be tenant-scoped.
- `NFR-STU-02`: Student archives shall be soft deletes/status transitions, not hard deletes.
- `NFR-STU-03`: Student creation shall validate input before reaching service or repository logic.
- `US-STU-01`: As an admissions staff member, I want to register a student and guardians in one flow so that the student is ready for attendance, fees, and communication.
- `US-STU-02`: As a bursar, I want to search by admission number so that I can quickly find a fee account.

## Academic Structure

- `FR-ACD-01`: The system shall create academic years per school.
- `FR-ACD-02`: The system shall create terms under academic years.
- `FR-ACD-03`: The system shall create classes per school.
- `FR-ACD-04`: The system shall store stream names on class instances.
- `FR-ACD-05`: The system shall create class instances from class, academic year, and stream name.
- `FR-ACD-06`: The system shall create subjects and assign them to class instances.
- `FR-ACD-07`: The system shall assign teachers to class instances or class subjects.
- `NFR-ACD-01`: Only one academic year may be active per school.
- `NFR-ACD-02`: Only one term may be active per academic year.
- `NFR-ACD-03`: Class instance uniqueness shall be enforced by class, academic year, and stream name.
- `US-ACD-01`: As an academic master, I want to configure classes and streams so that students can be enrolled correctly.

## Attendance

- `FR-ATT-01`: The system shall create attendance sessions for class instance, date, and session type.
- `FR-ATT-02`: The system shall record attendance as present, absent, late, or excused.
- `FR-ATT-03`: The system shall prevent duplicate attendance records for the same student in the same session.
- `FR-ATT-04`: The system shall allow authorized edits with reason after a session is locked.
- `FR-ATT-05`: The system shall generate guardian notifications for absent and late records where configured.
- `FR-ATT-06`: The system shall calculate attendance summaries by student, class, term, and school.
- `NFR-ATT-01`: Attendance writes shall be auditable by marker, timestamp, and edit reason.
- `NFR-ATT-02`: Attendance submission for a 50-student class should complete within 5 seconds under normal network conditions.
- `US-ATT-01`: As a teacher, I want to mark attendance quickly so that administration does not consume lesson time.
- `US-ATT-02`: As a parent, I want to know when my child is absent or late so that I can respond the same day.

## Assessments

- `FR-ASM-01`: The system shall create exams by school, term, name, type, and date range.
- `FR-ASM-02`: The system shall create assessments for class instance and subject.
- `FR-ASM-03`: The system shall record marks per student per assessment.
- `FR-ASM-04`: The system shall validate that attained marks do not exceed total marks.
- `FR-ASM-05`: The system shall publish assessment results to the parent portal.
- `FR-ASM-06`: The system shall generate student report cards.
- `FR-ASM-07`: The system shall support controlled exam types including CAT, midterm, endterm, mock, opener, continuous assessment, practical, project, oral, national, and custom.
- `NFR-ASM-01`: Published results shall be immutable except through an authorized correction workflow.
- `NFR-ASM-02`: Parents shall only see published results for linked students.
- `US-ASM-01`: As a teacher, I want to enter marks by subject so that results can be published accurately.
- `US-ASM-02`: As a parent, I want to view published results so that I can support my child earlier.

## Finance

- `FR-FIN-01`: The system shall define fee structures per school, academic year, term, and optionally class.
- `FR-FIN-02`: The system shall define fee items under fee structures.
- `FR-FIN-03`: The system shall generate invoices for students.
- `FR-FIN-04`: The system shall track invoice total, paid amount, balance, and status.
- `FR-FIN-05`: The system shall record payments by M-Pesa STK, M-Pesa C2B, bank transfer, bursary, cash, adjustment, or credit.
- `FR-FIN-06`: The system shall prevent duplicate provider payment references within a school.
- `FR-FIN-07`: The system shall generate receipts for confirmed payments.
- `FR-FIN-08`: The system shall support payment reversal instead of editing or deleting confirmed payments.
- `FR-FIN-09`: The system shall send configurable outstanding fee reminders to guardians.
- `FR-FIN-10`: The system shall expose student statements and finance reports.
- `FR-FIN-11`: The system shall support early fee issue alerts before school action disrupts learning.
- `NFR-FIN-01`: Money shall use PostgreSQL `numeric` and Prisma Decimal-compatible types.
- `NFR-FIN-02`: Confirmed financial records shall be immutable.
- `NFR-FIN-03`: Invoice balances shall not become negative; overpayment is recorded as credit.
- `NFR-FIN-04`: Payment webhooks shall be idempotent.
- `US-FIN-01`: As a bursar, I want payments to update balances automatically so that reconciliation is faster.
- `US-FIN-02`: As a parent, I want a receipt when I pay so that I have proof of payment.
- `US-FIN-03`: As a principal, I want early fee reminders so that students are not surprised at the school gate.

## Communication

- `FR-COM-01`: The system shall create conversations and messages within a school.
- `FR-COM-02`: The system shall send announcements to selected recipients or the whole school.
- `FR-COM-03`: The system shall log outbound notification attempts and delivery states.
- `FR-COM-04`: The system shall support message priorities.
- `FR-COM-05`: The system shall support read receipts where the channel allows it.
- `FR-COM-06`: The system shall classify conversations as direct, group, or announcement.
- `FR-COM-07`: The system shall classify messages by type: text, announcement, invoice, payment, attendance, assessment, or system.
- `NFR-COM-01`: Messages shall be tenant-scoped.
- `NFR-COM-02`: Automated notifications shall not block the main transaction if the provider is unavailable.
- `US-COM-01`: As a principal, I want to send announcements so that parents receive official communication.
- `US-COM-02`: As a parent, I want school messages in one trusted source so that important updates are not lost.

## Event System

- `FR-EVT-01`: The system shall persist domain events in `event_outbox`.
- `FR-EVT-02`: The system shall process pending outbox events using background workers.
- `FR-EVT-03`: The system shall retry failed events.
- `FR-EVT-04`: The system shall preserve failed event payloads and error messages for diagnosis.
- `NFR-EVT-01`: Outbox writes shall occur in the same transaction as the state change that produced them.
- `NFR-EVT-02`: Event consumers shall be idempotent.
- `US-EVT-01`: As an engineer, I want durable events so that notifications and reports do not disappear when providers fail.

## Reporting

- `FR-RPT-01`: The system shall provide attendance reports.
- `FR-RPT-02`: The system shall provide finance reports.
- `FR-RPT-03`: The system shall provide academic reports.
- `FR-RPT-04`: The system shall provide student reports.
- `FR-RPT-05`: The system shall provide operational reports for dashboard summaries.
- `FR-RPT-06`: The system shall export reports as CSV and selected documents as PDF.
- `NFR-RPT-01`: Reports shall always be tenant-scoped.
- `NFR-RPT-02`: Report generation shall not expose data from another school.
- `US-RPT-01`: As a principal, I want reports by term so that I can make decisions from current data.

## Acceptance Criteria

A v1.1.0 module is complete only when:

- Functional requirements are implemented.
- Non-functional requirements are verified.
- APIs have validation schemas.
- Tenant isolation tests pass.
- Permission tests pass.
- Audit logs are generated for writes.
- Domain events are produced where required.
- OpenAPI documentation exists.
- QA can demonstrate the user stories end to end in staging.
