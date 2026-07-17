# SchoolPulse Project Charter

Version: 1.1.0  
Status: Scope and documentation authority  
Last updated: 2026-07-08

## 1. Purpose

SchoolPulse is a cloud-based, multi-tenant school management platform for Kenyan schools. Its purpose is to simplify school administration, protect school revenue, improve parent communication, and keep students learning by making critical school information timely, accurate, and actionable.

SchoolPulse is not just a student register. It is the operating system for everyday school operations.

## 2. Mission

Give schools reliable, affordable management infrastructure that helps them run with clarity: accurate student records, real-time fee visibility, trusted attendance, published academic progress, and structured communication with parents.

## 3. Product Philosophy

- Every feature must solve a real school operational problem.
- Reliability is more important than novelty.
- Every workflow should reduce manual work.
- Every notification should improve communication or decision-making.
- Every table and endpoint must support multi-tenancy.
- Every financial workflow must be auditable.
- Every product decision must protect v1.1.0 from uncontrolled scope growth.

## 4. Target Version Boundary

SchoolPulse v1.1.0 is the official production-grade feature boundary.

No additional major modules may be added to v1.1.0. New ideas must be recorded for a later version unless they fit inside one of the approved modules without expanding the product surface.

## 5. v1.1.0 Modules

1. School Management
2. User Management
3. Student Management
4. Academic Structure
5. Attendance
6. Assessments
7. Finance
8. Communication
9. Event System
10. Reporting

Out of scope for v1.1.0:

- Library
- Transport
- Hostel
- Inventory
- Payroll
- Online exams
- Student self-service portal
- Native mobile applications
- Learning management system content

## 6. Primary Users

- School owners
- Principals
- Deputy principals
- Academic masters
- Bursars
- Teachers
- Parents and guardians
- Reception/admissions staff
- Platform administrators

Future users such as librarians and students are not part of v1.1.0.

## 7. Business Impact

SchoolPulse exists because real schools lose money, time, trust, and learning days when operations are managed through paper, spreadsheets, informal WhatsApp groups, and late phone calls.

One key v1.1.0 impact case is fee communication. A student should not be surprised at the school gate or sent home before a guardian has received a clear reminder, payment option, and receipt path. SchoolPulse supports early fee alerts, current balances, payment recording, and receipts so schools can act earlier and parents can respond sooner.

The system supports school policy; it does not replace school leadership judgment.

## 8. Technical Baseline

Backend:

- Bun
- TypeScript
- Elysia
- Prisma
- PostgreSQL
- Redis
- JWT
- Docker

Frontend:

- React
- TypeScript
- TailwindCSS

Deployment:

- Azure
- Cloudflare
- Managed PostgreSQL
- Redis
- Object storage

## 9. Multi-Tenancy Requirements

- School is the tenant boundary.
- Schools cannot access another school's data.
- Every tenant-owned record must be scoped by `school_id` directly or through a tenant-owned aggregate.
- Every protected endpoint must validate tenant ownership.
- Every repository query must be tenant-aware.
- Cross-tenant access attempts must return `403 Forbidden`.

## 10. Engineering Layering Standard

Each backend module must separate concerns as follows:

- `schema.ts`: validation schemas, DTOs, request and response types.
- `repository.ts`: Prisma database actions only.
- `service.ts`: business logic, transactions, domain events, audit intent.
- `controller.ts`: HTTP orchestration and response mapping.
- `route.ts`: Elysia route registration, middleware, OpenAPI metadata.

Controllers and routes must not call Prisma directly. Repositories must not make authorization decisions. Services must not return raw database errors to users.

## 11. Documentation Governance

Maintained documentation lives in Markdown files in `ENGINEERING_DOCS`.

The canonical documents are:

- `README.md`
- `ENGINEERING_METHOD.md`
- `SchoolPulse_ProductDocument_v1.1.0.md`
- `SchoolPulse_Engineering_Spec_v1.1.0.md`
- `SchoolPulse_SRS_v1.1.0.md`
- `MODEL_PLAN.md`
- `POSTGRESQL_CODE_TO_BE_COMPLETED.sql`

The Word documents in this directory are print/export artifacts generated from the maintained Markdown documents for OnlyOffice review, sharing, and sign-off.

## 12. Database Governance

The PostgreSQL schema is the canonical business model for v1.1.0 implementation.

The schema must define:

- Aggregate roots
- Relationships
- Business constraints
- Tenant ownership
- Soft deletes
- Audit fields
- Enums
- Indexes
- Event outbox
- Financial immutability support

Money must use `numeric`, not floating point.

All database modeling must follow the enum-first rule from `MODEL_PLAN.md`: define concrete enum values before implementing Prisma models or database tables that depend on them.

## 13. API Governance

All production APIs must use:

- `/api/v1` prefix
- JSON request and response bodies
- Schema validation
- Authentication and authorization middleware
- Tenant ownership validation
- Consistent error objects
- Pagination on collection endpoints
- OpenAPI metadata

Every endpoint must document:

- Purpose
- Business rules
- Authorization
- Validation
- Possible errors
- Events produced
- Audit logs generated

## 14. Event Governance

Domain events must be persisted through a transactional outbox when a workflow has asynchronous effects such as notification, audit processing, reporting, or provider integration.

Required event families include:

- School lifecycle
- User and membership lifecycle
- Student lifecycle
- Guardian changes
- Academic structure changes
- Attendance marking and edits
- Invoice and payment lifecycle
- Assessment publishing
- Communication events
- Subscription events

## 15. Security Governance

SchoolPulse handles minors' personal information and financial records. Security is a product requirement, not a later hardening phase.

Required controls:

- Password hashing
- JWT access tokens and refresh token rotation
- RBAC
- Tenant isolation
- Input validation
- Audit logging
- Rate limiting
- Sensitive data redaction in logs
- Encrypted transport
- Backups and recovery
- Provider secret management

## 16. Success Criteria

The v1.1.0 documentation and implementation are successful when:

- A backend engineer can implement APIs without guessing.
- A frontend engineer can build screens from documented workflows and response shapes.
- A QA engineer can write complete test cases from the SRS.
- A DevOps engineer can deploy and monitor the platform.
- A salesperson can pitch the product without technical confusion.
- A principal can understand the value in one demonstration.
- A new employee can understand the product, architecture, and scope boundary.

## 17. Change Control

Any change that adds a module, changes a core workflow, alters tenant isolation, or changes financial behavior must be treated as a versioned product decision.

For v1.1.0, the default answer to new feature ideas is: record for later unless it strengthens one of the approved modules without adding a new module.
