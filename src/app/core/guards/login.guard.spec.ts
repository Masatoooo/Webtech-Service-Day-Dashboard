import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { LoginGuard } from './login.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models';

describe('LoginGuard', () => {
  let guard: LoginGuard;
  let mockAuthService: {
    isAuthenticated: boolean;
    currentRole: UserRole | null;
  };
  let mockRouter: {
    createUrlTree: (commands: any[]) => UrlTree;
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = {} as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: false,
      currentRole: null
    };
    mockRouter = {
      createUrlTree: (commands: any[]) => ({
        toString: () => commands.join('/')
      } as unknown as UrlTree)
    };

    TestBed.configureTestingModule({
      providers: [
        LoginGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(LoginGuard);
  });

  it('should allow unauthenticated users to access /login', () => {
    mockAuthService.isAuthenticated = false;
    expect(guard.canActivate(dummyRoute, dummyState)).toBe(true);
  });

  it('should redirect authenticated ADMIN to /admin', () => {
    mockAuthService.isAuthenticated = true;
    mockAuthService.currentRole = 'ADMIN';

    const result = guard.canActivate(dummyRoute, dummyState);
    expect(result.toString()).toBe('/admin');
  });

  it('should redirect authenticated EMPLOYEE to /employee', () => {
    mockAuthService.isAuthenticated = true;
    mockAuthService.currentRole = 'EMPLOYEE';

    const result = guard.canActivate(dummyRoute, dummyState);
    expect(result.toString()).toBe('/employee');
  });
});
