---

# Package 01 — Application Shell

## Purpose

The Application Shell is the structural foundation of every authenticated page in SchoolPulse.

It is responsible for:

* Navigation
* Branding
* Global search
* Notifications
* User identity
* School switching
* Theme switching
* Responsive layouts
* Page transitions
* Workspace consistency

Every screen inside SchoolPulse exists inside this shell.

---

# Screen Hierarchy

```
App Shell

├── Sidebar
│   ├── Logo
│   ├── School Selector
│   ├── Navigation
│   ├── Collapse Button
│   └── User Summary
│
├── Top Bar
│   ├── Breadcrumbs
│   ├── Global Search
│   ├── Notifications
│   ├── Theme Toggle
│   ├── Profile Menu
│   └── Quick Actions
│
├── Content Area
│   ├── Page Header
│   ├── Filters
│   ├── Main Content
│   └── Footer
│
└── Global Overlays
    ├── Command Palette
    ├── Toasts
    ├── Dialogs
    ├── Loading Overlay
    └── Error Boundary
```

---

# Desktop Layout

```
+-------------------------------------------------------------+
| Sidebar |                 Top Bar                           |
|         |---------------------------------------------------|
|         |                                                   |
|         |                                                   |
|         |               Content Area                        |
|         |                                                   |
|         |                                                   |
|         |                                                   |
+---------+---------------------------------------------------+
```

Sidebar remains fixed.

Only the content scrolls.

---

# Mobile Layout

```
+--------------------------------------+
| Top Bar                              |
|--------------------------------------|
|                                      |
|              Content                 |
|                                      |
|                                      |
|--------------------------------------|
| Bottom Navigation                    |
+--------------------------------------+
```

The sidebar becomes a slide-out drawer.

Primary navigation becomes bottom tabs.

---

# Sidebar

## Width

Expanded

```
280px
```

Collapsed

```
80px
```

---

## Sections

### Logo

Contains

* SchoolPulse Logo
* Workspace Name

---

### School Selector

Displays

Current School

Clicking opens

```
Schools

St Mary's High

Green Hills Academy

Nakuru Junior

+ Join another school
```

A user belonging to multiple schools switches context here without signing out.

---

### Navigation Groups

Dashboard

Students

Academics

Finance

Communication

Administration

Reports

Settings

Navigation groups are collapsible.

---

### Active Item

Visual treatment

* Left accent border
* Filled background
* Bold label
* Icon highlighted

No animations beyond subtle transitions.

---

### User Summary

Bottom section

Contains

Avatar

Name

Role

Current School

Click opens profile menu.

---

# Top Bar

Height

```
72px
```

Contains

Left

* Breadcrumbs

Center

* Global Search

Right

* Notifications
* Theme Toggle
* Quick Actions
* User Menu

---

# Global Search

Supports searching across:

* Students
* Guardians
* Staff
* Classes
* Payments
* Invoices
* Receipts
* Exams

Results grouped by category.

Keyboard shortcut:

```
Ctrl + K
```

---

# Notifications

Shows unread badge.

Notification categories:

* Payments
* Admissions
* Exams
* Messages
* System
* Subscription
* SMS Wallet

Each notification includes:

* icon
* title
* timestamp
* read state
* action link

---

# Quick Actions

Floating action menu in the top bar.

Default actions:

* Add Student
* Record Payment
* Send Announcement
* Admit Student
* Create Invoice

Restricted by permissions.

---

# Page Header

Every page begins with:

Title

Subtitle

Primary Action

Secondary Action

Example:

```
Students

Manage enrolled learners.

[Import CSV]

[Add Student]
```

---

# Content Container

Maximum width

```
1600px
```

Centered on ultra-wide monitors.

Default padding

```
32px desktop

20px tablet

16px mobile
```

---

# Loading Experience

Instead of spinners:

* Skeleton tables
* Skeleton cards
* Skeleton forms
* Skeleton charts

The layout never shifts while loading.

---

# Empty States

Every module defines:

Illustration

Title

Description

Primary CTA

Example

```
No students yet.

Start by admitting your first learner.

[Add Student]
```

---

# Error States

Friendly.

Never expose stack traces.

Provide:

* explanation
* retry button
* support link (where applicable)

---

# Toast Notifications

Position

Top right.

Types

* Success
* Error
* Warning
* Information

Auto-dismiss after 5 seconds unless action is required.

---

# Command Palette

Shortcut

```
Ctrl + K
```

Allows quick navigation and actions:

* Navigate to pages
* Open student
* Open class
* Record payment
* Search invoices
* Search staff
* Open settings

---

# Theme

Default

Light.

Optional

Dark.

Both follow the Calm Enterprise design system:

* generous whitespace
* restrained color palette
* strong typography
* subtle elevation
* minimal visual noise

---

# Accessibility

* Full keyboard navigation
* Visible focus indicators
* WCAG AA color contrast
* Screen reader labels
* Large clickable targets (≥44×44 px)
* Respect reduced-motion preferences

---

# Responsive Behavior

| Device     | Layout                             |
| ---------- | ---------------------------------- |
| Mobile     | Drawer + Bottom Navigation         |
| Tablet     | Collapsible Sidebar                |
| Desktop    | Persistent Sidebar                 |
| Ultra-wide | Centered content, max width 1600px |

---
