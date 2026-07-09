<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 14 — Empty States, Loading States & Skeleton Experiences](#chapter-14-empty-states-loading-states-skeleton-experiences)
- [14.1 State Philosophy](#141-state-philosophy)
- [14.2 Primary Screen States](#142-primary-screen-states)
    - [Loading](#loading)
    - [Success](#success)
    - [Empty](#empty)
    - [Error](#error)
    - [Updating](#updating)
- [14.3 Loading Principles](#143-loading-principles)
- [14.4 Skeleton Screens](#144-skeleton-screens)
- [14.5 Spinner Usage](#145-spinner-usage)
- [14.6 Initial Dashboard Load](#146-initial-dashboard-load)
- [14.7 Table Loading](#147-table-loading)
- [14.8 Card Loading](#148-card-loading)
- [14.9 Chart Loading](#149-chart-loading)
- [14.10 Form Loading](#1410-form-loading)
- [14.11 Progressive Loading](#1411-progressive-loading)
- [14.12 Empty State Philosophy](#1412-empty-state-philosophy)
- [14.13 Good Empty States](#1413-good-empty-states)
- [14.14 Dashboard Empty State](#1414-dashboard-empty-state)
- [14.15 Student Module](#1415-student-module)
- [14.16 Teacher Module](#1416-teacher-module)
- [14.17 Finance Module](#1417-finance-module)
- [14.18 Attendance Module](#1418-attendance-module)
- [14.19 Assessment Module](#1419-assessment-module)
- [14.20 Messaging Module](#1420-messaging-module)
- [14.21 SMS Basket](#1421-sms-basket)
- [14.22 Search Empty State](#1422-search-empty-state)
- [14.23 Filter Empty State](#1423-filter-empty-state)
- [14.24 Error States](#1424-error-states)
- [14.25 Permission Empty State](#1425-permission-empty-state)
- [14.26 Offline State](#1426-offline-state)
- [14.27 Background Refresh](#1427-background-refresh)
- [14.28 Incremental Loading](#1428-incremental-loading)
- [14.29 Import Progress](#1429-import-progress)
- [14.30 Export Progress](#1430-export-progress)
- [14.31 Long Background Jobs](#1431-long-background-jobs)
- [14.32 Notification Loading](#1432-notification-loading)
- [14.33 Widget Independence](#1433-widget-independence)
- [14.34 Refresh Indicators](#1434-refresh-indicators)
- [14.35 First-Time School Experience](#1435-first-time-school-experience)
- [14.36 Mobile Loading](#1436-mobile-loading)
- [14.37 Accessibility](#1437-accessibility)
- [14.38 Developer Checklist](#1438-developer-checklist)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 14 — Empty States, Loading States & Skeleton Experiences

---

> **Purpose**
>
> A professional application never leaves users staring at blank pages, frozen screens, or unexplained delays. Every possible application state—even when there is no data—must communicate clearly.
>
> This chapter defines how SchoolPulse behaves before data exists, while data is loading, when data cannot be found, and when something fails.

---

# 14.1 State Philosophy

Every screen in SchoolPulse must always be in exactly one visual state:

```text
Loading
↓
Loaded
↓
Empty
↓
Error
↓
Updating
```

The UI must never appear "broken" because no state has been defined.

---

# 14.2 Primary Screen States

Every page must support five core states:

### Loading

Data is being retrieved.

---

### Success

Data loaded successfully.

---

### Empty

No data exists yet.

---

### Error

Data could not be retrieved.

---

### Updating

Existing data is refreshing in the background.

---

# 14.3 Loading Principles

Loading should communicate progress.

Never display:

* Blank white pages
* Frozen interfaces
* Jumping layouts

Users should immediately understand that work is in progress.

---

# 14.4 Skeleton Screens

SchoolPulse uses **skeleton loading** instead of generic spinners whenever page structure is known.

Example:

Student List

Instead of:

```
Loading...
```

Display:

```
□□□□□□□□□□□□□□□□□□□□
□□□□□□□□□□□□□□□□□□□□
□□□□□□□□□□□□□□□□□□□□
□□□□□□□□□□□□□□□□□□□□
```

The layout remains stable while content loads.

---

# 14.5 Spinner Usage

Spinners are reserved for:

* Very small actions
* Unknown loading duration
* Inline operations

Examples:

Saving...

Deleting...

Checking...

Avoid full-page spinners.

---

# 14.6 Initial Dashboard Load

Dashboard loading sequence:

```
Navigation

↓

Header

↓

Quick Statistics

↓

Widgets

↓

Charts

↓

Recent Activity
```

Users perceive faster performance when structure appears immediately.

---

# 14.7 Table Loading

Tables should render:

* Header
* Column widths
* Skeleton rows

Never collapse table dimensions during loading.

---

# 14.8 Card Loading

Cards preserve:

Height

Padding

Spacing

Icon placement

Only content becomes skeleton placeholders.

---

# 14.9 Chart Loading

Charts should initially display:

Chart frame

Axes

Placeholder bars

Placeholder lines

Avoid sudden layout shifts.

---

# 14.10 Form Loading

Forms load:

Labels

Inputs

Buttons

Sections

as skeletons.

Users understand which form is coming before values arrive.

---

# 14.11 Progressive Loading

Large pages load progressively.

Example:

Student Profile

↓

Basic Information

↓

Guardians

↓

Attendance

↓

Finance

↓

Assessments

↓

Messages

Do not block the entire page waiting for every section.

---

# 14.12 Empty State Philosophy

An empty state is **not an error**.

It often means:

"This feature hasn't been used yet."

The interface should encourage the user's next action.

---

# 14.13 Good Empty States

Every empty state includes:

Illustration or icon

Headline

Short explanation

Primary action

Optional secondary action

---

Example:

No Students Yet

Start building your student register by admitting your first learner.

[ Admit Student ]

---

# 14.14 Dashboard Empty State

Brand-new schools should not see empty widgets.

Instead display:

Getting Started Checklist

Examples:

✓ Complete school profile

✓ Add academic year

✓ Create classes

✓ Invite teachers

✓ Admit students

✓ Configure fees

This becomes the onboarding experience.

---

# 14.15 Student Module

Empty state:

No students admitted yet.

Primary:

Admit Student

Secondary:

Import Students

---

# 14.16 Teacher Module

Empty state:

No teachers have been added.

Primary:

Invite Staff

---

# 14.17 Finance Module

No invoices yet.

Primary:

Generate First Invoice

Secondary:

Configure Fee Structure

---

# 14.18 Attendance Module

No attendance sessions today.

Primary:

Start Attendance Session

---

# 14.19 Assessment Module

No assessments created.

Primary:

Create Assessment

---

# 14.20 Messaging Module

No conversations yet.

Primary:

Start Conversation

Secondary:

Send Announcement

---

# 14.21 SMS Basket

Empty state:

No SMS credits available.

Primary:

Purchase SMS Credits

Secondary:

View Pricing

Display:

Current Balance

Estimated messages remaining

Last purchase

---

# 14.22 Search Empty State

Example:

No results found for

"Dennis"

Offer:

Clear filters

Try another search

Create new record

---

# 14.23 Filter Empty State

Example:

No students match the selected filters.

Do not imply data is missing.

Explain that filters removed all results.

---

# 14.24 Error States

Error screens should include:

Headline

Explanation

Retry

Support option

Reference ID

Example:

Unable to load student information.

[Retry]

---

# 14.25 Permission Empty State

Example:

You don't have permission to view financial reports.

Contact your school administrator if you believe this is incorrect.

Avoid generic "Access Denied."

---

# 14.26 Offline State

Persistent banner:

You're currently offline.

Recently loaded information remains available.

Changes requiring the server will resume once you're connected.

---

# 14.27 Background Refresh

Refreshing data should never replace existing content.

Instead show:

Small progress indicator

"Updating…"

Keep current data visible.

---

# 14.28 Incremental Loading

When loading additional records:

Append skeleton rows below existing content.

Never hide previously loaded information.

---

# 14.29 Import Progress

Student Import

Show:

```
Reading Spreadsheet...

██████████░░░░░

923 / 1,240 Students Imported
```

Allow cancellation where safe.

---

# 14.30 Export Progress

Reports

Invoices

Payments

Attendance

Should continue in background.

Notify users once files are ready.

---

# 14.31 Long Background Jobs

Operations exceeding ten seconds become background tasks.

Examples:

Generate report cards

Bulk SMS

Export audit logs

Import assessments

Users should continue working elsewhere.

---

# 14.32 Notification Loading

Notification panel loads independently.

Do not block the rest of the application.

---

# 14.33 Widget Independence

Dashboard widgets fail independently.

Example:

Finance widget unavailable.

Attendance widget continues functioning.

One failure must never collapse the dashboard.

---

# 14.34 Refresh Indicators

Every dataset may display:

Last updated:

2 minutes ago

Refreshing...

This increases trust.

---

# 14.35 First-Time School Experience

A newly onboarded school should never encounter empty confusion.

Instead present a guided setup journey:

1. Verify school profile
2. Activate subscription/trial
3. Configure academic year
4. Create classes
5. Add staff
6. Admit students
7. Configure fee structures
8. Purchase SMS credits (optional)
9. Begin operations

This aligns directly with your `JoinRequest` and onboarding flow.

---

# 14.36 Mobile Loading

Mobile loading should minimize vertical movement.

Skeleton dimensions should closely match final content.

Avoid sudden page jumps.

---

# 14.37 Accessibility

Skeletons should be ignored by screen readers.

Instead announce:

"Loading student records."

Empty states must include meaningful text, not only illustrations.

---

# 14.38 Developer Checklist

Before shipping a screen, verify:

* Does it have a loading state?
* Does it have an updating state?
* Does it have an empty state?
* Does it have an error state?
* Does it support retries?
* Does it avoid layout shifts?
* Does it support background jobs?
* Does it guide first-time users?

If any answer is "No", the screen is incomplete.

---

# Chapter Summary

SchoolPulse treats every application state as part of the user experience. Loading, empty, error, and updating states are designed intentionally so users remain informed and productive regardless of network conditions, system state, or school maturity. This chapter is especially important for onboarding new schools, where guided empty states become part of the product itself.

---
