# Service Day Dashboard — Frontend AI Agent Task Pack

**Tujuan:** Prompt implementasi bertahap untuk membangun frontend Angular berdasarkan PRD dan hasil Architecture Audit.

**Frontend deadline:** 1 Desember 2026  
**Project location dari audit:** `scratch/service-day-dashboard`  
**Environment hasil audit:** Windows 11, Node.js `v24.12.0`, npm `11.6.2`, Angular CLI `21.2.25`  
**Arsitektur:** Angular berbasis `NgModule` / non-standalone, sesuai kebutuhan akademik dan rubric CLO2.

---

## Cara menggunakan task pack ini

1. Simpan file ini di repository sebagai `docs/Service_Day_Frontend_AI_Agent_Task_Pack.md`.
2. Berikan **Task 02 saja** kepada AI Agent. Jangan mengirim semua task sekaligus.
3. Periksa hasilnya, jalankan aplikasi, lalu lanjutkan ke Task 03 dan seterusnya.
4. Jika agent menemukan requirement yang bertentangan atau perlu keputusan produk baru, minta agent berhenti dan bertanya. Jangan membiarkan agent mengarang kebutuhan.
5. Setiap task harus berakhir dengan ringkasan file yang dibuat/diubah, hasil build/test, batasan yang diketahui, dan hal yang perlu disetujui sebelum lanjut.

## Keputusan produk yang sudah ditetapkan

- Project frontend-only untuk tahap pertama. **Jangan membangun backend, API server, atau database sungguhan sekarang.**
- Gunakan mock JSON yang dimuat asynchronous melalui Angular `HttpClient`.
- Perubahan demo disimpan di `localStorage` dan diperbarui secara reaktif tanpa reload halaman.
- Semua akses dan mutasi data dilakukan melalui Angular services. Component menangani presentasi dan interaksi UI, bukan menjadi tempat seluruh business logic.
- Gunakan arsitektur `NgModule`, bukan standalone components, kecuali dosen mengizinkan perubahan secara eksplisit.
- Login menggunakan mock authentication. Role ditentukan dari akun demo yang digunakan. **JANGAN tampilkan selector role, kartu Administrator/Employee, Preview Demo Roles, atau tombol pergantian role di halaman login.**
- Data login demo dijelaskan di dokumentasi, bukan dipajang sebagai pilihan role di UI. Mock authentication bukan keamanan produksi.
- Notifikasi dan pengingat di tahap frontend adalah simulasi dalam aplikasi. Jangan mengklaim email benar-benar terkirim atau reminder berjalan saat browser ditutup.
- QR Code dan check-in adalah prototipe frontend. Token demo bukan token aman yang divalidasi server. Beri label yang jujur tentang simulasi lokal.
- Jangan menyebut pembaruan reactive/local sebagai “real-time multi-user”. Aplikasi belum mempunyai sinkronisasi server.
- Hindari AI slop: tidak ada gradient dekoratif, glow/glassmorphism, emoji sebagai ikon, kartu berlebihan, dashboard template generik, micro-label teknis yang tidak berguna, atau grafik dekoratif tanpa arti.
- Jangan menambahkan library atau framework UI besar jika tidak diperlukan.

## Design system yang menjadi satu-satunya sumber kebenaran

Gunakan arah **Warm Editorial**. Palet lama yang tercampur di audit tidak boleh dipakai sebagai sumber desain alternatif.

| Token | Nilai | Pemakaian |
|---|---|---|
| Midnight Navy | `#243247` | Navigasi, heading utama, struktur penting |
| Warm Ivory | `#F6F1E8` | Background utama |
| White | `#FFFFFF` | Surface formulir, tabel, dan area kerja |
| Terracotta | `#C66A4E` | Aksi utama dan penekanan terpilih |
| Muted Ochre | `#D5B77A` | Aksen sekunder seperlunya |
| Secondary Text | `#6D706F` | Teks sekunder |
| Border | `#E2DACE` | Garis pemisah dan border |
| Light Slate | `#E9EDF0` | Surface sekunder jika dibutuhkan |

