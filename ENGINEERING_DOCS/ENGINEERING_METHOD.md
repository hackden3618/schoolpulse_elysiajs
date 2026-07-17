# SchoolPulse Engineering Method

Version: 1.1.0
Status: Authoritative engineering practice
Companion to: `SYSTEM_STORY.md` (the "why"), `AGENTS.md` (the constitution),
`SCHOOLPULSE_PROJECT_CHARTER.md` (scope and governance)

## 1. Purpose

`SYSTEM_STORY.md` describes how a school lives inside SchoolPulse across years of
operation. This document turns that narrative into a **mandatory engineering
method**: the sequence every feature must follow before a single line of code is
written, and the rules that keep the product aligned to real school workflows
rather than to database tables.

SchoolPulse is not a collection of CRUD pages. It is a living operating system
for schools. The database is only a persistence mechanism. The API exposes
business capabilities. The frontend visualizes the current operational state.
Everything revolves around business processes.

## 2. The Four Actors

There are only four real actors. Everything else connects them.

1. **Platform** — operates Schools, provisions tenants, owns cross-tenant
   concerns (billing, event infrastructure, global audit). Never acts *inside*
   a school's data.
2. **School** — the tenant. The boundary inside which all operational data
   lives. Every query, event, websocket, upload, and report executes inside one
   school context.
3. **People** — Users (administrators, teachers, parents, bursars, principals,
   secretaries, accountants) and the domain people they represent (Students are
   domain entities, **not** authenticating users in the current scope).
4. **Academic Records** — the accumulated, largely immutable history:
   enrollments, attendance, assessments, exams, payments, communications,
   imports, promotions, graduations.

When designing a feature, identify which actor initiates it and which actors it
affects. If a proposed feature does not map onto one of these four, the design
is wrong.

## 3. The Feature Intake Sequence (mandatory)

For every module, endpoint, workflow, or UI screen, answer these ten questions
**in order** before implementation. Do not skip any. The answers become the
feature's documentation, schema, API contract, events, and tests.

1. **What real-world event is happening?**
   Name the business event, not the table. "Guardian pays fees" not
   "insert into payments". If you cannot name a real event, the feature may not
   belong in v1.1.0.

2. **Who is allowed to perform it?**
   Identify the actor and the required permission. Authorization is always by
   **permission**, never by role name checked inline. Roles only collect
   permissions; permissions enable actions.

3. **What domain entities change?**
   List the aggregates written. Distinguish a command (changes state) from a
   query (reads state).

4. **What must never change?**
   Identify historical records. Payments, exam results, attendance, ledger
   entries, and enrollments are **superseded, never rewritten**. A correction
   creates a new record that references the old one; it does not mutate history.

5. **Which records become historical?**
   Decide what is appended vs. what is current. Promotion creates a new
   Enrollment; it does not move the student. Graduation makes a student
   operationally inactive; it does not delete. Every year becomes immutable
   history.

6. **Which events are emitted?**
   Every important action emits a domain event through the EventOutbox:
   StudentAdmitted, PaymentReceived, RoleSwitched, GuardianLinked,
   ExamPublished, MessageSent, ImportCompleted, and so on. The system is
   event-driven; modules react to events instead of coupling directly.

7. **Who needs to be notified?**
   Determine the communication fan-out (SMS / Email / In-App / WebSocket) and
   treat SMS as one delivery channel of the shared communication engine, gated
   to authorized roles.

8. **What should the UI show immediately?**
   Every user action produces instant feedback: click → loading begins
   instantly → request → progress → success or failure → UI synchronized. The
   user must never wonder whether the click worked.

9. **What should be auditable five years later?**
   If the action touches Students, Finance, Attendance, Assessments,
   Subscriptions, or Permissions, it must be capable of producing an audit log.
   No action occurs anonymously.

10. **What API contract exposes this capability cleanly?**
    Design the endpoint as a business capability (`POST /finance/payments`,
    `POST /students/:id/admit`), not as a table proxy (`POST /payments`). Document
    purpose, business rules, authorization, validation, errors, events, and
    audit per `AGENTS.md` §13.

## 4. Capability, Not CRUD Pages

Do not build "Admin pages." Build pages that require **permissions**.

- The navigation is generated from permissions. If a permission disappears, the
  page disappears from the user's navigation.
- The UI is a **projection** of backend state. The backend owns business rules;
  the frontend displays state and orchestrates interaction. Validation,
  authorization, and business invariants always belong to the backend.
- A screen's existence, its visible actions, and its enabled/disabled state are
  derived from the user's effective permissions in the current school context
  and active role — not hardcoded per role name.

## 5. School Lifecycle as the Backdrop

Every feature sits somewhere in the school lifecycle documented in
`SYSTEM_STORY.md`:

Onboarding → Initial Setup → Migration/Import → Identity Creation → Membership →
Admission → Academic Life → Financial Life → Communication → Daily Operation →
Promotion → Graduation → Audit.

Place the feature on this timeline. Features that assume operational data
(students, classes, fees) before Initial Setup and Migration have completed are
out of order and will be rejected at design review.

## 6. Immutability Rule

Nothing that represents history is edited. Payments, exam results, attendance,
ledger, and enrollments are superseded, not rewritten. Build correction and
reversal as first-class workflows (e.g. payment reversal, result amendment), not
as `UPDATE` statements on historical rows.

## 7. Multi-Tenancy Is Non-Negotiable

Every query, event, websocket, notification, upload, and report must execute
inside exactly one school context. No cross-school leakage is ever acceptable.
School isolation is mandatory and is validated at the auth/school-context layer,
not re-checked ad hoc in services.

## 8. How This Method Relates to the Layering Standard

`AGENTS.md` §5–§6 define the vertical-slice layering (controller / service /
repository / routes / schema / mapper / permissions / events / README). This
method defines **what goes inside that slice**:

- The **service** answers questions 1–3, 5–6, 9 (business rules, history,
  events, audit).
- The **permissions** module answers question 2 (capability gating).
- The **events** module answers question 6 (emission).
- The **schema** answers question 10 (contract + validation).
- The **frontend screen** answers questions 4, 7–8 (projection, feedback,
  notification display) and is rendered from permissions (§4).

## 9. Compliance Check

A feature is "done" (per `AGENTS.md` §19) only when the ten questions are
answered in its documentation and reflected in code:

✓ Documented (this method applied)
✓ API documented
✓ Validation implemented
✓ Authorization implemented (by permission)
✓ Errors handled
✓ Audit considered
✓ Events considered
✓ Tests considered
✓ UI projected from permissions
✓ School isolation preserved
