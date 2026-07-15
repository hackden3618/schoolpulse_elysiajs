# 22 — Notification Test Cases

## Table of Contents

| ID | Title |
|---|---|
| NOT-001 | SMS |
| NOT-002 | Email |
| NOT-003 | WebSocket |
| NOT-004 | Push |
| NOT-005 | Retry |
| NOT-006 | Failure |
| NOT-007 | Queue |
| NOT-008 | Delivery |
| NOT-009 | Duplicate |
| NOT-010 | Analytics |

---

## NOT-001 SMS

**Objective:** Verify notification sent via SMS provider

**Preconditions:**
- Notification system configured with SMS provider
- Valid recipient phone

**Action:**
Trigger event that generates SMS notification (e.g., student absent)

**Expected Behavior:**
- Notification record created with channel `sms`
- SMS queued in `sms_queue` table
- Provider API called with correct payload
- Status updated to `sent` after provider accepts

**Expected Database Changes:**
- `notification` table: new row with type `sms`, status `sent`
- `sms_queue` table: new row with provider reference

**Cleanup:**
- Remove notification and queued SMS

---

## NOT-002 Email

**Objective:** Verify notification sent via email

**Preconditions:**
- Notification system configured with email provider
- Valid recipient email address

**Action:**
Trigger event that generates email notification

**Expected Behavior:**
- Notification record created with channel `email`
- Email queued in `email_queue` table
- Email sent via SMTP or provider API
- Status updated to `sent` after provider accepts

**Expected Database Changes:**
- `notification` table: new row with type `email`, status `sent`
- `email_queue` table: new row with recipient, subject, body

**Cleanup:**
- Remove notification

---

## NOT-003 WebSocket

**Objective:** Verify real-time notification pushed to connected client

**Preconditions:**
- WebSocket client connected to user room
- Notification generated for this user

**Action:**
System generates notification for a specific user

**Expected Behavior:**
- Notification record created with channel `websocket`
- Event `notification.new` emitted to user room
- Client receives notification within 200ms
- If client is disconnected, notification is persisted for later retrieval

**Expected Database Changes:**
- `notification` table: new row with type `websocket`
- `unread_notification` table: new row for the user

**Expected WebSocket Event:**
- `notification.new` with notification payload

**Cleanup:**
- Mark notification as read and remove

---

## NOT-004 Push

**Objective:** Verify mobile push notification sent (if implemented)

**Preconditions:**
- Mobile push notification provider configured (FCM/APNs)
- User has registered device token

**Action:**
Trigger event that generates push notification

**Expected Behavior:**
- Notification record created with channel `push`
- Push notification sent to FCM/APNs
- Device receives notification
- Status updated based on provider response

**Expected Database Changes:**
- `notification` table: new row with type `push`
- `device_notification` table: mapping to device token

**Cleanup:**
- Remove notification

---

## NOT-005 Retry

**Objective:** Verify failed notification is retried up to 3 times

**Preconditions:**
- Notification exists with status `failed`
- Retry count is 0

**Action:**
System retry mechanism triggers

**Expected Behavior:**
- Notification retried at increasing intervals (5min, 25min, 125min)
- Each retry increments `retryCount`
- After each attempt, status updated to `sent` or `failed`
- Max 3 retry attempts

**Expected Database Changes:**
- `notification` table: `retryCount` incremented, `lastAttemptAt` updated, `nextRetryAt` set

**Cleanup:**
- Reset notification retry state

---

## NOT-006 Failure

**Objective:** Verify notification is permanently failed after max retries

**Preconditions:**
- Notification has been retried 3 times, all failed

**Action:**
Fourth retry attempt (should not happen) or status check

**Expected Behavior:**
- After 3 failed retries, status set to `permanently_failed`
- No further retry attempts made
- Admin alerted about permanent failure

**Expected Database Changes:**
- `notification` table: `status` changed to `permanently_failed`
- `notification` table: `permanentlyFailedAt` set

**Expected Audit Log:**
- Event type: `NotificationPermanentlyFailed`
- Actor: System
- Details: Notification ID, channel, max retries reached

**Cleanup:**
- None required

---

## NOT-007 Queue

**Objective:** Verify notifications are queued for async delivery

**Preconditions:**
- Notification system is running

**Action:**
Multiple notifications generated simultaneously (e.g., bulk SMS)

**Expected Behavior:**
- All notifications inserted into queue table
- Queue processor picks up notifications in FIFO order
- Notifications processed asynchronously
- Queue depth monitored

**Expected Database Changes:**
- `notification` table: new rows with status `queued`
- Queue table: items ordered by `createdAt`

**Cleanup:**
- Clear queued notifications

---

## NOT-008 Delivery

**Objective:** Verify delivery status is tracked through its lifecycle

**Preconditions:**
- Notification exists

**Action:**
Notification goes through delivery lifecycle

**Expected Status Transitions:**
```
queued -> sending -> sent -> delivered
queued -> sending -> failed -> queued (retry) -> sending -> delivered
queued -> sending -> failed -> queued (retry) -> ... -> permanently_failed
```

**Expected Database Changes:**
- `notification` table: `status` field tracks each state change
- `notification_delivery_log` table: detailed log of each delivery attempt

**Cleanup:**
- None required

---

## NOT-009 Duplicate

**Objective:** Verify the same notification is not sent twice

**Preconditions:**
- Notification ID `not_001` has already been sent

**Action:**
System attempts to send the same notification again

**Expected Behavior:**
- System checks notification ID or deduplication key
- If already sent, skips delivery
- Idempotency ensured via unique constraint on (eventType, aggregateId)

**Expected Database Changes:**
- None (duplicate detected and ignored)

**Expected Audit Log:**
- Event type: `NotificationDuplicateSuppressed`
- Actor: System

**Cleanup:**
- None required

---

## NOT-010 Analytics

**Objective:** Verify notification statistics: sent, delivered, failed rates

**Preconditions:**
- Notifications have been sent over a period

**Request:**
`GET /api/v1/schools/:schoolId/notifications/analytics?from=2026-07-01&to=2026-07-15`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "period": "2026-07-01 to 2026-07-15",
  "totalSent": 1500,
  "totalDelivered": 1425,
  "totalFailed": 60,
  "totalPermanentlyFailed": 15,
  "deliveryRate": 95.0,
  "failureRate": 4.0,
  "permanentFailureRate": 1.0,
  "byChannel": {
    "sms": { "sent": 1000, "delivered": 950, "failed": 50 },
    "email": { "sent": 400, "delivered": 390, "failed": 10 },
    "websocket": { "sent": 100, "delivered": 85, "failed": 0 }
  },
  "byTemplate": {
    "student_absent": { "sent": 300, "delivered": 290 },
    "fee_reminder": { "sent": 500, "delivered": 480 },
    "exam_alert": { "sent": 700, "delivered": 655 }
  }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required
