import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, shareReplay } from 'rxjs/operators';
import {
  NGO,
  Activity,
  User,
  Registration,
  Notification,
  Attendance
} from '../../models';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { MockDataService, SeedDataBundle } from './mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {
  private readonly _ngos$ = new BehaviorSubject<NGO[]>([]);
  private readonly _activities$ = new BehaviorSubject<Activity[]>([]);
  private readonly _users$ = new BehaviorSubject<User[]>([]);
  private readonly _registrations$ = new BehaviorSubject<Registration[]>([]);
  private readonly _notifications$ = new BehaviorSubject<Notification[]>([]);
  private readonly _attendance$ = new BehaviorSubject<Attendance[]>([]);

  private readonly _initialized$ = new BehaviorSubject<boolean>(false);
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  private readonly _error$ = new BehaviorSubject<string | null>(null);

  // In-flight initialization stream to prevent race conditions
  private inFlightInit$: Observable<boolean> | null = null;

  constructor(
    private readonly storage: StorageService,
    private readonly mockData: MockDataService
  ) {}

  // Public observable streams
  readonly ngos$: Observable<NGO[]> = this._ngos$.asObservable();
  readonly activities$: Observable<Activity[]> = this._activities$.asObservable();
  readonly users$: Observable<User[]> = this._users$.asObservable();
  readonly registrations$: Observable<Registration[]> = this._registrations$.asObservable();
  readonly notifications$: Observable<Notification[]> = this._notifications$.asObservable();
  readonly attendance$: Observable<Attendance[]> = this._attendance$.asObservable();

  readonly initialized$: Observable<boolean> = this._initialized$.asObservable();
  readonly loading$: Observable<boolean> = this._loading$.asObservable();
  readonly error$: Observable<string | null> = this._error$.asObservable();

  // Snapshot getters for instant synchronous access in services/guards
  get ngosSnapshot(): NGO[] { return this._ngos$.getValue(); }
  get activitiesSnapshot(): Activity[] { return this._activities$.getValue(); }
  get usersSnapshot(): User[] { return this._users$.getValue(); }
  get registrationsSnapshot(): Registration[] { return this._registrations$.getValue(); }
  get notificationsSnapshot(): Notification[] { return this._notifications$.getValue(); }
  get attendanceSnapshot(): Attendance[] { return this._attendance$.getValue(); }
  get isInitialized(): boolean { return this._initialized$.getValue(); }

  /**
   * Deterministic initialization:
   * 1. If already initialized, returns of(true).
   * 2. If initialization is in-flight, shares the existing observable.
   * 3. If valid persisted data exists for all entities, restores from localStorage without HTTP.
   * 4. If any entity data is missing, loads mock JSON seed data, persists to localStorage, and populates streams.
   */
  init(): Observable<boolean> {
    if (this._initialized$.getValue()) {
      return of(true);
    }

    if (this.inFlightInit$) {
      return this.inFlightInit$;
    }

    const hasStoredNGOs = this.storage.hasItem(STORAGE_KEYS.NGOS);
    const hasStoredActivities = this.storage.hasItem(STORAGE_KEYS.ACTIVITIES);
    const hasStoredUsers = this.storage.hasItem(STORAGE_KEYS.USERS);
    const hasStoredRegistrations = this.storage.hasItem(STORAGE_KEYS.REGISTRATIONS);
    const hasStoredNotifications = this.storage.hasItem(STORAGE_KEYS.NOTIFICATIONS);
    const hasStoredAttendance = this.storage.hasItem(STORAGE_KEYS.ATTENDANCE);

    const hasCompletePersistentState =
      hasStoredNGOs &&
      hasStoredActivities &&
      hasStoredUsers &&
      hasStoredRegistrations &&
      hasStoredNotifications &&
      hasStoredAttendance;

    if (hasCompletePersistentState) {
      const ngos = this.storage.getItem<NGO[]>(STORAGE_KEYS.NGOS, []) ?? [];
      const activities = this.storage.getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []) ?? [];
      const users = this.storage.getItem<User[]>(STORAGE_KEYS.USERS, []) ?? [];
      const registrations = this.storage.getItem<Registration[]>(STORAGE_KEYS.REGISTRATIONS, []) ?? [];
      const notifications = this.storage.getItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []) ?? [];
      const attendance = this.storage.getItem<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []) ?? [];

      this._ngos$.next(ngos);
      this._activities$.next(activities);
      this._users$.next(users);
      this._registrations$.next(registrations);
      this._notifications$.next(notifications);
      this._attendance$.next(attendance);

      this._initialized$.next(true);
      this._error$.next(null);

      // Silently sync newly added seed users from server in the background
      if (this.mockData && typeof this.mockData.loadUsers === 'function') {
        this.syncSeedUsers().subscribe();
      }

      return of(true);
    }

    // Otherwise, seed initial data from mock JSON
    this._loading$.next(true);
    this._error$.next(null);

    this.inFlightInit$ = this.mockData.loadAllSeedData().pipe(
      tap((bundle: SeedDataBundle) => {
        this.saveAndPublishBundle(bundle);
        this.storage.setItem(STORAGE_KEYS.INITIALIZED, true);
        this._initialized$.next(true);
        this._loading$.next(false);
        this._error$.next(null);
        this.inFlightInit$ = null;
      }),
      map(() => true),
      catchError((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this._error$.next(errorMsg);
        this._loading$.next(false);
        this.inFlightInit$ = null;
        return throwError(() => new Error(`[DataStoreService] Hydration failed: ${errorMsg}`));
      }),
      shareReplay(1)
    );

    return this.inFlightInit$;
  }

  /**
   * Resets demo data back to original seed JSON, clearing demo modifications from localStorage.
   */
  resetDemoData(): Observable<boolean> {
    this._loading$.next(true);
    this._error$.next(null);
    this.storage.clearAllDemoData();

    return this.mockData.loadAllSeedData().pipe(
      tap((bundle: SeedDataBundle) => {
        this.saveAndPublishBundle(bundle);
        this.storage.setItem(STORAGE_KEYS.INITIALIZED, true);
        this._initialized$.next(true);
        this._loading$.next(false);
      }),
      map(() => true),
      catchError((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this._error$.next(errorMsg);
        this._loading$.next(false);
        return throwError(() => new Error(`[DataStoreService] Reset failed: ${errorMsg}`));
      })
    );
  }

  /**
   * Synchronizes stored users with seed users from server.
   * Merges any users present in users.json that are missing in localStorage,
   * preserving any existing mock users/registrations created during testing.
   */
  syncSeedUsers(): Observable<User[]> {
    if (!this.mockData || typeof this.mockData.loadUsers !== 'function') {
      return of(this.usersSnapshot);
    }

    return this.mockData.loadUsers().pipe(
      tap((seedUsers: User[]) => {
        if (!Array.isArray(seedUsers) || seedUsers.length === 0) return;
        const currentUsers = this._users$.getValue();
        const existingEmails = new Set(currentUsers.map((u) => u.email.toLowerCase()));
        const newUsers = seedUsers.filter((u) => !existingEmails.has(u.email.toLowerCase()));

        if (newUsers.length > 0) {
          const merged = [...currentUsers, ...newUsers];
          this._users$.next(merged);
          this.storage.setItem(STORAGE_KEYS.USERS, merged);
        }
      }),
      map(() => this._users$.getValue()),
      catchError(() => of(this._users$.getValue()))
    );
  }

  // --- Mutators with Automatic Persistence ---

  setNGOs(ngos: NGO[]): void {
    this._ngos$.next(ngos);
    this.storage.setItem(STORAGE_KEYS.NGOS, ngos);
  }

  setActivities(activities: Activity[]): void {
    this._activities$.next(activities);
    this.storage.setItem(STORAGE_KEYS.ACTIVITIES, activities);
  }

  setUsers(users: User[]): void {
    this._users$.next(users);
    this.storage.setItem(STORAGE_KEYS.USERS, users);
  }

  setRegistrations(registrations: Registration[]): void {
    this._registrations$.next(registrations);
    this.storage.setItem(STORAGE_KEYS.REGISTRATIONS, registrations);
  }

  setNotifications(notifications: Notification[]): void {
    this._notifications$.next(notifications);
    this.storage.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  setAttendance(attendance: Attendance[]): void {
    this._attendance$.next(attendance);
    this.storage.setItem(STORAGE_KEYS.ATTENDANCE, attendance);
  }

  private saveAndPublishBundle(bundle: SeedDataBundle): void {
    this.storage.setItem(STORAGE_KEYS.NGOS, bundle.ngos);
    this.storage.setItem(STORAGE_KEYS.ACTIVITIES, bundle.activities);
    this.storage.setItem(STORAGE_KEYS.USERS, bundle.users);
    this.storage.setItem(STORAGE_KEYS.REGISTRATIONS, bundle.registrations);
    this.storage.setItem(STORAGE_KEYS.NOTIFICATIONS, bundle.notifications);
    this.storage.setItem(STORAGE_KEYS.ATTENDANCE, bundle.attendance);

    this._ngos$.next(bundle.ngos);
    this._activities$.next(bundle.activities);
    this._users$.next(bundle.users);
    this._registrations$.next(bundle.registrations);
    this._notifications$.next(bundle.notifications);
    this._attendance$.next(bundle.attendance);
  }
}
