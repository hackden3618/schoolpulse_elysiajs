# SchoolPulse REST API
## Chapter 6 — Authentication API Specification

Version: 1.1.0

---

# Purpose

This chapter specifies every authentication endpoint in SchoolPulse.

Authentication is responsible only for:

- identity verification
- session creation
- password management
- token lifecycle

School membership, permissions and authorization are handled separately.

---

# Authentication Philosophy

SchoolPulse separates identity from tenancy.

Identity answers:

> Who is this user?

Authorization answers:

> What may this user do?

Tenant resolution answers:

> Which school are they currently operating in?

These concerns must never be mixed.

---

# Authentication Flow

```
User

↓

Phone / Email

↓

Password Verification

↓

JWT Generation

↓

Refresh Token

↓

Return User Profile

↓

Frontend selects school

↓

School Context Activated

↓

Permission Resolution
```

---

# Authentication Methods

Supported in v1.1.0

✓ Phone + Password

✓ Email + Password

Future:

- Google OAuth
- Microsoft Login
- Passkeys

---

# Session Strategy

Authentication uses:

Access Token

Refresh Token

Access Token:

- short lived
- included in Authorization header

Refresh Token:

- long lived
- securely stored
- rotated after refresh

---

# Authorization Header

```
Authorization: Bearer <access_token>
```

---

# Access Token Payload

Example

```json
{
    "sub": "user_uuid",
    "phone": "+254712345678",
    "email": "john@example.com",
    "tokenVersion": 1
}
```

Notice:

School ID is NOT stored inside the authentication token.

School selection happens later.

---

# Login Endpoint

```
POST /api/v1/auth/login
```

Purpose

Authenticate an existing user.

---

## Request

```json
{
    "identifier": "+254712345678",
    "password": "********"
}
```

identifier accepts:

- phone
- email

---

## Success Response

201

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "accessToken": "...",
        "refreshToken": "...",
        "user": {
            "id": "...",
            "firstName": "Dennis",
            "lastName": "Wambugu"
        }
    }
}
```

---

Possible Errors

```
AUTH_INVALID_CREDENTIALS

AUTH_ACCOUNT_DISABLED

AUTH_ACCOUNT_ARCHIVED

AUTH_TOO_MANY_ATTEMPTS
```

---

Business Rules

Password must match.

Inactive accounts cannot login.

Archived accounts cannot login.

Failed login attempts should be logged.

---

Events

Emit:

```
UserLoggedIn
```

---

# Logout Endpoint

```
POST /api/v1/auth/logout
```

Purpose

Invalidate refresh token.

---

Request

```
Authorization Header
```

---

Response

```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

---

Business Rules

Refresh token becomes invalid.

Existing access token naturally expires.

---

Events

```
UserLoggedOut
```

---

# Refresh Token

```
POST /api/v1/auth/refresh
```

Purpose

Issue new access token.

---

Request

```json
{
    "refreshToken": "..."
}
```

---

Success

```json
{
    "success": true,
    "data": {
        "accessToken": "...",
        "refreshToken": "..."
    }
}
```

Refresh tokens rotate.

Old refresh token becomes invalid.

---

Errors

```
AUTH_REFRESH_EXPIRED

AUTH_INVALID_REFRESH

AUTH_SESSION_REVOKED
```

---

# Register Endpoint

Important

Registration creates only the User identity.

It does NOT create:

- school
- memberships
- permissions

Those belong to onboarding.

---

Endpoint

```
POST /api/v1/auth/register
```

---

Request

```json
{
    "firstName":"Dennis",
    "secondName":"",
    "lastName":"Wambugu",
    "phone":"+254712345678",
    "email":"john@example.com",
    "password":"StrongPassword123"
}
```

---

Response

```json
{
    "success":true,
    "message":"Account created successfully"
}
```

---

Business Rules

Phone must be unique.

Email must be unique.

Password hashed using Argon2id.

Never return hashed password.

---

Events

```
UserCreated
```

---

# Change Password

```
POST /api/v1/auth/change-password
```

Authenticated endpoint.

---

Request

```json
{
    "currentPassword":"",
    "newPassword":""
}
```

---

Business Rules

Current password required.

Password policy enforced.

All refresh tokens revoked.

---

Events

```
PasswordChanged
```

---

# Forgot Password

```
POST /api/v1/auth/forgot-password
```

---

Request

```json
{
    "identifier":"+254712345678"
}
```

Always return success.

Never reveal whether account exists.

---

Example

```json
{
    "success":true,
    "message":"If the account exists, recovery instructions have been sent."
}
```

---

# Reset Password

```
POST /api/v1/auth/reset-password
```

---

Request

```json
{
    "token":"...",
    "newPassword":"..."
}
```

---

Business Rules

Recovery token expires.

Single use only.

Revokes all sessions.

---

# Verify Phone

Future endpoint.

```
POST /auth/verify-phone
```

Not required in v1.1.0.

---

# Verify Email

Future endpoint.

```
POST /auth/verify-email
```

---

# Current User

```
GET /api/v1/auth/me
```

Returns authenticated identity.

---

Response

```json
{
    "success":true,
    "data":{
        "id":"",
        "firstName":"",
        "secondName":"",
        "lastName":"",
        "phone":"",
        "email":"",
        "profilePic":"",
        "status":"active"
    }
}
```

Notice:

Memberships are NOT returned here.

Use membership endpoint.

---

# Password Policy

Minimum

12 characters.

Must contain

Uppercase

Lowercase

Number

Special character

Reject weak passwords.

---

# Rate Limiting

Login

5 attempts

↓

Temporary lock

Forgot password

3 requests/hour

Refresh

reasonable burst limits

---

# Security Rules

Passwords

Argon2id

Tokens

JWT

HTTPS required

No credentials in logs.

No tokens inside URLs.

---

# Audit Requirements

Successful login

Failed login

Password change

Password reset

Logout

must all generate AuditLog entries.

---

# Events

Successful registration

↓

UserCreated

Successful login

↓

UserLoggedIn

Password change

↓

PasswordChanged

Logout

↓

UserLoggedOut

---

# Summary

Authentication establishes identity only.

School access is determined later through memberships and active tenant selection.

This separation allows one user to securely belong to multiple schools without duplicating accounts.

---
