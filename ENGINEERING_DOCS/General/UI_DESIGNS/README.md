# SchoolPulse UI Designs

This directory captures all Figma-level UI design assets for SchoolPulse v1.1.0.

## Directory Structure

```
UI_DESIGNS/
├── README.md                          (this file)
├── Figma_Design_System/               (shared tokens, components, styling)
│   ├── Colors.md
│   ├── Typography.md
│   ├── Spacing_Grid.md
│   ├── Iconography.md
│   ├── Components.md
│   └── Design_Tokens.fig              (shared Figma component file)
├── Screens/
│   ├── 01_Auth/
│   │   ├── README.md                  (screen specs)
│   │   └── *.fig / *.png / *.svg      (design files)
│   ├── 02_School_Management/
│   ├── 03_User_Management/
│   ├── 04_Student_Management/
│   ├── 05_Academic_Structure/
│   ├── 06_Attendance/
│   ├── 07_Assessments/
│   ├── 08_Finance/
│   ├── 09_Communication/
│   ├── 10_Reporting/
│   ├── 11_Parent_Portal/
│   └── 12_Settings_Admin/
├── Flow_Diagrams/
│   ├── Onboarding_Flow.md
│   ├── Admission_Flow.md
│   ├── Attendance_Marking_Flow.md
│   ├── Fee_Payment_Flow.md
│   ├── Assessment_Publishing_Flow.md
│   └── Parent_Communication_Flow.md
├── Wireframes/
│   ├── Low_Fidelity/
│   └── High_Fidelity/
└── Exports/
    ├── PNG/
    ├── SVG/
    └── PDF/
```

## Design Principles (from Product Doc & Engineering Spec)

- Staff workflows are optimized for repeated daily use.
- Parent portal is simpler than staff dashboard.
- Empty states guide the next operational action.
- Error states are plain, actionable, and non-technical.
- Every page is school-context aware.
- Mobile-responsive for teachers marking attendance in class.
- Primary navigation (Staff): Dashboard, Students, Attendance, Finance, Academics, Communication, Reports, Settings.
- Primary navigation (Parent): Overview, Fees, Attendance, Academics, Messages.

## Naming Convention

```
<ModuleNumber>_<ScreenName>_<Variant>_v<Version>.figma
```

Example: `04_StudentProfile_View_v1.figma`

## Source of Truth

The authoritative screen requirements are derived from:

1. `SchoolPulse_Engineering_Spec_v1.1.0.md` (API surface, domain rules, navigation)
2. `SchoolPulse_SRS_v1.1.0.md` (testable functional requirements & user stories)
3. `SchoolPulse_ProductDocument_v1.1.0.md` (client-facing value prop & workflows)
4. `POSTGRESQL_CODE_TO_BE_COMPLETED.sql` (data shapes visible in forms/tables)