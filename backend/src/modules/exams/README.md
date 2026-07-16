# Exams Module

## Purpose
Manages exams, assessments, and result publication workflows used by schools.

## Responsibilities
- Create and manage exams.
- Record assessment results.
- Publish assessment outcomes and related events.
- Support academic reporting use cases.

## Dependencies
- `PrismaClient` for persistence.
- `Students Module` for student validation.
- `Classes Module` for subject and class context.
- `Reports Module` for downstream academic summaries.

## Public API
- `GET /schools/:schoolId/exams`
- `POST /schools/:schoolId/exams`
- `GET /schools/:schoolId/exams/:examId`
- `PATCH /schools/:schoolId/exams/:examId`
- `POST /schools/:schoolId/exams/:examId/publish`
- `POST /schools/:schoolId/assessments`
- `GET /schools/:schoolId/assessments/:assessmentId`
- `POST /schools/:schoolId/assessments/:assessmentId/results`
- `POST /schools/:schoolId/assessments/:assessmentId/publish`
