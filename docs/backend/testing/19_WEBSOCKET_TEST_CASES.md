# 19 — WebSocket Test Cases

## Table of Contents

| ID | Title |
|---|---|
| WS-001 | Authenticate |
| WS-002 | Connect |
| WS-003 | Disconnect |
| WS-004 | Reconnect |
| WS-005 | Student Created |
| WS-006 | Student Updated |
| WS-007 | Attendance |
| WS-008 | Payments |
| WS-009 | Notifications |
| WS-010 | Heartbeat |

---

## WS-001 Authenticate

**Objective:** Verify WebSocket connection authenticates with valid token

**Preconditions:**
- Valid JWT token exists for a user

**Request:**
```
WebSocket wss://api.schoolpulse.com/ws?token=VALID_JWT_TOKEN
```

**Expected HTTP Status:** 101 Switching Protocols

**Expected Behavior:**
- Connection upgraded successfully
- Server authenticates the user from the token
- User assigned to appropriate rooms (school:clx..., user:usr_001)

**Expected Database Changes:**
- `websocket_session` table: new row with session ID, user ID, connected at

**Expected Audit Log:**
- None

**Cleanup:**
- Disconnect the WebSocket client

---

## WS-002 Connect

**Objective:** Verify a successful WebSocket upgrade

**Preconditions:**
- WebSocket server is running

**Request:**
```
WebSocket wss://api.schoolpulse.com/ws?token=VALID_TOKEN
```

**Expected HTTP Status:** 101 Switching Protocols

**Expected Response:**
- HTTP 101 response with `Upgrade: websocket` and `Connection: Upgrade` headers
- WebSocket connection established
- Server sends `connection.ack` event with session ID

**Expected Database Changes:**
- `websocket_session` table: new session record

**Cleanup:**
- Disconnect client

---

## WS-003 Disconnect

**Objective:** Verify server cleans up room membership on client disconnect

**Preconditions:**
- Connected WebSocket client is in school room `school:clx...` and user room `user:usr_001`

**Action:**
Client sends WebSocket close frame or network disconnects

**Expected Behavior:**
- Server receives close event
- Client removed from all rooms
- `websocket_session` updated with `disconnectedAt`
- No orphaned room memberships remain

**Expected Database Changes:**
- `websocket_session` table: `disconnectedAt` set
- Room membership data cleaned up

**Cleanup:**
- None required

---

## WS-004 Reconnect

**Objective:** Verify client can reconnect with same token and rejoin rooms

**Preconditions:**
- Client previously connected and disconnected
- Same JWT token is still valid

**Action:**
Client opens a new WebSocket connection with the same token

**Expected Behavior:**
- New connection established
- Client rejoins all previously assigned rooms (school:clx..., user:usr_001)
- Old session marked as stale
- Server sends `reconnect.ack` event

**Expected Database Changes:**
- `websocket_session` table: new session created
- Old session: `replacedBy` field set to new session ID

**Cleanup:**
- Disconnect the WebSocket client

---

## WS-005 Student Created

**Objective:** Verify `student.created` event broadcasts to school room

**Preconditions:**
- WebSocket client connected to school room `school:clx...`
- Authenticated user creates a student

**Action:**
`POST /api/v1/schools/:schoolId/students` is called

**Expected WebSocket Event:**
- Event: `student.created`
- Room: `school:clx...`
- Payload:
```json
{
  "id": "stu_001",
  "firstName": "Alice",
  "lastName": "Wanjiku",
  "admissionNumber": "ADM-2026-001",
  "schoolId": "clx..."
}
```

**Expected Behavior:**
- All clients in the school room receive the event within 200ms

**Cleanup:**
- Archive the created student

---

## WS-006 Student Updated

**Objective:** Verify `student.updated` event broadcasts

**Preconditions:**
- WebSocket client connected to school room `school:clx...`
- Authenticated user updates a student

**Action:**
`PATCH /api/v1/schools/:schoolId/students/:id` is called

**Expected WebSocket Event:**
- Event: `student.updated`
- Room: `school:clx...`
- Payload includes updated fields

**Cleanup:**
- None required

---

## WS-007 Attendance

**Objective:** Verify `attendance.marked` event broadcasts

**Preconditions:**
- WebSocket client connected to school room `school:clx...`
- Teacher marks attendance

**Action:**
`POST /api/v1/schools/:schoolId/attendance` is called

**Expected WebSocket Event:**
- Event: `attendance.marked`
- Room: `school:clx...`
- Payload includes studentId, date, status

**Cleanup:**
- Delete attendance record

---

## WS-008 Payments

**Objective:** Verify `payment.received` event broadcasts

**Preconditions:**
- WebSocket client connected to school room `school:clx...`
- Bursar records a payment

**Action:**
`POST /api/v1/schools/:schoolId/payments` is called

**Expected WebSocket Event:**
- Event: `payment.received`
- Room: `school:clx...`
- Payload includes amount, method, invoiceId

**Cleanup:**
- Reverse payment

---

## WS-009 Notifications

**Objective:** Verify `notification.new` event sent to specific user

**Preconditions:**
- WebSocket client connected to user room `user:usr_001`
- A notification is generated for this user

**Action:**
System generates notification for user `usr_001`

**Expected WebSocket Event:**
- Event: `notification.new`
- Room: `user:usr_001`
- Payload:
```json
{
  "id": "not_001",
  "type": "fee_reminder",
  "title": "Fee Payment Reminder",
  "message": "Tuition fee of 50000 is due by 2026-02-15",
  "severity": "high"
}
```

**Expected Behavior:**
- Only user `usr_001` receives this notification
- Other users in the same school room do NOT receive it

**Cleanup:**
- Remove notification

---

## WS-010 Heartbeat

**Objective:** Verify ping/pong keeps connection alive, stale connections closed

**Preconditions:**
- WebSocket client connected

**Action:**
Server sends `ping` frame every 30 seconds

**Expected Behavior:**
- Client responds with `pong` frame
- If client does not respond within 10 seconds:
  - Server closes the connection
  - `websocket_session` updated with `disconnectedAt`
  - Reason: `heartbeat_timeout`

**Expected Database Changes:**
- On timeout: `websocket_session` table: `disconnectedAt` set, `disconnectReason` = `heartbeat_timeout`

**Cleanup:**
- None required
