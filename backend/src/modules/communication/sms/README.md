# Communication / SMS Module

## Purpose
Handles SMS sending via TextSMS Kenya integration.

## Responsibilities
- Send SMS messages to recipients (single and bulk).
- Calculate GSM-7 encoding segments and cost estimation.
- Check account balance.
- Handle delivery receipts.

## Dependencies
- `infrastructure/sms/sms.provider.ts` (TextSMS Kenya HTTP client)
- Environment variables:
  - `TEXTSMS_API_KEY`
  - `TEXTSMS_PARTNER_ID`
  - `TEXTSMS_SENDER_ID`

## Endpoints
- `GET  /api/v1/sms`              – Service health check.
- `POST /api/v1/sms/send`          – Send SMS (up to 20 recipients per call).
- `POST /api/v1/sms/segment-info` – Calculate GSM-7 segments for a draft message.
- `GET  /api/v1/sms/balance`       – Check TextSMS Kenya account balance.
- `POST /api/v1/sms/delivery`      – Delivery receipt webhook.

## GSM-7 Segment Cost Table

| Characters     | Segments |
|----------------|----------|
| 0 – 160        | 1        |
| 161 – 306      | 2        |
| 307 – 459      | 3        |
| 460 – 612      | 4        |
| 613 – 765      | 5        |
| 766 – 918      | 6        |
| 919 – 1,071    | 7        |
| 1,072 – 1,224  | 8        |
| 1,225 – 1,377  | 9        |
| 1,378 – 1,530  | 10       |

The `segment-info` endpoint returns `characterCount`, `segmentCount`, `perSegmentMax`, and `remaining` so the frontend can show cost before sending.

## TextSMS Kenya API

Send SMS:   `POST https://sms.textsms.co.ke/api/services/sendsms/`
Send Bulk:  `POST https://sms.textsms.co.ke/api/services/sendbulk/`
Balance:    `POST https://sms.textsms.co.ke/api/services/getbalance/`
DLR:        `POST https://sms.textsms.co.ke/api/services/getdlr/`

## Future Work
- Incoming SMS handling (/inbox endpoint).
- Persist SMS records to database.
