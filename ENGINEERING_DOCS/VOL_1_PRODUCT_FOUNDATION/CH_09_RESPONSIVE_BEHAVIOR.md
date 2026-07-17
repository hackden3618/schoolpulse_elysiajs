<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 9 — Responsive & Adaptive Design](#chapter-9-responsive-adaptive-design)
- [9.1 Device Strategy](#91-device-strategy)
- [9.2 Supported Screen Sizes](#92-supported-screen-sizes)
    - [Large Desktop](#large-desktop)
    - [Desktop](#desktop)
    - [Laptop](#laptop)
    - [Tablet](#tablet)
    - [Mobile](#mobile)
- [9.3 Breakpoints](#93-breakpoints)
- [9.4 Layout Adaptation](#94-layout-adaptation)
- [9.5 Navigation Adaptation](#95-navigation-adaptation)
  - [Desktop](#desktop-1)
  - [Tablet](#tablet-1)
  - [Mobile](#mobile-1)
- [9.6 Header Adaptation](#96-header-adaptation)
- [9.7 Table Adaptation](#97-table-adaptation)
- [9.8 Dashboard Adaptation](#98-dashboard-adaptation)
- [9.9 Form Adaptation](#99-form-adaptation)
- [9.10 Modal Adaptation](#910-modal-adaptation)
- [9.11 Drawer Adaptation](#911-drawer-adaptation)
- [9.12 Multi-Step Wizards](#912-multi-step-wizards)
- [9.13 Cards](#913-cards)
- [9.14 Charts](#914-charts)
- [9.15 Filters](#915-filters)
- [9.16 Search](#916-search)
- [9.17 Pagination](#917-pagination)
- [9.18 Profile Pages](#918-profile-pages)
- [9.19 Dashboard Density](#919-dashboard-density)
- [9.20 Touch Targets](#920-touch-targets)
- [9.21 Typography Scaling](#921-typography-scaling)
- [9.22 Images](#922-images)
- [9.23 Empty States](#923-empty-states)
- [9.24 Notifications](#924-notifications)
- [9.25 Messaging](#925-messaging)
- [9.26 Finance Screens](#926-finance-screens)
- [9.27 Attendance](#927-attendance)
- [9.28 Assessment Entry](#928-assessment-entry)
- [9.29 Parent Experience](#929-parent-experience)
- [9.30 Administrator Experience](#930-administrator-experience)
- [9.31 Teacher Experience](#931-teacher-experience)
- [9.32 Principal Experience](#932-principal-experience)
- [9.33 Bursar Experience](#933-bursar-experience)
- [9.34 Universal Responsive Rules](#934-universal-responsive-rules)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 9 — Responsive & Adaptive Design

---

> **Purpose**
>
> SchoolPulse is primarily an enterprise desktop application, but it must remain fully usable on laptops, tablets, and phones.
>
> Responsive design is not simply shrinking components—it is adapting workflows while preserving functionality.

---

# 9.1 Device Strategy

SchoolPulse follows a **Desktop-First** design strategy.

Priority order:

```text
Desktop

↓

Laptop

↓

Tablet

↓

Mobile
```

Reason:

Most daily users (principals, bursars, administrators, secretaries, ICT officers) work on desktop or laptop computers.

Teachers may use tablets.

Parents primarily use phones.

---

# 9.2 Supported Screen Sizes

### Large Desktop

1920px+

Target users:

* School administrators
* Finance office
* System administrators

Supports:

* Multi-column layouts
* Large tables
* Analytics dashboards

---

### Desktop

1440–1919px

Primary design target.

Everything is optimized here first.

---

### Laptop

1024–1439px

Minor layout adjustments only.

Sidebar remains expanded by default but collapsible on command.

---

### Tablet

768–1023px

Sidebar collapses automatically.

Cards stack into two columns.

Large tables gain horizontal scrolling.

---

### Mobile

320–767px

Navigation changes significantly.

Cards become single-column.

Tables convert to list layouts where practical.

Large workflows become step-based.

---

# 9.3 Breakpoints

```text
Mobile

0–767

Tablet

768–1023

Laptop

1024–1439

Desktop

1440–1919

Large Desktop

1920+
```

These breakpoints are used consistently throughout the application.

---

# 9.4 Layout Adaptation

Desktop:

```text
Sidebar

Main Content

Inspector Panel (optional)
```

Tablet:

```text
Collapsed Sidebar

↓

Main Content
```

Mobile:

```text
Top Navigation

↓

Scrollable Content

↓

Bottom Navigation
```

---

# 9.5 Navigation Adaptation

## Desktop

Permanent sidebar.

---

## Tablet

Collapsible sidebar.

Hidden by default.

---

## Mobile

Bottom navigation.

Contains only major destinations.

Example:

Dashboard

Students

Finance

Messages

More

---

# 9.6 Header Adaptation

Desktop:

Logo

Breadcrumb

Search

Notifications

School Selector

Profile

---

Tablet:

Logo

Search

Notifications

Profile

---

Mobile:

Menu

Page Title

Notifications

Profile

---

# 9.7 Table Adaptation

Large operational tables cannot simply shrink.

Desktop:

Traditional table.

Tablet:

Horizontal scrolling.

Pinned first column.

Mobile:

Cards replacing rows.

Example:

```text
Student

Admission Number

Balance

Status

Actions
```

---

# 9.8 Dashboard Adaptation

Desktop:

Four KPI cards per row.

Tablet:

Two per row.

Mobile:

One per row.

Charts move below KPI cards.

---

# 9.9 Form Adaptation

Desktop:

Two-column forms.

Tablet:

Mostly single-column.

Mobile:

Single-column only.

Labels remain above fields.

---

# 9.10 Modal Adaptation

Desktop:

Centered modal.

Tablet:

Large modal.

Mobile:

Full-screen sheet.

Never tiny floating dialogs.

---

# 9.11 Drawer Adaptation

Desktop:

Right-side drawer.

Tablet:

Full-height drawer.

Mobile:

Full-screen page.

---

# 9.12 Multi-Step Wizards

Desktop:

Horizontal progress indicator.

Tablet:

Horizontal simplified indicator.

Mobile:

Vertical step indicator.

Navigation buttons remain fixed at the bottom.

---

# 9.13 Cards

Desktop:

Equal heights.

Tablet:

Adaptive height.

Mobile:

Natural content height.

---

# 9.14 Charts

Desktop:

Wide charts.

Tablet:

Reduced padding.

Mobile:

Stack vertically.

Legends move below charts.

---

# 9.15 Filters

Desktop:

Inline filter bar.

Tablet:

Wrapped rows.

Mobile:

"Filter" button opening a bottom sheet.

---

# 9.16 Search

Desktop:

Persistent search bar.

Tablet:

Compact search.

Mobile:

Expandable search overlay.

---

# 9.17 Pagination

Desktop:

Full pagination.

Tablet:

Compact controls.

Mobile:

Previous

Current Page

Next

---

# 9.18 Profile Pages

Desktop:

```text
Profile Header

↓

Tabs

↓

Two-column information
```

Tablet:

Single-column content.

Mobile:

Stacked sections.

---

# 9.19 Dashboard Density

Desktop emphasizes information density.

Mobile emphasizes clarity.

Never force desktop density onto phones.

---

# 9.20 Touch Targets

Minimum touch size:

44 × 44 px.

Spacing between controls:

Minimum 8 px.

Interactive elements must never overlap.

---

# 9.21 Typography Scaling

Desktop:

Largest information density.

Tablet:

Slight reduction.

Mobile:

Readable without zooming.

Never reduce below accessible sizes.

---

# 9.22 Images

School logos:

Scale proportionally.

Student photos:

Maintain square aspect ratio.

Charts:

Resize without distortion.

---

# 9.23 Empty States

Illustrations reduce in size on mobile.

Text remains identical.

Primary action remains visible without scrolling.

---

# 9.24 Notifications

Desktop:

Dropdown panel.

Tablet:

Drawer.

Mobile:

Dedicated notifications page.

---

# 9.25 Messaging

Desktop:

Conversation list

Conversation

Details

Tablet:

Conversation list

Conversation

Mobile:

Conversation list

↓

Conversation page

---

# 9.26 Finance Screens

Desktop:

Summary

Charts

Tables

Inspector

Tablet:

Summary

Charts

Tables

Mobile:

Summary

Cards

Actions

---

# 9.27 Attendance

Desktop:

Entire class visible.

Tablet:

Scrollable grid.

Mobile:

Vertical attendance list.

Each student occupies one card.

---

# 9.28 Assessment Entry

Desktop:

Spreadsheet-style entry.

Tablet:

Condensed spreadsheet.

Mobile:

One student at a time.

Optimized for touch input.

---

# 9.29 Parent Experience

Parents primarily use mobile.

Parent interfaces should feel lighter than staff interfaces.

Focus:

* Fees
* Results
* Attendance
* Messages
* School announcements

Avoid exposing administrative complexity.

---

# 9.30 Administrator Experience

Administrators primarily use desktop.

Interfaces prioritize:

* Data density
* Fast navigation
* Bulk actions
* Reporting
* Monitoring

---

# 9.31 Teacher Experience

Teachers alternate between:

Desktop

Tablet

Phone

Attendance and assessments must remain efficient across all devices.

---

# 9.32 Principal Experience

Principals consume information more than they create it.

Dashboard optimization:

* KPIs
* Charts
* Alerts
* Approvals
* Communication

Less emphasis on large forms.

---

# 9.33 Bursar Experience

Finance pages remain desktop-first.

Invoice management benefits greatly from larger displays.

Mobile support is secondary.

---

# 9.34 Universal Responsive Rules

Responsive adaptation must never:

* Hide critical functionality
* Change business logic
* Remove permissions
* Produce inconsistent workflows

Only the presentation changes.

---

# Chapter Summary

SchoolPulse is optimized for the environments in which it will actually be used. Administrative work is desktop-centric, classroom activities adapt well to tablets, and parent interactions are mobile-first. Every workflow remains functionally identical regardless of device, while layouts and navigation adjust to fit available space.

---
