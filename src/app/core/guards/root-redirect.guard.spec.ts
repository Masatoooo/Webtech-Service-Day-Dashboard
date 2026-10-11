import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RootRedirectGuard } from './root-redirect.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models';

describe('RootRedirectGuard', () => {
  let guard: RootRedirectGuard;
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
        RootRedirectGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(RootRedirectGuard);
  });

  it('should redirect unauthenticated users to /login', () => {
    mockAuthService.isAuthenticated = false;
    const result = guard.canActivate(dummyRoute, dummyState);
    expect(result.toString()).toBe('/login');
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
