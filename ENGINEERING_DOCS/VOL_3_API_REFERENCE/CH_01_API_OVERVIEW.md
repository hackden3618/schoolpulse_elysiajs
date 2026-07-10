# SchoolPulse REST API
## Chapter 1 — API Overview

Version: 1.1.0

---

# Purpose

The SchoolPulse REST API provides a secure, predictable and versioned interface for interacting with every resource within the SchoolPulse platform.

The API is designed around business operations rather than simple database CRUD. Each endpoint represents an action performed by schools during daily operations such as admitting students, recording fee payments, publishing assessments or marking attendance.

The API serves three primary clients:

- SchoolPulse Web Application
- Future Mobile Applications
- Third-party integrations (future versions)

Version 1.1.0 is considered the first production-ready API and defines the complete contract between backend and frontend.

---

# API Philosophy

SchoolPulse APIs follow several guiding principles.

## Business Driven

Endpoints are designed around business actions.

Examples

✔ Admit Student

✔ Record Fee Payment

✔ Publish Assessment

✔ Assign Teacher

instead of generic CRUD naming.

---

## Predictable

Every endpoint follows identical conventions.

Authentication

↓

Authorization

↓

Validation

↓

Business Rules

↓

Database Transaction

↓

Audit Log

↓

Event Emission

↓

Response

Every endpoint behaves consistently.

---

## Multi-Tenant First

Every request is executed within a School Context.

No endpoint may expose another school's data.

School isolation is mandatory.

---

## Secure by Default

All endpoints require authentication unless explicitly documented otherwise.

Every request is validated.

Every mutation is auditable.

Permissions are enforced before business logic executes.

---

## Versioned

The API is versioned.

Current version:

v1

Future versions may introduce additional endpoints without breaking existing clients.

---

# Base URL

Development

/api/v1

Example

GET /api/v1/students

Production deployment may prepend a domain.

Example

https://api.schoolpulse.app/api/v1

The version segment is mandatory.

---

# Content Type

Requests

Content-Type:

application/json

Responses

Content-Type:

application/json

File uploads use

multipart/form-data

---

# Character Encoding

UTF-8

All text exchanged by the API must be UTF-8 encoded.

---

# Date and Time

All timestamps use ISO-8601.

Example

2026-07-09T15:42:19Z

Dates without time

YYYY-MM-DD

Example

2026-07-09

Timezone

Africa/Nairobi

All timestamps are stored in UTC and converted by clients when necessary.

---

# Decimal Values

Financial values use decimal precision.

Example

15000.00

Never send floating-point approximations.

---

# Currency

Default currency

KES

Future versions may support multiple currencies.

---

# HTTP Methods

GET

Retrieve resources.

Never modifies data.

---

POST

Create resources or perform business actions.

---

PATCH

Partially update a resource.

Only changed fields are supplied.

---

DELETE

Soft-delete resources unless otherwise documented.

Data is never physically removed during standard operations.

---

# Idempotency

GET

Safe and idempotent.

PATCH

Idempotent where possible.

POST

Not idempotent unless explicitly documented.

DELETE

Idempotent.

---

# Resource Naming

Resources use plural nouns.

Examples

/students

/classes

/payments

/invoices

/messages

Never use verbs inside resource names.

Business actions are represented by nested routes.

Example

/students/{id}/archive

/students/{id}/transfer

/invoices/{id}/cancel

/messages/{id}/resend

---

# Endpoint Structure

Standard resource

GET /students

Retrieve collection.

GET /students/{id}

Retrieve one resource.

POST /students

Create.

PATCH /students/{id}

Update.

DELETE /students/{id}

Archive.

Business operation

POST /students/{id}/transfer

POST /students/{id}/restore

POST /payments/{id}/reverse

POST /attendance/sessions/{id}/lock

---

# Resource Identifiers

All primary identifiers are UUID v4.

Example

85ce9f67-8727-42c6-a7db-21e9fcaf650d

IDs are immutable.

---

# Soft Deletes

SchoolPulse never permanently deletes operational records during normal use.

Deleted resources contain

deletedAt

Archived resources may be restored where supported.

---

# API Lifecycle

Every request passes through the following lifecycle.

Client Request

↓

Authentication

↓

School Context Resolution

↓

Permission Verification

↓

Input Validation

↓

Business Rule Validation

↓

Database Transaction

↓

Audit Logging

↓

Event Outbox

↓

HTTP Response

This lifecycle is mandatory for every mutating endpoint.

---

# Backward Compatibility

Minor releases

May introduce

new endpoints

new optional fields

additional filters

additional metadata

without breaking existing clients.

Breaking changes require a new API version.

---

# API Documentation Structure

Each module within this documentation contains

Purpose

Responsibilities

Endpoint Summary

Permissions

Validation Rules

Business Rules

Request Schema

Response Schema

Error Responses

Audit Events

Generated Events

Frontend Notes

Performance Notes

Examples

Every endpoint follows this exact structure.

---

# REST Design Principles

The API adheres to the following principles.

Stateless communication

Uniform resource naming

HTTP status code correctness

Consistent response structures

Resource-oriented URLs

Business-oriented operations

Predictable pagination

Deterministic validation

No hidden side effects

---

# Non-Goals

Version 1.1.0 does not include

GraphQL

SOAP

XML

Public third-party API access

Bulk streaming endpoints

Real-time subscriptions over HTTP

These capabilities may be introduced in future versions.

---

# Implementation Principles

Controllers

Handle HTTP.

Services

Contain business logic.

Repositories

Access persistence.

Policies

Enforce business rules.

Middleware

Provides authentication, authorization and request context.

The API documentation mirrors this architecture.

---

# Summary

This chapter establishes the global conventions for the SchoolPulse REST API.

All subsequent chapters inherit these standards and should not redefine them unless explicitly stated.