Typography: **DM Sans** untuk interface, form, navigation, body, dan tabel. **Newsreader** hanya untuk headline editorial tertentu jika benar-benar membantu. Hindari monospace untuk teks biasa; boleh dipakai terbatas pada ID teknis kecil.

Ikon harus menggunakan satu gaya line-icon yang konsisten dan profesional. Gunakan inline SVG atau library icon yang ringan jika benar-benar dibutuhkan; jangan gunakan emoji.

---

# TASK 02 — Scaffold Angular Project dan Design System

**Copy seluruh isi prompt berikut kepada AI Agent.**

> Implement **Task 02 only: Angular project scaffolding and global design system** for the Service Day Dashboard.
>
> First inspect the current workspace and confirm the target path. The previous audit reported that no Service Day Angular project exists yet and identified Node.js 24.12.0, npm 11.6.2, and Angular CLI 21.2.25.
>
> ## Scope
> 1. Create the Angular application in `scratch/service-day-dashboard` if it does not already exist. Do not accidentally create a second nested project or overwrite existing work.
> 2. Use an Angular **NgModule-based, non-standalone** setup with routing and CSS. A command such as `ng new service-day-dashboard --no-standalone --routing --style=css` may be used from the correct parent directory, after checking the workspace and Git context.
> 3. Inspect package versions and verify compatibility before installing anything. Do not downgrade or upgrade packages without a clear reason.
> 4. Establish global CSS tokens for the exact Warm Editorial palette in the task pack: `#243247`, `#F6F1E8`, `#FFFFFF`, `#C66A4E`, `#D5B77A`, `#6D706F`, `#E2DACE`, and `#E9EDF0`.
> 5. Set DM Sans as the main interface font and Newsreader as a limited editorial heading font, with appropriate system fallbacks if external fonts are unavailable.
> 6. Create semantic global styles for typography, page background, links, focus states, buttons, form controls, tables, dividers, spacing, and responsive breakpoints.
> 7. Create only a minimal application shell and a placeholder routed page to demonstrate that the design tokens are working. Do not start building feature pages in this task.
> 8. Use CSS variables and a deliberate spacing/type scale. Avoid a large CSS framework unless an existing project requirement makes it necessary.
>
> ## Mandatory design constraints
> - No green-primary palette, purple/blue gradients, dotted terminal background, neon, glassmorphism, glow effects, or generic dashboard decoration.
> - No emoji icons, random illustration, oversized rounded-card grids, or decorative charts.
> - Keep the result professional, editorial, readable, and practical for a CSR operations product.
> - Do not display roles or role-switching UI on login. Login is not in scope in this task.
>
> ## Git and safety
> Check the current Git repository and branch before editing. Do not commit changes directly to `main`. Use or create a dedicated feature branch according to the workspace's existing Git setup. Do not create an accidental nested Git repository inside an existing one. If Git state makes this ambiguous, report it before destructive actions.
>
> ## Acceptance criteria
> - A valid Angular project exists at the expected path.
> - The project uses `NgModule` architecture; it must not quietly default back to standalone components.
> - The global palette and font rules are centralized and reusable.
> - The project compiles successfully.
> - No feature-specific packages are installed without a current need.
> - No unrelated repository files are changed.
>
> ## Verification and stop condition
> Run the appropriate Angular build command and report the result. List the exact files created/changed, the project path, Angular version, architecture choice, and any warnings. **Stop after Task 02. Do not continue to Task 03.**

---

# TASK 03 — Models, Mock JSON, Asynchronous Seed Loading, dan Persistence

