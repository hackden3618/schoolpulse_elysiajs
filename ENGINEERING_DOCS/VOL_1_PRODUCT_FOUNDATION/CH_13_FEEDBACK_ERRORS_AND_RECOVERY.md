<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 13 — Feedback, Errors & Recovery](#chapter-13-feedback-errors-recovery)
- [13.1 Feedback Philosophy](#131-feedback-philosophy)
- [13.2 Types of Feedback](#132-types-of-feedback)
    - [1. Informational](#1-informational)
    - [2. Success](#2-success)
    - [3. Warning](#3-warning)
    - [4. Error](#4-error)
    - [5. Progress](#5-progress)
    - [6. Confirmation](#6-confirmation)
    - [7. System Status](#7-system-status)
- [13.3 Immediate Feedback](#133-immediate-feedback)
- [13.4 Success Messages](#134-success-messages)
- [13.5 Error Messages](#135-error-messages)
- [13.6 Technical Errors](#136-technical-errors)
- [13.7 Validation Errors](#137-validation-errors)
- [13.8 Global Errors](#138-global-errors)
- [13.9 Toast Notifications](#139-toast-notifications)
- [13.10 Banner Notifications](#1310-banner-notifications)
- [13.11 Modal Confirmations](#1311-modal-confirmations)
- [13.12 Undo Support](#1312-undo-support)
- [13.13 Loading Feedback](#1313-loading-feedback)
- [13.14 Progress Bars](#1314-progress-bars)
- [13.15 Retry Actions](#1315-retry-actions)
- [13.16 Partial Failure](#1316-partial-failure)
- [13.17 Network Failure](#1317-network-failure)
- [13.18 Permission Errors](#1318-permission-errors)
- [13.19 Empty Search Results](#1319-empty-search-results)
- [13.20 Bulk Operation Summary](#1320-bulk-operation-summary)
- [13.21 SMS Feedback](#1321-sms-feedback)
- [13.22 Payment Feedback](#1322-payment-feedback)
- [13.23 Assessment Feedback](#1323-assessment-feedback)
- [13.24 Attendance Feedback](#1324-attendance-feedback)
- [13.25 Background Jobs](#1325-background-jobs)
- [13.26 Notification Center](#1326-notification-center)
- [13.27 Logging & Correlation](#1327-logging-correlation)
- [13.28 Recovery Guidance](#1328-recovery-guidance)
- [13.29 Tone of Voice](#1329-tone-of-voice)
- [13.30 Audit Awareness](#1330-audit-awareness)
- [13.31 Accessibility](#1331-accessibility)
- [13.32 Developer Checklist](#1332-developer-checklist)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 13 — Feedback, Errors & Recovery

---

> **Purpose**
>
> Every action a user performs in SchoolPulse must receive immediate, meaningful feedback. Users should never wonder:
>
> * "Did my click work?"
> * "Is it still loading?"
> * "Was the payment saved?"
> * "Why did this fail?"
>
> This chapter defines the communication contract between the system and its users.

---

# 13.1 Feedback Philosophy

Every user action must produce one of four outcomes:

* Acknowledgement
* Progress
* Success
* Failure

Silence is never acceptable.

---

# 13.2 Types of Feedback

SchoolPulse recognizes seven categories of feedback:

### 1. Informational

Example:

> New school year activated.

---

### 2. Success

Example:

> Student admitted successfully.

---

### 3. Warning

Example:

> SMS balance is running low.

---

### 4. Error

Example:

> Payment could not be processed.

---

### 5. Progress

Example:

> Importing students...

---

### 6. Confirmation

Example:

> Are you sure you want to archive this student?

---

### 7. System Status

Example:

> Maintenance begins in 30 minutes.

---

# 13.3 Immediate Feedback

Every click should feel responsive.

Examples:

Button pressed

↓

Loading indicator

↓

Result

Never leave users waiting without acknowledgement.

---

# 13.4 Success Messages

Success messages should:

* Confirm completion
* Mention affected record
* Avoid unnecessary detail

Good:

> Invoice INV-2026-041 generated successfully.

Bad:

> Success.

---

# 13.5 Error Messages

Every error should answer:

What happened?

Why?

What should the user do?

Example

❌ Poor

> Operation failed.

Better

> Student admission number already exists in this school.

Excellent

> Admission number **ST-2031** already exists. Choose another admission number or verify the student record.

---

# 13.6 Technical Errors

Never expose:

SQL

Stack traces

Prisma exceptions

Backend internals

Server paths

Internal IDs

Instead:

> Something went wrong. Please try again or contact your administrator if the problem persists.

Technical details belong only in logs.

---

# 13.7 Validation Errors

Show errors beside the affected field.

Example

Phone Number

❌ Must contain a valid Kenyan phone number.

Do not wait until form submission if validation can occur earlier.

---

# 13.8 Global Errors

Major failures require page-level feedback.

Examples:

Unable to load dashboard.

Unable to connect.

Permission denied.

Avoid scattering identical messages across multiple widgets.

---

# 13.9 Toast Notifications

Toasts are suitable for short-lived confirmations.

Examples:

Student updated.

Role assigned.

Attendance saved.

SMS sent.

Characteristics:

* Auto-dismiss
* Non-blocking
* Actionable where appropriate

---

# 13.10 Banner Notifications

Persistent issues use banners.

Examples:

Subscription expires in 5 days.

SMS credits exhausted.

Academic year inactive.

System maintenance scheduled.

Users dismiss banners only when appropriate.

---

# 13.11 Modal Confirmations

Use confirmation dialogs only for destructive or irreversible actions.

Examples:

Delete school.

Archive student.

Reverse payment.

Publish assessments.

Terminate subscription.

Do not overuse confirmations for routine actions.

---

# 13.12 Undo Support

Where safe, provide undo.

Examples:

Archive conversation.

Dismiss notification.

Remove announcement.

Do **not** allow undo for:

Payments

Invoice publication

Assessment publication

Subscription billing

---

# 13.13 Loading Feedback

Every request longer than 300 milliseconds should show progress.

Examples:

Spinner

Skeleton

Progress bar

Placeholder

Never leave frozen interfaces.

---

# 13.14 Progress Bars

Required for long-running operations.

Examples:

Student import

Bulk SMS

Export reports

Database backup

Invoice generation

Progress should indicate:

Completed

Remaining

Estimated duration (if available)

---

# 13.15 Retry Actions

When appropriate:

Provide Retry.

Example:

Unable to load students.

[Retry]

Avoid forcing full page refreshes.

---

# 13.16 Partial Failure

Bulk operations may partially succeed.

Example:

Imported:

480 students

Failed:

20 students

Provide downloadable error report.

Never discard successful work because of partial failures.

---

# 13.17 Network Failure

When internet disconnects:

Persistent notification:

No internet connection.

Reconnect automatically.

Resume safe operations.

Do not lose drafts unnecessarily.

---

# 13.18 Permission Errors

Instead of:

403 Forbidden

Display:

You do not have permission to publish assessments.

Contact your school administrator if you believe this is an error.

---

# 13.19 Empty Search Results

Example:

No students match "Dennis Mwangi"

Offer:

Clear filters

Create student

Try another search

Empty results should always guide the next action.

---

# 13.20 Bulk Operation Summary

Every bulk action ends with summary.

Example:

Students Imported

Successful: 923

Skipped: 14

Failed: 7

Warnings: 2

Download report

Users need confidence in large operations.

---

# 13.21 SMS Feedback

Because SMS costs money, messaging requires clear feedback.

Example:

SMS Sent

Recipients: 482

Delivered: Processing

Estimated Cost: 482 SMS Credits

Remaining Balance: 3,518 Credits

Failures must identify the affected recipients where possible.

---

# 13.22 Payment Feedback

Financial actions require higher confidence.

Example:

Payment Confirmed

Receipt Number

Transaction Reference

Invoice Updated

Remaining Balance

Never rely solely on a toast.

Payment confirmation should be available in the transaction history.

---

# 13.23 Assessment Feedback

Publishing assessments should summarize:

Classes affected

Students affected

Subjects

Publication time

Notifications queued

This reassures teachers before results become visible to guardians.

---

# 13.24 Attendance Feedback

Attendance saves instantly.

Example:

Attendance saved.

Present: 38

Absent: 2

Late: 1

Session remains editable until locked.

---

# 13.25 Background Jobs

Long-running jobs notify users after completion.

Examples:

Report ready.

Export complete.

Invoices generated.

SMS campaign finished.

Users should not wait on the page.

---

# 13.26 Notification Center

Important events should also appear in the notification center.

Examples:

Payment received.

Guardian message.

Assessment published.

Role assigned.

Notifications become a historical record, not just transient messages.

---

# 13.27 Logging & Correlation

Every significant error should generate a correlation identifier.

Example:

Reference ID: ERR-20260709-8A4F

Users can provide this ID to support staff without exposing technical details.

---

# 13.28 Recovery Guidance

Every recoverable error should suggest the next step.

Examples:

Retry

Reload

Contact administrator

Check SMS balance

Verify internet connection

Request permission

Guidance reduces frustration.

---

# 13.29 Tone of Voice

Messages should be:

Professional

Calm

Direct

Helpful

Avoid blame.

Bad:

> You entered invalid information.

Better:

> Please review the highlighted fields before continuing.

---

# 13.30 Audit Awareness

Actions recorded in audit logs should inform users when appropriate.

Example:

Payment reversed successfully.

This action has been recorded in the financial audit log.

This reinforces accountability without overwhelming users.

---

# 13.31 Accessibility

All feedback must be:

Screen-reader compatible

Keyboard accessible

Color-independent

Understandable without animations

Accessible feedback is essential, not optional.

---

# 13.32 Developer Checklist

Before shipping any interaction, ask:

* Does the user know the action started?
* Do they know it's still running?
* Do they know it finished?
* Do they know what changed?
* Do they know how to recover if it failed?
* Is sensitive information protected?
* Is the feedback accessible?

If any answer is "No", the interaction is incomplete.

---

# Chapter Summary

Feedback is the language through which SchoolPulse communicates with its users. Clear acknowledgements, meaningful success messages, actionable errors, and thoughtful recovery flows ensure that staff can work confidently—even during failures. This chapter establishes consistent feedback behavior across every module, from admissions and attendance to finance and messaging.

---
