# SchoolPulse Documentation Index

Version: 1.1.0  
Status: Authoritative planning baseline  
Last updated: 2026-07-08

## Purpose

This directory separates SchoolPulse documentation into two audiences:

- Product and sales documents explain why schools should buy SchoolPulse, what value it creates, how onboarding works, and what v1.1.0 includes.
- Engineering documents define exactly how v1.1.0 is designed, implemented, secured, tested, deployed, and maintained.

The binary Word files in this directory are treated as legacy drafts. The Markdown files are the maintained source of truth because they are reviewable in Git, easy to diff, and easier for engineers and sales teams to keep current.

## Maintained Documents

| Document | Audience | Purpose |
| --- | --- | --- |
| `SCHOOLPULSE_PROJECT_CHARTER.MD` | Everyone | Defines the product mission, v1.1.0 scope boundary, operating principles, and document governance. |
| `SchoolPulse_ProductDocument_v1.1.0.md` | Sales, founders, school leaders, investors | Non-technical product, pitch, pricing, ROI, onboarding, objection handling, and demo guide. |
| `SchoolPulse_Engineering_Spec_v1.1.0.md` | Backend, frontend, QA, DevOps | Architecture, modules, domain model, REST API, events, security, coding standards, deployment, testing, and implementation rules. |
| `SchoolPulse_SRS_v1.1.0.md` | Product, engineering, QA | Testable functional and non-functional requirements for the v1.1.0 product boundary. |
| `MODEL_PLAN.md` | Backend, database | Enum-first modeling notes and Prisma design decisions to apply before implementation. |
| `POSTGRESQL_CODE_TO_BE_COMPLETED.sql` | Backend, database, DevOps | Target PostgreSQL schema for v1.1.0, including enums, tables, constraints, indexes, soft deletes, and event outbox. |

## Current Codebase Snapshot

The backend currently uses Bun, TypeScript, Elysia, Prisma, PostgreSQL, and bcrypt. Implemented or started modules include:

- `backend/src/schools`: basic `GET /schools` and `POST /schools`.
- `backend/src/users`: basic `GET /users` and `POST /users`.
- `backend/src/students`: basic `GET /students` and `POST /students`.
- `backend/src/streams`: placeholder route; the v1.1.0 model plan now treats stream as a class-instance attribute rather than a separate aggregate.
- `backend/src/classes`, `guardians`, `memberships`, `roles`: placeholder directories and READMEs.

Important implementation gap: `backend/src/students/schema.ts` and `backend/src/students/repository.ts` are currently empty, while `service.ts` directly calls Prisma. v1.1.0 engineering standards require the following separation:

- `schema.ts`: request/response schemas, input validation, DTO types.
- `repository.ts`: database access only, using Prisma.
- `service.ts`: business logic, transactions, authorization-sensitive decisions, domain events.
- `controller.ts`: HTTP request/response orchestration only.
- `route.ts`: Elysia route registration, middleware, OpenAPI metadata.

## Version Boundary

SchoolPulse v1.1.0 includes:

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

No additional modules are accepted into v1.1.0 without a documented version change.

## Print-Ready Office Documents

OnlyOffice-compatible `.docx` files are generated from the maintained Markdown sources:

- `SchoolPulse_ProductDocument.docx`
- `SchoolPulse_SRS.docx`
- `SchoolPulse_Engineering_Spec_v1.1.0.docx`
- `SCHOOLPULSE_PROJECT_CHARTER.docx`
- `MODEL_PLAN.docx`
- `SchoolPulse_Database_Schema_v1.1.0.docx`
- `SchoolPulse_v1.1.0_Print_Pack.docx`

Use the Markdown files for editing and review. Use the `.docx` files for printing, sharing, and signing off the conceptual/design phase.