> Implement **Task 03 only: domain models, seed mock JSON, asynchronous initialization, and local persistence**. Use the existing project and design system; do not recreate the project.
>
> ## Scope
> 1. Create strict TypeScript interfaces for `NGO`, `Activity`, `User`, `Registration`, `Notification`, and `Attendance` in a dedicated models area.
> 2. Keep IDs and relationships consistent. An activity references an NGO; a registration references a user and an activity; attendance references the relevant registration/activity; a notification can reference a user and optionally an activity.
> 3. Add seed JSON files under `src/assets/data/` for the six entities. Create realistic, internally consistent sample data with at least 4 NGOs, around 10 activities, several employee demo accounts, registrations, notifications, and attendance records.
> 4. Include varied scenarios: approved and open activities, nearly full, full, cut-off passed, completed, cancelled, and draft/pending approval for the admin view. Do not show draft or unapproved activities in the employee opportunity list.
> 5. Use plausible activity dates that are not all in the past. Include enough different date/cut-off states to demonstrate rules. Store date-times consistently in ISO 8601 format and explicitly handle local display time.
> 6. Use Angular `HttpClient` to load seed JSON asynchronously. Import/configure the appropriate NgModule-based HTTP module.
> 7. Implement initialization that loads the seed JSON asynchronously and restores a valid local demo snapshot if it exists. This should still demonstrate asynchronous data loading at startup.
> 8. Implement a focused persistence/storage service with a versioned localStorage key, JSON parse/error handling, and a reset-to-seed capability. Do not scatter direct `localStorage` access throughout components.
> 9. Ensure the initial seed is not re-applied over saved demo changes on every load. A browser refresh must preserve local edits.
> 10. Handle loading and initialization failures explicitly; do not silently replace a failure with unrelated hardcoded data.
>
> ## Constraints
> - Do not implement activity CRUD pages, registration UI, notifications UI, or QR UI yet.
> - Do not put all domain types or persistence logic into `AppComponent`.
> - Do not store real or sensitive personal data. All accounts and data are fake demo data.
> - Keep the data layer easy to swap to an API later; JSON/localStorage are a frontend-stage adapter, not a production database.
>
> ## Acceptance criteria
> - All six entity interfaces are defined and used.
> - Mock JSON files have coherent IDs and valid relationships.
> - Seed data is loaded through `HttpClient` asynchronously.
> - A valid saved snapshot survives a browser refresh.
> - Reset restores the original demonstration data.
> - Corrupted storage and failed seed loading produce clear, recoverable handling.
> - The application compiles successfully.
>
> ## Verification and stop condition
> Verify startup loading, localStorage restoration, and reset at service level or through a minimal temporary check. Summarise files changed and test/build results. **Stop after Task 03.**

---

# TASK 04 — Core/Shared Modules, Login Mock, Routing, dan Role Guards

> Implement **Task 04 only: CoreModule, SharedModule, navigation shell, mock login, and route protection**.
>
> ## Scope
> 1. Create a clear NgModule-based structure: `CoreModule`, `SharedModule`, `EmployeeModule`, and `AdminModule`, plus domain models and services. Follow the existing repo; do not move files unnecessarily if an equivalent clean structure already exists.
> 2. Add core services for demo authentication and session state. Use a mock login account mapping that identifies the role from the credentials used.
> 3. Implement a refined login page that follows the Warm Editorial design system.
> 4. **Do not show a role selector, Admin/Employee choice cards, “Preview Demo Roles”, role tier badges, or a role switcher on the login page.** A user's role comes from the mock account, not a choice presented on screen.
> 5. Provide separate demo credentials in `README.md` or `docs/DEMO_CREDENTIALS.md`, not in the login UI. Use fake credentials only, e.g. `admin@serviceday.demo` and `employee@serviceday.demo`, with clearly documented demo passwords. Keep this explicitly labelled as frontend-only mock authentication.
> 6. On successful mock login, redirect the admin account to the admin landing page and the employee account to the employee landing page.
> 7. Implement route guards for `/admin/**` and `/employee/**`; unauthenticated users go to login, and users with the wrong role go to their own authorised landing page or a clear access-denied page.
> 8. Add a sign-out action. Do not claim that the mock guard is production security; backend authentication and server-side authorisation belong to the later backend task.
> 9. Create a role-aware application shell with distinct admin and employee navigation. The two roles should not have identical menus.
> 10. Implement reusable SharedModule components only where needed now, such as status badge, loading indicator, empty state, alert/toast, and confirmation dialog. Avoid creating unnecessary abstractions.
>
> ## Visual requirements
> The login page should be calm, minimal, and human. Use navy, ivory, and terracotta, DM Sans, and Newsreader only as a restrained editorial accent. Remove fake SSO infrastructure, system-health labels, environment metadata, security jargon, and irrelevant NGO KPI panels from login.
>
> ## Acceptance criteria
> - Login does not display a role-selection UI.
> - Demo credentials determine the role and destination.
> - Admin and employee routes are guarded.
> - Navigation changes according to role.
> - Sign-out works and protected routes cannot be opened through normal app navigation by an unauthenticated user.
> - Shared UI states are reusable and accessible.
> - Build passes without major console errors.
>
> ## Verification and stop condition
> Test valid admin login, valid employee login, invalid credentials, sign-out, direct navigation to protected URLs, and wrong-role access. Report demo credentials in documentation only. **Stop after Task 04.**

