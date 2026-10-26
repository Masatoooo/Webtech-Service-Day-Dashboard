# Service Day Dashboard — Web Technologies Assignment (CLO2)

**Module:** Web Technologies / Web Application Development  
**Coursework:** Assignment 2 (CLO2) — Front-End Web Application  
**Student Name:** [Student Name / Group Members]  
**Student ID:** [Student ID(s)]  

---

## 1. Project Overview

The **Service Day Dashboard** is a front-end Single Page Application (SPA) built using **Angular 21** for managing corporate volunteering initiatives and NGO partnerships. The application addresses the case study requirements by providing two distinct role-based experiences:

- **Employee Portal (`/employee`):** Allows employees to discover volunteer opportunities, inspect details and logistics, register with an ethical commitment contract, manage active bookings, transfer between activities, view in-app notifications, and perform on-site QR attendance check-in.
- **Administrator Portal (`/admin`):** Enables administrators to monitor aggregate corporate volunteering metrics, manage activities (Create, Edit, Cancel), configure and simulate automated reminder notifications, send custom broadcasts, and generate printable venue QR posters.

The project is implemented entirely on the client side using Angular's `HttpClient` to load seed data from mock JSON files (`public/assets/data/`), with state and slot availability managed reactively through RxJS `BehaviorSubject` streams and persisted in browser `localStorage`.

---

## 2. Technologies Used

- **Framework:** Angular 21 (`@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`)
- **Language:** TypeScript 5.9
- **State Management:** Reactive Extensions for JavaScript (`rxjs` 7.8)
- **Styling:** Semantic HTML5 and Vanilla CSS (Flexbox, CSS Grid, and custom CSS variables)
- **Utilities:**
  - `qrcode`: Client-side QR code matrix generation on HTML5 canvas for venue check-in posters.
  - `html5-qrcode`: In-browser webcam scanner for on-site attendance verification.

---

## 3. Prerequisites & System Setup

Ensure you have the following installed on your machine:
- **Node.js:** v20.x LTS or v24.x (Tested on v20.x and v24.x)
- **npm:** v10.x or v11.x (Bundled with Node.js)
- **Web Browser:** Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari

---

## 4. Installation & Running Locally

### Step 1: Install Dependencies
Open your terminal in the project directory and install the required npm packages:
```bash
npm install
```

### Step 2: Start the Development Server
Run the local dev server:
```bash
npm start
# or
ng serve
```

### Step 3: Open in Browser
Open your browser and navigate to:
```
http://localhost:4200/
```
Unauthenticated requests will automatically redirect to the `/login` page.

---

## 5. Demo Accounts for Testing

The application uses role-based authentication based on user email profiles. Any non-empty password (e.g., `demo123`) can be used for demonstration purposes.

| Role | Email Address | Convenient Alias | Password | Landing Page | Key Features |
|---|---|---|---|---|---|
| **Administrator** | `marcus.vance@corp.example.com` | `admin@serviceday.demo` | `demo123` | `/admin` | KPI dashboard, Activity CRUD, Reminder rule simulator, Broadcast announcements, Venue QR poster generation. |
| **Employee** | `alice.chen@corp.example.com` | `employee@serviceday.demo` | `demo123` | `/employee` | Opportunity catalog, Slot booking, My registrations, Activity transfer, In-app notifications, QR scanner check-in. |
| **Employee** | `budi.santoso@corp.example.com` | — | `demo123` | `/employee` | Finance Dept volunteer with existing confirmed registrations. |

> **Tip:** You can click the **"Reset Demo Data"** button located at the bottom of the sidebar at any time to restore the initial mock data.

---

## 6. Key Features & Rubric Highlights

- **Model-View-Controller (MVC) Architecture:**
  - **Models (`src/app/models/`):** Strongly typed interfaces and enums for `Activity`, `NGO`, `User`, `Registration`, `Notification`, and `Attendance`.
  - **Views (`*.component.html` & `*.component.css`):** Semantic templates focused solely on presentation, using semantic tags (`header`, `nav`, `main`, `section`, `article`) and accessible attributes.
  - **Controllers (`*.component.ts`):** Lean components handling user interaction and delegating data logic to services.
  - **Services (`src/app/core/services/`):** Centralized singleton services (`DataStoreService`, `MockDataService`, `AuthService`, `NotificationService`).

- **Responsive Web Design:**
  - Built with CSS Flexbox and Grid without heavy UI frameworks.
  - Desktop view presents comprehensive data tables for administrative monitoring.
  - Mobile view automatically transforms data tables into clean, readable cards to prevent horizontal overflow on smaller screens.

- **Asynchronous Data & Real-Time Updates:**
  - Seed data is loaded asynchronously from mock JSON files using Angular's `HttpClient`.
  - Slot availability (`capacity - active registrations`) recalculates dynamically in real time across the application without page reloads.
  - Registration cut-off dates are enforced automatically to prevent booking on expired initiatives.

- **Modular Design:**
  - Application code is organized into `CoreModule`, `SharedModule`, and lazy-loaded feature modules (`AdminModule` and `EmployeeModule`) to ensure scalability and clean dependency separation.

---

## 7. Build & Test Commands

- **Production Build:**
  ```bash
  npm run build
  ```
  Generates production-optimized output in `dist/service-day-dashboard/`.

- **Run Tests:**
  ```bash
  npm test
  ```
