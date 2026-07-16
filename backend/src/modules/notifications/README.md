# Notifications Module

## Purpose
Provides conversation-based messaging and notification delivery across school roles.

## Responsibilities
- Create and manage conversations.
- Send and track messages.
- Mark message receipts as read.
- Support message editing and deletion where allowed.
- Integrate with WebSocket updates for real-time delivery.

## Dependencies
- `PrismaClient` for message and conversation persistence.
- `Users Module` and `Students Module` for recipient resolution.
- `WebSocket` infrastructure for live updates.

## Public API
- `GET /schools/:schoolId/conversations`
- `POST /schools/:schoolId/conversations`
- `GET /schools/:schoolId/conversations/:conversationId`
- `GET /schools/:schoolId/conversations/:conversationId/messages`
- `POST /schools/:schoolId/conversations/:conversationId/messages`
- `POST /schools/:schoolId/messages/:messageId/read`
- `PATCH /schools/:schoolId/messages/:messageId`