---

# TASK 05 — Administrator: Activity Management (Use Case 1)

> Implement **Task 05 only: administrator NGO/activity management**, corresponding to Use Case 1.
>
> ## Scope
> 1. Build an activity list page with a clear heading, search, useful filters, and a well-structured table.
> 2. Display activity title, NGO, schedule, location, registered/capacity count, registration cut-off, approval/publication status, and row actions.
> 3. Implement create and edit forms with semantic labels, required-field validation, sensible date/time validation, capacity validation, and clear error messages.
> 4. Implement add, update, approve/reject where relevant, deactivate/cancel, and delete according to the product model. Confirm destructive actions in an accessible dialog.
> 5. Reuse NGO records rather than typing arbitrary NGO names into each activity. If NGO CRUD is not explicitly required in the current UI, provide a usable selector for existing NGOs and avoid building an unnecessary separate NGO-management suite.
> 6. All data changes must go through Angular services and update the in-memory observable/state and localStorage. Do not reload the page to reflect changes.
> 7. Only approved, available activities should be discoverable by employees. Draft or pending activities remain admin-only.
> 8. Show loading, empty, error, success, and validation states.
>
> ## Business rules
> - Capacity must be a positive integer.
> - Cut-off must be a valid date-time; explain invalid or contradictory schedules.
> - An activity with existing registrations must not be silently deleted if this would orphan registrations. Use a clear cancellation/deactivation policy or confirmation and preserve records consistently.
> - Activity status and employee availability must be derived consistently; do not maintain contradictory status labels in separate screens.
>
> ## Visual requirements
> Keep the Warm Editorial design system. Prioritise a precise table and clear form hierarchy; do not put every field or metric into its own rounded card. No emoji icons or generic dashboard decoration.
>
> ## Acceptance criteria
> - Admin can create and edit an activity.
> - Admin can change its publication/approval state.
> - Search and filters work on the data shown.
> - Deactivation/deletion has safe confirmation and consistent related data behaviour.
> - Changes are immediately visible through the UI and persist after refresh.
> - Employee-facing data will only include appropriate approved activities.
> - Build passes.
>
> ## Verification and stop condition
> Test create, edit, validation errors, status changes, search/filter, destructive confirmation, refresh persistence, and empty/error states. **Stop after Task 05.**

---

# TASK 06 — Employee: Browse Opportunities and Activity Details (Use Case 2)

> Implement **Task 06 only: employee activity discovery and detail screens**, corresponding to Use Case 2. Do not implement the full registration mutation flow yet; that is Task 07.
>
> ## Scope
> 1. Build an Employee Opportunity Board showing approved activities only.
> 2. Include search by activity/NGO and practical filters for date, type, location, and availability.
> 3. Each activity item should make its purpose quickly understandable: title, NGO, short description, schedule, location, capacity/remaining places, and cut-off.
> 4. Provide an activity-detail screen with full description, expected volunteer contribution, date/time, location/meeting point, availability, and cut-off.
> 5. Provide sensible states for Available, Almost Full, Full, Registration Closed, Cancelled, and Completed. Status must not rely on colour alone.
> 6. Include clear links from the opportunity list to details and to the future registration action. If the registration service is not ready, build the route/button contract cleanly without fake-success messaging.
> 7. Include a link to My Registrations and employee notifications in the role navigation; they can connect to their full implementation in later tasks.
> 8. Use selective documentary imagery only if available and appropriate. Do not add random illustrations or use images as decoration in every row.
>
> ## Visual requirements
> Employee experience must feel distinct from the admin operations console: more human and discovery-oriented, but still professional. Use editorial list layouts, aligned metadata, and selective imagery rather than a generic grid of identical cards.
>
> ## Acceptance criteria
> - Only approved activities are visible to employees.
> - Search and filters return correct results.
> - Activity detail uses the same source data as the list.
> - Full or closed activities are clearly distinguished and are not represented as available.
> - Responsive layout works at approximately 375px, 768px, and 1280px+.
> - No fake registration success is displayed before Task 07 exists.
> - Build passes.
>
> ## Verification and stop condition
> Test each filter/status, detail navigation, empty results, and mobile layout. **Stop after Task 06.**

