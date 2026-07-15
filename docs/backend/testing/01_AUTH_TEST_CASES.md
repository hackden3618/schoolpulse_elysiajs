# 01 — Authentication

## AUTH-001 Login Success

**Objective:** Verify that a user can log in with valid credentials.

**Preconditions:**
- User exists with email `john@example.com` and password `ValidPass123`
- User has an active membership in the school

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "john@example.com", "password": "ValidPass123" }
```

**Expected HTTP Status:** 200

**Expected Response Body:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": { "id": "<uuid>", "firstName": "John" },
  "membership": { "id": "<uuid>", "status": "active" },
  "school": { "id": "<uuid>", "schoolName": "Test School" }
}
```

**Expected Database Changes:**
- `platform_admin.lastLogin` updated to current timestamp

**Expected Audit Log:**
- Event: `UserLoggedIn`
- Actor: user ID
- Timestamp recorded

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-002 Invalid Password

**Objective:** Verify that login fails with wrong password.

**Preconditions:**
- User exists with email `john@example.com`

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "john@example.com", "password": "WrongPassword" }
```

**Expected HTTP Status:** 401

**Expected Response Body:**
```json
{ "error": { "message": "Invalid credentials" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-003 Invalid Email

**Objective:** Verify that login fails with unregistered email.

**Preconditions:** None

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "nonexistent@example.com", "password": "ValidPass123" }
```

**Expected HTTP Status:** 401

**Expected Response Body:**
```json
{ "error": { "message": "Invalid credentials" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-004 Invalid Phone

**Objective:** Verify that login fails with unregistered phone number.

**Preconditions:** None

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "+254700000000", "password": "ValidPass123" }
```

**Expected HTTP Status:** 401

**Expected Response Body:**
```json
{ "error": { "message": "Invalid credentials" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-005 Suspended User

**Objective:** Verify that a suspended user cannot log in.

**Preconditions:**
- User exists with status `suspended`

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "suspended@example.com", "password": "ValidPass123" }
```

**Expected HTTP Status:** 403

**Expected Response Body:**
```json
{ "error": { "message": "Account is not active" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-006 Archived User

**Objective:** Verify that an archived (soft-deleted) user cannot log in.

**Preconditions:**
- User exists with `deletedAt` set (soft-deleted)

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "archived@example.com", "password": "ValidPass123" }
```

**Expected HTTP Status:** 401

**Expected Response Body:**
```json
{ "error": { "message": "Invalid credentials" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-007 User Without Membership

**Objective:** Verify that a user with no active school membership cannot log in.

**Preconditions:**
- User exists but has no `SchoolMembership` record

**Request:**
`POST /api/v1/auth/login`
```json
{ "login": "nomembership@example.com", "password": "ValidPass123" }
```

**Expected HTTP Status:** 403

**Expected Response Body:**
```json
{ "error": { "message": "No active membership found" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-008 Wrong School Context

**Objective:** Verify that a user from school A cannot access school B resources.

**Preconditions:**
- User has membership in school A only
- Token is valid for school A

**Request:**
`GET /api/v1/schools/<schoolB_id>/students`

**Expected HTTP Status:** 403

**Expected Response Body:**
```json
{ "error": { "message": "School context mismatch" } }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-009 Refresh Token

**Objective:** Verify that a valid refresh token returns a new access token.

**Preconditions:**
- User logged in and has a valid refresh token

**Request:**
`POST /api/v1/auth/refresh`
```json
{ "refreshToken": "<valid_refresh_token>" }
```

**Expected HTTP Status:** 200

**Expected Response Body:**
```json
{ "accessToken": "<new_jwt>", "refreshToken": "<new_jwt>" }
```

**Expected Database Changes:** None

**Expected Audit Log:** None

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-010 Logout

**Objective:** Verify that logout clears the server-side session.

**Preconditions:**
- User is authenticated

**Request:**
`POST /api/v1/auth/logout`
Headers: `Authorization: Bearer <token>`

**Expected HTTP Status:** 200

**Expected Response Body:**
```json
{ "message": "Logged out successfully" }
```

**Expected Database Changes:** None

**Expected Audit Log:**
- Event: `UserLoggedOut`
- Actor: user ID

**Expected WebSocket Event:** None

**Expected SMS/Email Notification:** None

**Cleanup:** None

---

## AUTH-011 Password Reset

**Objective:** Verify that a password reset email/SMS is sent.

**Preconditions:**
- User exists with email `john@example.com`

**Request:**
`POST /api/v1/auth/reset-password`
```json
{ "email": "john@example.com" }
```

**Expected HTTP Status:** 200

**Expected Response Body:**
```json
{ "message": "Password reset link sent" }
```

**Expected Database Changes:**
- Password reset token stored

**Expected Audit Log:**
- Event: `PasswordResetRequested`

**Expected SMS/Email Notification:**
- SMS/Email with reset link sent to user

**Cleanup:** Delete reset token

---

## AUTH-012 Change Password

**Objective:** Verify that authenticated user can change their password.

**Preconditions:**
- User is authenticated

**Request:**
`POST /api/v1/auth/change-password`
```json
{ "currentPassword": "OldPass123", "newPassword": "NewPass456" }
```

**Expected HTTP Status:** 200

**Expected Database Changes:**
- `users.hashedPassword` updated

**Expected Audit Log:**
- Event: `PasswordChanged`

**Cleanup:** Reset password to original

---

## AUTH-013 JWT Expired

**Objective:** Verify that an expired JWT is rejected.

**Preconditions:**
- Token has `exp` claim in the past

**Request:**
`GET /api/v1/schools/:schoolId/students`
Headers: `Authorization: Bearer <expired_token>`

**Expected HTTP Status:** 401

**Expected Response Body:**
```json
{ "error": { "message": "Invalid or expired token" } }
```

**Expected Database Changes:** None

**Cleanup:** None

---

## AUTH-014 JWT Tampered

**Objective:** Verify that a tampered JWT is rejected.

**Preconditions:** None

**Request:**
`GET /api/v1/schools/:schoolId/students`
Headers: `Authorization: Bearer <tampered_signature>`

**Expected HTTP Status:** 401

**Expected Database Changes:** None

**Cleanup:** None

---

## AUTH-015 Refresh Token Rotation

**Objective:** Verify that after refresh, the old token is invalidated.

**Preconditions:**
- User has a valid refresh token

**Steps:**
1. Call refresh endpoint → get new token
2. Call refresh endpoint again with old token

**Expected HTTP Status (step 2):** 401

**Expected Database Changes:** None

**Cleanup:** None

---

## AUTH-016 Multiple Device Login

**Objective:** Verify that the same user can log in from multiple devices.

**Preconditions:**
- User exists with valid credentials

**Steps:**
1. Login from device A → token A
2. Login from device B → token B
3. Both tokens work simultaneously

**Expected HTTP Status:** 200 for both

**Cleanup:** Revoke both tokens

---

## AUTH-017 Session Revocation

**Objective:** Verify that an admin can revoke a user session.

**Preconditions:**
- Principal is authenticated
- User has an active session

**Request:**
`POST /api/v1/auth/revoke`
```json
{ "userId": "<target_user_id>" }
```

**Expected HTTP Status:** 200

**Expected Database Changes:**
- Session record invalidated

**Cleanup:** None

---

## AUTH-018 Brute Force Protection

**Objective:** Verify that multiple failed login attempts lock the account.

**Preconditions:**
- User exists

**Steps:**
1. Attempt login with wrong password 5 times
2. Attempt login with correct password

**Expected HTTP Status (step 2):** 429 Too Many Requests

**Expected Response Body:**
```json
{ "error": { "message": "Account temporarily locked. Try again later." } }
```

**Cleanup:** Unlock account

---

## AUTH-019 OTP Verification

**Objective:** Verify that OTP verification works for school onboarding.

**Preconditions:**
- Join request approved with one-time code

**Request:**
`POST /api/v1/schools/verify-otp`
```json
{ "oneTimeCode": "ABC123", "phone": "+254700000000" }
```

**Expected HTTP Status:** 200

**Expected Response Body:**
```json
{ "token": "<setup_token>", "school": { "id": "<uuid>" } }
```

**Cleanup:** Reset join request

---

## AUTH-020 Rate Limiting

**Objective:** Verify that the login endpoint is rate-limited.

**Preconditions:** None

**Steps:**
1. Send 20 login requests in 1 second

**Expected HTTP Status (request 11+):** 429

**Expected Response Body:**
```json
{ "error": { "message": "Too many requests" } }
```

**Cleanup:** Wait for rate limit window to expire
