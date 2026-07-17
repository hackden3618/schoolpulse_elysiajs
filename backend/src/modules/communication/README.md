# Communication Module

## Purpose
Manages all school communication channels: SMS, conversations, and messages.

## Responsibilities
- Send SMS notifications via Africa's Talking.
- Manage conversations and messages between school stakeholders.
- Handle delivery receipts and incoming messages.

## Dependencies
- `PrismaClient` (Database access)
- `infrastructure/sms` (Africa's Talking client)
- `Users Module`
- `Students Module`

## Public API
- `GET /sms`: SMS health check.
- `POST /sms`: Send an SMS.
- `POST /delivery`: Delivery receipt webhook.

## Sub-modules
- `sms/` — SMS sending and delivery
- `conversations/` — Conversation management (future)
- `messages/` — Message management (future)

## Future Work
- In-app messaging between users.
- Email integration.
- Multi-channel notification preferences.
