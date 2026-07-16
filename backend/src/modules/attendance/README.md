# Attendance Module

## Purpose
Provides daily classroom attendance tracking and session management for schools.

## Responsibilities
- Create and list attendance sessions.
- Capture attendance records for enrolled students.
- Allow edits to attendance records while a session remains open.
- Lock sessions once attendance is finalized.
- Emit attendance-related events for downstream processing.

## Dependencies
- `PrismaClient` for persistence.
- `Students Module` for enrollment membership.
- `Classes Module` for class instance context.
- `Notifications` and `Event Outbox` for downstream updates.

## Public API
- `GET /schools/:schoolId/attendance/sessions`
- `POST /schools/:schoolId/attendance/sessions`
- `GET /schools/:schoolId/attendance/sessions/:sessionId`
- `PATCH /schools/:schoolId/attendance/sessions/:sessionId/records/:recordId`
- `POST /schools/:schoolId/attendance/sessions/:sessionId/lock`
