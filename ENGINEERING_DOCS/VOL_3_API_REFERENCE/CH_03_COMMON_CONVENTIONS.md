# SchoolPulse REST API
## Chapter 2 — Authentication & Authorization

Version: 1.1.0

---

# Purpose

This chapter defines how clients authenticate with the SchoolPulse API,
how school context is established, and how permissions are evaluated.

Authentication answers:

> Who is making this request?

Authorization answers:

> Is the authenticated user allowed to perform this action within the selected school?

---

# Authentication Model

SchoolPulse uses stateless authentication.

The backend issues a signed JSON Web Token (JWT) after a successful login.

The client stores the token securely and includes it with every authenticated request.

Authentication is required for every endpoint unless explicitly marked as public.

---

# Authentication Flow

User submits credentials

↓

Credentials validated

↓

User account located

↓

Password verified

↓

Available school memberships loaded

↓

JWT generated

↓

Refresh Token generated

↓

Response returned

↓

Client stores tokens

↓

Authenticated requests begin

---

# Authentication Endpoints

## Login

POST

```
/api/v1/auth/login
```

Authenticates a user using phone number or email and password.

Returns:

- Access Token
- Refresh Token
- User Profile
- School Memberships

---

## Refresh Access Token

POST

```
/api/v1/auth/refresh
```

Uses a valid refresh token to obtain a new access token.

---

## Logout

POST

```
/api/v1/auth/logout
```

Invalidates the refresh token.

---

## Current User

GET

```
/api/v1/auth/me
```

Returns the authenticated user's profile together with:

- memberships
- active school
- permissions
- roles

---

# Login Identifier

Users may authenticate using either

Phone Number

or

Email Address

Phone numbers remain the preferred identifier.

---

# Password Requirements

Passwords are never stored.

Passwords are hashed using a secure password hashing algorithm.

The backend never returns passwords.

---

# Access Token

The access token is a signed JWT.

Typical lifetime

15–30 minutes

The token contains only identity information required for request processing.

Example payload

```
User ID

Current School ID

Membership ID

Issued At

Expiration

Token Version
```

Sensitive information must never be embedded inside the token.

---

# Refresh Token

Refresh tokens have a longer lifetime.

Typical lifetime

30 days

Refresh tokens are used only to obtain new access tokens.

They are never used to authorize API requests.

---

# Authorization Header

Authenticated requests must include

```
Authorization: Bearer <access_token>
```

Missing tokens result in

401 Unauthorized

---

# School Context

SchoolPulse is a multi-tenant platform.

Every authenticated request executes within exactly one school.

The active school is determined using the authenticated membership.

A user may belong to multiple schools.

Example

Teacher A

↓

School Alpha

↓

Principal

Teacher A

↓

School Beta

↓

Mathematics Teacher

The backend always evaluates permissions using the selected membership.

---

# Membership

Permissions are never granted directly to a user.

Permissions belong to

Role

↓

Membership

↓

School

Therefore:

User

↓

Membership

↓

Role

↓

Permissions

This prevents permission leakage across schools.

---

# Permission Evaluation

Every protected endpoint follows the same process.

Authenticated?

↓

Membership Active?

↓

School Active?

↓

Role Exists?

↓

Permission Granted?

↓

Business Rule Validation

↓

Execute

Failure at any stage terminates the request.

---

# Permission Naming Convention

Permissions follow

```
resource.action
```

Examples

```
students.read

students.create

students.update

students.archive

attendance.mark

attendance.edit

attendance.lock

payments.record

payments.reverse

invoices.generate

messages.send

roles.assign

users.manage

schools.update
```

This naming convention is mandatory.

---

# Roles

Roles are collections of permissions.

Examples

Principal

Deputy Principal

Teacher

Bursar

Secretary

Parent

System Administrator

Roles remain configurable.

Permissions are evaluated dynamically.

---

# Authentication Middleware

Every protected request passes through

Authentication Middleware

↓

JWT Verification

↓

Token Expiration Check

↓

User Lookup

↓

Membership Lookup

↓

School Lookup

↓

Attach Request Context

Controllers never perform authentication directly.

---

# Authorization Middleware

Authorization middleware checks

Required Permission

↓

Membership Status

↓

Role Assignment

↓

Permission Match

↓

Continue

Otherwise

403 Forbidden

---

# Public Endpoints

Version 1.1.0 exposes only a small number of public endpoints.

Examples

```
POST /join-requests

POST /auth/login

POST /auth/refresh
```

Everything else requires authentication.

---

# Membership Status Rules

Inactive memberships cannot access school resources.

Allowed

```
active
```

Denied

```
suspended

terminated

resigned

on_leave
```

unless explicitly documented otherwise.

---

# User Status Rules

Inactive users cannot authenticate.

Allowed

```
active
```

Denied

```
inactive

archived
```

---

# School Status Rules

If a school's subscription prevents access,

the authentication process may succeed,

but authorization will deny protected operations according to subscription policies.

---

# Request Context

Every authenticated request receives a request context.

Example

```
Authenticated User

Membership

School

Roles

Permissions

Request ID

IP Address
```

Services consume this context instead of re-querying identity information.

---

# Token Expiration

Expired access tokens return

401 Unauthorized

Clients should immediately call

```
POST /auth/refresh
```

If refresh also fails,

the user must authenticate again.

---

# Authentication Errors

Possible authentication failures include

Missing token

Malformed token

Expired token

Invalid signature

Unknown user

Inactive user

Inactive membership

Inactive school

Insufficient permissions

Each failure maps to a standardized error response defined in Chapter 4.

---

# Audit Logging

Authentication events should generate audit entries where appropriate.

Examples

Successful Login

Failed Login

Logout

Password Reset

Role Change

Membership Change

---

# Security Principles

Authentication must never expose

Password hashes

Internal IDs not required by clients

Permission evaluation logic

Internal stack traces

Database details

---

# Summary

SchoolPulse authentication is based on JWT access tokens, refresh tokens, school memberships, and role-based permissions.

Authorization is always evaluated within the context of the selected school, ensuring strict tenant isolation and consistent permission enforcement throughout the platform.

---
