---

# SchoolPulse Product Design Specification

## Version 1.1.0

# VOLUME I — PRODUCT FOUNDATION

# Chapter 6 — Design System

---

<!--toc:start-->
- [6.1 Design Philosophy](#61-design-philosophy)
- [6.2 Visual Personality](#62-visual-personality)
- [6.3 Design Keywords](#63-design-keywords)
- [6.4 Layout Philosophy](#64-layout-philosophy)
- [6.5 Grid System](#65-grid-system)
- [6.6 Spacing System](#66-spacing-system)
- [6.7 Border Radius](#67-border-radius)
- [6.8 Shadows](#68-shadows)
- [6.9 Color Philosophy](#69-color-philosophy)
- [6.10 Primary Brand Color](#610-primary-brand-color)
- [6.11 Semantic Colors](#611-semantic-colors)
- [6.12 Neutral Palette](#612-neutral-palette)
- [6.13 Background Hierarchy](#613-background-hierarchy)
- [6.14 Typography Philosophy](#614-typography-philosophy)
- [6.15 Typography Scale](#615-typography-scale)
- [6.16 Font Characteristics](#616-font-characteristics)
- [6.17 Icons](#617-icons)
- [6.18 Illustration Usage](#618-illustration-usage)
- [6.19 Tables](#619-tables)
- [6.20 Cards](#620-cards)
- [6.21 Forms](#621-forms)
- [6.22 Buttons](#622-buttons)
- [6.23 Inputs](#623-inputs)
- [6.24 Badges](#624-badges)
- [6.25 Chips](#625-chips)
- [6.26 Animations](#626-animations)
- [6.27 Loading States](#627-loading-states)
- [6.28 Empty States](#628-empty-states)
- [6.29 Feedback Components](#629-feedback-components)
- [6.30 Component Consistency](#630-component-consistency)
- [6.31 Accessibility Baseline](#631-accessibility-baseline)
- [6.32 Future-Proofing](#632-future-proofing)
- [6.33 Design Tokens](#633-design-tokens)
- [6.34 Design System Principles](#634-design-system-principles)
<!--toc:end-->

> **Purpose**
>
> The Design System is the visual language of SchoolPulse.
>
> It defines the rules governing every color, spacing value, typography scale, elevation level, border radius, icon, animation, and layout.
>
> The objective is not to create a beautiful interface.
>
> The objective is to create a **professional enterprise system that schools trust with their operations.**

---

# 6.1 Design Philosophy

SchoolPulse is **professional software**, not a marketing website.

The visual language should communicate:

* Trust
* Stability
* Accuracy
* Calmness
* Speed
* Professionalism

The interface should disappear behind the user's work.

Users should notice how easy their work becomes—not the interface itself.

---

# 6.2 Visual Personality

SchoolPulse should feel like:

* Microsoft 365 Admin
* Linear
* GitHub
* Stripe Dashboard
* Atlassian

Not like:

* Dribbble concepts
* Crypto dashboards
* Gaming interfaces
* Consumer social media
* NFT websites

The product exists to perform work.

---

# 6.3 Design Keywords

Every screen should satisfy these adjectives:

* Calm
* Structured
* Reliable
* Modern
* Clean
* Efficient
* Professional
* Timeless

If a design cannot be described using those words, it should be redesigned.

---

# 6.4 Layout Philosophy

SchoolPulse uses a **desktop-first enterprise layout**.

Each page consists of:

```text
Header

↓

Page Header

↓

Summary Cards

↓

Toolbar

↓

Primary Workspace

↓

Supporting Panels
```

The content should breathe.

Information density should be high.

Visual clutter should be low.

---

# 6.5 Grid System

Use a **12-column responsive grid**.

Rules:

* Maximum content width for centered layouts
* Consistent gutters
* Consistent margins
* Predictable alignment

Cards, tables, and forms snap to the grid.

Nothing should feel randomly positioned.

---

# 6.6 Spacing System

Use an **8-point spacing system**.

Allowed spacing values:

```text
4
8
12
16
24
32
40
48
64
80
96
```

Never invent arbitrary spacing.

Consistency creates rhythm.

---

# 6.7 Border Radius

Use restrained rounding.

| Component | Radius    |
| --------- | --------- |
| Inputs    | 8px       |
| Buttons   | 8px       |
| Cards     | 12px      |
| Dialogs   | 16px      |
| Avatars   | Circular  |
| Chips     | Full pill |

Avoid excessive rounding.

SchoolPulse is enterprise software.

---

# 6.8 Shadows

Elevation should communicate hierarchy.

Use only four levels.

Level 0

Flat

Level 1

Cards

Level 2

Dropdowns

Level 3

Dialogs

Avoid dramatic floating effects.

---

# 6.9 Color Philosophy

Color communicates meaning.

It should never exist purely for decoration.

Every color must answer:

"What information is this telling the user?"

---

# 6.10 Primary Brand Color

The primary color should communicate trust.

Recommended:

Professional Blue

Used for:

* Primary buttons
* Active navigation
* Links
* Focus states
* Selected elements

Never overuse it.

Too much blue reduces emphasis.

---

# 6.11 Semantic Colors

Every semantic meaning owns one color.

Success

Green

Warning

Amber

Error

Red

Information

Blue

Neutral

Gray

These meanings never change.

---

# 6.12 Neutral Palette

Most of the interface uses neutral colors.

Backgrounds

Panels

Tables

Borders

Typography

Only actions should introduce stronger colors.

---

# 6.13 Background Hierarchy

Four surface levels exist.

Surface 0

Application background

Surface 1

Page background

Surface 2

Cards

Surface 3

Dialogs

This hierarchy creates depth without visual noise.

---

# 6.14 Typography Philosophy

Typography creates hierarchy.

Never rely on color alone.

Hierarchy should be visible even in grayscale.

---

# 6.15 Typography Scale

Use consistent text sizes.

Display

Page titles

Heading

Section titles

Subheading

Card titles

Body

General content

Caption

Metadata

Label

Inputs

Table Header

Tables

No additional text sizes should exist.

---

# 6.16 Font Characteristics

Preferred characteristics:

* Modern
* Highly readable
* Neutral
* Excellent numeric alignment

Numbers are extremely important in finance.

The chosen font should render tables beautifully.

---

# 6.17 Icons

Icons assist recognition.

They never replace text.

Rules:

Always:

Icon + Label

Avoid icon-only buttons except where universally understood.

Examples:

Search

Close

Notifications

Profile

---

# 6.18 Illustration Usage

Illustrations should be rare.

Use them only for:

* Empty states
* Onboarding
* Documentation

Never decorate operational pages.

---

# 6.19 Tables

Tables are first-class citizens.

Most enterprise work happens inside tables.

Every table supports:

* sorting
* filtering
* pagination
* column resizing (future)
* row selection
* bulk actions
* export

Tables should be comfortable for long sessions.

---

# 6.20 Cards

Cards summarize information.

A card should answer one question.

Examples:

Outstanding Balance

Students Present Today

Revenue This Month

Unread Messages

Cards should not become miniature dashboards.

---

# 6.21 Forms

Forms prioritize speed.

Every form follows:

Label

↓

Input

↓

Helper Text

↓

Validation

↓

Completion

Never place labels inside placeholders.

---

# 6.22 Buttons

Only four button priorities exist.

Primary

Major action

Secondary

Supporting action

Outline

Alternative action

Danger

Destructive action

Every screen should have only one primary button.

---

# 6.23 Inputs

Inputs should communicate state clearly.

States:

Default

Focused

Filled

Disabled

Error

Success

Required

The user should instantly recognize each state.

---

# 6.24 Badges

Badges represent status.

Examples:

Active

Paid

Draft

Archived

Published

Pending

Badges should never be clickable.

---

# 6.25 Chips

Chips represent selections.

Examples:

Current Term

Grade 8

Science

Boarding

Chips are interactive.

Badges are informational.

---

# 6.26 Animations

Animation exists only to improve understanding.

Allowed:

Fade

Slide

Expand

Collapse

Progress

Skeleton loading

Avoid:

Bounce

Spin for decoration

Elastic effects

Parallax

Large motion

Motion should reduce cognitive effort.

---

# 6.27 Loading States

Never display blank screens.

Preferred:

Skeleton loaders

Progress indicators

Incremental loading

The interface should feel alive.

---

# 6.28 Empty States

Every empty state contains:

Illustration (optional)

Headline

Explanation

Primary action

Example:

"No assessments have been created yet."

Create Assessment

---

# 6.29 Feedback Components

Standard feedback includes:

Success

Information

Warning

Error

Processing

Queued

These appear consistently throughout the application.

---

# 6.30 Component Consistency

Every component should behave identically regardless of module.

Example:

A search input inside Finance must behave exactly like one inside Students.

Muscle memory increases productivity.

---

# 6.31 Accessibility Baseline

Every component must support:

* keyboard navigation
* visible focus
* readable contrast
* screen reader labels
* scalable typography

Accessibility is part of quality—not an optional enhancement.

---

# 6.32 Future-Proofing

The Design System must support:

* dark mode
* high-contrast mode
* custom branding (future enterprise feature)
* additional languages
* right-to-left layouts (future)

Without redesigning components.

---

# 6.33 Design Tokens

Every visual decision should originate from tokens—not hard-coded values.

Examples:

```text
Primary Color
Primary Hover
Surface Background
Surface Border
Text Primary
Text Secondary
Spacing Large
Radius Medium
Elevation Level 2
Animation Fast
```

The implementation should reference tokens throughout the codebase.

---

# 6.34 Design System Principles

Before approving any interface:

✓ Consistent spacing

✓ Consistent typography

✓ Clear hierarchy

✓ Purposeful color

✓ Predictable interaction

✓ Professional appearance

✓ Minimal visual noise

✓ Accessible

If any requirement fails, the design is incomplete.

---
