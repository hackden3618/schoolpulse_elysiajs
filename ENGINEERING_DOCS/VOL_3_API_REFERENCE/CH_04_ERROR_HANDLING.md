# SchoolPulse REST API
## Chapter 4 — Error Handling and Recovery Strategy

Version: 1.1.0

---

# Purpose

This chapter defines how SchoolPulse handles failures.

The goal is to ensure:

- predictable frontend behavior
- easier debugging
- secure error exposure
- reliable financial operations
- recoverable failures
- consistent user experience

Errors are treated as part of the product design, not only backend exceptions.

---

# Error Philosophy

SchoolPulse operates in a multi-tenant environment where failures can affect:

- schools
- students
- payments
- attendance records
- communication channels
- subscriptions

Therefore:

1. Errors must be explicit.
2. Sensitive information must never leak.
3. Failed operations must leave the system in a safe state.
4. Recoverable failures should be retried automatically where appropriate.

---

# Error Classification

All errors belong to one of these categories.

---

# 1. Client Errors

Caused by incorrect user requests.

Examples:

- invalid data
- missing permissions
- incorrect IDs
- invalid state transitions

HTTP range:

400-499

---

# 2. Business Logic Errors

The request is technically valid but violates SchoolPulse rules.

Examples:

A student cannot be enrolled twice in the same class.

A completed exam cannot be modified.

A reversed payment cannot be edited.

---

Example:

```json
{
    "success": false,
    "error": {
        "code": "STUDENT_ALREADY_ENROLLED",
        "message": "Student is already enrolled in this class"
    }
}
````

---

# 3. Infrastructure Errors

Problems outside business logic.

Examples:

* database unavailable
* SMS provider failure
* payment provider timeout
* external API failure

These require logging and recovery.

---

# 4. System Errors

Unexpected failures.

Examples:

* programming bugs
* corrupted state
* unexpected exceptions

These must be logged internally.

---

# Error Object Standard

Every error follows:

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable message",
        "details": {}
    },
    "meta": {
        "requestId": "uuid"
    }
}
```

---

# Error Code Rules

Error codes are:

* uppercase
* descriptive
* stable
* machine readable

Format:

```
DOMAIN_ACTION_REASON
```

Examples:

```
STUDENT_NOT_FOUND

PAYMENT_ALREADY_REVERSED

SCHOOL_ACCESS_DENIED

SMS_BALANCE_LOW
```

---

# Error Code Domains

## Authentication

Prefix:

```
AUTH_
```

Examples:

```
AUTH_INVALID_TOKEN

AUTH_SESSION_EXPIRED

AUTH_ACCOUNT_DISABLED
```

---

## Authorization

Prefix:

```
PERMISSION_
```

Examples:

```
PERMISSION_DENIED

PERMISSION_ROLE_REQUIRED
```

---

## Schools

Prefix:

```
SCHOOL_
```

Examples:

```
SCHOOL_NOT_FOUND

SCHOOL_ALREADY_EXISTS
```

---

## Students

Prefix:

```
STUDENT_
```

Examples:

```
STUDENT_NOT_FOUND

STUDENT_DUPLICATE_ADMISSION_NUMBER

STUDENT_ALREADY_ARCHIVED
```

---

## Payments

Prefix:

```
PAYMENT_
```

Examples:

```
PAYMENT_FAILED

PAYMENT_ALREADY_CONFIRMED

PAYMENT_REFERENCE_EXISTS
```

---

## Communication

Prefix:

```
MESSAGE_
```

Examples:

```
MESSAGE_SEND_FAILED

MESSAGE_TOKEN_INSUFFICIENT
```

---

## Subscription

Prefix:

```
SUBSCRIPTION_
```

Examples:

```
SUBSCRIPTION_EXPIRED

SUBSCRIPTION_PAYMENT_REQUIRED
```

---

# Validation Errors

Validation failures return:

