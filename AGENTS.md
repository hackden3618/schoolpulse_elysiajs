# AGENTS.md

## Purpose

This file is the operating contract for any AI agent, coding assistant, or contributor working in the SchoolPulse codebase.

The goal is deterministic collaboration. If two competent agents read this file and work on the same task, they should reach the same interpretation of product scope, architecture, documentation authority, coding standards, and implementation constraints.

SchoolPulse is a serious commercial SaaS product for schools. Treat the repository as production-bound software, not an experiment.

## Product Identity

SchoolPulse is a cloud-based, multi-tenant school management platform built for Kenyan schools.

Its v1.1.0 product boundary includes:

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

Do not add modules outside this list unless the user explicitly changes the product version boundary in the engineering documents.

## Canonical Documentation

All agents must treat `ENGINEERING_DOCS` as the source of product and engineering truth.

Read documents in this order before making architectural, database, API, or module-level decisions:

1. `ENGINEERING_DOCS/README.md`
2. `ENGINEERING_DOCS/SCHOOLPULSE_PROJECT_CHARTER.MD`
3. `ENGINEERING_DOCS/SchoolPulse_Engineering_Spec_v1.1.0.md`
4. `ENGINEERING_DOCS/SchoolPulse_SRS_v1.1.0.md`
5. `ENGINEERING_DOCS/MODEL_PLAN.md`
6. `ENGINEERING_DOCS/POSTGRESQL_CODE_TO_BE_COMPLETED.sql`
7. `ENGINEERING_DOCS/SchoolPulse_ProductDocument_v1.1.0.md`

Use `.docx` files only as print/share artifacts. Do not treat `.docx` files as the editable source of truth when a matching Markdown file exists.

## Documentation Authority Order

When documents conflict, resolve in this order:

1. `SCHOOLPULSE_PROJECT_CHARTER.MD` controls product scope and governance.
2. `SchoolPulse_Engineering_Spec_v1.1.0.md` controls engineering architecture, APIs, events, security, and coding standards.
3. `SchoolPulse_SRS_v1.1.0.md` controls testable product behavior.
4. `MODEL_PLAN.md` controls model planning intent, especially enum-first Prisma/database design.
5. `POSTGRESQL_CODE_TO_BE_COMPLETED.sql` controls target database shape, unless it contradicts higher-level governance.
6. `SchoolPulse_ProductDocument_v1.1.0.md` controls client-facing language and value proposition only.

If a conflict affects implementation, update the relevant documentation first or in the same change as the code.

## Deterministic Agent Workflow

Every agent must follow this workflow for implementation tasks:

1. Read the relevant canonical docs listed above.
2. Inspect existing code before editing.
3. Identify the module boundary.
4. Preserve existing patterns unless they violate this file or canonical docs.
5. Make the smallest change that fully satisfies the task.
6. Keep product scope inside v1.1.0.
7. Add or update tests when behavior changes.
8. Run the most relevant validation commands available locally.
9. Report exactly what changed, what was verified, and what remains unverified.

Do not skip directly to coding from memory.

## Strict Non-Negotiable Constraints

Agents must not:

- Add new product modules outside v1.1.0.
- Invent features not present in the charter, engineering spec, SRS, model plan, or SQL target.
- Bypass tenant isolation.
- Query tenant-owned records without a school constraint or verified parent ownership path.
- Use floating-point arithmetic for money.
- Hard-delete student, finance, audit, or school records.
- Put business logic in controllers or routes.
- Put database calls in controllers.
- Put authorization decisions in repositories.
- Return raw database errors, stack traces, secrets, password hashes, OTPs, or tokens to API clients.
- Edit generated files unless the task explicitly requires regeneration.
- Rewrite unrelated code while completing a scoped request.
- Revert user changes unless the user explicitly asks.
- Treat client-facing product language as engineering requirements when engineering docs say otherwise.

## Current Technology Stack

Backend:

- Bun
- TypeScript
- Elysia
- Prisma
- PostgreSQL
- Redis planned for queues/rate limiting/background work
- JWT planned for authenticated API access

Frontend:

- React
- TypeScript
- TailwindCSS

Deployment target:

- Azure
- Cloudflare
- Managed PostgreSQL
- Object storage

## Repository Structure

Expected high-level structure:

```text
/
  AGENTS.md
  README.md
  ENGINEERING_DOCS/
  backend/
  frontend/
```

