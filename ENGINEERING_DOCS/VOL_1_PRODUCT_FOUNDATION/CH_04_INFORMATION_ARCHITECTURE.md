<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
- [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 4 — Information Architecture](#chapter-4-information-architecture)
- [4.1 What is Information Architecture?](#41-what-is-information-architecture)
- [4.2 SchoolPulse Organizational Philosophy](#42-schoolpulse-organizational-philosophy)
- [4.3 The Three Product Layers](#43-the-three-product-layers)
  - [Layer 1 — Public Website](#layer-1-public-website)
  - [Layer 2 — SchoolPulse Operations Portal](#layer-2-schoolpulse-operations-portal)
  - [Layer 3 — School Portal](#layer-3-school-portal)
- [4.4 School Portal Domain Architecture](#44-school-portal-domain-architecture)
- [4.5 Domain Ownership](#45-domain-ownership)
  - [Dashboard](#dashboard)
  - [Students](#students)
  - [Academics](#academics)
  - [Attendance](#attendance)
  - [Finance](#finance)
  - [Communication](#communication)
  - [Reports](#reports)
  - [Administration](#administration)
- [4.6 The Navigation Pyramid](#46-the-navigation-pyramid)
- [4.7 Maximum Navigation Depth](#47-maximum-navigation-depth)
- [4.8 Record Hierarchy](#48-record-hierarchy)
- [4.9 Relationship Navigation](#49-relationship-navigation)
- [4.10 Cross-Domain References](#410-cross-domain-references)
- [4.11 Global Information](#411-global-information)
- [4.12 Universal Objects](#412-universal-objects)
- [4.13 Search Architecture](#413-search-architecture)
- [4.14 Action Architecture](#414-action-architecture)
  - [Global](#global)
  - [Domain](#domain)
  - [Record](#record)
  - [Field](#field)
- [4.15 Information Ownership Matrix](#415-information-ownership-matrix)
- [4.16 Permission Architecture](#416-permission-architecture)
- [4.17 Future Scalability](#417-future-scalability)
- [4.18 Information Architecture Principles](#418-information-architecture-principles)
- [4.19 Information Architecture Blueprint](#419-information-architecture-blueprint)
<!--toc:end-->

# SchoolPulse Product Design Specification

# Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 4 — Information Architecture

---

> **Purpose**
>
> This chapter defines the structural organization of the entire SchoolPulse product.
>
> Information Architecture (IA) determines **how users mentally navigate the product**, not how pages look.
>
> If Chapter 3 is the constitution,
> then Chapter 4 is the map.

---

# 4.1 What is Information Architecture?

Information Architecture is the deliberate organization of information so users can always answer three questions:

* Where am I?
* What can I do here?
* Where do I go next?

A well-designed architecture allows users to predict where features live before they search for them.

This reduces learning time, decreases errors, and builds confidence.

---

# 4.2 SchoolPulse Organizational Philosophy

SchoolPulse is **domain-driven**.

The navigation is **not** based on database tables.

For example, users should never think:

```text
Students

StudentGuardian

Enrollment

ClassInstance

AssessmentResult
```

Those are backend concepts.

Instead, users think:

```text
Admissions

Academics

Attendance

Finance

Communication

Reports
```

The interface should reflect how schools operate.

---

# 4.3 The Three Product Layers

SchoolPulse consists of three distinct architectural layers.

```text
SchoolPulse Platform

│

├── Public Website

├── Internal Operations Portal

└── School Portal (Tenant)
```

Each layer has a different audience.

---

## Layer 1 — Public Website

Purpose:

Acquire schools.

Users:

* Visitors
* Principals
* School owners

Contains:

* Landing Page
* Features
* Pricing
* Documentation
* Request Demo
* Join Request
* Contact
* Authentication

No school data exists here.

---

## Layer 2 — SchoolPulse Operations Portal

Purpose:

Manage the SaaS platform.

Users:

* SchoolPulse employees

Contains:

* Join Requests
* Verification
* Subscription Management
* SMS Package Management
* School Directory
* Tenant Monitoring
* Support
* Audit
* Platform Analytics

This is **your company dashboard**.

Schools never see it.

---

## Layer 3 — School Portal

Purpose:

Daily school operations.

Users:

* Principals
* Teachers
* Bursars
* Administrators
* Guardians

This becomes the largest application.

---

# 4.4 School Portal Domain Architecture

The School Portal is divided into operational domains.

```text
Dashboard

Students

Academics

Attendance

Finance

Communication

Reports

Administration

Settings
```

Each domain owns a specific business responsibility.

No feature should exist without belonging to a domain.

---

# 4.5 Domain Ownership

## Dashboard

Responsible for:

* Overview
* Today's activities
* Pending tasks
* Quick actions
* KPIs
* Notifications

It never becomes a reporting page.

---

## Students

Responsible for:

* Admissions
* Profiles
* Guardians
* Enrollment
* Promotions
* Transfers
* Archives

Not:

* Attendance analytics
* Fee management
* Messaging history

Those remain linked but owned elsewhere.

---

## Academics

Responsible for:

* Academic Years
* Terms
* Classes
* Streams
* Subjects
* Teachers
* Exams
* Assessments
* Results

---

## Attendance

Responsible for:

* Sessions
* Attendance Recording
* Attendance History
* Attendance Statistics

Only attendance.

---

## Finance

Responsible for:

* Fee Structures
* Invoices
* Payments
* Allocations
* Financial Audit
* Subscription
* SMS Wallet

Everything involving money belongs here.

---

## Communication

Responsible for:

* Inbox
* Conversations
* Announcements
* SMS
* Email
* Templates
* Delivery Reports

Communication should feel like a unified workspace rather than separate messaging tools.

---

## Reports

Responsible for:

* Academic Reports
* Financial Reports
* Attendance Reports
* Student Reports
* Operational Reports

Reports are read-only by design.

---

## Administration

Responsible for:

* Users
* Roles
* Permissions
* School Information
* Audit Logs
* System Configuration

Only administrators should spend significant time here.

---

# 4.6 The Navigation Pyramid

Every screen belongs to one level of hierarchy.

```text
Product

↓

Domain

↓

Module

↓

Page

↓

Record

↓

Detail
```

Example

```text
School Portal

↓

Finance

↓

Invoices

↓

Invoice List

↓

Invoice #INV-2026-00432

↓

Payment Allocation
```

Users should always know where they are.

---

# 4.7 Maximum Navigation Depth

To prevent users from getting lost, navigation depth is limited.

Recommended maximum:

```text
Domain

↓

Module

↓

Page

↓

Record
```

Going deeper should happen through drawers, tabs, or dialogs—not endless pages.

---

# 4.8 Record Hierarchy

Most information follows the same structure.

```text
Collection

↓

Filtered Collection

↓

Individual Record

↓

Supporting Tabs

↓

History
```

Example

```text
Students

↓

Grade 8

↓

Dennis Mwangi

↓

Attendance

↓

Attendance Session
```

This pattern becomes universal.

---

# 4.9 Relationship Navigation

SchoolPulse contains many related entities.

Relationships should always be navigable.

Example

Student Profile

↓

Guardian

↓

Guardian Profile

↓

Messages

↓

Conversation

Instead of forcing users to search again.

---

# 4.10 Cross-Domain References

Some data belongs to multiple domains.

Ownership remains singular.

Example

Student Profile

Shows

Outstanding Balance

Clicking it opens

Finance

Invoices

The Finance domain remains the owner.

The Student module merely references it.

This prevents duplicate functionality.

---

# 4.11 Global Information

Some information is visible everywhere.

Examples:

Current School

Academic Year

Current Term

Notifications

Search

Profile

Help

These belong to the global application shell.

Not individual pages.

---

# 4.12 Universal Objects

Certain objects appear throughout SchoolPulse.

They should always behave identically.

Examples

Student

Teacher

Guardian

Invoice

Payment

Conversation

Assessment

Attendance Session

Regardless of where they're accessed.

---

# 4.13 Search Architecture

Search is global.

Users should never wonder where to search.

One search bar should find:

* Students
* Staff
* Guardians
* Invoices
* Payments
* Subjects
* Conversations

Permissions determine results.

---

# 4.14 Action Architecture

Actions exist at four levels.

## Global

Examples

Search

Notifications

Profile

School Switch

---

## Domain

Examples

Create Student

Generate Invoice

Compose Message

---

## Record

Examples

Edit

Archive

Publish

Assign

---

## Field

Examples

Copy

Preview

Expand

This hierarchy keeps interfaces predictable.

---

# 4.15 Information Ownership Matrix

| Information   | Primary Owner  | Referenced By                                 |
| ------------- | -------------- | --------------------------------------------- |
| Student       | Students       | Attendance, Finance, Academics, Communication |
| Guardian      | Students       | Communication, Finance                        |
| Academic Year | Academics      | Finance, Attendance                           |
| Class         | Academics      | Attendance, Assessments                       |
| Assessment    | Academics      | Reports                                       |
| Attendance    | Attendance     | Student Profile, Reports                      |
| Invoice       | Finance        | Student Profile                               |
| Payment       | Finance        | Student Profile                               |
| Conversation  | Communication  | Student Profile                               |
| User          | Administration | Every module                                  |

Every record has one owner.

---

# 4.16 Permission Architecture

Navigation should respect permissions.

Users should never see pages they cannot access.

Example

Teacher

```text
Dashboard

Academics

Attendance

Communication
```

Bursar

```text
Dashboard

Finance

Communication

Reports
```

Guardian

```text
Dashboard

My Student

Invoices

Messages
```

Principal

```text
Everything
```

The interface adapts to responsibility.

---

# 4.17 Future Scalability

The architecture intentionally reserves space for future domains.

Possible future additions:

```text
Library

Transport

Inventory

Hostel

Human Resources

Procurement

Health

AI Insights
```

These can be introduced without disrupting existing navigation.

---

# 4.18 Information Architecture Principles

SchoolPulse follows these non-negotiable IA principles:

* Organize around business domains.
* Every record has one owner.
* Navigation must preserve context.
* Cross-domain data should be referenced, not duplicated.
* Global tools remain globally accessible.
* Users should predict where information exists.
* Permissions shape navigation automatically.
* Growth should require extension—not redesign.

---

# 4.19 Information Architecture Blueprint

The complete conceptual map of the School Portal is:

```text
School Portal

├── Dashboard
│
├── Students
│   ├── Admissions
│   ├── Student Directory
│   ├── Profiles
│   ├── Guardians
│   ├── Enrollment
│   ├── Transfers
│   └── Archives
│
├── Academics
│   ├── Academic Years
│   ├── Terms
│   ├── Classes
│   ├── Class Instances
│   ├── Subjects
│   ├── Teacher Assignments
│   ├── Exams
│   ├── Assessments
│   └── Results
│
├── Attendance
│   ├── Sessions
│   ├── Records
│   ├── Analytics
│   └── History
│
├── Finance
│   ├── Fee Structures
│   ├── Fee Items
│   ├── Invoices
│   ├── Payments
│   ├── Payment Allocation
│   ├── Subscription
│   ├── SMS Wallet
│   └── Financial Audit
│
├── Communication
│   ├── Inbox
│   ├── Conversations
│   ├── Announcements
│   ├── SMS Center
│   ├── Email
│   ├── Templates
│   └── Delivery Reports
│
├── Reports
│
├── Administration
│   ├── Users
│   ├── Roles
│   ├── Permissions
│   ├── School Profile
│   ├── Audit Logs
│   └── Settings
│
└── Help
```

---