HTTP:

422

Example:

Request:

```json
{
    "firstName": ""
}
```

Response:

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_FAILED",
        "message": "Invalid request data",
        "details": {
            "firstName": [
                "First name cannot be empty"
            ]
        }
    }
}
```

---

# Database Constraint Errors

Database errors must be translated.

Never expose:

```
PrismaClientKnownRequestError
```

to clients.

---

Example:

Database:

```
Unique constraint failed
```

Converted to:

```json
{
    "success": false,
    "error": {
        "code": "STUDENT_DUPLICATE_ADMISSION_NUMBER",
        "message": "Admission number already exists"
    }
}
```

---

# Not Found Handling

Every resource lookup must handle missing data.

Example:

Request:

```
GET /students/random-id
```

Response:

HTTP:

404

```json
{
    "success": false,
    "error": {
        "code": "STUDENT_NOT_FOUND",
        "message": "Student was not found"
    }
}
```

---

# Permission Errors

Multi-tenancy requires strict isolation.

A user must never access another school's data.

Example:

User belongs to:

School A

Requests:

```
GET /schools/B/students
```

Response:

403

```json
{
    "success": false,
    "error": {
        "code": "SCHOOL_ACCESS_DENIED",
        "message": "You do not have access to this school"
    }
}
```

---

# Financial Error Handling

Financial operations require special treatment.

Affected modules:

* invoices
* payments
* allocations
* subscriptions

---

## Payment Failure

Example:

M-Pesa timeout.

The payment record becomes:

```
status = failed
```

The system does not delete it.

Reason:

Financial records are immutable history.

---

## Payment Reversal

A reversal creates a new financial event.

Never:

Delete payment.

Modify amount.

---

Correct:

Payment A

```
confirmed
KES 5000
```

↓

Payment B

```
reversal
KES 5000
```

---

# External Service Failures

External systems:

* M-Pesa
* SMS providers
* Email providers

may fail.

The system must:

1. Record failure.
2. Retry where appropriate.
3. Inform users when action is required.

---

Example:

SMS sending:

Attempt 1:

Failed

↓

Retry queue

↓

Attempt 2

↓

Delivered

---

# Retry Policy

Retryable operations:

## SMS

Retry:

3 times

Backoff:

exponential

---

## Event Processing

Retry:

configurable

Example:

```
1 minute

5 minutes

15 minutes

1 hour
```

---

## Payments

Never automatically retry payment confirmation blindly.

Payment providers require reconciliation.

---

# Dead Letter Handling

Failed events eventually move to:

```
dead_letter
```

Example:

```
EventOutbox.status = dead_letter
```

They require administrator review.

---

# Logging Requirements

Every server error must include:

```
requestId

userId

schoolId

endpoint

timestamp

stack trace
```

---

# User Facing Error Messages

Messages should:

* explain what happened
* suggest next action
* avoid technical terms

Bad:

```
Foreign key constraint failed
```

Good:

```
This student cannot be removed because payment records exist.
```

---

# Frontend Error Handling Expectations

Frontend should:

Display friendly messages.

Never interpret raw errors.

Use:

```
error.code
```

for behavior.

Example:

```typescript
if(error.code==="PAYMENT_FAILED"){
    showRetryPayment()
}
```

---

# API Error Middleware

Backend must contain centralized error middleware.

Suggested location:

```
src/common/errors/
```

Responsibilities:

* catch exceptions
* map errors
* format responses
* log failures

---

# Development Mode

Development may expose:

* stack traces
* database details
* debugging metadata

---

# Production Mode

Production hides:

* stack traces
* SQL errors
* internal paths
* environment variables

---

# Error Handling Summary

A production-ready SchoolPulse API must:

✓ return predictable errors

✓ protect tenant boundaries

✓ preserve financial history

✓ support recovery

✓ log failures

✓ avoid leaking internals

✓ provide actionable feedback

---
