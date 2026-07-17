<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 16 — Permissions & Role-Based User Experience](#chapter-16-permissions-role-based-user-experience)
- [16.1 UX Philosophy](#161-ux-philosophy)
- [16.2 The Principle of Least Privilege](#162-the-principle-of-least-privilege)
- [16.3 Navigation is Permission-Aware](#163-navigation-is-permission-aware)
- [16.4 Pages Are Not Hidden by CSS](#164-pages-are-not-hidden-by-css)
- [16.5 Dashboard Personalization](#165-dashboard-personalization)
- [16.6 Role-Specific Quick Actions](#166-role-specific-quick-actions)
- [16.7 Module Visibility](#167-module-visibility)
- [16.8 Read-Only Experience](#168-read-only-experience)
- [16.9 Disabled Actions](#169-disabled-actions)
- [16.10 Cross-School Membership](#1610-cross-school-membership)
- [16.11 School Switcher](#1611-school-switcher)
- [16.12 School Context](#1612-school-context)
- [16.13 Role Switching](#1613-role-switching)
- [16.14 Guardian Experience](#1614-guardian-experience)
- [16.15 Student Isolation](#1615-student-isolation)
- [16.16 Messaging Permissions](#1616-messaging-permissions)
- [16.17 Finance Permissions](#1617-finance-permissions)
- [16.18 Academic Permissions](#1618-academic-permissions)
- [16.19 Attendance Permissions](#1619-attendance-permissions)
- [16.20 SMS Permissions](#1620-sms-permissions)
- [16.21 Subscription Permissions](#1621-subscription-permissions)
- [16.22 Audit Visibility](#1622-audit-visibility)
- [16.23 Settings Permissions](#1623-settings-permissions)
- [16.24 Import Permissions](#1624-import-permissions)
- [16.25 Export Permissions](#1625-export-permissions)
- [16.26 Role Assignment UX](#1626-role-assignment-ux)
- [16.27 Permission Feedback](#1627-permission-feedback)
- [16.28 Session Changes](#1628-session-changes)
- [16.29 API Alignment](#1629-api-alignment)
- [16.30 Future Permission Expansion](#1630-future-permission-expansion)
- [16.31 Developer Checklist](#1631-developer-checklist)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 16 — Permissions & Role-Based User Experience

---

> **Purpose**
>
> SchoolPulse is fundamentally a role-driven system. The same application serves principals, deputy principals, bursars, teachers, receptionists, parents/guardians, and platform administrators. Each user must see only what they need, while still feeling like they are using the same product.
>
> This chapter defines how permissions shape the user experience—not just backend authorization.

---

# 16.1 UX Philosophy

Permissions are **not** a security feature exposed to the user.

Permissions should quietly shape the interface.

Users should rarely encounter:

> "Access Denied."

Instead, they should simply see the tools relevant to their responsibilities.

---

# 16.2 The Principle of Least Privilege

Every user starts with the minimum access required.

They gain additional capabilities only through assigned roles.

This aligns directly with:

* `Role`
* `SchoolMembership`
* `SchoolMembershipRole`

from the backend schema.

---

# 16.3 Navigation is Permission-Aware

The sidebar is dynamically generated.

Example:

Principal

```text
Dashboard
Students
Academics
Attendance
Finance
Messaging
Reports
Settings
```

Teacher

```text
Dashboard
My Classes
Attendance
Assessments
Messaging
```

Guardian

```text
Dashboard
My Children
Invoices
Payments
Attendance
Results
Messages
```

The interface should never expose unavailable modules.

---

# 16.4 Pages Are Not Hidden by CSS

Permissions are enforced in three layers:

1. Backend authorization
2. API response filtering
3. Frontend rendering

A hidden button is **not** security.

---

# 16.5 Dashboard Personalization

Every role receives a different dashboard.

Example:

Principal Dashboard

* School statistics
* Revenue
* Attendance
* Academic performance
* Recent activity
* SMS balance
* Subscription status

---

Teacher Dashboard

* Today's classes
* Attendance due
* Pending assessments
* Messages
* Recent announcements

---

Guardian Dashboard

* Outstanding balances
* Attendance alerts
* Exam results
* Messages from school
* Payment history

---

# 16.6 Role-Specific Quick Actions

Quick Actions change with permissions.

Principal

* Admit Student
* Invite Staff
* Generate Invoices
* Purchase SMS Credits

Teacher

* Mark Attendance
* Enter Marks
* View Timetable

Guardian

* Pay Fees
* Message School
* Download Receipt

---

# 16.7 Module Visibility

Modules should support four visibility levels:

* Hidden
* Read Only
* Limited Edit
* Full Management

Example:

Finance

Teacher

Hidden

Bursar

Full Management

Principal

Full Management

Guardian

Read Only (their own invoices)

---

# 16.8 Read-Only Experience

Read-only users should still have a polished interface.

Editable fields become:

Static text

Disabled controls

Read-only tables

The experience should not feel broken.

---

# 16.9 Disabled Actions

If an action is visible but unavailable:

Disable the button.

Provide explanation on hover or tap.

Example:

Publish Results

Unavailable because marks are incomplete.

---

# 16.10 Cross-School Membership

Your schema supports one user belonging to multiple schools.

This is one of SchoolPulse's strongest architectural decisions.

The UX should reflect this.

---

# 16.11 School Switcher

If a user belongs to multiple schools:

Display a persistent school switcher in the header.

Example:

```
Green Valley Academy ▼
```

Selecting another school reloads the application context.

No logout required.

---

# 16.12 School Context

Every screen should clearly indicate:

Current School

Academic Year

Current Term

Example:

```
Green Valley Academy

Academic Year:
2026

Term 2
```

This prevents mistakes.

---

# 16.13 Role Switching

Users with multiple roles inside the same school should **not** manually switch roles.

Instead:

Permissions are merged.

Example:

Teacher

*

Finance Officer

receives capabilities from both.

---

# 16.14 Guardian Experience

Guardians are fundamentally different.

They are external users.

Their navigation should contain only:

Dashboard

Children

Attendance

Assessments

Invoices

Payments

Messages

Profile

Nothing else.

---

# 16.15 Student Isolation

Guardians only see:

Students linked through

`StudentGuardian`

They never browse school-wide data.

---

# 16.16 Messaging Permissions

Messaging permissions vary.

Teacher

↓

Parents of assigned students

Principal

↓

Entire school

Bursar

↓

Fee-related conversations

Platform Admin

↓

No school conversations unless explicitly participating.

---

# 16.17 Finance Permissions

Finance contains highly sensitive information.

Separate permissions include:

View invoices

Create invoices

Edit invoices

Reverse payments

Generate reports

Purchase SMS credits

Manage subscriptions

Never bundle them unnecessarily.

---

# 16.18 Academic Permissions

Separate permissions:

Create exams

Create assessments

Enter marks

Publish marks

Edit published marks

View reports

This prevents accidental academic changes.

---

# 16.19 Attendance Permissions

Permissions include:

Create session

Mark attendance

Edit attendance

Lock attendance

Unlock attendance

View reports

Audit changes

---

# 16.20 SMS Permissions

Your schema includes:

`MessageToken`

This deserves dedicated permissions.

Examples:

Purchase credits

View balance

Send SMS

Bulk SMS

View delivery reports

View expenditure history

Only finance or administration should manage credits.

---

# 16.21 Subscription Permissions

Subscription management belongs to administrators.

Capabilities:

Upgrade plan

Renew subscription

View invoices

Download receipts

Manage payment methods

Activate trial

---

# 16.22 Audit Visibility

Only privileged users may view:

Audit Logs

Financial Audit Logs

Event Processing

System Logs

These screens should never appear for ordinary staff.

---

# 16.23 Settings Permissions

Settings are divided.

School Settings

Principal

Platform Settings

Platform Admin

Personal Settings

Every user

This separation avoids accidental system-wide changes.

---

# 16.24 Import Permissions

Importing affects large datasets.

Permissions should distinguish:

Import Students

Import Staff

Import Fee Structures

Import Assessments

Import Payments

Each can be granted independently.

---

# 16.25 Export Permissions

Likewise:

Export Students

Export Finance

Export Reports

Export Audit Logs

Export Contacts

Large exports should always be logged.

---

# 16.26 Role Assignment UX

Only authorized administrators assign roles.

Interface:

Staff Member

↓

Current Roles

↓

Available Roles

↓

Permission Summary

↓

Save

Avoid editing raw permission lists.

Roles remain the primary abstraction.

---

# 16.27 Permission Feedback

When users attempt restricted actions:

Explain why.

Example:

Only finance administrators can reverse payments.

Contact your administrator if access is required.

Never simply say:

Forbidden.

---

# 16.28 Session Changes

If permissions change while a user is logged in:

Display:

> Your permissions have changed.

> Please refresh your session.

Avoid unexpected interface changes.

---

# 16.29 API Alignment

Frontend permissions should originate from backend authorization.

Never duplicate permission logic manually.

The frontend consumes capabilities exposed by the API.

Backend remains the source of truth.

---

# 16.30 Future Permission Expansion

The permission architecture should support future modules without redesign.

Examples:

Library

Transport

Hostel

Payroll

Inventory

Medical

Discipline

Examinations Council

Each introduces new permissions while preserving the same UX model.

---

# 16.31 Developer Checklist

Before releasing any feature, verify:

* Is navigation permission-aware?
* Are unauthorized modules hidden?
* Are APIs enforcing permissions?
* Are dashboards personalized?
* Does the UI explain restricted actions?
* Are role changes reflected correctly?
* Does multi-school membership work?
* Are SMS and subscription permissions isolated?

If any answer is "No", the feature is incomplete.

---

# Chapter Summary

Permissions are more than backend authorization—they define the user's experience. SchoolPulse adapts itself to every role by exposing only the tools each person needs, while remaining consistent across principals, teachers, bursars, guardians, and platform administrators. This approach aligns directly with the frozen schema, particularly the `SchoolMembership`, `Role`, and `SchoolMembershipRole` models, and lays the groundwork for scalable multi-tenant administration.

---
