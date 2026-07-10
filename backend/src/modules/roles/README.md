# Roles Module

## Purpose
Manages the roles defined within the application (e.g., admin, teacher, principal).

## Responsibilities
- Define role types.
- Provide permissions associated with roles.

## Dependencies
- `PrismaClient` (Database access)

## Public API
- `GET /roles`: List all roles.
- `POST /roles`: Create a new role.

## Future Work
- Implement granular permission checking.
