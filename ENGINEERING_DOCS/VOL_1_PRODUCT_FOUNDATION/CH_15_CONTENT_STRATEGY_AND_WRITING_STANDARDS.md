<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 15 — Content Strategy & Writing Standards](#chapter-15-content-strategy-writing-standards)
- [15.1 Content Philosophy](#151-content-philosophy)
- [15.2 Brand Voice](#152-brand-voice)
- [15.3 Writing Principles](#153-writing-principles)
- [15.4 Button Labels](#154-button-labels)
- [15.5 Menu Labels](#155-menu-labels)
- [15.6 Dialog Titles](#156-dialog-titles)
- [15.7 Success Messages](#157-success-messages)
- [15.8 Error Messages](#158-error-messages)
- [15.9 Empty State Writing](#159-empty-state-writing)
- [15.10 Form Labels](#1510-form-labels)
- [15.11 Placeholder Text](#1511-placeholder-text)
- [15.12 Helper Text](#1512-helper-text)
- [15.13 Dates](#1513-dates)
- [15.14 Time](#1514-time)
- [15.15 Currency](#1515-currency)
- [15.16 Numbers](#1516-numbers)
- [15.17 Student Names](#1517-student-names)
- [15.18 School Names](#1518-school-names)
- [15.19 SMS Writing Standards](#1519-sms-writing-standards)
- [15.20 Email Standards](#1520-email-standards)
- [15.21 Notification Standards](#1521-notification-standards)
- [15.22 Report Titles](#1522-report-titles)
- [15.23 Table Headers](#1523-table-headers)
- [15.24 Status Labels](#1524-status-labels)
- [15.25 Confirmation Dialogs](#1525-confirmation-dialogs)
- [15.26 Destructive Actions](#1526-destructive-actions)
- [15.27 Loading Messages](#1527-loading-messages)
- [15.28 Search](#1528-search)
- [15.29 Accessibility Writing](#1529-accessibility-writing)
- [15.30 Inclusive Language](#1530-inclusive-language)
- [15.31 Tone During Errors](#1531-tone-during-errors)
- [15.32 Consistency with Backend](#1532-consistency-with-backend)
- [15.33 SchoolPulse Terminology Dictionary](#1533-schoolpulse-terminology-dictionary)
- [15.34 Future Localization](#1534-future-localization)
- [15.35 Developer Content Checklist](#1535-developer-content-checklist)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 15 — Content Strategy & Writing Standards

---

> **Purpose**
>
> Every word inside SchoolPulse is part of the product.
>
> Buttons, notifications, forms, dialogs, reports, SMS messages, emails, invoices, and dashboards should all speak with one consistent voice.
>
> This chapter establishes the writing standards that define SchoolPulse's personality and ensure clarity, professionalism, and trust.

---

# 15.1 Content Philosophy

SchoolPulse is software for schools.

It should communicate like a competent school administrator:

* Professional
* Calm
* Helpful
* Respectful
* Direct

The interface should never sound robotic or overly casual.

---

# 15.2 Brand Voice

SchoolPulse should sound:

✓ Confident

✓ Knowledgeable

✓ Respectful

✓ Encouraging

✓ Trustworthy

Avoid sounding:

✗ Playful

✗ Sarcastic

✗ Humorous

✗ Aggressive

✗ Overly technical

Schools trust systems that communicate clearly.

---

# 15.3 Writing Principles

Every piece of interface text should satisfy four questions:

1. Is it clear?
2. Is it concise?
3. Is it actionable?
4. Is it respectful?

If not, rewrite it.

---

# 15.4 Button Labels

Buttons should describe actions.

Good:

* Admit Student
* Save Changes
* Generate Invoice
* Publish Results
* Purchase SMS Credits
* Invite Teacher

Poor:

* Submit
* Continue
* Click Here
* Confirm

Users should know exactly what will happen.

---

# 15.5 Menu Labels

Navigation should use nouns.

Examples:

Dashboard

Students

Classes

Attendance

Assessments

Finance

Messaging

Reports

Settings

Consistency improves navigation.

---

# 15.6 Dialog Titles

Dialogs should describe the decision.

Examples:

Archive Student

Delete Subject

Reverse Payment

Publish Assessment Results

Assign Teacher

Avoid generic titles such as:

Confirmation

Warning

Alert

---

# 15.7 Success Messages

Structure:

Action + Object + Outcome

Examples:

Student admitted successfully.

Attendance saved successfully.

Fee structure updated.

SMS campaign scheduled.

Invoice generated.

Avoid:

Success!

Done.

Completed.

---

# 15.8 Error Messages

Structure:

Problem

↓

Reason

↓

Next step

Example:

Unable to publish assessments because marks are missing for five students.

Review the highlighted records before publishing.

---

# 15.9 Empty State Writing

Structure:

Headline

↓

Explanation

↓

Primary action

Example:

No Attendance Sessions

Attendance sessions have not been created for today.

[ Start Attendance Session ]

---

# 15.10 Form Labels

Labels should be explicit.

Use:

Admission Number

School Phone Number

Guardian Relationship

Academic Year

Avoid abbreviations unless universally understood.

---

# 15.11 Placeholder Text

Placeholders provide examples—not instructions.

Correct:

e.g. ST-2026-001

Incorrect:

Enter admission number here...

---

# 15.12 Helper Text

Use helper text only when users genuinely need guidance.

Example:

School Code

Used when identifying your school during login.

Avoid unnecessary explanations.

---

# 15.13 Dates

Always display dates in a human-readable format.

Preferred:

09 Jul 2026

Avoid:

07/09/26

09/07/26

Different countries interpret these differently.

---

# 15.14 Time

Administrative interfaces use 24-hour time.

Examples:

08:30

13:45

16:10

Reports should follow the same standard.

---

# 15.15 Currency

Always display:

Currency symbol

↓

Amount

↓

Two decimal places

Example:

KES 24,500.00

Never omit the currency.

---

# 15.16 Numbers

Large numbers should include separators.

Examples:

1,500

15,600

1,250,000

Improves readability.

---

# 15.17 Student Names

Display full names whenever space allows.

Format:

First Name

Second Name (if available)

Last Name

Do not reorder names inconsistently.

---

# 15.18 School Names

Always display the official registered school name.

Avoid unnecessary abbreviations.

Example:

Springfield Secondary School

Not:

Springfield Sec.

Unless explicitly configured.

---

# 15.19 SMS Writing Standards

SMS messages must be:

Concise

Professional

Action-oriented

Example:

Springfield Secondary:
Fee payment of KES 5,000 received.
Balance: KES 12,500.
Thank you.

Every SMS consumes credits, so every character matters.

---

# 15.20 Email Standards

Emails should include:

School logo

School name

Subject

Greeting

Body

Action

Contact information

Footer

Maintain a consistent template across all automated emails.

---

# 15.21 Notification Standards

Notifications should begin with the event.

Examples:

Payment received.

Attendance marked.

Results published.

New guardian message.

Avoid unnecessary wording.

---

# 15.22 Report Titles

Reports should be descriptive.

Examples:

Term 2 Fee Collection Report

Student Attendance Summary

Academic Performance Analysis

Audit Log Report

Avoid vague names such as:

Report 1

Summary

---

# 15.23 Table Headers

Headers should be short.

Good:

Student

Class

Balance

Amount

Date

Status

Avoid wrapping text across multiple lines where possible.

---

# 15.24 Status Labels

Statuses must be consistent with backend enums.

Examples:

Student

* Active
* Graduated
* Archived
* Inactive

Invoice

* Draft
* Issued
* Partially Paid
* Paid
* Overdue
* Cancelled

Subscription

* Trial
* Active
* Suspended
* Defaulted

Never invent alternate wording.

---

# 15.25 Confirmation Dialogs

Confirmation should clearly state consequences.

Example:

Archive Student?

The student will no longer appear in active enrollment lists but historical records will be preserved.

[Cancel]

[Archive Student]

---

# 15.26 Destructive Actions

Destructive buttons use explicit wording.

Delete Invoice

Archive Student

Reverse Payment

Terminate Subscription

Avoid generic:

OK

Proceed

Yes

---

# 15.27 Loading Messages

Loading text should explain what is happening.

Examples:

Loading student records...

Generating invoices...

Publishing results...

Importing spreadsheet...

---

# 15.28 Search

Search fields should specify scope.

Examples:

Search students...

Search invoices...

Search messages...

Avoid simply:

Search...

---

# 15.29 Accessibility Writing

Avoid:

Click here

Read more

More

Instead:

Download Invoice

View Attendance Report

Open Student Profile

Screen readers benefit from descriptive actions.

---

# 15.30 Inclusive Language

Avoid assumptions.

Use:

Guardian

instead of

Father/Mother

unless specifically referring to a relationship field.

Similarly:

School Staff

instead of

Teachers

when referring to all employees.

---

# 15.31 Tone During Errors

Remain calm.

Poor:

You entered invalid data.

Better:

Please review the highlighted information before continuing.

Never blame the user.

---

# 15.32 Consistency with Backend

Frontend terminology must match the API.

Example:

If the backend enum is:

`AttendanceSession`

The UI should consistently use:

Attendance Session

Avoid inventing:

Morning Register

unless it refers to a specific feature.

This alignment reduces confusion between developers, documentation, and users.

---

# 15.33 SchoolPulse Terminology Dictionary

The following terms are considered canonical across the entire platform:

| Preferred          | Avoid                                                     |
| ------------------ | --------------------------------------------------------- |
| Student            | Learner (unless configured by school)                     |
| Guardian           | Parent Contact                                            |
| Class              | Grade (unless country-specific configuration)             |
| Attendance Session | Register                                                  |
| Assessment         | Test Record                                               |
| Invoice            | Bill                                                      |
| Payment            | Transaction (except where referring to payment providers) |
| School Membership  | User Assignment                                           |
| SMS Credits        | SMS Units                                                 |

Every future module should use this dictionary.

---

# 15.34 Future Localization

All interface text must be stored in localization resources.

Never hardcode strings inside components.

Prepare for future support of:

* Kiswahili
* French
* Additional regional languages

---

# 15.35 Developer Content Checklist

Before releasing any screen, verify:

* Is the wording consistent with SchoolPulse terminology?
* Does every button describe an action?
* Are errors actionable?
* Are success messages meaningful?
* Are destructive actions explicit?
* Are SMS messages concise?
* Are reports professionally titled?
* Is every term consistent with backend models and enums?

If any answer is "No", revise the content before release.

---

# Chapter Summary

Words are part of the interface. By defining a consistent vocabulary, tone, and structure, SchoolPulse becomes easier to learn, more trustworthy, and more maintainable. This chapter ensures that every screen, notification, SMS, report, and email communicates with the same professional voice while remaining aligned with the backend schema and business terminology.

---
