---

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 5 — Navigation Architecture

---

> **Purpose**
>
> Information Architecture answered **where information belongs**.
>
> Navigation Architecture answers **how users move through the product.**
>
> This chapter defines every navigation behavior in SchoolPulse. No screen may introduce a different navigation style.

---

# 5.1 Navigation Philosophy

Navigation is not decoration.

It is the user's map.

Good navigation should become invisible. Users should spend their time managing students—not figuring out where features are.

SchoolPulse follows four principles:

* Predictable
* Fast
* Context-aware
* Role-based

A user should never feel lost.

---

# 5.2 The Four Navigation Layers

The application consists of four navigation levels.

```
Application Shell

↓

Sidebar Navigation

↓

Page Navigation

↓

Context Navigation
```

Each has a different responsibility.

---

# 5.3 Application Shell

The shell never changes while moving around the application.

It contains:

```
┌──────────────────────────────────────────────┐
│ Header                                       │
├────────────┬─────────────────────────────────┤
│ Sidebar    │                                 │
│            │ Main Content                    │
│            │                                 │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

This gives users a constant sense of location.

---

# 5.4 Header Layout

The header is intentionally minimal.

### Left

* Collapse sidebar
* Breadcrumbs

### Center

* Global Search

### Right

* Notifications
* Quick Actions
* School Switcher
* User Avatar

Nothing else belongs here.

The header should remain fixed while scrolling.

---

# 5.5 Sidebar

The sidebar is the primary navigation.

It contains only domains.

```
Dashboard

Students

Academics

Attendance

Finance

Communication

Reports

Administration
```

No page-level links should appear here.

---

# 5.6 Sidebar Behavior

The sidebar supports two modes.

Expanded

```
📊 Dashboard

🎓 Students

📚 Academics
```

Collapsed

```
📊

🎓

📚
```

Hovering over a collapsed sidebar temporarily expands labels.

User preference is remembered.

---

# 5.7 Active State

Only one domain may be active.

Example

```
Dashboard

▶ Students

Academics

Finance
```

The active domain should have:

* subtle background
* accent indicator
* bold label

No flashing animations.

---

# 5.8 Module Navigation

Selecting a domain reveals its modules.

Example

Students

```
Admissions

Student Directory

Guardians

Archives
```

These appear inside the content area—not inside the sidebar.

This keeps the sidebar stable.

---

# 5.9 Breadcrumbs

Every page shows its position.

Example

```
Students

>

Student Directory

>

Dennis Mwangi
```

Breadcrumbs are not clickable clutter.

Only previous levels are clickable.

The current page is plain text.

---

# 5.10 Global Search

Search is available everywhere.

Capabilities include searching:

* students
* guardians
* staff
* invoices
* payments
* assessments
* conversations
* classes

Results are grouped by category.

Example

```
Students

Dennis Mwangi

Dennis Kiptoo

────────────

Invoices

INV-00124

INV-00511

────────────

Classes

Grade 8 East
```

---

# 5.11 Quick Actions

Frequently used actions should never require navigating away.

Examples

```
+

Admit Student

Generate Invoice

Compose Message

Mark Attendance
```

These adapt according to permissions.

---

# 5.12 School Switcher

Users belonging to multiple schools can change context.

Example

```
Current School

Green Valley Academy

▼
```

Switching schools refreshes the workspace while preserving the user's identity.

---

# 5.13 Notifications

Notifications are grouped.

Examples

Today

Yesterday

Earlier

Each notification indicates:

* icon
* title
* short description
* timestamp
* read state

Unread items remain visually distinct.

---

# 5.14 Page Layout

Every page follows the same structure.

```
Title

Description

Primary Action

Summary Cards

Filters

Main Content
```

No exceptions.

Users should instinctively know where to look.

---

# 5.15 Tabs

Tabs divide related information.

Example

Student Profile

```
Overview

Academics

Attendance

Finance

Communication

History
```

Tabs never navigate to unrelated domains.

---

# 5.16 Drawers

Drawers are used for quick interactions.

Examples

View Student

Quick Edit

Payment Details

Notification Preview

The user remains on the same page.

---

# 5.17 Dialogs

Dialogs interrupt work.

They should only be used for:

* confirmation
* destructive actions
* short forms
* critical warnings

Never place large workflows inside dialogs.

---

# 5.18 Full Pages

Use full pages for:

* Student Profile
* Invoice Details
* Assessment Entry
* Fee Structure Builder
* Reports

Large workflows deserve space.

---

# 5.19 Back Navigation

Users should never lose context.

Example

```
Student Directory

↓

Dennis Mwangi

↓

Attendance

↓

Attendance Record
```

Back returns to the filtered student list—not to page one of the directory.

Filters, sorting, pagination, and search remain intact.

---

# 5.20 Navigation Memory

SchoolPulse remembers:

* collapsed sidebar
* recent searches
* last opened module
* selected academic year
* selected term
* preferred table density
* preferred theme (future)
* recent records

The product should feel familiar every day.

---

# 5.21 Empty Navigation

If a user has no permission for a domain:

It does not appear.

Instead of

```
Finance

🔒
```

Simply hide it.

The UI should never advertise inaccessible functionality.

---

# 5.22 Mobile Navigation

Although SchoolPulse is desktop-first, mobile access is supported.

Desktop

Sidebar

↓

Tablet

Compact Sidebar

↓

Phone

Bottom Navigation

Only the highest-frequency modules appear on phones.

Advanced administration remains desktop-oriented.

---

# 5.23 Navigation Performance

Navigation should feel instant.

Strategies include:

* route prefetching
* optimistic transitions
* skeleton loading
* preserving page state
* background data fetching

The user should never feel like the application "starts over" after each click.

---

# 5.24 Navigation Rules

Every page must satisfy:

✓ User always knows location.

✓ User always knows next action.

✓ User never loses context.

✓ Navigation reflects permissions.

✓ Navigation remains consistent.

✓ Navigation preserves state.

If any rule fails, navigation must be redesigned.

---

# 5.25 Complete Navigation Blueprint

```
Application

│

├── Header
│   ├── Breadcrumbs
│   ├── Global Search
│   ├── Quick Actions
│   ├── Notifications
│   ├── School Switcher
│   └── User Menu
│
├── Sidebar
│   ├── Dashboard
│   ├── Students
│   ├── Academics
│   ├── Attendance
│   ├── Finance
│   ├── Communication
│   ├── Reports
│   └── Administration
│
└── Content
    ├── Page Header
    ├── Module Navigation
    ├── Summary
    ├── Filters
    ├── Content
    └── Supporting Panels
```

This blueprint applies to every screen in SchoolPulse.

---
