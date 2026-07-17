# SchoolPulse UI Screen Inventory v1.1.0

Every screen below should be designed in Figma before frontend implementation.
Reference: SRS v1.1.0 (FR-*), Engineering Spec (API section), Product Doc (workflow descriptions).

---

## 01 — Authentication (Staff & Parent)

| # | Screen | Source Requirements | Notes |
|---|--------|-------------------|-------|
| 01.01 | Staff Login | FR-USR-03, FR-SYS-02 | Phone/email + password form |
| 01.02 | Parent OTP Request | FR-USR-04, FR-SYS-02 | Phone number input |
| 01.03 | Parent OTP Verify | FR-USR-04 | 4-6 digit code entry |
| 01.04 | Forgot Password | NFR-USR-02 | Rate-limited reset flow |
| 01.05 | Reset Password | NFR-USR-02 | New password form |
| 01.06 | Token Refresh (silent) | — | No screen; loading overlay |
| 01.07 | Logout Confirmation | — | Modal / slide-out |

## 02_School Management

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 2.01 | School Registration | FR-SCH-01, US-SCH-01 | Multi-step onboarding form |
| 2.02 | School Profile View | FR-SCH-03, FR-SCH-05 | Read-only details + subscription badge |
| 2.03 | School Profile Edit | FR-SCH-02 | Name, phone, address, branding, timezone, currency |
| 2.04 | School Settings | FR-SCH-05 | Academic config, fee reminder thresholds |
| 2.05 | Subscription Management | FR-SCH-03, FR-SCH-06 | Plan display, status badge, upgrade path |
| 2.05a | Subscription Edit | FR-SCH-03 | Status transitions (admin only) |
| 2.06 | School List (Platform Admin) | FR-SCH-01, FR-SCH-06 | Paginated table with search/filter |

## 03_User Management (Staff)

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 3.01 | Staff User List | FR-USR-01, US-USR-01 | Paginated, search, filter by role/status |
| 3.02 | Create Staff User | FR-USR-01 | Name, phone, email, role assignment |
| 3.03 | User Profile | FR-USR-05, FR-USR-06 | Membership info, roles, status |
| 3.04 | Edit User | FR-USR-07 | Profile fields, status (active/suspended/archived) |
| 3.05 | Role Assignment | FR-USR-06, NFR-USR-03 | Multi-select roles per membership |
| 3.06 | Memberships List | FR-USR-05 | Users → schools table |

## 04_Student Management

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 4.01 | Student List | FR-STU-01, FR-STU-07, US-STU-02 | Searchable, filterable, paginated table |
| 4.02 | Admit Student (Step 1) | FR-STU-01, NFR-STU-03 | Personal info, admission number, class |
| 4.03 | Add Guardian (Step 2) | FR-STU-03, FR-STU-04, US-STU-01 | Guardian relationship picker |
| 4.04 | Student Profile | FR-STU-08 | Tab-based: overview, guardians, enrollment, attendance, fees, academics |
| 4.05 | Edit Student | FR-STU-06 | Profile edits, status change |
| 4.06 | Student Archive | FR-STU-06, NFR-STU-02 | Soft-delete confirmation modal |
| 4.07 | Bulk Student Import | FR-STU-09 | CSV upload with validation preview |
| 4.08 | Guardian Link | FR-STU-03, FR-STU-04 | Add existing or create new guardian |
| 4.09 | Guardian Unlink | FR-STU-03 | Confirmation dialog |
| 4.10 | Transfer Student | FR-STU-06 | Class/stream selector, effective date |
| 4.10a | Graduation | FR-STU-06 | Status transition to graduated |

