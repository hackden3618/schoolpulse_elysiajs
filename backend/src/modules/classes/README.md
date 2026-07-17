# Classes Module

## Purpose
Manages classes within a school.

## Responsibilities
- Define classes, their levels, and class teachers.
- Provide a structure for student enrollment.

## Dependencies
- `PrismaClient` (Database access)
- `Schools Module`

## Public API
- `GET /classes`: List all classes.
- `POST /classes`: Create a new class.

## Future Work
- Add endpoints for creating classes and assigning teachers.
