---

# PACKAGE_01_APPLICATION_SHELL

## 02_AI_DESIGN_PROMPT.md

---

# SchoolPulse Application Shell

## Master Design Prompt

Design the authenticated application shell for **SchoolPulse v1.1.0**, a modern enterprise SaaS learner management system built specifically for schools in Kenya. The design should feel premium, trustworthy, highly organized, and extremely efficient for users who spend many hours inside the application every day.

The target users include school principals, deputy principals, bursars, accountants, teachers, secretaries, ICT administrators, reception staff, and system administrators. The interface should inspire confidence, reduce cognitive load, and prioritize productivity over visual decoration.

This is not a student portal. It is an enterprise-grade operational platform comparable in polish to Linear, Stripe Dashboard, Notion, GitHub, Vercel, and Arc Browser, while remaining approachable for non-technical school staff.

---

# Design Philosophy

Follow these principles throughout the design:

* Minimal but not empty
* Premium without looking luxurious
* Professional rather than playful
* Calm and trustworthy
* Data-first interface
* Excellent spacing
* Strong visual hierarchy
* Tables are primary workspaces
* Cards only where appropriate
* Typography communicates hierarchy more than color
* Icons support navigation instead of dominating it
* Every action should appear intentional

The interface should feel like software built to run an institution.

---

# Color Language

Primary

Deep academic blue.

Used only for

* Active navigation
* Primary buttons
* Focus states
* Links
* Important highlights

Secondary

Slate gray.

Background

Very light gray rather than pure white.

Cards

Pure white.

Success

Green.

Warning

Amber.

Danger

Red.

Information

Blue.

Avoid colorful dashboards.

The application should feel calm.

---

# Overall Layout

Create a desktop application layout.

Viewport

```
1920 × 1080
```

Structure

```
Sidebar

Top Navigation

Breadcrumbs

Page Header

Main Content

Toast Layer

Modal Layer

Command Palette

Notification Drawer
```

The shell itself should occupy the entire screen.

No floating windows.

No centered dashboard.

---

# Left Sidebar

Permanent navigation.

Desktop Width

```
280px
```

Collapsed

```
84px
```

Rounded corners

No.

The sidebar should extend from top to bottom.

Background

Slightly darker than page background.

Top

SchoolPulse logo.

Current school selector.

Global search shortcut.

---

Navigation groups

Dashboard

School Management

Academic

Students

Attendance

Assessments

Finance

Communication

Reports

Settings

Divider

Help

Documentation

Feedback

Bottom

Current logged-in user.

Avatar.

Role.

Current school.

---

Navigation Style

Active item

Blue background.

Blue indicator bar.

Inactive

Transparent.

Hover

Soft gray.

Icons should be outlined.

Lucide style.

---

Badges

Attendance

Today

Finance

12 overdue

Communication

5 unread

Reports

New

Badges should remain subtle.

---

# Top Navigation

Height

```
72px
```

Contains

Left

Breadcrumbs.

Center

Global Search Bar.

Right

Notifications.

Quick Actions.

Theme Toggle.

Profile.

School Switcher.

Spacing should feel generous.

---

# Global Search

Large centered search field.

Placeholder

```
Search students, invoices, teachers, classes...
```

Shortcut badge

```
Ctrl + K
```

Search icon.

Rounded corners.

Minimal border.

---

# Breadcrumbs

Examples

```
Dashboard
```

```
Students / All Students
```

```
Finance / Invoices
```

```
Students / Dennis Wambugu
```

Small typography.

Muted gray.

Current page bold.

---

# Notification Button

Bell icon.

Unread badge.

Opening panel slides from right.

Notification cards

Avatar.

Title.

Description.

Time.

Priority color.

Actions

Mark Read.

View.

Dismiss.

---

# Quick Actions

Lightning icon.

Dropdown.

Contains

Admit Student

Receive Payment

Mark Attendance

Create Invoice

Compose Announcement

Register Teacher

Generate Report

Should feel like Linear.

---

# School Switcher

One of SchoolPulse's defining features.

Shows

Logo.

School Name.

Subscription Plan.

Current Role.

Dropdown

Search.

Recent schools.

Switch animation.

Instant transition.

---

# User Menu

Avatar.

Name.

Role.

Dropdown

Profile

Preferences

Keyboard Shortcuts

Appearance

Logout

---

# Main Content

Maximum Width

```
1600px
```

Padding

```
32px
```

Centered.

Contains page-specific layouts.

The shell itself never reloads.

---

# Page Header

Contains

Large page title.

Description.

Primary action button.

Secondary actions.

Filters.

Example

```
Students

Manage admissions, enrollment and student records.

+ Admit Student
```

---

# Command Palette

Keyboard

```
Ctrl + K
```

Floating modal.

Dark overlay.

Rounded corners.

Search bar.

Categories

Navigation

Students

Finance

Attendance

Reports

Actions

Recent

Favorites

Should feel similar to Raycast.

---

# Toast Notifications

Bottom right.

Rounded.

Small.

Examples

Student admitted successfully.

Payment received.

Attendance submitted.

Invoice generated.

Undo button where appropriate.

---

# Loading States

Never show blank pages.

Use skeleton loaders.

Navigation should remain interactive.

Sidebar should never disappear.

Tables should use skeleton rows.

Cards should shimmer.

---

# Empty States

Illustration.

Friendly explanation.

Primary CTA.

Example

"No students have been admitted yet."

Button

```
Admit First Student
```

---

# Responsive Behaviour

Desktop

Permanent sidebar.

Tablet

Collapsed sidebar.

Mobile

Drawer navigation.

Top navigation simplified.

Quick actions become floating action button.

---

# Accessibility

Minimum contrast ratio AA.

Keyboard navigable.

Visible focus indicators.

ARIA labels.

Screen reader friendly.

44px minimum touch targets.

---

# Motion

Subtle.

150–250ms.

Fade.

Slide.

Scale.

Never bounce.

No exaggerated animations.

---

# Typography

Primary font

Inter.

Large Titles

700

Section Titles

600

Body

400

Metadata

500

Hierarchy through size rather than color.

---

# Icons

Lucide.

Consistent stroke width.

Never filled icons.

---

# Components Visible

Design the shell using realistic placeholder data.

Sidebar

Top Bar

Notifications

Breadcrumbs

Search

Quick Actions

Profile Menu

School Switcher

Empty Content Area

Toast Notification

Skeleton Loader

Command Palette

Modal

Confirmation Dialog

---

# Do Not Include

Analytics charts.

Student data.

Finance data.

Attendance data.

Specific modules.

Those belong to later packages.

This screen is only the application shell.

---

# Visual Goal

The first impression should make a school administrator think:

> "This looks like software our institution can trust for the next ten years."

The interface should feel timeless rather than trendy.

Prioritize clarity, consistency, and confidence over decoration.

---
