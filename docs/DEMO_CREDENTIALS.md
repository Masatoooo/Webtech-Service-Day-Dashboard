# Service Day Dashboard — Demo Authentication & Credentials

**Document Stage:** Frontend Evaluation (Task 04)  
**Security Notice:** Mock Authentication for Academic/Demonstration Purposes Only.  
**Platform:** Corporate Social Responsibility (CSR) Management Platform

---

## 1. Overview

The Service Day Dashboard frontend utilizes client-side demonstration authentication (`AuthService`) backed by mock JSON seed profiles (`public/assets/data/users.json`). 

In compliance with the project PRD and Task Pack rules:
- **No role selector, role switcher, or role preview cards** are present on the login screen.
- Roles (`ADMIN` or `EMPLOYEE`) are strictly determined by the authenticated user account.
- Passwords are not evaluated against a production security backend; any non-empty demo password (e.g., `demo123`) is accepted when submitting a valid corporate email.
- Sessions are maintained in local storage under `sdd_current_user` and are cleared immediately upon signing out.

---

## 2. Recognized Demo Accounts

### 2.1 Administrator Accounts

| Name | Role | Email | Convenience Demo Alias | Suggested Password | Department |
|---|---|---|---|---|---|
| **Marcus Vance** | `ADMIN` | `marcus.vance@corp.example.com` | `admin@serviceday.demo` | `demo123` | Corporate Sustainability & CSR |
| **Super Admin** | `ADMIN` | `dev@svd.id` | &mdash; | `demo123` | Corporate Sustainability & CSR |

**Access Rights:**
- Destination: `/admin` (Administrator Operations & Governance Console)
- Access to CSR activity management, NGO partner configurations, and impact governance.
- Attempting to access `/employee` routes will redirect Marcus Vance back to `/admin`.

---

### 2.2 Employee Volunteer Accounts

| Name | Role | Email | Convenience Demo Alias | Suggested Password | Department |
|---|---|---|---|---|---|
| **Alice Chen** | `EMPLOYEE` | `alice.chen@corp.example.com` | `employee@serviceday.demo` | `demo123` | Software Engineering |
| **Budi Santoso** | `EMPLOYEE` | `budi.santoso@corp.example.com` | &mdash; | `demo123` | Finance & Accounting |
| **Citra Dewi** | `EMPLOYEE` | `citra.dewi@corp.example.com` | &mdash; | `demo123` | Product Management |
| **David Kim** | `EMPLOYEE` | `david.kim@corp.example.com` | &mdash; | `demo123` | People & Culture |
| **Maya Indah** | `EMPLOYEE` | `maya.indah@corp.example.com` | &mdash; | `demo123` | Legal & Risk Governance |

**Access Rights:**
- Destination: `/employee` (Employee Volunteer Contributions Portal)
- Access to discover approved community initiatives, register for events, and manage active slots.
- Attempting to access `/admin` routes will redirect employees back to `/employee`.

---

## 3. Route Protection & Guards Summary

| Route Pattern | Protected By | Role Restriction | Unauthenticated Behavior | Cross-Role Access Behavior |
|---|---|---|---|---|
| `/` (Root) | `RootRedirectGuard` | None | Redirects to `/login` | Redirects to role landing (`/admin` or `/employee`) |
| `/login` | `LoginGuard` | None | Renders login form | Redirects authenticated user to their role landing |
| `/admin/**` | `AuthGuard`, `RoleGuard` | `ADMIN` | Redirects to `/login?returnUrl=/admin` | Redirects unauthorized Employee to `/employee` |
| `/employee/**` | `AuthGuard`, `RoleGuard` | `EMPLOYEE` | Redirects to `/login?returnUrl=/employee` | Redirects unauthorized Admin to `/admin` |
| `**` (Fallback) | None | None | Redirects to `/404` (`NotFoundComponent`) | Role-aware Return button provided |

---

## 4. Verification Instructions

1. **Test Administrator Login:**
   - Navigate to `http://localhost:4200/login`.
   - Enter `admin@serviceday.demo` (or `marcus.vance@corp.example.com`) and password `demo123`.
   - Click **Sign In**.
   - Verify immediate redirect to `http://localhost:4200/admin`.
   - Observe header: Avatar initials `MV`, role badge `Administrator`, and Admin navigation items.

2. **Test Route Protection (Cross-Role):**
   - While logged in as Marcus Vance, manually change URL in the browser to `http://localhost:4200/employee`.
   - Verify that `RoleGuard` blocks access and redirects back to `http://localhost:4200/admin`.

3. **Test Sign Out:**
   - Click **Sign Out** in the header.
   - Verify session is cleared and user is redirected to `http://localhost:4200/login`.

4. **Test Employee Login:**
   - Enter `employee@serviceday.demo` (or `alice.chen@corp.example.com`) and password `demo123`.
   - Click **Sign In**.
   - Verify immediate redirect to `http://localhost:4200/employee`.
   - Observe header: Avatar initials `AC`, role badge `Employee`, and Employee navigation items.

5. **Test Invalid Credentials:**
   - Sign out and enter `unregistered.person@corp.example.com`.
   - Click **Sign In**.
   - Verify an accessible error alert appears: *"Invalid credentials. Please enter a recognized employee or administrator email."*
