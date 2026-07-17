---

# SchoolPulse Product Design Specification

## Version 1.1.0

# VOLUME I — PRODUCT FOUNDATION

# Chapter 11 — Design Tokens & Visual Language

---

<!--toc:start-->
- [11.1 What are Design Tokens?](#111-what-are-design-tokens)
- [11.2 Token Categories](#112-token-categories)
- [11.3 Color Tokens](#113-color-tokens)
  - [Brand](#brand)
  - [Success](#success)
  - [Warning](#warning)
  - [Danger](#danger)
  - [Information](#information)
- [11.4 Neutral Colors](#114-neutral-colors)
- [11.5 Status Colors](#115-status-colors)
- [11.6 Typography Tokens](#116-typography-tokens)
- [11.7 Font Weights](#117-font-weights)
- [11.8 Spacing Scale](#118-spacing-scale)
- [11.9 Border Radius](#119-border-radius)
- [11.10 Elevation](#1110-elevation)
- [11.11 Borders](#1111-borders)
- [11.12 Icon Sizes](#1112-icon-sizes)
- [11.13 Avatar Sizes](#1113-avatar-sizes)
- [11.14 Input Heights](#1114-input-heights)
- [11.15 Button Heights](#1115-button-heights)
- [11.16 Animation Duration](#1116-animation-duration)
- [11.17 Motion Curves](#1117-motion-curves)
- [11.18 Blur Tokens](#1118-blur-tokens)
- [11.19 Opacity Tokens](#1119-opacity-tokens)
- [11.20 Z-Index Scale](#1120-z-index-scale)
- [11.21 Grid Tokens](#1121-grid-tokens)
- [11.22 Table Tokens](#1122-table-tokens)
- [11.23 Form Tokens](#1123-form-tokens)
- [11.24 Chart Tokens](#1124-chart-tokens)
- [11.25 Notification Tokens](#1125-notification-tokens)
- [11.26 Token Governance](#1126-token-governance)
- [11.27 Dark Theme Tokens](#1127-dark-theme-tokens)
- [11.28 Future Branding](#1128-future-branding)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

> **Purpose**
>
> The Design System defines the principles.
>
> Design Tokens define the implementation.
>
> Every color, spacing value, radius, elevation, transition, and typography scale used throughout SchoolPulse must originate from this chapter.
>
> Developers should never hardcode UI values.

---

# 11.1 What are Design Tokens?

Design Tokens are named values that represent visual decisions.

Instead of:

```css
color: #2563eb;
```

Use

```css
color: var(--color-primary);
```

If branding changes later, only the token changes.

Entire application updates automatically.

---

# 11.2 Token Categories

SchoolPulse tokens are grouped into:

```text
Colors

Typography

Spacing

Sizing

Radius

Elevation

Opacity

Motion

Borders

Z-index
```

No UI element should define values outside these groups.

---

# 11.3 Color Tokens

Never reference raw colors inside components.

Use semantic names.

## Brand

```text
Primary

Primary Hover

Primary Active

Primary Surface
```

---

## Success

```text
Success

Success Surface

Success Border

Success Text
```

---

## Warning

```text
Warning

Warning Surface

Warning Border

Warning Text
```

---

## Danger

```text
Danger

Danger Surface

Danger Border

Danger Text
```

---

## Information

```text
Info

Info Surface

Info Border

Info Text
```

---

# 11.4 Neutral Colors

Instead of Gray100...

Use semantic naming.

```text
Canvas

Surface

Surface Elevated

Border

Divider

Muted Text

Primary Text

Secondary Text
```

Developers should understand purpose immediately.

---

# 11.5 Status Colors

Status colors correspond directly to business logic.

Examples

Student Active

Student Archived

Invoice Paid

Invoice Overdue

Attendance Present

Attendance Late

Attendance Absent

Subscription Active

Subscription Trial

Subscription Suspended

Message Delivered

Message Failed

These mappings remain consistent across every module.

---

# 11.6 Typography Tokens

Instead of font-size values, define roles.

```text
Display Large

Display Medium

Display Small

Heading 1

Heading 2

Heading 3

Heading 4

Body Large

Body

Body Small

Caption

Label

Code
```

Roles survive redesigns.

Pixel values do not.

---

# 11.7 Font Weights

Allowed weights:

```text
Regular

Medium

SemiBold

Bold
```

Avoid excessive variation.

---

# 11.8 Spacing Scale

Every margin and padding originates here.

Example scale

```text
0

4

8

12

16

20

24

32

40

48

64

80
```

No arbitrary spacing.

---

# 11.9 Border Radius

Standard radii:

```text
None

Small

Medium

Large

Extra Large

Pill

Circular
```

Cards, buttons and inputs reuse these values.

---

# 11.10 Elevation

Three elevation levels are sufficient.

```text
Surface

Raised

Floating
```

Avoid deep shadow hierarchies.

Enterprise interfaces benefit from subtle depth.

---

# 11.11 Borders

Border tokens define:

Thickness

Color

Focus outline

Dashed border

Upload border

Never invent borders inside components.

---

# 11.12 Icon Sizes

Only four sizes.

```text
16

20

24

32
```

Consistency improves recognition.

---

# 11.13 Avatar Sizes

Standard sizes.

```text
Small

Medium

Large

Extra Large
```

Student profile pages reuse these.

---

# 11.14 Input Heights

Three sizes.

```text
Compact

Default

Large
```

Do not mix heights within a single form.

---

# 11.15 Button Heights

Standardize to:

Small

Default

Large

Loading state never changes dimensions.

---

# 11.16 Animation Duration

Motion tokens:

Fast

Normal

Slow

Avoid arbitrary durations.

---

# 11.17 Motion Curves

Use consistent easing.

Examples

Ease In

Ease Out

Ease In Out

No experimental animation curves.

---

# 11.18 Blur Tokens

Used sparingly.

Only for:

Dialogs

Overlays

Glass navigation (future)

Avoid decorative blur.

---

# 11.19 Opacity Tokens

Standard levels.

Disabled

Hover

Pressed

Overlay

Avoid random opacity values.

---

# 11.20 Z-Index Scale

Consistent stacking order.

```text
Base

Dropdown

Sticky Header

Drawer

Modal

Toast

Tooltip
```

Never use arbitrary z-index values.

---

# 11.21 Grid Tokens

Layout spacing:

Container width

Content width

Sidebar width

Inspector width

Column gap

Row gap

Future layout changes become straightforward.

---

# 11.22 Table Tokens

Tokens define:

Header height

Row height

Padding

Selection color

Hover color

Border

Sticky shadow

Ensures identical tables across the product.

---

# 11.23 Form Tokens

Shared values:

Input spacing

Validation spacing

Group spacing

Section spacing

Forms feel identical regardless of module.

---

# 11.24 Chart Tokens

Define:

Grid color

Axis color

Label color

Series palette

Hover opacity

Animation duration

Charts remain visually consistent.

---

# 11.25 Notification Tokens

Separate styling for:

Toast

Banner

Modal alert

Inline warning

Different presentation.

Same visual language.

---

# 11.26 Token Governance

New tokens require design approval.

Never duplicate existing tokens.

Every token must have:

Purpose

Usage

Examples

Deprecation strategy

---

# 11.27 Dark Theme Tokens

Dark mode uses the same semantic token names.

Only values change.

Components never detect light or dark directly.

They consume semantic tokens.

---

# 11.28 Future Branding

A future rebrand should require changing only:

* Token values
* Logo
* Brand illustrations

Business UI remains untouched.

This greatly reduces redesign cost.

---

# Chapter Summary

Design Tokens separate **design decisions** from **implementation details**. By ensuring every visual property originates from a governed token set, SchoolPulse gains consistency, scalability, and the flexibility to evolve its branding without rewriting components.

---