## 05_Academic Structure

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 5.01 | Academic Year List | FR-ACD-01, US-ACD-01 | With active indicator |
| 5.02 | Create Academic Year | FR-ACD-01 | Name, start/end dates |
| 5.03 | Edit Academic Year | — | |
| 5.04 | Activate Academic Year | FR-ACD-01, NFR-ACD-01 | Confirmation modal |
| 5.05 | Term List | FR-ACD-02 | Nested under academic year |
| 5.06 | Create Term | FR-ACD-02 | Name, dates, type |
| 5.07 | Activate Term | FR-ACD-02, NFR-ACD-02 | Auto-deactivate previous |
| 5.08 | Class List | FR-ACD-03 | |
| 5.09 | Create Class | FR-ACD-03 | Name, level |
| 5.10 | Class Instance List | FR-ACD-04, FR-ACD-05 | Grouped by class, year, stream |
| 5.11 | Create Class Instance | FR-ACD-04, FR-ACD-05 | Class picker + stream name input |
| 5.12 | Subject List | FR-ACD-06 | Per class instance view |
| 5.13 | Create Subject | FR-ACD-06 | Name, code, optional teacher |
| 5.14 | Teacher Assignment | FR-ACD-07 | Subject + teacher per class instance |

## 06_Attendance

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 6.01 | Attendance Sessions (Today) | FR-ATT-01, US-ATT-01 | Grid for teacher to pick class + session type |
| 6.02 | New Attendance Session | FR-ATT-01 | Date, class instance, session type (morning, afternoon, etc.) |
| 6.03 | Mark Attendance (Grid) | FR-ATT-02, FR-ATT-03, NFR-ATT-02 | Student rows with present/absent/late/excused toggles |
| 6.04 | Session Detail | FR-ATT-03 | Review mode (locked), summary stats |
| 6.05 | Lock Session | FR-ATT-04 | Confirmation action |
| 6.06 | Edit Attendance Record | FR-ATT-04, NFR-ATT-01 | Reason input modal |
| 6.07 | Attendance Analytics (Class view) | FR-ATT-06 | Charts, % rates per term |
| 6.08 | Absent/Late Alerts | FR-ATT-05 | Notification triggered — no screen UI needed sentinel |

## 07_Assessments & Exams

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 7.01 | Exam List | FR-ASM-01, US-ASM-01 | Filter by term, status (draft/published) |
| 7.02 | Create Exam | FR-ASM-01 | Name, type, dates, term |
| 7.03 | Edit Exam | — | |
| 7.04 | Assessment List (per exam) | FR-ASM-02 | Per subject breakdown |
| 7.05 | Create Assessment | FR-ASM-02 | Subject, class instance, total marks |
| 7.06 | Marks Entry (Sheet) | FR-ASM-03, FR-ASM-04 | Grid: student × marks with validation |
| 7.07 | Publish Exam Results | FR-ASM-05, NFR-ASM-01 | Confirmation — makes results immutable |
| 7.08 | Student Report Card | FR-ASM-06 | Per-student printable view |
| 7.09 | Result Correction Workflow | NFR-ASM-01 | Admin-only edit with reason |

## 08_Finance

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 8.01 | Fee Structure List | FR-FIN-01, US-FIN-01 | Per year/term, with class filters |
| 8.02 | Create Fee Structure | FR-FIN-01 | Year, term, optional class |
| 8.03 | Add Fee Items (inside structure) | FR-FIN-02 | Item name, amount (Decimal) |
| 8.04 | Invoice Generation | FR-FIN-03, US-FIN-03 | Trigger per class or bulk; preview before confirm |
| 8.05 | Invoice List | FR-FIN-04 | Paginated, searchable, filter by status |
| 8.06 | Invoice Detail | FR-FIN-04 | Line items, totals, payments applied, balance |
| 8.07 | Student Statement | FR-FIN-10 | Chronological ledger + running balance |
| 8.08 | Manual Payment Entry | FR-FIN-05, FR-FIN-06 | Student search, amount, method, reference |
| 8.09 | M-Pesa STK Push (initiate) | FR-FIN-05 | Amount + phone number → push |
| 8.10 | Payment Receipt | FR-FIN-07, US-FIN-02 | Printable receipt view |
| 8.11 | Payment Reversal | FR-FIN-08, NFR-FIN-02 | Reason input, confirmation, new reversed payment record |
| 8.12 | Fee Reminders Send | FR-FIN-09 | Select students, preview, send batch |
| 8.13 | Finance Dashboard (Bursar) | FR-FIN-10, FR-FIN-11 | Collection rate %, pending balances, recent payments |

