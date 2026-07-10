# Memberships Module

## Purpose
Manages the relationship between Users and Schools.

## Responsibilities
- Link users to schools.
- Manage user roles within a specific school context.

## Dependencies
- `PrismaClient` (Database access)
- `Schools Module`
- `Users Module`
- `Roles Module`

## Public API
- `GET /schools/:id/members`: List members of a school.

## Future Work
- Add endpoints for joining/leaving schools and assigning roles.
