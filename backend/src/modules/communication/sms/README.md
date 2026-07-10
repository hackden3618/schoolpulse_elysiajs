# Communication / SMS Module

## Purpose
Handles SMS sending via Africa's Talking integration.

## Responsibilities
- Send SMS messages to recipients.
- Handle delivery receipts.
- (Future) Handle incoming SMS.

## Dependencies
- `infrastructure/sms` (Africa's Talking client)
- Environment variables: `AFRICASTALKING_API`, `AFRICASTALKING_USERNAME`

## Public API
- `GET /sms`: Health check.
- `POST /sms`: Send an SMS.
- `POST /delivery`: Delivery receipt webhook.

## Future Work
- Incoming SMS handling (/inbox endpoint).
- Persist SMS records to database.
- Scheduled/bulk SMS capabilities.
