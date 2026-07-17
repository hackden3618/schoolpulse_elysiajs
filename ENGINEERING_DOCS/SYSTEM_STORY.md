# SchoolPulse System Story

## The Complete Operational Narrative

### Purpose

This document is the business narrative behind SchoolPulse. It explains how a real school uses the system from the first day they subscribe until many years later. It is intended for software engineers, architects, AI coding agents, testers, UI designers, DevOps engineers, product managers, and future maintainers.

This document is the source of truth for understanding **why** each module exists and how they interact.

---

# Chapter 1 — A School Discovers SchoolPulse

Green Valley High School has operated for fifteen years.

It has over 1,800 students.

All records are currently stored in:

* Exercise books
* Filing cabinets
* Microsoft Excel spreadsheets
* Printed report cards
* Fee receipt books
* Bank statements
* SMS books
* Teachers' mark books

The principal decides that the school can no longer continue operating manually.

The school purchases a SchoolPulse subscription.

---

# Chapter 2 — Onboarding an Existing School

Unlike a brand-new school, Green Valley already has years of historical information.

Nothing should be retyped manually.

Instead, SchoolPulse provides an onboarding wizard.

The wizard asks the school to import its existing information.

Examples include:

* Existing students
* Existing parents
* Existing teachers
* Existing fee balances
* Existing fee structures
* Existing subjects
* Existing streams
* Existing classes
* Existing exam marks
* Existing academic years
* Existing report cards
* Existing admission numbers

Each import is performed independently.

Every upload is first validated.

Errors are shown before any data is written.

No partial imports occur.

Everything is transactional.

---

# Chapter 3 — Importing School Structure

The first upload creates the school's structure.

The school imports:

Academic Years

Example

2023

2024

2025

2026

Each year contains its Terms.

Each year contains its Streams.

Each stream contains its Classes.

Teachers are assigned later.

Students are assigned later.

At this stage the school hierarchy now exists.

---

# Chapter 4 — Importing Existing Teachers

The HR office exports its staff list.

A spreadsheet is uploaded.

Columns include:

Employee Number

Name

Phone

Email

Department

Position

Role

SchoolPulse validates:

Duplicate emails

Duplicate phones

Invalid roles

Missing required fields

Unknown departments

Teachers are imported as Users.

They are then attached to the school using School Memberships.

Roles are automatically assigned.

Examples:

Principal

Teacher

Bursar

Deputy Principal

Accountant

ICT Administrator

Discipline Master

Head of Department

The system produces an import report.

Successful records.

Failed records.

Reasons for failure.

---

# Chapter 5 — Importing Existing Students

The admissions office exports every learner.

The spreadsheet contains:

Admission Number

Names

Date of Birth

Gender

Current Class

Current Stream

Current Academic Year

Current Term

Status

SchoolPulse validates every row.

Admission numbers must be unique inside the school.

Students are created.

Enrollments are automatically created.

No student is permanently attached to a class.

Instead, each enrollment records where the learner currently belongs.

Historical movement becomes possible.

---

# Chapter 6 — Importing Guardians

Parents are imported next.

The upload contains:

Parent Name

Phone

Email

Relationship

Student Admission Number

SchoolPulse checks whether the parent already exists.

If the same parent has three children,

only one User record is created.

Three StudentGuardian records are created.

If another child later joins a completely different school using SchoolPulse,

the same User account is reused.

Only new relationships are created.

Duplicate people never exist.

---

# Chapter 7 — Importing Historical Fee Balances

The bursar exports the current financial ledger.

Each student has:

Opening Balance

Outstanding Balance

Scholarship

Discounts

Previous Payments

Waivers

Credits

SchoolPulse imports these as opening financial records.

Nothing is lost.

Historical balances remain traceable.

The school's books now continue digitally from where paper records ended.

---

# Chapter 8 — Importing Historical Exam Results

Years of examination data already exist.

Teachers export spreadsheets.

Each row contains:

Admission Number

Subject

Exam

Marks

Grade

Teacher

Academic Year

Term

The system validates:

Unknown students

Unknown subjects

Duplicate marks

Missing exams

Invalid grades

Only valid records are imported.

Immediately afterwards:

Student transcripts become available.

Historical report cards become available.

Trend graphs become available.

Mean scores become available.

Department analytics become available.

Without teachers entering marks again.

---

# Chapter 9 — Going Live

The principal reviews every imported record.

The school verifies:

Student count

Teachers

Parents

Classes

Streams

Academic Years

Fee balances

Exam records

Everything matches their paper records.

The principal clicks:

Activate School.

SchoolPulse becomes the school's official operating system.

From this point onwards,

all daily work happens digitally.

---

# Chapter 10 — Daily Operations

Every morning begins with attendance.

Teachers open today's class.

Students are marked:

Present

Absent

Late

Excused

Attendance is saved instantly.

Parents receive SMS notifications if configured.

The principal's dashboard updates immediately through WebSockets.

Attendance analytics begin accumulating.

---

# Chapter 11 — Continuous Learning

Teachers teach lessons.

Assignments are issued.

Homework is recorded.

Continuous assessments are entered.

Projects are graded.

