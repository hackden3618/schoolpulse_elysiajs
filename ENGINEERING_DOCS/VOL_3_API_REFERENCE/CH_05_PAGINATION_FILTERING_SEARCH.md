# SchoolPulse REST API
## Chapter 5 — API Versioning, Routing and Module Organization

Version: 1.1.0

---

# Purpose

This chapter defines how SchoolPulse exposes its backend capabilities through a stable API structure.

The goal is to ensure:

- predictable frontend integration
- future compatibility
- clean backend organization
- independent module development
- safe evolution after v1.1.0

---

# API Design Philosophy

SchoolPulse is designed as a long-term SaaS platform.

The API must support:

- multiple schools
- multiple user roles
- future mobile applications
- external integrations
- future reporting systems
- third-party payment integrations

Therefore, the API contract must remain stable.

---

# Base URL Structure

All APIs follow:

```

[https://api.schoolpulse.co.ke/api/v1](https://api.schoolpulse.co.ke/api/v1)

```

Development:

```

[http://localhost:3000/api/v1](http://localhost:3000/api/v1)

```

---

# Versioning Strategy

SchoolPulse uses URL-based versioning.

Current version:

```

v1

```

Example:

```

GET /api/v1/students

```

---

# Why URL Versioning?

Advantages:

- clear separation
- easy frontend migration
- easier documentation
- supports multiple clients

---

# Version Lifecycle

## v1.1.0

Current production target.

Focus:

Core school management system.

Includes:

- authentication
- school management
- students
- academics
- attendance
- finance
- communication
- subscriptions
- events

---

## Future versions

Example:

```

/api/v2/students

```

may introduce breaking changes.

Existing clients continue using:

```

/api/v1/students

```

---

# Request Lifecycle

A request follows:

```

Client

↓

API Gateway

↓

Authentication Middleware

↓

Tenant Resolution

↓

Permission Middleware

↓

Route Handler

↓

Controller

↓

Service Layer

↓

Repository Layer

↓

Database

↓

Response Formatter

↓

Client

```

---

# Route Organization

The API is divided into domains.

Structure:

```

/api/v1
│
├── auth
├── schools
├── users
├── memberships
├── roles
├── students
├── guardians
├── academics
├── attendance
├── assessments
├── finance
├── communication
├── subscriptions
├── events
└── system

```

---

# Authentication Routes

Base:

```

/api/v1/auth

```

Purpose:

User identity management.

Routes:

```

POST   /auth/register

POST   /auth/login

POST   /auth/logout

POST   /auth/refresh

POST   /auth/change-password

POST   /auth/reset-password

```

---

# School Routes

Base:

```

/api/v1/schools

```

Purpose:

School tenant management.

Routes:

```

GET     /schools

POST    /schools

GET     /schools/:schoolId

PATCH   /schools/:schoolId

DELETE  /schools/:schoolId

```

---

# School Onboarding Routes

Because SchoolPulse supports new school registration:

Base:

```

/api/v1/onboarding

```

Purpose:

Allow schools to request access.

Routes:

```

POST /onboarding/request

GET  /onboarding/status/:requestId

```

Internal administration:

```

GET   /admin/join-requests

PATCH /admin/join-requests/:id/approve

PATCH /admin/join-requests/:id/reject

```

---

# User Routes

Base:

```

/api/v1/users

```

Purpose:

Global user identity management.

Routes:

```

GET    /users/me

PATCH  /users/me

GET    /users/:id

PATCH  /users/:id/status

```

---

# Membership Routes

Base:

```

/api/v1/memberships

```

Purpose:

School-user relationships.

Routes:

```

GET  /schools/:schoolId/members

POST /schools/:schoolId/members

PATCH /memberships/:id

DELETE /memberships/:id

```

---

# Role Routes

Base:

```

/api/v1/roles

```

Purpose:

Permission management.

Routes:

```

GET /roles

POST /roles

PATCH /roles/:id

DELETE /roles/:id

```

---

# Student Routes

Base:

```

/api/v1/students

```

Purpose:

Student lifecycle management.

Routes:

```

GET    /students

POST   /students

GET    /students/:id

PATCH  /students/:id

POST   /students/:id/archive

POST   /students/:id/transfer

```

---

# Guardian Routes

Base:

```

/api/v1/guardians

```

Purpose:

Parent/guardian management.

Routes:

```

GET  /students/:studentId/guardians

POST /students/:studentId/guardians

PATCH /guardians/:id

DELETE /guardians/:id

```

---

# Academic Routes

Base:

```

/api/v1/academics

```

Handles:

- academic years
- terms
- classes
- streams
- subjects

---

Example:

Academic years:

```

GET  /academic-years

POST /academic-years

PATCH /academic-years/:id

```

---

Classes:

```

GET  /classes

POST /classes

GET /classes/:id

```

---

Class instances:

```

GET /class-instances

POST /class-instances

```

---

# Attendance Routes

Base:

```

/api/v1/attendance

```

Purpose:

Daily learner attendance.

Routes:

```

POST /sessions

GET /sessions/:id

POST /sessions/:id/records

PATCH /records/:id

POST /sessions/:id/lock

```

---

# Assessment Routes

Base:

```

/api/v1/assessments

```

Purpose:

Academic performance.

Routes:

```

POST /exams

GET /exams

POST /assessments

POST /results

PATCH /results/:id

POST /results/publish

```

---

# Finance Routes

Base:

```

/api/v1/finance

```

Purpose:

School financial management.

Modules:

- fee structures
- invoices
- payments
- allocations
- audit logs

---

Fee structures:

```

GET  /fee-structures

POST /fee-structures

```

---

Invoices:

```

GET /invoices

POST /invoices/generate

GET /invoices/:id

```

---

Payments:

```

POST /payments

GET /payments/:id

POST /payments/:id/reverse

```

---

# Communication Routes

Base:

```

/api/v1/communication

```

Purpose:

Messaging system.

Includes:

- in-app messages
- SMS
- email
- WhatsApp future support

---

Routes:

```

POST /messages

GET /messages

GET /conversations

POST /broadcast

```

---

# SMS Basket Routes

Base:

```

/api/v1/messages/tokens

```

Purpose:

School-managed SMS credits.

---

View balance:

```

GET /tokens

````

Response:

```json
{
    "type":"sms",
    "availableTokens":5000
}
````

---

Purchase tokens:

```
POST /tokens/purchase
```

---

Transaction history:

```
GET /tokens/history
```

---

# Subscription Routes

Base:

```
/api/v1/subscriptions
```

Purpose:

SchoolPulse SaaS billing.

Routes:

```
GET /subscriptions/current

POST /subscriptions/upgrade

POST /subscriptions/renew
```

---

# Event Routes

Base:

```
/api/v1/events
```

Purpose:

Internal event monitoring.

Not exposed to normal users.

Routes:

```
GET /events

GET /events/:id

POST /events/retry
```

---

# Administrative Routes

Base:

```
/api/v1/admin
```

Restricted to SchoolPulse internal administrators.

Purpose:

Platform management.

Includes:

* onboarding review
* subscription management
* fraud detection
* system monitoring

---

# Module Folder Mapping

Each API module maps to:

```
src/modules/
```

Example:

```
src/modules/students

├── students.route.ts
├── students.controller.ts
├── students.service.ts
├── students.repository.ts
├── students.schema.ts
├── students.types.ts
└── README.md
```

---

# Layer Responsibilities

## Route

Responsible for:

* URL definitions
* middleware attachment

---

## Controller

Responsible for:

* request extraction
* response formatting

---

## Service

Responsible for:

* business rules
* transactions
* event emission

---

## Repository

Responsible for:

* database operations

---

# Forbidden Practices

Never:

❌ Put Prisma queries in controllers

❌ Put business logic in routes

❌ Return database errors directly

❌ Create random endpoints without documentation

❌ Mix unrelated domains

---

# API Documentation Requirement

Every module must contain:

```
README.md
```

Containing:

* endpoint list
* request examples
* response examples
* permissions required
* emitted events
* business rules

---

# Summary

The SchoolPulse API is organized around business domains.

Each module owns its logic.

The API contract is versioned, predictable and designed for long-term SaaS growth.

---
