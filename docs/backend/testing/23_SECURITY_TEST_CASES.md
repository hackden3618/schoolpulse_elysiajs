# 23 — Security Test Cases

## Table of Contents

| ID | Title |
|---|---|
| SEC-001 | SQL Injection |
| SEC-002 | XSS |
| SEC-003 | CSRF |
| SEC-004 | JWT Tampering |
| SEC-005 | Privilege Escalation |
| SEC-006 | IDOR |
| SEC-007 | File Upload |
| SEC-008 | Mass Assignment |
| SEC-009 | Rate Limit |
| SEC-010 | Password Policy |
| SEC-011 | Secrets Exposure |
| SEC-012 | CORS |
| SEC-013 | Headers |
| SEC-014 | Encryption |
| SEC-015 | Session Hijacking |

---

## SEC-001 SQL Injection

**Objective:** Verify SQL injection attacks are prevented

**Preconditions:**
- Public or authenticated endpoint that accepts string input
- Prisma ORM is used with parameterized queries

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Robert'); DROP TABLE students;--",
  "lastName": "Test",
  "admissionNumber": "ADM-SQL-001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 201 Created (or 400 if input sanitized)

**Expected Behavior:**
- Input is safely stored as a literal string, NOT executed as SQL
- Database remains intact
- All tables and data are unaffected

**Expected Database Changes:**
- `student` table: new row with firstName containing the literal injection string (or request rejected by input validation)

**Cleanup:**
- Delete created student record

---

## SEC-002 XSS

**Objective:** Verify XSS attacks are prevented by sanitizing output

**Preconditions:**
- Authenticated school admin
- Input can contain HTML/JavaScript

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "<script>alert('xss')</script>",
  "lastName": "Test",
  "admissionNumber": "ADM-XSS-001",
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 201 Created (or 400 if rejected)

**Expected Behavior:**
- If stored: value is HTML-escaped on output (e.g., `&lt;script&gt;alert('xss')&lt;/script&gt;`)
- If rejected: validation returns 400 with message about invalid characters
- No script execution occurs in browser

**Expected Database Changes:**
- `student` table: new row with sanitized or literal value

**Cleanup:**
- Delete created record

---

## SEC-003 CSRF

**Objective:** Verify CSRF protection for cookie-based authentication

**Preconditions:**
- Cookie-based auth is used
- CSRF protection is enabled

**Request:**
`POST /api/v1/schools/:schoolId/students`
Headers: `Cookie: session=valid_session`
Body: (valid student data)
Without: `X-CSRF-Token` header

**Expected HTTP Status:** 403 Forbidden

**Expected Response Body:**
```json
{
  "error": "Forbidden",
  "message": "CSRF token missing or invalid"
}
```

**Expected Behavior:**
- Request with valid CSRF token succeeds
- Request without token or with invalid token is rejected

**Cleanup:**
- None required

---

## SEC-004 JWT Tampering

**Objective:** Verify modified JWT tokens are rejected

**Preconditions:**
- JWT token exists for a valid user

**Request:**
`GET /api/v1/schools/:schoolId/students`
Headers: `Authorization: Bearer <modified_jwt>`
(where the payload has been tampered with, e.g., user ID changed)

**Expected HTTP Status:** 401 Unauthorized

**Expected Response Body:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or tampered token"
}
```

**Verification:**
- Token with invalid signature is rejected
- Token with expired `exp` claim is rejected
- Token with modified payload fails signature verification

**Cleanup:**
- None required

---

## SEC-005 Privilege Escalation

**Objective:** Verify low-role user cannot access high-role endpoints

**Preconditions:**
- Authenticated user with role `teacher`
- Teacher does not have permission to manage fee structures

**Request:**
`POST /api/v1/schools/:schoolId/fee-structures`
```json
{
  "name": "Test Fee",
  "amount": 10000,
  "classId": "cls_001",
  "termId": "trm_001"
}
```

**Expected HTTP Status:** 403 Forbidden

**Expected Response Body:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions. Required role: bursar or admin."
}
```

**Verification:**
- Teacher CAN access allowed endpoints (attendance, students read)
- Teacher CANNOT access bursar or admin-only endpoints

**Cleanup:**
- None required

---

## SEC-006 IDOR

**Objective:** Verify user A cannot access user B's data by changing URL parameter

**Preconditions:**
- User A (teacher) is authenticated
- User A belongs to school A (clx_school_a)
- Student `stu_050` belongs to school B (clx_school_b)

**Request:**
`GET /api/v1/schools/clx_school_a/students/stu_050`

**Expected HTTP Status:** 403 Forbidden or 404 Not Found

**Expected Response Body:**
```json
{
  "error": "Not Found",
  "message": "Student not found"
}
```
(403 or 404 — must not reveal existence of data in other schools)

**Verification:**
- User A cannot access students, payments, or any data from school B
- All queries are scoped to the authenticated user's school

**Cleanup:**
- None required

---

## SEC-007 File Upload

**Objective:** Verify malicious file uploads are rejected

**Preconditions:**
- Authenticated school admin
- File upload endpoint (e.g., school logo)

**Request:**
`POST /api/v1/schools/:id/logo`
```
Content-Type: multipart/form-data
file: [malicious.php file containing PHP code]
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "File type not allowed. Accepted types: image/png, image/jpeg, image/webp"
}
```

**Verification:**
- `.php`, `.exe`, `.sh`, `.html` files rejected
- File extension and MIME type both validated
- File size limit enforced (e.g., 2MB max)
- File content inspected for magic bytes

