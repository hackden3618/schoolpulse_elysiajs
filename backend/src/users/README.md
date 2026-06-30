# Users Module

## Purpose
Manages user accounts, authentication credentials (passwords), and personal information.

## Responsibilities
- Create and manage user records.
- Handle password hashing.
- Expose RESTful endpoints for user management.

## Dependencies
- `PrismaClient` (Database access)
- `bcrypt` (Password hashing)

## Public API
- `GET /users`: List all users.
- `POST /users`: Create a new user.

## Future Work
- Add user authentication (login/logout).
- Add update and delete user endpoints.
- Role-based access control integration.
