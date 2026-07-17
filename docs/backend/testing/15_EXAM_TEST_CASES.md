# 15 — Exam Test Cases

## Table of Contents

| ID | Title |
|---|---|
| EXM-001 | Create Exam |
| EXM-002 | Publish Exam |
| EXM-003 | Close Exam |
| EXM-004 | Enter Marks |
| EXM-005 | Bulk Marks |
| EXM-006 | Missing Marks |
| EXM-007 | Grade Calculation |
| EXM-008 | Ranking |
| EXM-009 | Reports |
| EXM-010 | Audit |

---

## EXM-001 Create Exam

**Objective:** Verify an exam can be created

**Preconditions:**
- Authenticated school admin
- Term exists with ID `:termId`
- Subject exists with ID `:subjectId`
- Class exists with ID `:classId`

**Request:**
`POST /api/v1/schools/:schoolId/exams`
```json
{
  "title": "End of Term 1 Exam",
  "termId": "trm_001",
  "subjectId": "sub_001",
  "classId": "cls_001",
  "date": "2026-04-10",
  "maxScore": 100,
  "type": "final"
}
```

**Expected HTTP Status:** 201 Created

**Expected Response Body:**
```json
{
  "id": "exm_001",
  "title": "End of Term 1 Exam",
  "termId": "trm_001",
  "subjectId": "sub_001",
  "classId": "cls_001",
  "date": "2026-04-10",
  "maxScore": 100,
  "status": "draft",
  "createdAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `exam` table: new row inserted

**Expected Audit Log:**
- Event type: `ExamCreated`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `exam.created`

**Expected SMS/Email Notification:**
- None

**Cleanup:**
- Delete created exam

---

## EXM-002 Publish Exam

**Objective:** Verify an exam can be published

**Preconditions:**
- Authenticated school admin
- Exam exists with ID `:id` and status `draft`

**Request:**
`PATCH /api/v1/schools/:schoolId/exams/:id`
```json
{
  "status": "published"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "exm_001",
  "title": "End of Term 1 Exam",
  "status": "published",
  "publishedAt": "2026-07-15T11:00:00.000Z"
}
```

**Expected Database Changes:**
- `exam` table: `status` set to `published`, `publishedAt` set

**Expected Audit Log:**
- Event type: `ExamPublished`
- Actor: Authenticated admin user ID

**Expected WebSocket Event:**
- `exam.published`

**Expected SMS/Email Notification:**
- Recipient: Students' guardians
- Template: `exam_published`

**Cleanup:**
- Revert exam to draft

---

## EXM-003 Close Exam

**Objective:** Verify an exam can be closed

**Preconditions:**
- Authenticated school admin
- Exam exists with ID `:id` and status `published`

**Request:**
`PATCH /api/v1/schools/:schoolId/exams/:id`
```json
{
  "status": "closed"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "id": "exm_001",
  "status": "closed",
  "closedAt": "2026-07-15T12:00:00.000Z"
}
```

**Expected Database Changes:**
- `exam` table: `status` set to `closed`

**Expected Audit Log:**
- Event type: `ExamClosed`
- Actor: Authenticated admin user ID

**Cleanup:**
- Reopen exam

---

## EXM-004 Enter Marks

**Objective:** Verify marks can be entered for a student

**Preconditions:**
- Authenticated teacher
- Exam exists with ID `:id` and status `published`
- Student `stu_001` is enrolled in the exam's class

**Request:**
`POST /api/v1/schools/:schoolId/exams/:id/marks`
```json
{
  "studentId": "stu_001",
  "score": 85,
  "remarks": "Good performance"
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "examId": "exm_001",
  "studentId": "stu_001",
  "score": 85,
  "grade": "A",
  "enteredBy": "usr_003",
  "enteredAt": "2026-07-15T10:00:00.000Z"
}
```

**Expected Database Changes:**
- `exam_mark` table: new row with student score and auto-calculated grade

**Expected Audit Log:**
- Event type: `ExamMarkEntered`
- Actor: Teacher user ID

**Cleanup:**
- Delete entered mark

---

## EXM-005 Bulk Marks

**Objective:** Verify marks can be entered in bulk for an entire class

**Preconditions:**
- Authenticated teacher
- Exam exists with ID `:id`
- Class `cls_001` has 5 students

**Request:**
`POST /api/v1/schools/:schoolId/exams/:id/marks/bulk`
```json
{
  "marks": [
    { "studentId": "stu_001", "score": 85 },
    { "studentId": "stu_002", "score": 72 },
    { "studentId": "stu_003", "score": 91 },
    { "studentId": "stu_004", "score": 65 },
    { "studentId": "stu_005", "score": 78 }
  ]
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "entered": 5,
  "failed": 0,
  "errors": []
}
```

**Expected Database Changes:**
- `exam_mark` table: 5 new rows

**Expected Audit Log:**
- Event type: `ExamBulkMarksEntered`
- Actor: Teacher user ID

**Cleanup:**
- Delete all entered marks

---

## EXM-006 Missing Marks

**Objective:** Verify report of students without marks

**Preconditions:**
- Authenticated school admin
- Exam exists with ID `:id`
- Some students have marks entered, some do not

**Request:**
`GET /api/v1/schools/:schoolId/exams/:id/missing-marks`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "examId": "exm_001",
  "totalStudents": 45,
  "marksEntered": 40,
  "missingMarks": 5,
  "students": [
    { "id": "stu_006", "firstName": "Missing", "lastName": "Student1" },
    { "id": "stu_007", "firstName": "Missing", "lastName": "Student2" }
  ]
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## EXM-007 Grade Calculation

**Objective:** Verify marks are auto-converted to grades

**Preconditions:**
- Exam exists with maxScore 100
- Grading scale: A=80-100, B=65-79, C=50-64, D=40-49, E=0-39

**Request:**
`POST /api/v1/schools/:schoolId/exams/:id/marks`
```json
{
  "studentId": "stu_001",
  "score": 85
}
```

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "score": 85,
  "grade": "A",
  "maxScore": 100,
  "percentage": 85.0
}
```