## 09_Communication

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 9.01 | Conversation List | FR-COM-01, US-COM-01, US-COM-02 | Threaded list per school |
| 9.02 | Create Conversation | FR-COM-01 | Recipient picker (staff, parent, group) |
| 9.03 | Conversation Thread | FR-COM-04, FR-COM-05 | Message timeline, read receipts, priority badge |
| 9.04 | Send Announcement | FR-COM-02 | Audience selector (whole school / class / parents of ), compose, preview |
| 9.05 | Notification Delivery Log | FR-COM-03 | Status per recipient (sent/delivered/failed) |

## 10_Reporting

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 10.01 | Staff Dashboard (Principal View) | FR-RPT-05, US-RPT-01 | Attendance rate, fee progress, recent payments, students needing attention, published academic activity |
| 10.02 | Attendance Report | FR-RPT-01, NFR-RPT-01 | Date range, class/term filters, CSV export |
| 10.03 | Finance Report | FR-RPT-02 | Fee collection summary, outstanding, payment trends |
| 10.04 | Academic Report | FR-RPT-03 | Performance summaries by class/subject |
| 10.05 | Student Report | FR-RPT-04 | Per-student profile compilation |
| 10.06 | Operational Report | FR-RPT-05 | Daily operations snapshots |
| 10.07 | Report Builder / Filters | NFR-RPT-01 | Common filter bar used across all reports |

## 11_Parent Portal

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 11.01 | Parent Dashboard (Overview) | NFR-ASM-02 | Linked students summary, recent notices |
| 11.02 | Fee Statement | FR-FIN-10, US-FIN-02 | Student balance, payment history, receipts |
| 11.03 | Attendance View | FR-ATT-06 | Per-student attendance summary, timeline |
| 11.04 | Academic Results | FR-ASM-05, NFR-ASM-02 | Published report cards, assessment breakdown |
| 11.05 | Messages | FR-COM-01, FR-COM-02, US-COM-02 | Inbox, announcements, school messages |
| 11.06 | Student Profile (Parent) | FR-STU-08 (parent-limited) | Limited view: name, class, guardian info |

## 12_Settings & Admin

| # | Screen | Requirements | Notes |
|---|--------|-------------|-------|
| 12.01 | Audit Log Query | FR-SYS-04, FR-SYS-05 | Filterable log table with actor, action, timestamp |
| 12.02 | Event Outbox Admin | FR-EVT-03, FR-EVT-04 | Failed events list, retry button |
| 12.03 | School Branding | FR-SCH-02 | Logo upload, school colors, favicon |
| 12.04 | Role & Permissions Matrix | FR-USR-06 | System-level role configuration |
| 12.05 | Integration Settings | — | SMS provider, payment provider config |
| 12.06 | School Config (Timezone, Currency) | FR-SCH-02 | |
| 12.07 | Subscription Plan Configuration | FR-SCH-03 | Platform admin only |

---

## Summary

| Module | Screens |
|--------|---------|
| Auth | 7 |
| School Management | 6 |
| User Management | 6 |
| Student Management | 10 |
| Academic Structure | 14 |
| Attendance | 8 |
| Assessments | 9 |
| Finance | 13 |
| Communication | 5 |
| Reporting | 7 |
| Parent Portal | 6 |
| Settings & Admin | 7 |
| **Total** | **98** |

---

## Screen Spec Template (for each screen)

When implementing a Figma screen, include this header in the Figma file's description or a companion markdown file:

```
Screen: [Number.Name]
Route: /api/v1/schools/:schoolId/[route]
Data Dependencies: [e.g. Student, ClassInstance, AttendanceSession]
States: Loading | Empty | Error | Loaded | Edge Cases
Key Interactions: [what clicks, forms, toggles]
Permission Level: [e.g. Teacher, Bursar, Principal, Admin]
User Story: [e.g. US-ATT-01]
```