**Cleanup:**
- None required

---

## SEC-008 Mass Assignment

**Objective:** Verify extra fields in request body are ignored

**Preconditions:**
- Authenticated school admin

**Request:**
`POST /api/v1/schools/:schoolId/students`
```json
{
  "firstName": "Alice",
  "lastName": "Wanjiku",
  "admissionNumber": "ADM-MASS-001",
  "classId": "cls_001",
  "termId": "trm_001",
  "role": "admin",
  "isAdmin": true,
  "password": "hacked",
  "balance": 0
}
```

**Expected HTTP Status:** 201 Created

**Expected Behavior:**
- Extra fields (`role`, `isAdmin`, `password`, `balance`) are silently ignored
- Student is created with default role `student`
- No privilege escalation occurs

**Expected Database Changes:**
- `student` table: new row with only allowed fields

**Cleanup:**
- Delete created student

---

## SEC-009 Rate Limit

**Objective:** Verify rate limiting returns 429 when exceeded

**Preconditions:**
- Rate limit configured at 100 requests/second per IP/user

**Action:**
Send 101 requests within 1 second

**Expected HTTP Status (101st request):** 429 Too Many Requests

**Expected Response Body:**
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 1 second.",
  "retryAfter": 1
}
```

**Expected Headers:**
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: <timestamp>`
- `Retry-After: 1`

**Cleanup:**
- None required

---

## SEC-010 Password Policy

**Objective:** Verify weak passwords are rejected

**Preconditions:**
- Password policy requires: min 8 chars, uppercase, lowercase, number, special char

**Request:**
`POST /api/v1/schools/:schoolId/users`
```json
{
  "firstName": "Weak",
  "lastName": "Password",
  "email": "weak@test.com",
  "phone": "+254712345690",
  "password": "123"
}
```

**Expected HTTP Status:** 400 Validation Error

**Expected Response Body:**
```json
{
  "error": "Validation Error",
  "message": "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character"
}
```

**Test cases:**
- `"123"` - too short -> 400
- `"password"` - no uppercase, number, special -> 400
- `"PASSWORD123"` - no lowercase, special -> 400
- `"SecurePass123!"` - valid -> 201

**Cleanup:**
- None required

---

## SEC-011 Secrets Exposure

**Objective:** Verify .env file is not accessible via web

**Preconditions:**
- Web server is running

**Request:**
`GET /.env`

**Expected HTTP Status:** 403 Forbidden or 404 Not Found

**Expected Behavior:**
- `.env` file is outside web root OR
- Web server is configured to deny access to dotfiles
- Environment variables are NOT returned in any API response

**Cleanup:**
- None required

---

## SEC-012 CORS

**Objective:** Verify only allowed origins can access the API

**Preconditions:**
- CORS configured to allow `https://app.schoolpulse.com`

**Request:**
`GET /api/v1/schools/:schoolId/students`
Headers: `Origin: https://malicious-site.com`

**Expected HTTP Status:** 200 OK (but CORS headers deny access)

**Expected Response Headers:**
- `Access-Control-Allow-Origin: https://app.schoolpulse.com`
- `Vary: Origin`
- NOT `Access-Control-Allow-Origin: *`

**Verification:**
- Allowed origin `https://app.schoolpulse.com` gets proper CORS headers
- Disallowed origin does not get `Access-Control-Allow-Origin` matching its origin
- Preflight OPTIONS requests are handled correctly

**Cleanup:**
- None required

---

## SEC-013 Headers

**Objective:** Verify security headers are present in all responses

**Preconditions:**
- Web server and API gateway are configured

**Request:**
`GET /api/v1/schools/:schoolId/students`

**Expected Response Headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Cache-Control: no-store
Pragma: no-cache
Referrer-Policy: strict-origin-when-cross-origin
```

**Expected HTTP Status:** 200 OK

**Cleanup:**
- None required

---

## SEC-014 Encryption

**Objective:** Verify passwords are hashed with bcrypt and tokens with JWT

**Preconditions:**
- Database access for verification

**Verification:**
1. Create a user with password `SecurePass123!`
2. Check database: `passwordHash` should start with `$2b$` or `$2a$` (bcrypt prefix)
3. Plain text password is NOT stored
4. JWT tokens are signed with HS256 or RS256
5. JWT payload does NOT contain sensitive data (plain text password)

**Expected Database:**
- `user` table: `passwordHash` contains bcrypt hash, not plain text

**Cleanup:**
- Delete test user

---

## SEC-015 Session Hijacking

**Objective:** Verify token theft does not allow reuse if IP-bound (if implemented)

**Preconditions:**
- JWT token is bound to IP address (optional security feature)
- Valid token for user from IP 192.168.1.100

**Request:**
`GET /api/v1/schools/:schoolId/students`
Headers: `Authorization: Bearer <valid_token>`
Originating from IP: 10.0.0.1 (different from token's bound IP)

**Expected HTTP Status:** 401 Unauthorized (if IP binding is enabled)

**Expected Response Body:**
```json
{
  "error": "Unauthorized",
  "message": "Token IP binding mismatch"
}
```

**Verification:**
- Token used from same IP works correctly
- Token from different IP is rejected
- After token expiry, a new token must be obtained

**NOTE:** IP binding is optional. If not implemented, this test verifies token expiry is properly enforced.

**Cleanup:**
- None required