---

# TASK 07 — Registration, My Registrations, Slot Rules (Use Case 3)

> Implement **Task 07 only: registration workflows and business rules**, corresponding to Use Case 3. Connect the employee UI to the services and shared state.
>
> ## Scope
> 1. Implement registration for an approved activity using the current mock data/services.
> 2. Implement My Registrations with upcoming, past, and cancelled/withdrawn views as appropriate.
> 3. Allow change/transfer to another activity and withdrawal only while the configured cut-off rule permits it.
> 4. Update activity availability, registration lists, dashboard figures, and notifications through shared observable state without a page reload.
> 5. Persist all changes to localStorage.
> 6. Return clear success and error messages; do not silently ignore rejected actions.
>
> ## Business rules
> - Block registration when activity is not approved, registration is closed, the cut-off has passed, or capacity is full.
> - Prevent duplicate active registrations for the same employee and activity.
> - A registration consumes one place only once.
> - Cancellation restores the old activity's available capacity.
> - Activity transfer must validate the destination first. Only after the destination passes all checks should the old registration be released and the new registration be recorded; a failed transfer must not lose the employee's original place.
> - Once cut-off has passed, editing, transferring, and cancellation are disabled with a clear explanation, following the case study.
> - Allow multiple different registrations unless they duplicate the same activity. Detect overlapping activity schedules and show a clear warning; do not silently make an undocumented policy that blocks otherwise valid registrations. If a hard block is required by the lecturer, ask before changing this rule.
> - Slot counts must be derived from active registrations and capacity. Do not separately hardcode “remaining places” across screens.
> - Prevent an employee from checking in twice later; keep the registration/attendance relationship suitable for Task 10.
>
> ## Acceptance criteria
> - Successful registration reduces remaining capacity consistently on employee and admin screens.
> - Full activity, closed registration, cut-off passed, and duplicate registration all fail with helpful messages.
> - Cancellation and transfer update both affected activities consistently.
> - Failed transfer preserves the original registration.
> - Data survives refresh.
> - UI updates without full-page reload.
> - Build passes.
>
> ## Verification and stop condition
> Test all rule cases, including one remaining place, full activity, deadline boundary, duplicate registration, cancelled registration, failed transfer, successful transfer, overlapping schedule warning, and refresh persistence. **Stop after Task 07.**

---

# TASK 08 — Administrator Dashboard and Participation Monitoring (Use Case 4)

