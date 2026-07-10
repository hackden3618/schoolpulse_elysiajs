# SchoolPulse Engineering Constitution

Version: 1.1.0

This document defines the engineering rules that every contributor
(human or AI) MUST follow.

Violation of these rules results in inconsistent architecture,
feature drift and technical debt.

---

# 1. Project Identity

SchoolPulse is a production-grade multi-tenant School Management SaaS.

Target users include:

- Primary Schools
- Junior Secondary Schools
- Senior Secondary Schools
- Mixed Schools

This is NOT:

- a tutorial
- a university project
- a CRUD demo
- an experimental codebase

Every engineering decision must assume thousands of schools,
millions of records and long-term maintainability.

---

# 2. Current Development Phase

Current Version:

v1.1.0

This version is feature frozen.

Only implement functionality already defined in:

- Engineering Documents
- Database Schema
- API Specification

Do NOT invent new product features.

If an improvement is discovered:

DO NOT implement it.

Instead document it under:

Future Improvements (v1.2+)

---

# 3. Source of Truth

The order of authority is:

1.
Engineering Documentation

↓

2.
Prisma Schema

↓

3.
API Documentation

↓

4.
Backend Implementation

↓

5.
Frontend

Never allow implementation to redefine documentation.

Documentation drives implementation.

---

# 4. Frozen Components

The following are frozen unless explicitly requested.

✓ Database Schema

✓ Product Scope

✓ Core Business Rules

✓ Entity Relationships

✓ API Design Principles

✓ Multi-tenancy Design

✓ Version 1.1.0 Scope

---

# 5. Architecture Style

Backend follows Vertical Slice Architecture.

Every feature module contains:

controller

service

repository

routes

schema

mapper

permissions

events

README

No exceptions.

---

# 6. Separation of Responsibilities

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma

Controllers never contain business logic.

Repositories never contain business logic.

Services orchestrate work.

Policies enforce business rules.

---

# 7. Business Rules

Business rules belong inside Policy classes.

Example

StudentPolicy

InvoicePolicy

AttendancePolicy

MembershipPolicy

Never scatter business rules across services.

---

# 8. Infrastructure

External systems belong under Infrastructure.

Examples

Database

Queue

SMS

Email

Storage

Cache

Events

Feature modules must never implement infrastructure directly.

---

# 9. Documentation First

Before implementing any major feature,
documentation must exist.

Required order:

Architecture

↓

Database

↓

API

↓

UI

↓

Implementation

Never reverse this process.

---

# 10. UI Philosophy

The UI should communicate trust.

Keywords:

Professional

Calm

Fast

Minimal

Enterprise

Never imitate social media dashboards.

Avoid excessive gradients.

Avoid playful interfaces.

Favor clarity over decoration.

---

# 11. Design Philosophy

School administrators use this system for hours every day.

Optimize for:

low cognitive load

speed

predictability

keyboard efficiency

high information density

large tables

bulk operations

minimal clicks

---

# 12. Performance Philosophy

Avoid:

N+1 queries

large payloads

duplicate API calls

duplicate rendering

unnecessary loading

Pagination is preferred over loading everything.

---

# 13. Security

Always assume:

every endpoint is public until protected.

Every endpoint must consider:

Authentication

Authorization

School isolation

Audit logging

Validation

Never trust frontend input.

---

# 14. Multi-Tenancy

Every query MUST be scoped to school context unless explicitly global.

Never expose records across schools.

School isolation is mandatory.

---

# 15. Auditability

Any action affecting:

Students

Finance

Attendance

Assessments

Subscriptions

Permissions

should be capable of producing audit logs.

---

# 16. Event Driven Design

Where applicable:

emit events

instead of tightly coupling modules.

Examples

StudentAdmitted

PaymentReceived

InvoiceGenerated

AssessmentPublished

AttendanceMarked

---

# 17. Code Quality

Prefer:

small files

small functions

descriptive names

pure functions

composition

Avoid:

god classes

massive services

deep nesting

copy-paste

magic numbers

---

# 18. AI Agent Rules

AI agents must NOT:

invent endpoints

invent database tables

change schema

change version scope

rename entities

change business rules

rewrite architecture

AI agents SHOULD:

follow documentation

reuse components

maintain consistency

improve readability

reduce duplication

---

# 19. Definition of Done

A task is complete only when:

✓ Documentation updated

✓ API documented

✓ Validation implemented

✓ Authorization implemented

✓ Errors handled

✓ Audit considered

✓ Events considered

✓ Tests considered

---

# 20. Guiding Principle

Every change should make the project feel like it was built by
a disciplined engineering team over many years.

When unsure:

prefer consistency over cleverness.

Architecture over shortcuts.

Long-term maintainability over temporary convenience.



> extra notes for AI agents
# AI Decision Framework

Before making any modification, ask internally:

1. Does this already exist?

If yes:
Reuse it.

---

2. Does this change Version 1.1.0 scope?

If yes:
Stop.
Suggest documenting it for v1.2.0 instead.

---

3. Does this violate the frozen schema?

If yes:
Stop.

---

4. Does this duplicate an existing module?

If yes:
Extend the existing module.

---

5. Does this belong in Infrastructure?

If yes:
Move it there.

---

6. Does this belong in Common?

If yes:
Move it there.

---

7. Does this belong in Policies?

If it is a business rule,
move it into a Policy class.

---

8. Does this require an Event?

If yes:
Emit an EventOutbox event.

---

9. Does this require an Audit Log?

If yes:
Create one.

---

10. Is this documented?

If not:

Document first.
Code second.
