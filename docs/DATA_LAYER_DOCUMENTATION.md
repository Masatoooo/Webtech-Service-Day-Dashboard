# Data Layer Architecture & Persistence Documentation

## 1. Core Domain Entities & Relationships

The application defines six strongly-typed TypeScript domain entities:

```
+---------------+        1:N        +------------------+
|      NGO      | <---------------- |     Activity     |
+---------------+                   +------------------+
                                             ^
                                             | 1:N
+---------------+        1:N        +------------------+        1:1        +------------------+
|     User      | <---------------- |   Registration   | <---------------- |    Attendance    |
+---------------+                   +------------------+                   +------------------+
        ^
        | 1:N
+---------------+
| Notification  |
+---------------+
```

1. **`NGO`** (`src/app/models/ngo.model.ts`):
   - Non-Governmental Organization partner profile with approval status (`PENDING`, `APPROVED`, `REJECTED`).
2. **`Activity`** (`src/app/models/activity.model.ts`):
   - CSR event referencing `ngoId`, with schedule (`startDateTime`, `endDateTime`, `registrationCutoff`), maximum `capacity`, service type, and publication status (`DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`).
   - Slot counts (`filledSlots`, `remainingSlots`, `utilisationPercentage`) and availability status are computed reactively from active registrations rather than being hardcoded.
3. **`User`** (`src/app/models/user.model.ts`):
   - Corporate participant profiles with role (`ADMIN`, `EMPLOYEE`), department, and initials.
4. **`Registration`** (`src/app/models/registration.model.ts`):
   - Booking record binding `employeeId` to `activityId`, with status (`ACTIVE`, `CANCELLED`), registered timestamp, and cancellation audit trail.
5. **`Notification`** (`src/app/models/notification.model.ts`):
   - In-app notification directed to a specific `recipientUserId` or `'ALL'` for company-wide broadcasts.
6. **`Attendance`** (`src/app/models/attendance.model.ts`):
   - Event check-in record linked to a confirmed `registrationId`, `activityId`, and `employeeId`, tracking verification method (`QR_SCAN`, `MANUAL_FALLBACK`) and an opaque token without personal data.

---

## 2. Mock JSON Seed Data Location

- **Served Asset Path:** `public/assets/data/` (served at `/assets/data/*` per `angular.json` asset configuration)
- **Source Mirror:** `src/assets/data/`
- Datasets:
  - `ngos.json` (5 partner organizations)
  - `activities.json` (10 CSR initiatives across varying availability states)
  - `users.json` (1 Admin, 5 Employees)
  - `registrations.json` (13 realistic bookings, testing full capacity and cancellations)
  - `notifications.json` (5 in-app notices including broadcasts and reminders)
  - `attendance.json` (2 check-in records)

---

## 3. Data Access Services & Hydration Flow

- **`MockDataService` (`src/app/core/services/mock-data.service.ts`):**
  - Pure HTTP Client loader requesting seed JSON files asynchronously.
  - Converts network errors into descriptive Error exceptions.
- **`StorageService` (`src/app/core/services/storage.service.ts`):**
  - Safe browser `localStorage` wrapper with JSON serialization boundaries.
  - Automatic fallback to an in-memory `Map` when storage is blocked, quotas are exceeded, or running in restricted test environments.
- **`DataStoreService` (`src/app/core/services/data-store.service.ts`):**
  - Central reactive store exposing read-only RxJS `Observable` streams backed by `BehaviorSubject`.
  - Deterministic Hydration:
    1. Hooked into Angular's `APP_INITIALIZER` (`src/app/app.module.ts`), ensuring data is ready before any component renders.
    2. Checks if localStorage already contains valid state. If yes, hydrates in-memory streams directly, preserving user mutations across browser refresh.
    3. If storage is empty (first run or after reset), calls `MockDataService.loadAllSeedData()`, saves to storage, and emits to subjects.
    4. Caches in-flight initialization streams to prevent race conditions.
  - Exposes `resetDemoData()` to reset the browser's data state back to the original mock seed bundle.
- **Domain Services:**
  - `NGOService`: NGO list and CRUD queries.
  - `ActivityService`: Activity catalog, published filter, and reactive `computeSlotSummary()` calculations.
  - `RegistrationService`: Booking management enforcing single active registration per activity (BR-08) and cancellation tracking (BR-09).
  - `UserService`: User queries and role filtering.
  - `NotificationService`: In-app notification delivery and read status.
  - `AttendanceService`: Check-in logging and duplicate check-in prevention (BR-11).

---

## 4. How to Reset Demo Data During Development

Consumers or evaluators can reset the demo state back to the pristine mock seed JSON at any time:

```typescript
// Inject DataStoreService
this.dataStoreService.resetDemoData().subscribe(() => {
  console.log('Demo data reset to initial seed state.');
});
```

Or directly via browser console:
```javascript
localStorage.clear();
location.reload();
```

---

## 5. Limitations of Frontend-Only Persistence

1. **Browser Isolation:** `localStorage` persists data only within the same browser and domain profile; changes are not synced across multiple devices or separate browser profiles.
2. **Concurrency / Race Conditions:** Capacity checking in the browser is client-side only and cannot guarantee atomic cross-user lock reservations without a centralized backend database.
3. **Security Boundary:** Frontend role checks and mock authentication are purely for workflow demonstration and do not constitute server-side security.

---

## 6. Migration Path to REST API Backend

Because all component interactions communicate strictly through domain services (`ActivityService`, `RegistrationService`, etc.) using Observable streams, transitioning to a backend REST API requires:

1. Updating `MockDataService` or replacing `DataStoreService` HTTP calls to point to real REST endpoints (e.g. `POST /api/registrations`, `GET /api/activities`).
2. Replacing the local `localStorage` state cache with standard HTTP requests or HTTP cache interceptors.
3. Zero changes will be required to UI components, as the component contracts remain identical (`Observable<Activity[]>`, `Observable<Registration>`, etc.).