> Implement **Task 08 only: administrator overview and participation monitoring**, corresponding to Use Case 4.
>
> ## Scope
> 1. Build the administrator overview with compact totals for activities, registrations, total offered places, places taken, places remaining, and capacity utilisation.
> 2. Calculate metrics from the current activity and registration data services. Do not hardcode the figures displayed in the UI.
> 3. Build an activity-by-activity operational table with NGO, capacity, filled places, remaining places, cut-off, status, and relevant action links.
> 4. Show a useful “Needs attention” list for activities nearing capacity, low registration, or approaching cut-off if the data supports it.
> 5. Build participant monitoring/roster grouped by activity with participant name, registration state, and attendance status if available.
> 6. Add meaningful filters/search where useful. Keep the table readable and make mobile adaptation intentional.
> 7. Reuse shared statuses and data services rather than building dashboard-specific duplicate logic.
>
> ## Business rules
> - `remainingPlaces = maxCapacity - activeRegistrationCount`, clamped safely at zero.
> - Utilisation must avoid division by zero and use the same active-registration definition as the activity screens.
> - Clearly label all figures as demo data where useful; do not imply real server-side multi-user live updates.
> - Administrative monitoring must be read-only regarding an employee's own registration editing; that functionality belongs to the employee workflow.
>
> ## Acceptance criteria
> - Metrics change after creating/cancelling/transferring registrations.
> - Totals and per-activity counts reconcile.
> - Search/filter and activity links work.
> - Empty and low-data states are handled professionally.
> - No decorative charts without interpretation or source data.
> - Build passes.
>
> ## Verification and stop condition
> Compare dashboard calculations with seeded registrations and verify that changing a registration updates totals without reload. **Stop after Task 08.**

---

# TASK 09 — In-App Notifications and Reminder Simulation (Use Case 5)

> Implement **Task 09 only: employee notification inbox and administrator reminder/broadcast interface**, corresponding to Use Case 5.
>
> ## Scope
> 1. Generate in-app notifications for successful registration, registration transfer, cancellation, and relevant activity updates.
> 2. Build an employee inbox with All/Unread filtering, read/unread state, timestamps, activity reference, and navigation to related details.
> 3. Build an admin interface for reminder schedule settings at 7 days, 3 days, and 1 day before an activity.
> 4. Allow admins to enable/disable demo reminder rules and compose a broadcast with subject, body, target group, and optional activity association.
> 5. Record simulated notification events in a simple notification history with statuses such as Preview, Scheduled (demo), Simulated, or Failed.
> 6. Make reminder simulation testable through an explicit preview/test-trigger action. Do not rely on an always-running browser timer or claim that a reminder will be sent when the browser is closed.
> 7. Store notification changes in localStorage and update state without full-page reload.
>
> ## Constraints
> - Do not integrate a real email provider or create a backend scheduler in the frontend assignment.
> - Never display “Email sent” or “Delivered” unless a real delivery system exists. Use transparent labels such as “Simulated in app”.
> - Do not create a chat UI; this is a notification centre and administrative control surface.
>
> ## Acceptance criteria
> - Relevant registration actions create consistent in-app notifications.
> - Read/unread controls work and persist.
> - Admin can configure demo reminder rules and preview/broadcast a simulated message.
> - Activity/recipient selection and message validation work.
> - Simulation status is explicit.
> - Build passes.
>
> ## Verification and stop condition
> Test each generated notification type, read/unread filtering, reminder preview, broadcast validation, persistence, and no-false-email-delivery claims. **Stop after Task 09.**

---

# TASK 10 — QR Code Generation and Employee Check-In (Use Case 6)

> Implement **Task 10 only: frontend QR generation, scanning, check-in simulation, and attendance records**, corresponding to Use Case 6.
>
> ## Scope
> 1. Review existing dependencies before adding packages. If not already present and compatible, add a suitable QR generation package such as `qrcode` and a camera scanner such as `html5-qrcode`. Verify package compatibility with the current Angular/TypeScript versions; do not add duplicate or unnecessary QR libraries.
> 2. Build an admin QR management page where the admin selects an activity and generates a QR representing an activity-specific opaque demo reference/token. Do not include employee PII or passwords in the QR payload.
> 3. Provide a readable QR preview and print-friendly layout with activity name, NGO, date/location, and short instructions.
> 4. Build an employee check-in page with camera permission/scan states and a clearly discoverable manual demo fallback for evaluation environments without a camera.
> 5. After a valid demo scan, display activity details and validate that the employee has an active registration for that activity.
> 6. Record a demo attendance entry with the current arrival timestamp, update attendance state, and expose it to the administrator report.
> 7. Prevent duplicate check-in for the same registration.
> 8. Validate invalid token, missing registration, cancelled registration, not-yet-eligible activity, and already-checked-in cases with clear messages.
> 9. Persist attendance in localStorage and update the UI reactively.
>
> ## Security honesty
> This remains a frontend demonstration. The opaque reference is not a secure backend token, and local checks can be manipulated. Make no claims that the check-in has been server-verified. The backend assignment will implement authoritative validation.
>
> ## Acceptance criteria
> - QR can be generated and associated with the selected activity.
> - A supported camera can scan QR, or the manual fallback can complete a demo.
> - Only an eligible demo registration can be checked in.
> - Check-in records a timestamp and appears in attendance records.
> - Duplicate check-in is blocked.
> - Permission denial and camera-unavailable paths remain usable.
> - Build passes and no scanner resources remain running after leaving the screen.
>
> ## Verification and stop condition
> Test QR generation, scanner start/stop, permission denial, invalid QR, unregistered employee, successful check-in, duplicate check-in, manual fallback, and refresh persistence. **Stop after Task 10.**

