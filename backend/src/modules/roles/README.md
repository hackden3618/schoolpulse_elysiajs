# Roles Module

## Purpose
Manages global (non-school-scoped) roles used across the platform.

## Responsibilities
- List all available roles.
- Roles define permission sets assigned to school memberships.

## Dependencies
- `PrismaClient` (Database access)

## Public API
- `GET /roles`: List all roles ordered by name ascending.

## Future Work
- Create / Update / Delete role endpoints (v1.2+).
- Role-to-permission mapping management.
