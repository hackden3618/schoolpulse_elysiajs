# 13 — Attendance Test Cases

## Table of Contents

| ID | Title |
|---|---|
| ATT-001 | Mark Present |
| ATT-002 | Mark Absent |
| ATT-003 | Late |
| ATT-004 | Excused |
| ATT-005 | Bulk Attendance |
| ATT-006 | Duplicate Attendance |
| ATT-007 | Attendance Report |
| ATT-008 | Attendance Notification |
| ATT-009 | Attendance Analytics |
| ATT-010 | Audit |

---

## ATT-001 Mark Present

**Objective:** Verify attendance can be marked as present

**Preconditions:**
- Authenticated teacher
- Student exists with ID `:studentId`
- Date is valid school day

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "present"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "att_001",
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "present",
  "markedBy": "usr_003",
  "markedAt": "2026-07-15T08:00:00.000Z"
}
```

**Expected Database Changes:**
- `attendance` table: new row inserted

**Expected Audit Log:**
- Event type: `AttendanceMarked`
- Actor: Teacher user ID
- Changes recorded: Attendance marked present for student

**Expected WebSocket Event:**
- `attendance.marked`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created attendance record

---

## ATT-002 Mark Absent

**Objective:** Verify attendance can be marked as absent

**Preconditions:**
- Authenticated teacher
- Student exists with ID `:studentId`

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "absent"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "att_002",
  "status": "absent",
  "date": "2026-07-15"
}
```

**Expected Database Changes:**
- `attendance` table: new row with status absent

**Expected Audit Log:**
- Event type: `AttendanceMarked`
- Actor: Teacher user ID

**Expected WebSocket Event:**
- `attendance.marked`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `student_absent`

**Cleanup:**
- Delete created attendance record

---

## ATT-003 Late

**Objective:** Verify attendance can be marked as late with minutes

**Preconditions:**
- Authenticated teacher
- Student exists with ID `:studentId`

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_002",
  "date": "2026-07-15",
  "status": "late",
  "minutesLate": 15
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "att_003",
  "status": "late",
  "minutesLate": 15,
  "date": "2026-07-15"
}
```

**Expected Database Changes:**
- `attendance` table: new row with status late, minutesLate stored

**Expected Audit Log:**
- Event type: `AttendanceMarked`
- Actor: Teacher user ID

**Cleanup:**
- Delete created attendance record

---

## ATT-004 Excused

**Objective:** Verify attendance can be marked as excused with reason

**Preconditions:**
- Authenticated teacher
- Student exists with ID `:studentId`

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_003",
  "date": "2026-07-15",
  "status": "excused",
  "reason": "Medical appointment"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "att_004",
  "status": "excused",
  "reason": "Medical appointment",
  "date": "2026-07-15"
}
```

**Expected Database Changes:**
- `attendance` table: new row with status excused, reason stored

**Expected Audit Log:**
- Event type: `AttendanceMarked`
- Actor: Teacher user ID

**Cleanup:**
- Delete created attendance record

---

## ATT-005 Bulk Attendance

**Objective:** Verify attendance can be marked in batch for an entire class

**Preconditions:**
- Authenticated teacher
- Class `cls_001` has 5 students

**Request:**
`POST /api/v1/schools/:schoolId/attendance/bulk`
```json
{
  "date": "2026-07-15",
  "classId": "cls_001",
  "records": [
    { "studentId": "stu_001", "status": "present" },
    { "studentId": "stu_002", "status": "present" },
    { "studentId": "stu_003", "status": "absent" },
    { "studentId": "stu_004", "status": "late", "minutesLate": 10 },
    { "studentId": "stu_005", "status": "excused", "reason": "Sick" }
  ]
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "marked": 5,
  "failed": 0,
  "errors": []
}
```

**Expected Database Changes:**
- `attendance` table: 5 new rows inserted

**Expected Audit Log:**
- Event type: `AttendanceBulkMarked`
- Actor: Teacher user ID

**Cleanup:**
- Delete all 5 attendance records

---

## ATT-006 Duplicate Attendance

**Objective:** Verify marking attendance for the same student, date, and class returns conflict

**Preconditions:**
- Attendance already exists for student `stu_001` on date `2026-07-15`

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "present"
}
```

**Expected HTTP Status:** 409 Conflict

**Expected Response Body:**
```json
{
  "error": "Conflict",
  "message": "Attendance already recorded for this student on this date",
  "field": "studentId+date"
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required

---

## ATT-007 Attendance Report

**Objective:** Verify attendance report can be generated

**Preconditions:**
- Authenticated school admin
- Attendance data exists for the requested period

**Request:**
`GET /api/v1/schools/:schoolId/attendance/report?classId=cls_001&from=2026-07-01&to=2026-07-15`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "classId": "cls_001",
  "period": "2026-07-01 to 2026-07-15",
  "totalStudents": 45,
  "summary": {
    "present": 620,
    "absent": 30,
    "late": 20,
    "excused": 5
  },
  "attendanceRate": 91.9
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required

---

## ATT-008 Attendance Notification

**Objective:** Verify SMS notification sent to guardian when student is absent

**Preconditions:**
- Authenticated teacher
- Student `stu_001` has guardian with SMS enabled

**Request:**
`POST /api/v1/schools/:schoolId/attendance`
```json
{
  "studentId": "stu_001",
  "date": "2026-07-15",
  "status": "absent"
}
```

**Expected HTTP Status:** 201 Created

**Expected Database Changes:**
- `attendance` table: new row
- `sms_queue` table: new row with guardian phone, template `student_absent`

**Expected SMS/Email Notification:**
- Recipient: Guardian phone
- Template: `student_absent`

**Cleanup:**
- Delete attendance record and queued SMS

---

## ATT-009 Attendance Analytics

**Objective:** Verify attendance analytics summary by class and month

**Preconditions:**
- Authenticated school admin
- Attendance data exists for multiple months

**Request:**
`GET /api/v1/schools/:schoolId/attendance/analytics?year=2026&month=07`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "schoolId": "clx...",
  "year": 2026,
  "month": 7,
  "classSummary": [
    {
      "classId": "cls_001",
      "className": "Grade 7",
      "totalStudents": 45,
      "attendanceRate": 93.2,
      "totalSchoolDays": 21
    },
    {
      "classId": "cls_002",
      "className": "Grade 8",
      "totalStudents": 42,
      "attendanceRate": 90.5,
      "totalSchoolDays": 21
    }
  ],
  "schoolAverage": 91.85
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required

---

## ATT-010 Audit

**Objective:** Verify attendance marking is logged

**Preconditions:**
- Attendance records exist for student `stu_001`

**Request:**
`GET /api/v1/schools/:schoolId/students/:studentId/attendance/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "AttendanceMarked",
      "actor": "usr_003",
      "timestamp": "2026-07-15T08:00:00.000Z",
      "changes": { "studentId": "stu_001", "date": "2026-07-15", "status": "present" }
    }
  ],
  "meta": { "total": 1 }
}
```

**Expected Database Changes:**
- None

**Expected Audit Log:**
- None

**Cleanup:**
- None required
