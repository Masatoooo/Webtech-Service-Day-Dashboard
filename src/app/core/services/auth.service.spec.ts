import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { AuthService, CURRENT_USER_KEY } from './auth.service';
import { StorageService } from './storage.service';
import { DataStoreService } from './data-store.service';
import { User } from '../../models';

describe('AuthService', () => {
  let authService: AuthService;
  let storage: StorageService;
  let fakeRouter: { navigate: (commands: any[]) => Promise<boolean> };

  const mockUsers: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Marcus Vance',
      email: 'marcus.vance@corp.example.com',
      role: 'ADMIN',
      department: 'Corporate Sustainability & CSR',
      avatarInitials: 'MV'
    },
    {
      id: 'usr-emp-1',
      name: 'Alice Chen',
      email: 'alice.chen@corp.example.com',
      role: 'EMPLOYEE',
      department: 'Software Engineering',
      avatarInitials: 'AC'
    }
  ];

  const fakeDataStore = {
    isInitialized: true,
    usersSnapshot: [...mockUsers],
    init: () => of(true),
    setUsers: (users: User[]) => {
      fakeDataStore.usersSnapshot = [...users];
    }
  };

  beforeEach(() => {
    fakeDataStore.usersSnapshot = [...mockUsers];
    fakeRouter = {
      navigate: async () => true
    };

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: DataStoreService, useValue: fakeDataStore },
        { provide: Router, useValue: fakeRouter },
        AuthService
      ]
    });

    storage = TestBed.inject(StorageService);
    storage.removeItem(CURRENT_USER_KEY);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    storage.removeItem(CURRENT_USER_KEY);
  });

  it('should be created and start with no authenticated user if storage is empty', () => {
    expect(authService).toBeTruthy();
    expect(authService.isAuthenticated).toBe(false);
    expect(authService.currentUserSnapshot).toBeNull();
    expect(authService.currentRole).toBeNull();
  });

  it('should authenticate admin via exact email and update state', async () => {
    const user = await firstValueFrom(
      authService.login('marcus.vance@corp.example.com', 'anyPass')
    );

    expect(user).toBeTruthy();
    expect(user.role).toBe('ADMIN');
    expect(authService.isAuthenticated).toBe(true);
    expect(authService.currentRole).toBe('ADMIN');
    expect(authService.hasRole('ADMIN')).toBe(true);
    expect(authService.hasRole('EMPLOYEE')).toBe(false);
  });

  it('should authenticate admin via demo alias admin@serviceday.demo', async () => {
    const user = await firstValueFrom(
      authService.login('admin@serviceday.demo', 'demo123')
    );

    expect(user).toBeTruthy();
    expect(user.id).toBe('usr-admin-1');
    expect(user.role).toBe('ADMIN');
  });

  it('should authenticate employee via demo alias employee@serviceday.demo', async () => {
    const user = await firstValueFrom(
      authService.login('employee@serviceday.demo', 'demo123')
    );

    expect(user).toBeTruthy();
    expect(user.id).toBe('usr-emp-1');
    expect(user.role).toBe('EMPLOYEE');
    expect(authService.hasRole('EMPLOYEE')).toBe(true);
  });

  it('should reject unrecognized credentials with a descriptive error', async () => {
    let errorCaught: Error | null = null;
    try {
      await firstValueFrom(authService.login('unknown.person@corp.example.com'));
    } catch (err: any) {
      errorCaught = err;
    }

    expect(errorCaught).toBeTruthy();
    expect(errorCaught?.message).toContain('Invalid credentials');
    expect(authService.isAuthenticated).toBe(false);
  });

  it('should not throw synchronously when credentials are invalid', () => {
    expect(() => authService.login('unknown.person@corp.example.com')).not.toThrow();

    const errors: Error[] = [];
    authService.login('unknown.person@corp.example.com').subscribe({
      error: (err: Error) => {
        errors.push(err);
      }
    });

    expect(errors[0]?.message).toContain('Invalid credentials');
  });

  it('should persist session to StorageService and restore it', () => {
    storage.setItem(CURRENT_USER_KEY, mockUsers[1]); // Alice Chen
    authService.restoreSession();

    expect(authService.isAuthenticated).toBe(true);
    expect(authService.currentUserSnapshot?.name).toBe('Alice Chen');
    expect(authService.currentRole).toBe('EMPLOYEE');
  });

  it('should clear session and route to /login on logout', () => {
    let navigatedTo: any[] = [];
    fakeRouter.navigate = async (commands) => {
      navigatedTo = commands;
      return true;
    };

    storage.setItem(CURRENT_USER_KEY, mockUsers[0]);
    authService.restoreSession();
    expect(authService.isAuthenticated).toBe(true);

    authService.logout();

    expect(authService.isAuthenticated).toBe(false);
    expect(authService.currentUserSnapshot).toBeNull();
    expect(storage.getItem(CURRENT_USER_KEY)).toBeNull();
    expect(navigatedTo).toEqual(['/login']);
  });

  it('should register a new employee user successfully and establish session', async () => {
    const newUser = await firstValueFrom(
      authService.register({
        name: 'Bob Marley',
        email: 'bob.marley@corp.example.com',
        department: 'Music & Arts'
      })
    );

    expect(newUser).toBeTruthy();
    expect(newUser.name).toBe('Bob Marley');
    expect(newUser.role).toBe('EMPLOYEE');
    expect(authService.isAuthenticated).toBe(true);
    expect(authService.currentUserSnapshot?.email).toBe('bob.marley@corp.example.com');
  });

  it('should reject registration if email is already registered', async () => {
    let errorCaught: Error | null = null;
    try {
      await firstValueFrom(
        authService.register({
          name: 'Duplicate Alice',
          email: 'alice.chen@corp.example.com'
        })
      );
    } catch (err: any) {
      errorCaught = err;
    }

    expect(errorCaught).toBeTruthy();
    expect(errorCaught?.message).toContain('already exists');
  });

  it('should handle simulated password reset request', async () => {
    const result = await firstValueFrom(
      authService.requestPasswordReset('alice.chen@corp.example.com')
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('Password reset instructions have been dispatched');
  });
});