Backend source currently lives in:

```text
backend/src/
```

Prisma schema currently lives in:

```text
backend/prisma/schema.prisma
```

Target SQL planning schema lives in:

```text
ENGINEERING_DOCS/POSTGRESQL_CODE_TO_BE_COMPLETED.sql
```

## Backend Module Structure

Every backend module must use this structure:

```text
backend/src/<module>/
  schema.ts
  repository.ts
  service.ts
  controller.ts
  route.ts
  README.md
```

If a module does not yet have all files, create only the files required for the task, but align with this structure.

## Backend Layer Responsibilities

`schema.ts`:

- Defines request schemas.
- Defines response schemas where useful.
- Defines DTO/input/output types.
- Performs shape-level validation before data reaches business logic.
- Must not import Prisma.
- Must not perform database queries.

`repository.ts`:

- Contains Prisma database access only.
- Receives already-validated inputs.
- Must not know HTTP details.
- Must not decide business permissions.
- Must not emit HTTP responses.
- Must include tenant-aware filters for tenant-owned data.

`service.ts`:

- Contains business logic.
- Enforces domain rules.
- Coordinates transactions.
- Calls repositories.
- Produces domain events where required.
- Owns application-level decisions such as state transitions.
- Must not return raw provider/database errors to controllers.

`controller.ts`:

- Translates Elysia request context into service calls.
- Maps service results into API response envelopes.
- Maps known application errors into safe API errors.
- Must not import Prisma.
- Must not contain domain logic.

`route.ts`:

- Registers Elysia routes.
- Attaches schemas, middleware, and OpenAPI metadata.
- Must not contain domain logic.

## API Standards

Production API routes must use:

```text
/api/v1
```

Current code may still have unversioned routes. When touching a route for production implementation, migrate it toward the `/api/v1` standard unless the user asks for a temporary compatibility change.

Collection endpoints must support pagination when returning lists.