---

# TASK 11 — Responsive Design, Accessibility, Edge Cases, and Visual Polish

> Implement **Task 11 only: cross-application quality pass**. Do not add new product features or redesign the product identity from scratch.
>
> ## Scope
> 1. Review all existing screens against the Warm Editorial design system.
> 2. Test desktop at approximately 1280px or wider, tablet at 768px, and mobile at 375–390px.
> 3. Fix overflows, cramped tables, inaccessible dialogs, inconsistent spacing, unreadable typography, and buttons that are hard to use on mobile.
> 4. Ensure admin tables convert into usable responsive layouts when necessary instead of forcing the entire page to overflow horizontally.
> 5. Check semantic headings, labels, keyboard navigation, visible focus, button names, accessible status text, and contrast.
> 6. Standardise loading, empty, error, validation, success, and confirmation states using shared components where appropriate.
> 7. Remove remaining emoji, generic AI-style decoration, unnecessary cards, fake technical metadata, inconsistent icon styles, and unhelpful chart decoration.
> 8. Verify the login still contains no visible role selector or demo role cards.
> 9. Ensure all primary buttons perform an implemented action. Remove inert controls or clearly identify unimplemented features rather than pretending they work.
>
> ## Acceptance criteria
> - No critical horizontal overflow at target viewports.
> - Forms, tables, dialogs, filters, and navigation remain usable on mobile.
> - Warm Editorial palette and type rules are consistent.
> - Focus and labels are visible and accessible.
> - All key UI states are understandable without relying on colour alone.
> - No broken links, inert primary actions, or major console errors.
>
> ## Verification and stop condition
> Provide a viewport-by-viewport QA summary and list each issue fixed. Run a build and available tests. **Stop after Task 11.**

---

# TASK 12 — Final Rubric Audit, Test Evidence, and Frontend Handover

> Implement **Task 12 only: final verification and frontend handover**. Do not begin backend implementation.
>
> ## Scope
> 1. Audit the full frontend against the PRD and CLO2 rubric dimensions:
>    - MVC / model-view-component separation and Angular architecture
>    - HTML semantics, visual design, responsive layout, Flexbox/CSS layout
>    - asynchronous loading via Angular `HttpClient`
>    - no-reload reactive UI updates, slot updates, and cut-off logic
>    - `NgModule`, Core/Shared/feature structure, imports/exports, and justified package use
> 2. Run the project's configured build, lint (if configured), and test commands. Inspect the current `package.json`; do not assume test tooling that is not present and do not install a new testing framework without a clear reason.
> 3. Fix only confirmed defects within the agreed frontend scope. If a change is risky or broad, report it and request approval rather than rewriting the architecture at the end.
> 4. Add/update README documentation covering prerequisites, Node/npm/Angular versions, installation, run/build/test commands, folder structure, mock data approach, demo credentials, and known frontend-only limitations.
> 5. Prepare a manual test checklist covering at minimum:
>    - admin and employee mock login
>    - route protection and logout
>    - activity CRUD and approval status
>    - employee browsing/search/filter/details
>    - valid registration
>    - full activity rejection
>    - cut-off rejection
>    - duplicate registration rejection
>    - cancellation and activity transfer
>    - slot consistency across employee/admin views
>    - notification generation and read/unread state
>    - reminder simulation and broadcast
>    - QR generation and check-in
>    - duplicate check-in rejection
>    - persistence after refresh and reset demo data
>    - mobile responsive checks
> 6. Document which behaviours are simulated and which are genuinely functional in the browser.
> 7. Do not state “real email sent”, “secure authentication”, or “server-side validated check-in” because backend is not part of this phase.
>
> ## Acceptance criteria
> - Build succeeds, or any blocker is documented with exact error output and a remediation recommendation.
> - Available automated tests pass, or failures are reported honestly.
> - All six use cases have a corresponding implemented frontend flow or explicitly documented limitation.
> - README and manual QA checklist are current and usable by another student/evaluator.
> - No backend server or database has been added.
>
> ## Final report and stop condition
> Provide a concise rubric-by-rubric status: Complete / Partial / Not implemented, evidence, known limitations, exact run commands, and any open lecturer decisions. **Stop after Task 12 and wait for user review.**

