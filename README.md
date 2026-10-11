# Service Day Dashboard — Corporate Volunteer Management Platform

[![Angular](https://img.shields.io/badge/Angular-21.2.0-DD0031.svg?style=flat&logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-180%20Passed-41B883.svg?style=flat&logo=vitest)](https://vitest.dev/)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg?style=flat)](https://github.com/)

A modern, responsive, and accessible Angular enterprise web application built for **Corporate Social Responsibility (CSR) and Employee Volunteer Operations**. Designed following the **Warm Editorial** design system (Executive Slate `#202C3B`, Forest `#356859`, Ochre `#C9A66B`, and Sand `#F5F2EB`).

---

## 1. System Requirements & Prerequisites

| Requirement | Recommended Version | Minimum Version | Notes |
|---|---|---|---|
| **Node.js** | `v20.x` or `v24.x` (Tested on `v24.12.0`) | `v18.19.0+` | LTS release recommended |
| **npm** | `v10.x` or `v11.x` (Tested on `11.6.2`) | `v9.0.0+` | Bundled with Node.js |
| **Angular CLI** | `@angular/cli@21.2.25` | `^21.0.0` | Global install optional (`npx ng` works) |
| **Browser** | Chrome, Edge, Safari, Firefox | Evergreen | Supports CSS Grid, Flexbox, & modern JS |

---

## 2. Quick Start & Execution Commands

### 2.1 Installation
Clone the repository and install dependencies:
```bash
# Navigate to project directory
cd service-day-dashboard

# Install exact dependencies
npm install
```

### 2.2 Local Development Server
Start the Angular dev server with live-reloading:
```bash
npm start
# or
ng serve
```
Once initialized, navigate to **`http://localhost:4200/`** in your browser. The application automatically redirects unauthenticated traffic to the secure `/login` portal.

### 2.3 Running Automated Unit & Integration Tests
Execute the full test suite via Vitest:
```bash
# Single-run test execution (180 tests across 24 test suites)
npm test -- --watch=false

# Interactive watch mode during development
npm test
```

### 2.4 Production Compilation & Build
Compile optimized production bundles:
```bash
npm run build
```
Compiled output is saved to `dist/service-day-dashboard/`. Chunk budgets and bundle sizes are strictly validated.

---

## 3. Demo Credentials & Access Governance

The platform features role-based access control (RBAC) supporting **Administrator** and **Employee** roles without arbitrary client-side role selectors. Roles are strictly resolved from authenticated corporate profiles.

> **Password Note:** For evaluation purposes, any non-empty password (e.g., `demo123`) is accepted when submitting a valid corporate email.

| Role | Corporate Email | Demo Shortcut Alias | Suggested Password | Default Landing | Primary Capabilities |
|---|---|---|---|---|---|
| **Administrator** | `marcus.vance@corp.example.com` | `admin@serviceday.demo` | `demo123` | `/admin` | Activity CRUD, Capacity Governance, Reminder Rules, Broadcasts, Venue QR Generation |
| **Employee** | `alice.chen@corp.example.com` | `employee@serviceday.demo` | `demo123` | `/employee` | Catalog Discovery, Slot Booking, Registrations, Activity Transfer, In-App Inbox, On-Site QR Check-In |
| **Employee** | `budi.santoso@corp.example.com` | &mdash; | `demo123` | `/employee` | Financial Dept Volunteer |
| **Employee** | `citra.dewi@corp.example.com` | &mdash; | `demo123` | `/employee` | Product Team Volunteer |
| **Employee** | `david.kim@corp.example.com` | &mdash; | `demo123` | `/employee` | HR Team Volunteer |

> For complete authentication rules, return URL behaviors, and guard mechanics, refer to [`docs/DEMO_CREDENTIALS.md`](docs/DEMO_CREDENTIALS.md).

---

## 4. Architectural Structure & Module Organization

The codebase follows the strict Angular **Core / Shared / Feature** architectural pattern adhering to Model-View-Component (MVC) separation:

```text
service-day-dashboard/
├── docs/                                 # Architecture and QA documentation
│   ├── DATA_LAYER_DOCUMENTATION.md       # Data store, hydration & entity relationships
│   ├── DEMO_CREDENTIALS.md               # User roles, test accounts & security notes
│   └── MANUAL_QA_CHECKLIST.md            # 16-scenario comprehensive test verification plan
├── public/
│   └── assets/data/                      # JSON Mock seed data files (served at /assets/data/*)
│       ├── activities.json               # CSR initiatives with logistics, capacities & cutoffs
│       ├── attendance.json               # Attendance check-in event logs
│       ├── ngos.json                     # Partner NGO organizations
│       ├── notifications.json            # In-app alert notices & broadcast messages
│       ├── registrations.json            # Employee event bookings
│       └── users.json                    # Corporate user directory with roles
└── src/
    ├── app/
    │   ├── core/                         # Singleton services, guards, and interceptors
    │   │   ├── guards/                   # AuthGuard, RoleGuard, LoginGuard, RootRedirectGuard
    │   │   ├── services/                 # AuthService, DataStoreService, MockDataService, StorageService
    │   │   └── core.module.ts            # Root-level provider module
    │   ├── models/                       # Strongly-typed domain TypeScript interfaces & enums
    │   │   ├── activity.model.ts         # Activity, ServiceType, PublicationStatus, SlotSummary
    │   │   ├── attendance.model.ts       # Attendance, VerificationMethod
    │   │   ├── ngo.model.ts              # NGO partner entity
    │   │   ├── notification.model.ts     # In-app notification entity
    │   │   ├── registration.model.ts     # Registration, RegistrationStatus
    │   │   └── user.model.ts             # User, UserRole, UserSession
    │   ├── shared/                       # Reusable UI components, pipes, directives
    │   │   └── shared.module.ts          # CommonModule, FormsModule, ReactiveFormsModule exports
    │   ├── features/                     # Feature domain business modules
    │   │   ├── admin/                    # Administrator Operations Feature (Lazy-Loaded)
    │   │   │   ├── pages/
    │   │   │   │   ├── admin-dashboard/  # Executive KPI summaries & quick actions
    │   │   │   │   ├── activity-management/ # Activity CRUD & capacity management
    │   │   │   │   ├── admin-reminders/  # 7/3/1 day reminder simulation & broadcast composer
    │   │   │   │   └── admin-qr/         # Printable logistics QR poster generation
    │   │   │   │   └── admin.module.ts   # Admin lazy-loaded feature module
    │   │   │   └── admin-routing.module.ts
    │   │   ├── auth/                     # Authentication & onboarding feature
    │   │   │   ├── login/                # Accessible email/password corporate sign-in
    │   │   │   └── register/             # Employee registration & profile creation
    │   │   └── employee/                 # Employee Volunteer Feature (Lazy-Loaded)
    │   │       ├── pages/
    │   │       │   ├── employee-dashboard/ # Personal volunteer stats & upcoming initiative hero
    │   │       │   ├── opportunity-list/ # Catalog search, filtering, and slot badges
    │   │       │   ├── activity-detail/  # Activity logistical briefing & booking modal
    │   │       │   ├── my-registrations/ # Active bookings, cancellation & activity transfer
    │   │       │   ├── employee-checkin/ # Camera QR scanner & manual fallback simulation
    │   │       │   └── employee-notifications/ # In-app inbox with unread filters
    │   │       └── employee.module.ts    # Employee lazy-loaded feature module
    │   ├── app-routing.module.ts         # Top-level routing with lazy route definitions
    │   ├── app.component.{ts,html,css}   # App Shell with responsive sidebar & mobile top bar
    │   └── app.module.ts                 # Root NgModule with APP_INITIALIZER store hydration
    ├── assets/                           # Image assets, SVG icons, and mock data mirror
    ├── index.html                        # Semantic HTML5 host document with Google Fonts preloads
    └── styles.css                        # Warm Editorial Design System, utilities & responsive rules
```

---

## 5. Reactive Data Layer & Persistence Architecture

The frontend uses an enterprise-grade **Client-Side Reactive Data Store** (`DataStoreService`):

1. **Hydration Engine:** During application startup via `APP_INITIALIZER`, `DataStoreService` inspects browser `localStorage`.
   - If previous state exists, it hydrates in-memory `BehaviorSubject` streams immediately.
   - If empty (first launch or post-reset), it triggers `MockDataService`, which loads seed datasets from `public/assets/data/*.json` asynchronously via Angular `HttpClient` (`forkJoin`).
2. **Reactive Immutability:** All features subscribe to public `Observable` streams (`activities$`, `registrations$`, `notifications$`, `attendance$`). Mutations (registering, cancelling, updating capacity) emit new state snapshots and persist to `localStorage` atomically.
3. **Reactive Slot Arithmetic:** Remaining slots and availability statuses are dynamically calculated on the fly (`capacity - active registrations`), ensuring 100% synchronization between admin and employee portals.
4. **1-Click Reset Demo Data:** A convenient **Reset Demo Data** button is located in the sidebar footer (and programmatically callable via `dataStoreService.resetDemoData()`), enabling evaluators to restore pristine demo data in 1 second.

---

## 6. Implementation Status of Core Use Cases

| Use Case | Description | Status | Implementation Highlights |
|---|---|---|---|
| **UC-1** | Authentication & RBAC | **Complete** | Role-based guards (`AuthGuard`, `RoleGuard`), return URL navigation, zero role switcher cards on login screen. |
| **UC-2** | Activity Management | **Complete** | Full CRUD, capacity limits, deadline datepicker, publication workflow (`PUBLISHED`, `DRAFT`, `CANCELLED`). |
| **UC-3** | Catalog & Registration | **Complete** | Search & multi-parameter filtering, dynamic capacity counter, ethical commitment modal, cutoff rejection. |
| **UC-4** | Bookings & Transfer | **Complete** | Booking cancellation with slot restoration, atomic activity transfer, active vs history tabs. |
| **UC-5** | In-App Alerts & Reminders | **Complete** | Employee inbox (read/unread filters), admin 7/3/1 day reminder simulation engine, custom broadcast announcements. |
| **UC-6** | QR Code & Attendance | **Complete** | Printable logistics poster generation (`qrcode`), camera check-in scanner (`html5-qrcode`), duplicate prevention. |

---

## 7. Known Frontend-Only Limitations

To uphold absolute academic and professional honesty, the following constraints are explicitly documented:

- **No Remote Backend / Database:** The application is purely client-side; no Node.js/Express server or database is running.
- **Client-Scoped Persistence:** Data changes persist in the evaluator's local browser via `localStorage`. Changes in one browser will not synchronize with a different browser profile or device.
- **Simulated Authentication:** Passwords are not evaluated using server-side cryptography. Submitting any non-empty password with a valid corporate email succeeds.
- **Simulated Email & SMS Delivery:** Reminders and broadcasts generate persistent in-app notifications and audit logs; no external SMTP emails or SMS messages are dispatched.
- **Simulated QR Verification:** QR codes encode opaque demo tokens (`SDD-{activityId}-{timestamp}`). Verification is decoded and validated by client-side service logic without remote cryptographic signature validation.

---

## 8. Verification & QA Documentation

- **Coursework Deliverables Report:** Full technology inventory, architectural rationale, user manuals, video script, and references are detailed in [`docs/COURSEWORK_DELIVERABLES_REPORT.md`](docs/COURSEWORK_DELIVERABLES_REPORT.md).
- **Manual QA Checklist:** A detailed 16-test scenario guide covering step-by-step reproduction instructions is available in [`docs/MANUAL_QA_CHECKLIST.md`](docs/MANUAL_QA_CHECKLIST.md).
- **Data Layer Architecture:** Extended documentation detailing domain interfaces, serialization boundaries, and hydration flows is available in [`docs/DATA_LAYER_DOCUMENTATION.md`](docs/DATA_LAYER_DOCUMENTATION.md).
- **Demo Credentials:** Complete role-based test account credentials and guard mechanics are available in [`docs/DEMO_CREDENTIALS.md`](docs/DEMO_CREDENTIALS.md).
