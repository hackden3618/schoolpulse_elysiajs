# Support Module

## Purpose
Two-way communication between school administrators and platform support team.

## Entities
- `SupportTicket` - A ticket/thread opened by a school admin
- `SupportTicketMessage` - Individual messages within a ticket

## Categories
- `query` - General inquiry
- `support` - Technical/operational support request
- `feedback` - Feedback about the platform
- `other` - Other

## Statuses
- `open` - Ticket created, awaiting response
- `in_progress` - Platform admin is working on it
- `resolved` - Issue resolved
- `closed` - Ticket closed

## API Endpoints

### School Admin (authenticated user)
- `GET /api/v1/schools/:schoolId/support/tickets` - List tickets
- `POST /api/v1/schools/:schoolId/support/tickets` - Create ticket
- `GET /api/v1/schools/:schoolId/support/tickets/:ticketId` - Get detail
- `POST /api/v1/schools/:schoolId/support/tickets/:ticketId/messages` - Send message

### Platform Admin (platform auth)
- `GET /api/v1/platform/support/tickets` - List all tickets
- `GET /api/v1/platform/support/tickets/:ticketId` - Get detail
- `POST /api/v1/platform/support/tickets/:ticketId/messages` - Reply
- `PATCH /api/v1/platform/support/tickets/:ticketId/status` - Update status

## WebSocket Events
- `support:ticket:new` - New ticket created
- `support:message:new` - New message on a ticket
- `support:ticket:updated` - Ticket status changed

## Broadcasting
- School-scoped events broadcast to all connections in that school
- Admin-scoped events broadcast to all platform admin connections
