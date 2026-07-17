# Platform Admin Module

## Purpose
Provides platform-level operations for SchoolPulse administrators who manage the SaaS tenant layer rather than a single school.

## Responsibilities
- Manage platform admin accounts and login flows.
- Review and approve school join requests.
- List and soft-delete schools from the platform.
- Publish onboarding-related OTP and setup flows for schools.

## Dependencies
- `PrismaClient` for platform and school persistence.
- `Schools Module` for school creation and code generation.
- `Messaging` infrastructure for admin invitation and reset SMS.
- `Events` outbox for platform-admin and school lifecycle events.

## Public API
- `GET /platform/admins`
- `POST /platform/admins`
- `PATCH /platform/admins/:id`
- `DELETE /platform/admins/:id`
- `POST /platform/admins/:id/reset-password`
- `GET /platform/schools`
- `DELETE /platform/schools/:id`
- `POST /platform/join-requests/:id/approve`
- `POST /platform/join-requests/:id/reject`
- `POST /platform/join-requests/:id/mark-review`
- `POST /schools/verify-otp`
- `POST /schools/setup-admin`
