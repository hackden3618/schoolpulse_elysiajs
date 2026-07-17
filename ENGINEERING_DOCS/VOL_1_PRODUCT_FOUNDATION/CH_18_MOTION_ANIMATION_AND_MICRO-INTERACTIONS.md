<!--toc:start-->
- [SchoolPulse Product Design Specification](#schoolpulse-product-design-specification)
  - [Version 1.1.0](#version-110)
- [VOLUME I — PRODUCT FOUNDATION](#volume-i-product-foundation)
- [Chapter 18 — Motion, Animation & Micro-interactions](#chapter-18-motion-animation-micro-interactions)
- [18.1 Motion Philosophy](#181-motion-philosophy)
- [18.2 Motion Principles](#182-motion-principles)
- [18.3 Animation Categories](#183-animation-categories)
    - [Navigation](#navigation)
    - [Feedback](#feedback)
    - [Attention](#attention)
    - [Progress](#progress)
    - [Context](#context)
- [18.4 Duration Standards](#184-duration-standards)
- [18.5 Easing](#185-easing)
- [18.6 Hover States](#186-hover-states)
- [18.7 Button Interaction](#187-button-interaction)
- [18.8 Sidebar Navigation](#188-sidebar-navigation)
- [18.9 Page Transitions](#189-page-transitions)
- [18.10 Modal Animation](#1810-modal-animation)
- [18.11 Drawer Animation](#1811-drawer-animation)
- [18.12 Dropdowns](#1812-dropdowns)
- [18.13 Toast Notifications](#1813-toast-notifications)
- [18.14 Form Validation](#1814-form-validation)
- [18.15 Success Animation](#1815-success-animation)
- [18.16 Error Animation](#1816-error-animation)
- [18.17 Table Updates](#1817-table-updates)
- [18.18 Sorting](#1818-sorting)
- [18.19 Search Results](#1819-search-results)
- [18.20 Loading Skeletons](#1820-loading-skeletons)
- [18.21 Dashboard Widgets](#1821-dashboard-widgets)
- [18.22 Progress Bars](#1822-progress-bars)
- [18.23 SMS Campaign Progress](#1823-sms-campaign-progress)
- [18.24 Notification Badge](#1824-notification-badge)
- [18.25 Accordion Sections](#1825-accordion-sections)
- [18.26 Charts](#1826-charts)
- [18.27 Mobile Motion](#1827-mobile-motion)
- [18.28 Accessibility](#1828-accessibility)
- [18.29 Focus Transitions](#1829-focus-transitions)
- [18.30 Drag and Drop](#1830-drag-and-drop)
- [18.31 Financial Operations](#1831-financial-operations)
- [18.32 Academic Operations](#1832-academic-operations)
- [18.33 Motion Consistency](#1833-motion-consistency)
- [18.34 AI Frontend Requirements](#1834-ai-frontend-requirements)
- [18.35 Motion Governance](#1835-motion-governance)
- [18.36 Developer Motion Checklist](#1836-developer-motion-checklist)
- [Chapter Summary](#chapter-summary)
<!--toc:end-->

# SchoolPulse Product Design Specification

## Version 1.1.0

---

# VOLUME I — PRODUCT FOUNDATION

# Chapter 18 — Motion, Animation & Micro-interactions

---

> **Purpose**
>
> Motion is communication.
>
> Animation should never exist for decoration alone—it should explain, reinforce, and guide user actions.
>
> SchoolPulse serves administrators, teachers, bursars, and parents who prioritize efficiency over visual effects. Every transition must feel purposeful, subtle, and professional.

---

# 18.1 Motion Philosophy

SchoolPulse animations should make the interface feel:

* Calm
* Stable
* Predictable
* Responsive
* Professional

The product should feel like enterprise software, not a consumer social media application.

---

# 18.2 Motion Principles

Every animation must answer at least one question:

* What changed?
* Where did it go?
* What just happened?
* What should I do next?

If it answers none of these, remove it.

---

# 18.3 Animation Categories

SchoolPulse only uses five categories of motion:

### Navigation

Moving between pages.

---

### Feedback

Showing the result of actions.

---

### Attention

Highlighting important information.

---

### Progress

Communicating ongoing work.

---

### Context

Helping users understand relationships between screens.

No other animation categories should be introduced without review.

---

# 18.4 Duration Standards

| Motion          |   Duration |
| --------------- | ---------: |
| Hover           |     100 ms |
| Button Press    |     120 ms |
| Tooltip         |     150 ms |
| Dropdown        |     180 ms |
| Modal           |     220 ms |
| Drawer          |     250 ms |
| Page Transition | 250–300 ms |
| Toast           |     200 ms |
| Skeleton Fade   |     180 ms |

Animations should complete quickly enough to feel responsive.

---

# 18.5 Easing

Preferred easing:

Ease Out

Objects should start quickly and settle gently.

Avoid:

* Elastic
* Bounce
* Overshoot
* Cartoon motion

---

# 18.6 Hover States

Hover should subtly communicate interactivity.

Allowed changes:

* Background elevation
* Slight shadow increase
* Border emphasis

Avoid scaling elements dramatically.

---

# 18.7 Button Interaction

When pressed:

1. Slight visual compression
2. Immediate ripple or highlight
3. Loading state if required

Users should receive instant feedback.

---

# 18.8 Sidebar Navigation

Selecting a navigation item:

* Active indicator slides smoothly
* Icon color updates
* Text emphasis changes

Avoid dramatic movement.

---

# 18.9 Page Transitions

Page transitions should prioritize continuity.

Sequence:

```text id="9t7e1w"
Old Content

↓

Fade

↓

New Content

↓

Skeleton (if needed)

↓

Loaded Content
```

Avoid full-screen wipes.

---

# 18.10 Modal Animation

Modal appearance:

Fade

↓

Scale from 98% to 100%

↓

Focus first input

Closing reverses this sequence.

---

# 18.11 Drawer Animation

Side drawers:

Slide from edge

↓

Fade overlay

↓

Focus first interactive element

No bouncing.

---

# 18.12 Dropdowns

Dropdowns:

Fade

↓

Expand vertically

↓

Focus first option

Keyboard navigation should remain immediate.

---

# 18.13 Toast Notifications

Toast sequence:

Appear

↓

Remain visible

↓

Fade

↓

Collapse height

Never disappear instantly.

---

# 18.14 Form Validation

Validation should feel helpful.

Example:

Invalid field

↓

Border highlights

↓

Helper message fades in

↓

Focus remains in field

Avoid shaking inputs aggressively.

---

# 18.15 Success Animation

Successful operations receive subtle confirmation.

Examples:

✓ Student admitted

✓ Attendance saved

✓ Payment received

Use a small checkmark animation.

No confetti.

---

# 18.16 Error Animation

Errors should draw attention without alarming users.

Allowed:

* Border emphasis
* Gentle fade
* Small icon appearance

Avoid flashing red screens.

---

# 18.17 Table Updates

When new rows appear:

Fade

↓

Slide upward slightly

↓

Settle

Deleted rows:

Fade

↓

Collapse

This preserves context.

---

# 18.18 Sorting

Table sorting:

Arrow rotates

↓

Rows reorder smoothly

Avoid abrupt jumps.

---

# 18.19 Search Results

Results update progressively.

Existing items:

Fade out

↓

New items:

Fade in

Avoid rebuilding the entire page.

---

# 18.20 Loading Skeletons

Skeletons should shimmer subtly.

Never pulse rapidly.

The animation should suggest activity without distraction.

---

# 18.21 Dashboard Widgets

Widgets appear independently.

Sequence:

Statistics

↓

Cards

↓

Charts

↓

Activity

Avoid displaying everything simultaneously.

---

# 18.22 Progress Bars

Progress should move continuously.

Avoid:

Jumping

Resetting

Moving backwards

Unless a retry occurs.

---

# 18.23 SMS Campaign Progress

Campaign animation:

Queued

↓

Preparing

↓

Sending

↓

Delivered

↓

Completed

Users understand work is continuing.

---

# 18.24 Notification Badge

Unread count:

Increment

↓

Small scale animation

↓

Return to normal

Avoid exaggerated bouncing.

---

# 18.25 Accordion Sections

Expand:

Height grows

↓

Content fades

Collapse:

Content fades

↓

Height contracts

Maintain layout stability.

---

# 18.26 Charts

Charts animate only once after loading.

Subsequent refreshes update values smoothly.

Avoid replaying the entire animation after every refresh.

---

# 18.27 Mobile Motion

Mobile animations should be shorter.

Reduce unnecessary transitions to conserve battery and improve responsiveness.

---

# 18.28 Accessibility

Respect operating system preferences.

If the user enables:

Reduced Motion

SchoolPulse should:

* Remove non-essential animations
* Disable decorative transitions
* Keep functional feedback

Accessibility overrides visual polish.

---

# 18.29 Focus Transitions

Keyboard navigation should visibly move focus.

Never animate focus rings.

They should appear immediately.

---

# 18.30 Drag and Drop

Future modules (Timetable, File Uploads):

Dragging:

Object slightly elevates.

Dropping:

Settles into position.

No exaggerated movement.

---

# 18.31 Financial Operations

Financial actions should prioritize confidence.

Examples:

Payment received

↓

Receipt generated

↓

Balance updated

↓

Toast displayed

Each step confirms progress.

---

# 18.32 Academic Operations

Publishing results:

Button

↓

Loading

↓

Success

↓

Results become visible

↓

Notification

Never instantly replace screens.

---

# 18.33 Motion Consistency

The same interaction must always animate the same way.

Example:

Every modal opens identically.

Every drawer closes identically.

Consistency builds familiarity.

---

# 18.34 AI Frontend Requirements

The implementation agent should:

* Prefer CSS transforms over layout changes.
* Animate `opacity` and `transform` instead of width or height where possible.
* Avoid expensive reflows.
* Use GPU-accelerated transitions.
* Prevent animation conflicts during rapid interactions.

Motion should never reduce performance.

---

# 18.35 Motion Governance

New animations require review if they:

* Exceed 300 ms.
* Affect navigation.
* Introduce new motion patterns.
* Could distract from task completion.

This prevents "animation creep" as the product evolves.

---

# 18.36 Developer Motion Checklist

Before shipping:

* Does every animation communicate something?
* Is the duration appropriate?
* Does it preserve context?
* Is it accessible?
* Does it avoid unnecessary movement?
* Does it maintain performance?
* Does it remain consistent with existing interactions?

If any answer is "No", redesign the interaction.

---

# Chapter Summary

Motion in SchoolPulse is functional, restrained, and purposeful. Every animation reinforces user understanding, communicates progress, or preserves context while respecting accessibility and performance. By establishing a limited and consistent motion language, the product remains professional and efficient across all user roles.

---
