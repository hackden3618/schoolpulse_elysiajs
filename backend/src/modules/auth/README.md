# Auth Module

Handles authentication, registration, password reset, and join requests.

## Endpoints

### Auth (no JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/login | Login with phone/email + password |
| POST | /api/v1/auth/register | Self-register with optional school code |
| POST | /api/v1/auth/forgot-password | Request password reset token |
| POST | /api/v1/auth/reset-password | Reset password with token |
| POST | /api/v1/auth/refresh | Refresh JWT |
| POST | /api/v1/auth/logout | Logout (stateless, no-op) |

### Join Requests (no JWT for create)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/join-requests | Submit school registration request |
| GET | /api/v1/join-requests | List all join requests (admin) |

## JWT Payload

```json
{
  "sub": "userId",
  "schoolId": "schoolId",
  "roles": ["Super Admin", "Teacher"],
  "iat": 1234567890,
  "exp": 1234567890
}
```
