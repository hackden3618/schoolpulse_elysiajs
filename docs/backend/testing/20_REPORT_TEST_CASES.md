# 20 — Report Test Cases

## Table of Contents

| ID | Title |
|---|---|
| REP-001 | Student Report |
| REP-002 | Fee Report |
| REP-003 | Attendance Report |
| REP-004 | Academic Report |
| REP-005 | Export PDF |
| REP-006 | Export Excel |
| REP-007 | Filters |
| REP-008 | Large Dataset |
| REP-009 | Scheduled Reports |
| REP-010 | Permissions |

---

## REP-001 Student Report

**Objective:** Verify a paginated student list report can be generated

**Preconditions:**
- Authenticated school admin
- School has 50+ students

**Request:**
`GET /api/v1/schools/:schoolId/reports/students?page=1&limit=20&sortBy=lastName&sortOrder=asc`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "id": "stu_001",
      "firstName": "Alice",
      "lastName": "Wanjiku",
      "admissionNumber": "ADM-2026-001",
      "className": "Grade 7",
      "stream": "East",
      "status": "active"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 50, "totalPages": 3 }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## REP-002 Fee Report

**Objective:** Verify a fee collection summary report can be generated

**Preconditions:**
- Authenticated bursar
- Fee and payment data exists for the term

**Request:**
`GET /api/v1/schools/:schoolId/reports/fees?termId=trm_001`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "term": "Term 1 - 2026",
  "totalInvoiced": 2250000,
  "totalCollected": 1800000,
  "outstandingBalance": 450000,
  "collectionRate": 80.0,
  "classBreakdown": [
    {
      "className": "Grade 7",
      "invoiced": 500000,
      "collected": 420000,
      "outstanding": 80000,
      "rate": 84.0
    }
  ]
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## REP-003 Attendance Report

**Objective:** Verify an attendance report with class stats can be generated

**Preconditions:**
- Authenticated school admin
- Attendance data exists for the period

**Request:**
`GET /api/v1/schools/:schoolId/reports/attendance?classId=cls_001&from=2026-01-15&to=2026-04-15`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "class": "Grade 7",
  "period": "2026-01-15 to 2026-04-15",
  "totalStudents": 45,
  "totalSchoolDays": 65,
  "summary": {
    "present": 2800,
    "absent": 95,
    "late": 30,
    "excused": 25
  },
  "attendanceRate": 94.9,
  "topAttendees": [
    { "name": "Alice Wanjiku", "rate": 100.0 },
    { "name": "Bob Kamau", "rate": 98.5 }
  ],
  "lowAttendees": [
    { "name": "John Doe", "rate": 75.4 }
  ]
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## REP-004 Academic Report

**Objective:** Verify an academic exam results report can be generated

**Preconditions:**
- Authenticated school admin
- Exam marks exist for the term

**Request:**
`GET /api/v1/schools/:schoolId/reports/academic?termId=trm_001&classId=cls_001`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "term": "Term 1 - 2026",
  "class": "Grade 7",
  "students": [
    {
      "name": "Alice Wanjiku",
      "subjects": [
        { "subject": "Mathematics", "score": 85, "grade": "A" },
        { "subject": "English", "score": 78, "grade": "B" },
        { "subject": "Science", "score": 92, "grade": "A" }
      ],
      "total": 255,
      "average": 85.0,
      "rank": 1
    }
  ],
  "subjectAverages": [
    { "subject": "Mathematics", "average": 72.5 },
    { "subject": "English", "average": 68.0 },
    { "subject": "Science", "average": 75.0 }
  ]
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## REP-005 Export PDF

**Objective:** Verify a report can be exported as PDF

**Preconditions:**
- Authenticated school admin
- Report exists with ID `:id`

**Request:**
`GET /api/v1/schools/:schoolId/reports/:id/export?format=pdf`

**Expected HTTP Status:** 200 OK

**Expected Response Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="report-academic-grade7-term1-2026.pdf"`

**Expected Response Body:**
Binary PDF content with formatted report

**Expected Database Changes:**
- None

**Expected Audit Log:**
- Event type: `ReportExported`
- Actor: Authenticated user ID
- Changes recorded: Report ID, format PDF

**Cleanup:**
- None required

---

## REP-006 Export Excel

**Objective:** Verify a report can be exported as Excel (XLSX)

**Preconditions:**
- Authenticated school admin
- Report exists with ID `:id`

**Request:**
`GET /api/v1/schools/:schoolId/reports/:id/export?format=xlsx`

**Expected HTTP Status:** 200 OK

**Expected Response Headers:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="report-fees-grade7-term1-2026.xlsx"`

**Expected Response Body:**
Binary XLSX content with data in spreadsheet format

**Expected Database Changes:**
- None

**Expected Audit Log:**
- Event type: `ReportExported`
- Changes recorded: Report ID, format XLSX

**Cleanup:**
- None required

---

## REP-007 Filters

**Objective:** Verify reports can be filtered by class, term, and date range

**Preconditions:**
- Authenticated school admin

**Request:**
`GET /api/v1/schools/:schoolId/reports/attendance?classId=cls_001&from=2026-01-15&to=2026-04-15`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "class": "Grade 7",
  "period": "2026-01-15 to 2026-04-15",
  "data": []
}
```

**Additional filter combinations:**
- `?classId=cls_001` - single class
- `?termId=trm_001` - all classes in term
- `?from=2026-01-01&to=2026-12-31` - custom date range
- `?status=active` - active students only

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## REP-008 Large Dataset

**Objective:** Verify report with 10k+ records returns within 5 seconds

**Preconditions:**
- Authenticated school admin
- School has 10,000+ students with data

**Request:**
`GET /api/v1/schools/:schoolId/reports/students?page=1&limit=100`

**Expected HTTP Status:** 200 OK

**Expected Performance:**
- Response time < 5000ms
- Pagination works correctly with large dataset
- Database query uses indexes and limits

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## REP-009 Scheduled Reports

**Objective:** Verify daily email reports are sent automatically

**Preconditions:**
- Scheduled report job is configured
- School has enabled daily summary report

**Action:**
Scheduled cron job triggers daily report generation

**Expected Behavior:**
- System generates report for the previous day
- Email is sent to configured recipients
- Report generation is logged

**Expected Database Changes:**
- `scheduled_report_log` table: new row with generation timestamp, status `sent`

**Expected Audit Log:**
- Event type: `ScheduledReportSent`
- Actor: System
- Changes recorded: Report type, delivery status

**Expected SMS/Email Notification:**
- Recipient: Configured email addresses
- Template: `daily_summary_report`
- Attachment: PDF or link to report

**Cleanup:**
- None required

---

## REP-010 Permissions

**Objective:** Verify bursar cannot access academic reports (403)

**Preconditions:**
- Authenticated user with Bursar role
- Bursar does not have permission to view academic reports

**Request:**
`GET /api/v1/schools/:schoolId/reports/academic?termId=trm_001`

**Expected HTTP Status:** 403 Forbidden

**Expected Response Body:**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access academic reports"
}
```

**Verification:**
- Same bursar CAN access fee reports
- Same bursar CAN access attendance reports (if permitted)

**Expected Database Changes:**
- None

**Cleanup:**
- None required
