<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 7 — Component Library](#chapter-7-component-library)
- [7.1 Component Philosophy](#71-component-philosophy)
- [7.2 Component Classification](#72-component-classification)
- [7.3 Foundation Components](#73-foundation-components)
- [7.4 Button Component](#74-button-component)
- [7.5 Icon Button](#75-icon-button)
- [7.6 Data Table](#76-data-table)
  - [Standard Table Layout](#standard-table-layout)
- [7.7 Summary Card](#77-summary-card)
- [7.8 Statistic Grid](#78-statistic-grid)
- [7.9 Information Card](#79-information-card)
- [7.10 Profile Header](#710-profile-header)
- [7.11 Search Input](#711-search-input)
- [7.12 Filter Bar](#712-filter-bar)
- [7.13 Status Badge](#713-status-badge)
- [7.14 Chip](#714-chip)
- [7.15 Avatar](#715-avatar)
- [7.16 Avatar Group](#716-avatar-group)
- [7.17 Tabs](#717-tabs)
- [7.18 Accordion](#718-accordion)
- [7.19 Timeline](#719-timeline)
- [7.20 Empty State](#720-empty-state)
- [7.21 Modal](#721-modal)
- [7.22 Drawer](#722-drawer)
- [7.23 Toast Notification](#723-toast-notification)
- [7.24 Alert Banner](#724-alert-banner)
- [7.25 Skeleton Loader](#725-skeleton-loader)
- [7.26 Breadcrumb](#726-breadcrumb)
- [7.27 Command Palette (Future Ready)](#727-command-palette-future-ready)
- [7.28 Pagination](#728-pagination)
- [7.29 Form Components](#729-form-components)
- [7.30 File Upload](#730-file-upload)
- [7.31 Progress Components](#731-progress-components)
- [7.32 Charts](#732-charts)
- [7.33 Calendar](#733-calendar)
- [7.34 Notification Center](#734-notification-center)
- [7.35 SMS Balance Widget](#735-sms-balance-widget)
- [7.36 Invoice Summary Widget](#736-invoice-summary-widget)
- [7.37 Attendance Summary Widget](#737-attendance-summary-widget)
- [7.38 Academic Performance Widget](#738-academic-performance-widget)
- [7.39 Audit Viewer](#739-audit-viewer)
- [7.40 Component Rules](#740-component-rules)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

From here onward, every screen will simply be assembled from components defined here. This chapter is intentionally detailed because it becomes the "lego bricks" for the rest of the product.

---

# SchoolPulse Product Design Specification

## Version 1.1.0

# VOLUME I — PRODUCT FOUNDATION

# Chapter 7 — Component Library

---

> **Purpose**
>
> Every interface in SchoolPulse is built from reusable, standardized components.
>
> No page should invent its own button, table, card, modal, or input style.
>
> Consistency improves usability, development speed, testing, and maintainability.

---

# 7.1 Component Philosophy

A component is a reusable building block with:

* one responsibility
* predictable behavior
* consistent appearance
* documented states
* documented interactions

Every component must be reusable across every module.

---

# 7.2 Component Classification

SchoolPulse components belong to six families.

```text
Foundation

↓

Inputs

↓

Display

↓

Navigation

↓

Feedback

↓

Layouts
```

---

# 7.3 Foundation Components

These are invisible building blocks.

Includes:

* Typography
* Icons
* Colors
* Spacing
* Dividers
* Surface Containers
* Elevation
* Borders

Every visible component depends on these.

---

# 7.4 Button Component

Buttons represent actions.

Variants:

* Primary
* Secondary
* Outline
* Danger
* Ghost
* Icon Button

States:

* Default
* Hover
* Active
* Disabled
* Loading

Rules:

* One primary button per page.
* Never mix multiple primary actions.

Examples:

```
[ Save ]

[ Cancel ]

[ Archive ]
```

---

# 7.5 Icon Button

Used only where universally recognized.

Examples:

* Search
* Refresh
* Close
* More Options
* Download

Always include tooltip text.

---

# 7.6 Data Table

The Data Table is the most important component in SchoolPulse.

Every table supports:

* Search
* Filters
* Sort
* Pagination
* Row selection
* Bulk actions
* Empty state
* Loading state
* Export
* Sticky header

Future-ready:

* Column resize
* Saved views
* Pin columns

---

## Standard Table Layout

```
Toolbar

Search

Filters

Bulk Actions

──────────────

Column Headers

──────────────

Rows

──────────────

Pagination
```

---

# 7.7 Summary Card

Purpose:

Display one KPI.

Contains:

* Icon
* Title
* Primary Value
* Trend
* Optional description

Example:

```
Students

1,254

+14 this month
```

Never exceed one KPI per card.

---

# 7.8 Statistic Grid

A responsive collection of Summary Cards.

Desktop:

4 cards

Tablet:

2 cards

Mobile:

1 card

Used on:

* Dashboard
* Finance
* Attendance
* Reports

---

# 7.9 Information Card

Displays grouped information.

Example:

School Profile

```
School Name

County

Phone

Website

Subscription
```

No actions inside the content.

Actions belong in the header.

---

# 7.10 Profile Header

Reusable across:

* Student
* Staff
* Guardian
* School

Contains:

* Avatar
* Name
* Secondary information
* Status badge
* Quick actions

This component creates identity.

---

# 7.11 Search Input

Global appearance.

Features:

* Search icon
* Clear button
* Keyboard shortcut hint
* Debounced search
* Loading indicator

Behavior is identical everywhere.

---

# 7.12 Filter Bar

Contains:

* Dropdown filters
* Date filters
* Reset button
* Saved views (future)

Always appears above tables.

---

# 7.13 Status Badge

Displays state.

Examples:

Active

Archived

Paid

Draft

Present

Absent

Never clickable.

---

# 7.14 Chip

Represents selections.

Examples:

Grade 7

Term 2

Science

Selectable.

Removable.

Interactive.

---

# 7.15 Avatar

Sizes:

Small

Medium

Large

Supports:

* initials
* uploaded image
* fallback color

---

# 7.16 Avatar Group

Used for:

Teaching staff

Conversation participants

Guardians

Displays overflow count.

---

# 7.17 Tabs

Reusable tabs.

Always horizontal.

Used inside record pages.

Never for application navigation.

---

# 7.18 Accordion

Used for:

Advanced settings

Audit details

Metadata

Long explanations

Collapsed by default.

---

# 7.19 Timeline

Displays chronological events.

Examples:

Admission

Attendance edits

Payments

Audit history

Messages

Each entry contains:

* timestamp
* actor
* description
* optional metadata

---

# 7.20 Empty State

Contains:

Headline

Description

Illustration (optional)

Primary Action

Every module has meaningful empty states.

---

# 7.21 Modal

Used for:

Delete confirmation

Quick edit

Short forms

Warnings

Never for long workflows.

---

# 7.22 Drawer

Slides from the right.

Purpose:

Preview information.

Quick edit.

Avoids navigation interruption.

Ideal for:

Student Preview

Invoice Preview

Message Preview

---

# 7.23 Toast Notification

Temporary feedback.

Types:

Success

Info

Warning

Error

Appears top-right.

Automatically dismisses.

---

# 7.24 Alert Banner

Persistent notification.

Examples:

Subscription expires in 5 days.

SMS balance is low.

Academic year not configured.

Requires user acknowledgement.

---

# 7.25 Skeleton Loader

Every list page supports skeletons.

Never display blank white pages while loading.

Skeletons should resemble final layout.

---

# 7.26 Breadcrumb

Displays navigation path.

Maximum depth:

Four levels.

Last item not clickable.

---

# 7.27 Command Palette (Future Ready)

Keyboard shortcut:

Ctrl + K

Allows searching:

Students

Pages

Actions

Invoices

Payments

Settings

Future enhancement.

Architecture should anticipate it.

---

# 7.28 Pagination

Standard footer.

Contains:

* Rows per page
* Current page
* Total records
* Previous
* Next

Never use infinite scrolling for operational data.

---

# 7.29 Form Components

Standard inputs include:

* Text Input
* Number Input
* Currency Input
* Phone Input
* Email Input
* Password Input
* Search Input
* Select
* Multi-select
* Combobox
* Date Picker
* Date Range
* Checkbox
* Radio
* Switch
* Text Area

No custom field styles.

---

# 7.30 File Upload

Supports:

* drag & drop
* browse
* upload progress
* retry
* validation

Used for:

Student imports

School logos

CSV uploads

Documents

---

# 7.31 Progress Components

Includes:

Progress Bar

Circular Progress

Step Indicator

Upload Progress

Invoice Generation Progress

---

# 7.32 Charts

Charts supplement tables.

Never replace them.

Supported types:

* Line
* Bar
* Area
* Pie (sparingly)
* Donut
* Heatmap (future)

Charts always include downloadable data.

---

# 7.33 Calendar

Used for:

Academic calendar

Exams

Attendance

Events

Responsive.

---

# 7.34 Notification Center

Contains:

Unread

Today

Earlier

Archived

Supports:

Mark all read

Open

Dismiss

---

# 7.35 SMS Balance Widget

Unique to SchoolPulse.

Displays:

Remaining SMS

Expiry

Usage this month

Purchase button

Warning threshold

Appears in:

Finance

Communication

Dashboard

---

# 7.36 Invoice Summary Widget

Displays:

Outstanding

Paid

Overdue

Collection Rate

Finance dashboards.

---

# 7.37 Attendance Summary Widget

Displays:

Present

Absent

Late

Attendance %

---

# 7.38 Academic Performance Widget

Displays:

Average Score

Top Subject

Lowest Subject

Trend

Upcoming Exams

---

# 7.39 Audit Viewer

Displays:

Actor

Action

Previous Value

New Value

Timestamp

Supports JSON expansion.

---

# 7.40 Component Rules

Every component must define:

✓ Purpose

✓ Variants

✓ States

✓ Accessibility

✓ Responsive behavior

✓ Loading state

✓ Empty state

✓ Error state

✓ Keyboard interaction

✓ Reusability

No component enters production without this specification.

---

# Chapter Summary

The Component Library is now the official UI toolkit for SchoolPulse v1.1.0.

Every future screen specification will be composed exclusively from these components. This ensures consistency across modules and allows frontend engineers—or AI agents—to assemble interfaces rapidly without inventing new UI patterns.

---
