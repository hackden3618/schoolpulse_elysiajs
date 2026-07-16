# Dashboard Module

## Purpose
Exposes aggregate dashboards and operational summaries for school administrators and other roles.

## Responsibilities
- Return summary metrics for the current school.
- Provide recent activity snapshots.
- Support role-aware dashboard views.

## Dependencies
- `PrismaClient` for metrics queries.
- `Attendance Module` for attendance-derived data.
- `Finance Module` for balance and payment summaries.
- `Students Module` and `Users Module` for counts and recent activity.

## Public API
- `GET /schools/:schoolId/dashboard/summary`
- `GET /schools/:schoolId/dashboard/activity`
