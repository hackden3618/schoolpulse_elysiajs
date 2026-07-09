<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 12 — Application State & Data Loading](#chapter-12-application-state-data-loading)
- [12.1 State Philosophy](#121-state-philosophy)
- [12.2 Types of State](#122-types-of-state)
    - [Application State](#application-state)
    - [Server State](#server-state)
    - [Form State](#form-state)
    - [URL State](#url-state)
    - [Session State](#session-state)
- [12.3 Single Source of Truth](#123-single-source-of-truth)
- [12.4 Data Ownership](#124-data-ownership)
- [12.5 Fetch Strategy](#125-fetch-strategy)
- [12.6 Cache Strategy](#126-cache-strategy)
- [12.7 Automatic Refresh](#127-automatic-refresh)
- [12.8 Optimistic Updates](#128-optimistic-updates)
- [12.9 Pagination](#129-pagination)
- [12.10 Infinite Scroll](#1210-infinite-scroll)
- [12.11 Sorting](#1211-sorting)
- [12.12 Filtering](#1212-filtering)
- [12.13 Search](#1213-search)
- [12.14 Background Refresh](#1214-background-refresh)
- [12.15 Concurrent Updates](#1215-concurrent-updates)
- [12.16 Unsaved Changes](#1216-unsaved-changes)
- [12.17 Auto Save](#1217-auto-save)
- [12.18 Retry Strategy](#1218-retry-strategy)
- [12.19 Offline Awareness](#1219-offline-awareness)
- [12.20 Synchronization](#1220-synchronization)
- [12.21 Loading Priority](#1221-loading-priority)
- [12.22 Prefetching](#1222-prefetching)
- [12.23 Background Jobs](#1223-background-jobs)
- [12.24 Long Operations](#1224-long-operations)
- [12.25 Refresh Indicators](#1225-refresh-indicators)
- [12.26 Session Expiration](#1226-session-expiration)
- [12.27 Multi-School Context](#1227-multi-school-context)
- [12.28 Error Boundaries](#1228-error-boundaries)
- [12.29 Memory Management](#1229-memory-management)
- [12.30 Security](#1230-security)
- [12.31 Real-Time Events](#1231-real-time-events)
- [12.32 Event Handling](#1232-event-handling)
- [12.33 Developer Guidelines](#1233-developer-guidelines)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 12 — Application State & Data Loading

---

> **Purpose**
>
> SchoolPulse is a real-time SaaS platform where multiple users may be interacting with the same data simultaneously. Principals, teachers, bursars, guardians, and administrators all expect information to be current, reliable, and responsive.
>
> This chapter defines how the frontend manages application state, communicates with the backend, caches data, handles loading, and recovers from failures.

---

# 12.1 State Philosophy

State should always have a **single source of truth**.

Avoid duplicating business data across multiple components.

The frontend should never become the authoritative source of school information. The backend remains the system of record.

---

# 12.2 Types of State

SchoolPulse separates state into five categories:

### Application State

Global UI information.

Examples:

* Current user
* Selected school
* Current theme
* Sidebar collapsed state
* Notification count

---

### Server State

Data fetched from the backend.

Examples:

* Students
* Classes
* Payments
* Attendance
* Assessments
* Messages

Server state should always be synchronized with the API.

---

### Form State

Temporary values while editing.

Examples:

* Admission form
* Invoice creation
* Student update
* Login form

Form state should not pollute global state.

---

### URL State

Navigation state.

Examples:

Current page

Filters

Sorting

Pagination

Selected student

Deep linking improves usability.

---

### Session State

Temporary state that survives navigation but not logout.

Examples:

Wizard progress

Draft reports

Unsaved filters

Recently opened modules

---

# 12.3 Single Source of Truth

Every piece of information should originate from one location.

Example

Student Name

Source:

Student endpoint

Not:

Student card

Student table

Student report

Student invoice

Every view consumes the same underlying data.

---

# 12.4 Data Ownership

Each module owns its own state.

Examples

Finance

Owns invoices.

Academics

Owns assessments.

Attendance

Owns attendance records.

Messaging

Owns conversations.

Avoid cross-module duplication.

---

# 12.5 Fetch Strategy

Every page follows this lifecycle:

Loading

↓

Data fetched

↓

Rendered

↓

Background refresh

↓

Updated if changed

This provides responsiveness while keeping information current.

---

# 12.6 Cache Strategy

Frequently accessed information should be cached.

Examples:

Current school

Current user

Roles

Permissions

Navigation

Academic year

Active term

Avoid repeatedly requesting unchanged metadata.

---

# 12.7 Automatic Refresh

Critical business data should refresh automatically.

Examples:

Message count

SMS balance

Notifications

Payments

Attendance sessions

Background refresh should never interrupt user interaction.

---

# 12.8 Optimistic Updates

Optimistic updates should be used only where failures are easily reversible.

Suitable examples:

Mark attendance

Send message

Archive notification

Rename class

Not suitable for:

Fee payments

Subscription renewals

Invoice generation

Student admission

Financial operations should only update after backend confirmation.

---

# 12.9 Pagination

Large datasets must never be fully loaded.

Applies to:

Students

Invoices

Payments

Audit logs

Messages

Attendance

Events

Default page size should remain consistent throughout the application.

---

# 12.10 Infinite Scroll

Avoid infinite scrolling in enterprise modules.

Prefer:

Pagination

or

"Load More"

Enterprise users often require predictable navigation.

---

# 12.11 Sorting

Every table should support sorting where meaningful.

Examples:

Student Name

Admission Number

Amount

Date

Balance

Created At

Sort indicators must remain visible.

---

# 12.12 Filtering

Filtering should be instantaneous.

Common filters:

Academic Year

Term

Class

Stream

Status

Gender

Teacher

Role

Date Range

Payment Method

Subscription

Search

Filters should persist during navigation.

---

# 12.13 Search

Search should begin after a small delay.

Avoid requests on every keystroke.

Support:

Partial matches

Admission number

Phone number

Invoice number

School code

Names

Search results should highlight matched text.

---

# 12.14 Background Refresh

While users work:

Data may refresh silently.

Never unexpectedly replace:

Currently edited forms

Selected rows

Cursor position

Expanded panels

Protect ongoing work.

---

# 12.15 Concurrent Updates

Two users may edit the same record.

Example:

Principal edits teacher.

Secretary edits teacher.

System should detect stale data.

Show:

"This record has been updated by another user."

Allow:

Reload

Compare

Overwrite (with permission)

---

# 12.16 Unsaved Changes

Whenever data has changed but not been saved:

Warn users before leaving.

Examples:

Admission forms

Fee structure

Assessment entry

School settings

Prevent accidental data loss.

---

# 12.17 Auto Save

Only appropriate for:

Settings

Draft announcements

Message drafts

Report drafts

Never autosave:

Payments

Invoices

Student admission

Assessment publication

---

# 12.18 Retry Strategy

Temporary network failures should retry automatically.

Retry only safe requests.

Do not automatically retry:

Payments

Publishing results

Deleting records

Financial operations

---

# 12.19 Offline Awareness

If connection drops:

Display persistent banner.

Example:

"No internet connection. Changes may not be saved."

Application should recover automatically once connectivity returns.

---

# 12.20 Synchronization

After successful operations:

Refresh only affected data.

Avoid refreshing the entire application.

Example:

Adding one student should update:

Student list

Dashboard count

Class enrollment

Nothing else.

---

# 12.21 Loading Priority

Load information in this order:

Critical navigation

↓

Current user

↓

Permissions

↓

Primary page data

↓

Secondary widgets

↓

Charts

↓

Reports

Users should see useful content as quickly as possible.

---

# 12.22 Prefetching

Predict likely navigation.

Example:

Viewing student list.

Prefetch:

Student profile.

Fee summary.

Attendance.

Assessment summary.

Navigation feels instantaneous.

---

# 12.23 Background Jobs

Long-running operations should execute asynchronously.

Examples:

Bulk SMS

Report generation

Bulk invoices

Import students

Export data

Show progress.

Never freeze the interface.

---

# 12.24 Long Operations

Operations exceeding five seconds require:

Progress indicator

Estimated completion

Background notification

Cancel option (where safe)

---

# 12.25 Refresh Indicators

Users should know when data was last updated.

Example:

Updated 12 seconds ago

Refreshing...

This increases confidence in system accuracy.

---

# 12.26 Session Expiration

Before logout:

Warn user.

Allow session extension.

Preserve unsaved work where possible.

---

# 12.27 Multi-School Context

A user may belong to multiple schools.

Switching schools should completely replace:

Permissions

Navigation

Dashboard

Notifications

Current academic year

Cached datasets

Never leak information between schools.

---

# 12.28 Error Boundaries

Frontend failures should isolate themselves.

If one widget crashes:

Dashboard continues working.

Entire application should never fail because of one component.

---

# 12.29 Memory Management

Unused data should be released.

Large datasets:

Attendance

Audit logs

Reports

Messages

Should not remain permanently in memory.

---

# 12.30 Security

Sensitive information should never remain cached after:

Logout

School switch

Session expiration

Role removal

Clear all protected state immediately.

---

# 12.31 Real-Time Events

Some backend events should update the UI instantly.

Examples:

New message

SMS balance updated

Payment received

Invoice paid

Student admitted

Attendance locked

Assessment published

These updates should appear without requiring manual refresh.

---

# 12.32 Event Handling

Every real-time event should define:

* Event source
* Affected modules
* State updates
* Notification behavior
* Audit implications

This aligns directly with the `EventOutbox` model in your schema.

---

# 12.33 Developer Guidelines

Developers should ask:

* Is this server state or UI state?
* Can this be cached?
* Can this become stale?
* What happens if another user changes it?
* Does this need optimistic updates?
* Does it survive school switching?

If uncertain, default to server truth.

---

# Chapter Summary

SchoolPulse treats data as a living system rather than static pages. By separating UI state from server state, defining synchronization rules, supporting concurrent edits, and respecting multi-school boundaries, the application remains fast, predictable, and trustworthy even as schools scale.

---