---

## Shared completion report format for every task

At the end of every task, the AI Agent must report:

1. **Task completed:** exact task ID and scope.
2. **Files created/modified:** list paths and why they changed.
3. **Behaviour added:** user-visible functionality implemented.
4. **Verification:** commands executed and their actual results.
5. **Known issues:** any warnings, skipped work, or untested paths.
6. **Requirement conflicts:** any assumptions or decisions that need user approval.
7. **Next task suggestion:** name the next task only; do not start it automatically.

## Explicitly out of scope for the entire frontend assignment

- Real Node.js/Express backend or API server
- Real database integration
- Actual email delivery or a server-side reminder scheduler
- Production authentication, JWT/session security, and authoritative server role permissions
- Secure server-verified QR tokens
- Multi-user live synchronisation across browsers/devices
- Backend deployment

These are reserved for the later backend assignment. The frontend must be structured so services can be adapted to an API later, but do not implement the backend now.

---

# TASK 13 — Frontend Coursework Deliverables (Run only after Task 12 is approved)

> Implement **Task 13 only: prepare the supporting coursework deliverables for the completed frontend**. Do not add new application features unless a documented gap is found and approved.
>
> ## Scope
> 1. Produce an accurate technology/framework/library inventory from the actual `package.json`, Angular configuration, and source code. Do not list packages that are not actually used.
> 2. Draft a technology justification section that explains why the project uses Angular, TypeScript, HTML5, CSS/Flexbox or Grid, Angular `HttpClient`, RxJS where used, NgModules, and any additional QR/icon packages that are genuinely present.
> 3. Support claims with real, verifiable technical references such as official Angular, Node.js, TypeScript, MDN, RxJS, or package documentation. If an academic-literature citation is required, use real publications with complete bibliographic details; never fabricate titles, authors, publication years, DOIs, or URLs.
> 4. Prepare a step-by-step setup/configuration guide matching the project's actual Node.js/npm/Angular versions, installation commands, run/build/test commands, and demo credentials.
> 5. Prepare separate user manuals for Employee and Administrator, based on the actual implemented navigation and functionality.
> 6. Prepare a video walkthrough outline/script that demonstrates the app in a logical sequence: login, admin activity management, employee activity discovery, registration and slot updates, notifications, QR/check-in demo, and admin attendance report.
> 7. Include a table that transparently labels simulated frontend behaviours versus functionality that is genuinely executed in the browser. In particular, clearly note mock authentication, localStorage persistence, simulated reminders, and local/demo QR verification.
> 8. Keep the coursework report factual and tied to the implemented project. Do not claim backend capabilities that do not exist yet.
>
> ## Acceptance criteria
> - A student can follow the setup guide to run the application from a clean checkout.
> - The Employee and Administrator manuals match the screens and available actions.
> - The video outline can be used to record the actual application without inventing functionality.
> - All references are real and relevant, and every package listed is verified in the project.
> - The report distinguishes frontend simulation from future backend work.
>
> ## Verification and stop condition
> Cross-check all commands, versions, route names, demo credentials, and package names against the actual repository. List remaining items that require student-written reflection or lecturer clarification. **Stop after Task 13.**
