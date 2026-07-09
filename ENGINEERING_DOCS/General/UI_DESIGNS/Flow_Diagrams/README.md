# SchoolPulse UI Workflow Flows (FigJam / Miro diagrams)

Each flow below should be mapped as a FigJam / Miro / flowchart before individual screen designs.

## 1. Onboarding Flow
**Source:** Product Doc (Onboarding section), Engineering Spec (build order)
**Steps:** Register School → Set Academic Year → Set Terms → Create Classes & Streams → Add Staff & Roles → Import Students & Guardians → Configure Fee Structures → Generate Invoices → Go Live

## 2. Admission Flow
**Source:** SRS (FR-STU-01–04, US-STU-01)
**Steps:** Search/Create Student → Enter Personal Info → Assign Admission Number → Link/Add Guardian(s) → Enroll in Class Instance → Confirm → (Event: StudentAdmitted)

## 3. Attendance Marking Flow
**Source:** SRS (FR-ATT-01–04, US-ATT-01)
**Steps:** Teacher Logs In → Dashboard shows today's classes → Select Class Instance + Session Type → Open Session → Grid shows enrolled students → Teacher marks Present/Absent/Late/Excused → Submit → Lock Session → (Event: AttendanceMarked)

## 4. Fee Payment Flow
**Source:** SRS (FR-FIN-05–08, US-FIN-01), Product Doc (Finance section)
**Steps:** Guardian receives invoice/reminder → (Manual) Bursar selects student → Enter amount, method, ref → Confirm → Receipt Generated → Balance Updated → (Event: PaymentReceived)
**Alt Path (M-Pesa):** Parent OTP → M-Pesa STK push → User confirms on phone → Callback received → Balance updated → Receipt

## 5. Assessment Publishing Flow
**Source:** SRS (FR-ASM-03–06, US-ASM-01)
**Steps:** Teacher creates exam → Creates assessments per subject → Enters marks per student → Validates (marks ≤ total) → Submit → Principal/Admin reviews → Publish → Results immutable → Parent portal updated → (Event: AssessmentPublished)

## 6. Parent Communication Flow
**Source:** SRS (FR-COM-01–03, FR-COM-05, US-COM-02)
**Steps:** Staff creates announcement/message → Selects audience (class, parents of , whole school) → Composes → (Optional: priority) → Sends → Log delivery → Parents see in Message Inbox → Read receipt updated

---

## File naming for FigJam

```
Flow_01_Onboarding.figjam
Flow_02_Admission.figjam
Flow_03_Attendance_Marking.figjam
Flow_04_Fee_Payment.figjam
Flow_05_Assessment_Publishing.figjam
Flow_06_Parent_Communication.figjam
```