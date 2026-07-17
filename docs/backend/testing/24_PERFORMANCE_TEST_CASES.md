# 24 — Performance Test Cases

## Table of Contents

| ID | Title |
|---|---|
| PER-001 | 10 Users |
| PER-002 | 100 Users |
| PER-003 | 1,000 Users |
| PER-004 | 10,000 Students |
| PER-005 | Bulk Import |
| PER-006 | Bulk SMS |
| PER-007 | Dashboard Load |
| PER-008 | Payment Throughput |
| PER-009 | WebSocket Broadcast |
| PER-010 | Memory Leak |

---

## PER-001 10 Users

**Objective:** Verify login and CRUD operations complete within thresholds for 10 concurrent users

**Preconditions:**
- 10 user accounts exist with valid credentials
- Test data (students, classes, fees) exists

**Scenario:**
- 10 concurrent users perform the following operations:
  - Login
  - List students (GET /students)
  - Create a student (POST /students)
  - Update a student (PATCH /students/:id)
  - Delete a student (DELETE /students/:id)
  - Logout

**Expected Thresholds:**
- Login: < 500ms (p95)
- List students: < 200ms (p95)
- Create student: < 500ms (p95)
- Update student: < 300ms (p95)
- Delete student: < 300ms (p95)
- All requests succeed (0% error rate)

**Cleanup:**
- Remove test data created during test

---

## PER-002 100 Users

**Objective:** Verify concurrent operations succeed for 100 simultaneous users

**Preconditions:**
- 100 user accounts exist
- Test data is seeded

**Scenario:**
- 100 concurrent users perform mixed read/write operations for 5 minutes
- Mix: 60% reads, 30% writes, 10% deletes

**Expected Thresholds:**
- p95 response time: < 1000ms for all operations
- p99 response time: < 2000ms
- Error rate: < 1%
- No 429 rate limit errors (rate limits should be per-IP, not global)

**Cleanup:**
- Clean up test data

---

## PER-003 1,000 Users

**Objective:** Verify system remains responsive under 1,000 concurrent users

**Preconditions:**
- 1,000 virtual user accounts
- Load testing tool configured (e.g., k6, Artillery)

**Scenario:**
- Ramp up from 0 to 1,000 users over 60 seconds
- Sustain 1,000 users for 5 minutes
- Ramp down over 30 seconds
- Operations: browse students, view dashboard, check attendance

**Expected Thresholds:**
- p95 response time: < 2000ms
- p99 response time: < 5000ms
- Error rate: < 2%
- CPU usage: < 80%
- Memory usage: < 80%
- No crashes or service interruptions

**Cleanup:**
- None required

---

## PER-004 10,000 Students

**Objective:** Verify student search returns results in under 500ms with 10,000 records

**Preconditions:**
- School has 10,000+ student records
- Students have varied names, classes, and statuses

**Request:**
`GET /api/v1/schools/:schoolId/students?q=John&page=1&limit=20`

**Expected Threshold:**
- Response time: < 500ms
- Results are paginated correctly
- Database query uses proper indexes

**Additional searches:**
- Search by admission number: < 200ms (indexed)
- Search by classId: < 300ms (indexed)
- Search with filters (class + gender + status): < 500ms (composite index)

**Cleanup:**
- None required

---

## PER-005 Bulk Import

**Objective:** Verify 1,000 students can be imported in under 30 seconds

**Preconditions:**
- Authenticated school admin
- CSV file with 1,000 valid student records prepared

**Request:**
`POST /api/v1/schools/:schoolId/students/bulk`
```
Content-Type: multipart/form-data
file: [CSV with 1000 students]
```

**Expected Threshold:**
- Total import time: < 30 seconds
- All 1,000 students imported successfully
- 0 failed records
- Transactional: if any record fails, none are imported

**Expected Database Changes:**
- `student` table: 1,000 new rows
- `enrollment` table: 1,000 new rows

**Cleanup:**
- Delete all imported students

---

## PER-006 Bulk SMS

**Objective:** Verify 500 SMS messages are queued in under 5 seconds

**Preconditions:**
- Authenticated school admin
- 500 valid recipient phone numbers

**Request:**
`POST /api/v1/schools/:schoolId/sms/bulk`
```json
{
  "recipients": ["+254712345679", "...", "(500 items)"],
  "message": "School will be closed tomorrow for public holiday."
}
```

**Expected Threshold:**
- Request processing time: < 5 seconds
- All 500 SMS queued successfully
- Response includes batch ID

**Expected Database Changes:**
- `sms_queue` table: 500 new rows inserted

**Cleanup:**
- Remove queued SMS batch

---

## PER-007 Dashboard Load

**Objective:** Verify school dashboard loads in under 1 second with 500 students

**Preconditions:**
- School has 500 students, 30 teachers, 10 classes, 3 terms
- Attendance and fee data exists for current term

**Request:**
`GET /api/v1/schools/:schoolId/dashboard`

**Expected Threshold:**
- Response time: < 1 second
- Response includes:
  - Student count: 500
  - Teacher count: 30
  - Class count: 10
  - Active term
  - Attendance rate (aggregate)
  - Fee collection summary
  - Recent activity (last 10 events)

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## PER-008 Payment Throughput

**Objective:** Verify 100 concurrent payments are processed correctly

**Preconditions:**
- 100 invoices exist with balance > 0
- 100 concurrent payment requests

**Scenario:**
- 100 concurrent POST requests to create cash payments
- Each payment is for a different invoice

**Request:**
`POST /api/v1/schools/:schoolId/payments`
```json
{
  "invoiceId": "inv_NNN",
  "amount": 50000,
  "method": "cash"
}
```

**Expected Thresholds:**
- All 100 requests complete within 10 seconds
- 100% success rate
- No race conditions or duplicate payments
- All invoice balances correctly updated
- Total amount collected equals sum of all payments

**Cleanup:**
- Reverse all 100 payments

---

## PER-009 WebSocket Broadcast

**Objective:** Verify message is received by 100 clients in under 200ms

**Preconditions:**
- 100 WebSocket clients connected to school room `school:clx...`

**Scenario:**
- Trigger event that broadcasts to school room (e.g., create a student)

**Action:**
`POST /api/v1/schools/:schoolId/students`

**Expected Threshold:**
- All 100 clients receive the event within 200ms of server send
- No messages lost
- Event payload is correct for all clients

**Cleanup:**
- Archive created student, disconnect WebSocket clients

---

## PER-010 Memory Leak

**Objective:** Verify sustained load for 1 hour shows stable memory usage

**Preconditions:**
- Application is monitored with memory profiling

**Scenario:**
- Sustained load of 100 requests/second for 60 minutes
- Mix of endpoints: students, attendance, fees, payments, reports

**Expected Behavior:**
- Memory usage stabilizes within 30 minutes (no continuous growth)
- Heap size remains within configured limits
- Garbage collection runs regularly
- No OutOfMemoryError or crash
- Response times remain consistent throughout the hour

**Metrics to Monitor:**
- Heap memory usage (MB) over time
- CPU usage (%)
- GC frequency and duration
- Request latency (p50, p95, p99) over time

**Pass Criteria:**
- Memory delta between t=5min and t=60min < 20%
- No memory leak pattern (steady increase without plateau)

**Cleanup:**
- None required