**Additional tests:**
- Score 72 -> grade B
- Score 55 -> grade C
- Score 42 -> grade D
- Score 15 -> grade E

**Expected Database Changes:**
- `exam_mark` table: score and calculated grade stored

**Cleanup:**
- Delete entered marks

---

## EXM-008 Ranking

**Objective:** Verify students are ranked by total score

**Preconditions:**
- Authenticated school admin
- Exam marks exist for multiple students

**Request:**
`GET /api/v1/schools/:schoolId/exams/:id/ranking`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "examId": "exm_001",
  "subject": "Mathematics",
  "class": "Grade 7",
  "rankings": [
    { "rank": 1, "studentId": "stu_003", "name": "Alice Wanjiku", "score": 91, "grade": "A" },
    { "rank": 2, "studentId": "stu_001", "name": "Bob Kamau", "score": 85, "grade": "A" },
    { "rank": 3, "studentId": "stu_005", "name": "Carol Muthoni", "score": 78, "grade": "B" }
  ],
  "totalStudents": 5
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## EXM-009 Reports

**Objective:** Verify exam performance report can be generated

**Preconditions:**
- Authenticated school admin
- Exam data exists for the term

**Request:**
`GET /api/v1/schools/:schoolId/exams/reports/term?termId=trm_001&classId=cls_001`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "term": "Term 1",
  "class": "Grade 7",
  "subjects": [
    {
      "subject": "Mathematics",
      "averageScore": 78.2,
      "highestScore": 91,
      "lowestScore": 55,
      "passRate": 92.0
    },
    {
      "subject": "English",
      "averageScore": 75.0,
      "highestScore": 88,
      "lowestScore": 60,
      "passRate": 95.0
    }
  ],
  "overallAverage": 76.6
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required

---

## EXM-010 Audit

**Objective:** Verify exam creation and marks entry are logged

**Preconditions:**
- Exam `exm_001` has been created and marks entered

**Request:**
`GET /api/v1/schools/:schoolId/exams/:id/audit-logs`

**Expected HTTP Status:** 200 OK

**Expected Response Body:**
```json
{
  "data": [
    {
      "event": "ExamCreated",
      "actor": "usr_001",
      "timestamp": "2026-07-15T10:00:00.000Z",
      "changes": { "title": "End of Term 1 Exam", "status": "draft" }
    },
    {
      "event": "ExamMarkEntered",
      "actor": "usr_003",
      "timestamp": "2026-07-15T11:00:00.000Z",
      "changes": { "studentId": "stu_001", "score": 85 }
    }
  ],
  "meta": { "total": 2 }
}
```

**Expected Database Changes:**
- None

**Cleanup:**
- None required