Standard error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-safe message",
    "details": [],
    "requestId": "request-id"
  }
}
```

Do not expose internal stack traces to clients.

## Multi-Tenancy Rules

School is the tenant boundary.

For tenant-owned data:

- Include `schoolId` in API route context where practical.
- Validate the authenticated user has an active membership in that school.
- Filter all repository queries by `schoolId` or through a parent relation proven to belong to the school.
- Return `403 Forbidden` for known cross-school access attempts.
- Return `404 Not Found` only when the record is absent within the valid tenant context.

Never assume a UUID is safe because it came from the client.

## Database and Prisma Rules

Follow the enum-first model plan.

Before implementing or changing Prisma models:

1. Check `MODEL_PLAN.md`.
2. Check `POSTGRESQL_CODE_TO_BE_COMPLETED.sql`.
3. Define enums before dependent models.
4. Use clean TypeScript-friendly Prisma field names.
5. Map database snake_case columns with `@map`.
6. Use `@@map` for table names.

Use:

- `Decimal` or database `numeric` for money.
- UUID primary keys.
- `createdAt`, `updatedAt`, and `deletedAt` fields for lifecycle tracking where applicable.
- Soft delete for school, student, finance, communication, audit-sensitive, and operational records.

Do not use:

- `Float` for money.
- Hard deletes for financial records.
- Free-form strings where a controlled enum exists.

## Academic Model Rule

Use the simpler v1.1.0 academic model:

- `classes`
- `class_instances`
- `class_instances.stream_name`

Do not reintroduce separate `class_templates` or `streams` aggregate tables unless the engineering documents are explicitly changed first.

## Finance Rules

Finance is audit-sensitive.

Agents must enforce:

- Money uses Decimal/numeric.
- Confirmed payments are immutable.
- Corrections use reversal records.
- Duplicate payment references are rejected per school/provider.
- Invoice balances cannot become negative.
- Overpayment becomes credit, not negative balance.
- Receipts are generated for confirmed payments.
- Financial actions produce audit logs.

Never implement financial calculations with JavaScript floating-point `number` arithmetic for production logic.

## Event Outbox Rules

Use the transactional outbox pattern for workflows that produce asynchronous side effects.

Examples:

- Student admitted
- Guardian added
- Attendance marked
- Attendance edited
- Invoice generated
- Payment received
- Payment reversed
- Fee reminder queued
- Assessment published
- Message sent

Outbox events caused by a database write must be created in the same transaction as the state change.

Do not add extra outbox fields such as `workerId`, `correlationId`, or `causationId` for v1.1.0 unless the model plan is updated.

## Security Rules

Agents must treat the system as handling sensitive data about minors and family finances.

Required behavior:

- Hash passwords before storage.
- Never return password hashes.
- Never log secrets, OTPs, raw tokens, or payment credentials.
- Enforce RBAC server-side.
- Enforce tenant isolation server-side.
- Validate all inputs.
- Rate-limit authentication and OTP endpoints when implemented.
- Use safe user-facing errors.

Parent access must be limited to students explicitly linked to that parent/guardian.

## Validation Rules

Validate input at the route/schema boundary before it reaches service or repository logic.

Validation must cover:

- Required fields.
- UUID format where applicable.
- Enum values.
- String length constraints.
- Numeric/money constraints.
- Date validity.
- Pagination limits.

Business validation belongs in services, not schemas.

## Testing Expectations

When changing behavior, add or update tests appropriate to risk.

Priority tests:

- Tenant isolation.
- Permission enforcement.
- Input validation.
- Student admission and guardian linking.
- Enrollment uniqueness.
- Attendance session uniqueness.
- Finance decimal calculations.
- Duplicate payment prevention.
- Payment reversal behavior.
- Outbox event creation.

If the project lacks a test harness for the touched area, document the gap and perform the closest available validation.

## Documentation Update Rules

Update documentation when code changes alter:

- Product scope.
- API paths or request/response shapes.
- Database schema.
- Domain events.
- Security behavior.
- Module responsibilities.
- Business rules.

Markdown files are source. Regenerate `.docx` only when the user needs print/share artifacts.

## Client-Facing vs Internal Documentation

Do not mix audiences.

Client-facing:

- `SchoolPulse_ProductDocument_v1.1.0.md`
- Matching `.docx` print artifact

Internal engineering:

- `SchoolPulse_Engineering_Spec_v1.1.0.md`
- `SchoolPulse_SRS_v1.1.0.md`
- `MODEL_PLAN.md`
- `POSTGRESQL_CODE_TO_BE_COMPLETED.sql`

Client-facing documents must not mention internal pitch strategy, implementation plans, coding standards, or speculative future modules.

Engineering documents must be precise, testable, and implementation-oriented.

## Code Style

Use TypeScript with explicit types.

Prefer:

- Clear function names.
- Small module-level functions.
- Typed DTOs.
- Schema-derived types where possible.
- Early validation.
- Explicit error classes or typed error objects.
- Prisma transactions for multi-write workflows.

Avoid:

- `any` unless bridging an untyped framework boundary.
- Large controllers.
- Hidden cross-module side effects.
- Broad refactors unrelated to the task.
- Magic strings for controlled states.

## Error Handling

Use consistent application errors.

Map errors to these HTTP categories:

- `400 VALIDATION_ERROR`
- `401 UNAUTHENTICATED`
- `403 FORBIDDEN`
- `404 NOT_FOUND`
- `409 CONFLICT`
- `429 RATE_LIMITED`
- `500 INTERNAL_ERROR`
- `502 PROVIDER_ERROR`

Do not leak raw Prisma errors to clients.

## Git and File Safety

The working tree may contain user changes.

Agents must:

- Check relevant files before editing.
- Avoid touching unrelated files.
- Never run destructive git commands unless explicitly requested.
- Never revert user changes unless explicitly requested.
- Keep generated artifacts separate from source edits when possible.

## Deterministic Output Rules

For the same task and same repository state, agents should produce the same output by following these rules:

- Use canonical documents in the specified read order.
- Use the documentation authority order for conflicts.
- Use existing module patterns unless they violate this file.
- Use the backend layer responsibilities exactly.
- Use `/api/v1` for production API design.
- Use enum-first database modeling.
- Keep v1.1.0 scope fixed.
- Prefer conservative implementation over speculative abstraction.
- Do not add optional features.
- Do not rename concepts unless docs require it.

## Before Final Response

Before reporting completion, an agent must check:

- Were canonical docs followed?
- Were tenant boundaries preserved?
- Were layer responsibilities preserved?
- Were money and finance rules preserved?
- Were relevant tests or validations run?
- Were docs updated if contracts changed?
- Are any limitations clearly stated?

Final responses must be concise and include:

- What changed.
- Where it changed.
- What validation was run.
- Any remaining risk or follow-up needed.

