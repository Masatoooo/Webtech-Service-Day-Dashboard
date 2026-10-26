import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, defer, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { User, UserRole } from '../../models';
import { StorageService } from './storage.service';
import { DataStoreService } from './data-store.service';

export const CURRENT_USER_KEY = 'sdd_current_user';

// Convenient demo email aliases mapping to actual seed users
export const DEMO_EMAIL_ALIASES: Record<string, string> = {
  'admin@serviceday.demo': 'marcus.vance@corp.example.com',
  'employee@serviceday.demo': 'alice.chen@corp.example.com'
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _currentUser$ = new BehaviorSubject<User | null>(null);

  constructor(
    private readonly storage: StorageService,
    private readonly dataStore: DataStoreService,
    private readonly router: Router
  ) {
    this.restoreSession();
  }

  readonly currentUser$: Observable<User | null> = this._currentUser$.asObservable();

  readonly isAuthenticated$: Observable<boolean> = this._currentUser$.pipe(
    map((user) => user !== null)
  );

  readonly userRole$: Observable<UserRole | null> = this._currentUser$.pipe(
    map((user) => user?.role ?? null)
  );

  get currentUserSnapshot(): User | null {
    return this._currentUser$.getValue();
  }

  get isAuthenticated(): boolean {
    return this.currentUserSnapshot !== null;
  }

  get currentRole(): UserRole | null {
    return this.currentUserSnapshot?.role ?? null;
  }

  /**
   * Restores existing session from StorageService on service boot.
   */
  restoreSession(): void {
    const saved = this.storage.getItem<User>(CURRENT_USER_KEY);
    if (saved) {
      this._currentUser$.next(saved);
    }
  }

  /**
   * Authenticates against the mock users loaded in DataStoreService.
   * Matches by exact email (case-insensitive) or documented demo aliases.
   */
  login(email: string, _password?: string): Observable<User> {
    return defer(() => {
      const normalizedInput = (email || '').trim().toLowerCase();
      const targetEmail = DEMO_EMAIL_ALIASES[normalizedInput] || normalizedInput;

      const matchUser = (): User => {
        const availableUsers = this.dataStore.usersSnapshot;
        const matchedUser = availableUsers.find(
          (u) => u.email.toLowerCase() === targetEmail
        );

        if (!matchedUser) {
          throw new Error('Invalid credentials. Please enter a recognized employee or administrator email.');
        }

        this._currentUser$.next(matchedUser);
        this.storage.setItem(CURRENT_USER_KEY, matchedUser);
        return matchedUser;
      };

      // defer() converts a synchronous matchUser() throw into an observable error
      // instead of letting it escape login() before the caller can subscribe.
      const attemptMatch$ = (): Observable<User> => defer(() => of(matchUser()));

      const attemptWithSeedSync$ = (): Observable<User> =>
        attemptMatch$().pipe(
          catchError((err) => {
            // Stored demo state may predate newly added seed users. Refresh the
            // seed directory once, then retry; preserve the original error if
            // the retry still does not match.
            if (typeof this.dataStore.syncSeedUsers !== 'function') {
              return throwError(() => err);
            }

            return this.dataStore.syncSeedUsers().pipe(
              switchMap(() => attemptMatch$()),
              catchError(() => throwError(() => err))
            );
          })
        );

      if (!this.dataStore.isInitialized) {
        return this.dataStore
          .init()
          .pipe(switchMap(() => attemptWithSeedSync$()));
      }

      return attemptWithSeedSync$();
    });
  }

  /**
   * Clears the current session and redirects to the login screen.
   */
  logout(): void {
    this._currentUser$.next(null);
    this.storage.removeItem(CURRENT_USER_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Registers a new staff member as EMPLOYEE and establishes their session.
   */
  register(data: { name: string; email: string; department?: string }): Observable<User> {
    const email = (data.email || '').trim().toLowerCase();
    if (!email || !data.name?.trim()) {
      return throwError(() => new Error('Full name and a valid corporate email are required.'));
    }

    const currentUsers = this.dataStore.usersSnapshot;
    const exists = currentUsers.some((u) => u.email.toLowerCase() === email);
    if (exists) {
      return throwError(() => new Error('An account with this corporate email already exists.'));
    }

    const initials = data.name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newUser: User = {
      id: `usr_reg_${Date.now()}`,
      name: data.name.trim(),
      email,
      role: 'EMPLOYEE',
      department: data.department?.trim() || 'General Operations',
      avatarInitials: initials || 'EM'
    };

    this.dataStore.setUsers([...currentUsers, newUser]);
    this._currentUser$.next(newUser);
    this.storage.setItem(CURRENT_USER_KEY, newUser);
    return of(newUser);
  }

  /**
   * Simulates password reset request for registered corporate staff.
   */
  requestPasswordReset(email: string): Observable<{ success: boolean; message: string }> {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      return throwError(() => new Error('Please provide a valid corporate email address.'));
    }
    return of({
      success: true,
      message: `Password reset instructions have been dispatched to ${normalized}. For evaluation, any password is valid for registered personnel.`
    });
  }

  /**
   * Helper check for role compatibility.
   */
  hasRole(role: UserRole): boolean {
    return this.currentRole === role;
  }
}