Practical work is scored.

Students gradually build academic histories.

Nothing replaces previous records.

Everything accumulates.

---

# Chapter 12 — Examination Season

The examinations office creates:

CAT 1

CAT 2

Midterm

End Term

Mock Exams

Teachers enter marks manually.

Or upload spreadsheets.

The system validates:

Student existence

Subject allocation

Duplicate marks

Invalid score ranges

Missing students

After validation,

results are published.

Automatically the system calculates:

Subject totals

Overall totals

Percentages

Grades

Mean score

Position

Class ranking

School ranking

Department ranking

Historical trends

Parents immediately receive result notifications.

---

# Chapter 13 — Report Cards

Once results are approved,

SchoolPulse generates report cards.

Each report includes:

Student information

Attendance

Subject marks

Teacher comments

Class teacher comments

Principal comments

Mean score

Position

Grade

Fee balance

Conduct

Promotion recommendation

Report cards may be:

Printed

Downloaded

Shared electronically

Stored permanently.

---

# Chapter 14 — Fee Management

The bursar creates fee structures.

Example:

Tuition

Transport

Lunch

Activity Fee

Laboratory Fee

Development Levy

Boarding

The fee structure is assigned to classes.

Students automatically inherit fee obligations.

Throughout the term,

parents make payments.

Channels include:

Cash

Bank

M-Pesa

Online Gateway

Standing Orders

Every payment produces:

Receipt

Ledger Entry

Updated Balance

Audit Record

SMS Notification

WebSocket Event

Financial reports update instantly.

---

# Chapter 15 — Mass Fee Processing

Sometimes hundreds of parents pay simultaneously.

The bursar receives a bank statement.

Or an M-Pesa settlement file.

Instead of recording payments individually,

the file is uploaded.

SchoolPulse matches:

Admission Number

Reference Number

Amount

Date

Unknown rows are rejected.

Known payments are automatically posted.

Balances update instantly.

Receipts are generated automatically.

Parents receive confirmation messages.

---

# Chapter 16 — Promotions

The academic year ends.

Instead of editing thousands of students individually,

the principal opens the Promotion Wizard.

Example:

Grade 7 North

↓

Grade 8 North

Grade 7 South

↓

Grade 8 South

SchoolPulse previews every movement.

The principal confirms.

The system creates new Enrollment records.

Old enrollments remain historical.

Nothing is overwritten.

The school now begins a completely new academic year.

---

# Chapter 17 — Transfers

One student transfers to another school.

The admissions office marks:

Transferred.

SchoolPulse closes the active enrollment.

Academic history remains.

Fee history remains.

Attendance remains.

Exam records remain.

Nothing is deleted.

---

# Chapter 18 — Graduation

Form Four students complete school.

The principal performs a Mass Graduation.

Thousands of students become Graduated simultaneously.

No data disappears.

Years later,

former students can still request:

Transcripts

Academic history

Fee statements

Report cards

Everything remains archived.

---

# Chapter 19 — Communication

Every department communicates differently.

Admissions sends admission letters.

Finance sends fee reminders.

Teachers send homework alerts.

Principals send announcements.

Examinations send result notifications.

Discipline sends parent notices.

Messages may be sent through:

SMS

Email

Push Notifications

WebSockets

Every message is queued.

Delivery is monitored.

Failures are retried.

Communication history is preserved forever.

---

# Chapter 20 — Administration

Throughout the year administrators:

Hire teachers.

Suspend users.

Assign new roles.

Move teachers between schools.

Create new academic years.

Close terms.

Archive old data.

Renew subscriptions.

Restore archived users.

Generate reports.

Export government returns.

Approve financial transactions.

Every administrative action is audited.

Nothing occurs anonymously.

---

# Chapter 21 — Multi-School Operations

Years later,

Green Valley Academy opens a second campus.

The principal already has a User account.

No duplicate account is created.

A second School Membership is added.

The principal logs in once.

SchoolPulse displays:

Green Valley High School

Green Valley Academy

The principal selects the desired school.

Everything inside the application immediately switches to that school's isolated data.

Identity remains the same.

Permissions are recalculated.

No data crosses tenant boundaries.

---

# Chapter 22 — The Lifetime of a Student

A learner joins in Grade 7.

Every year:

A new enrollment is created.

Attendance accumulates.

Exam records accumulate.

Fee payments accumulate.

Guardian relationships remain.

Medical records accumulate.

Discipline history accumulates.

Achievements accumulate.

By graduation,

SchoolPulse contains a complete educational biography spanning many years.

---

# Chapter 23 — The Philosophy of SchoolPulse

SchoolPulse is not a CRUD application.

It is a living digital model of how schools operate.

Every endpoint represents a real business action.

Every database record represents a real-world event.

Every module contributes to a student's educational journey.

The platform preserves history instead of replacing it.

Students grow.

Teachers move.

Parents change.

Schools expand.

Academic years pass.

Financial records accumulate.

People graduate.

Nothing meaningful is lost.

SchoolPulse becomes the institutional memory of the school.

Its purpose is not simply to store information, but to preserve the operational history of educational institutions accurately, securely, and at scale for decades to come.

