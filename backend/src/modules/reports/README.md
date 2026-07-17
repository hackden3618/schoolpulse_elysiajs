# Reports Module

## Endpoints

All routes are scoped under `{API_PREFIX}/schools/:schoolId/reports` and are
protected by `authGuard`.

| Method | Path            | Description                      |
| ------ | --------------- | -------------------------------- |
| GET    | `/`             | Available report types + counts  |
| GET    | `/attendance`   | Attendance summary               |
| GET    | `/finance`      | Finance summary                  |
| GET    | `/academic`     | Academic summary                 |
| GET    | `/students`     | Student statistics               |

## Architecture

```
route.ts → controller.ts → service.ts → repository.ts → Prisma
```

- **Route** – registers Elysia handlers with param validation
- **Controller** – extracts `schoolId`, delegates to service, wraps in `success()`
- **Service** – thin pass-through (orchestration if needed)
- **Repository** – raw Prisma queries (counts, aggregations, groupBy)

## Multi-tenancy

Every query is filtered by `schoolId`. The calling user's school context is
enforced by `authGuard` middleware installed on the parent app.
