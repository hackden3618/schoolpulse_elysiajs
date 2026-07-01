# Students Module

## Purpose
Manages student records and enrollment information.

## Responsibilities
- Create and manage students.
- Track class enrollments and admission numbers.
- Expose RESTful endpoints for student management.

## Dependencies
- `PrismaClient` (Database access)
- `Schools Module` (Students belong to schools)
- `Classes Module` (Students belong to classes)

## Public API
- `GET /students`: List all students.
- `POST /students`: Create a new student.

## Future Work
- Add update and delete student endpoints.
- Integration with attendance and academics modules.
