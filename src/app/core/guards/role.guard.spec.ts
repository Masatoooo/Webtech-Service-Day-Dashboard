import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let mockAuthService: {
    isAuthenticated: boolean;
    currentRole: UserRole | null;
  };
  let mockRouter: {
    createUrlTree: (commands: any[]) => UrlTree;
  };

  const dummyState = {} as RouterStateSnapshot;

  const createRouteSnapshot = (expectedRole?: UserRole): ActivatedRouteSnapshot => {
    return {
      data: { expectedRole }
    } as unknown as ActivatedRouteSnapshot;
  };

  beforeEach(() => {
    mockAuthService = {
      isAuthenticated: true,
      currentRole: 'ADMIN'
    };
    mockRouter = {
      createUrlTree: (commands: any[]) => ({
        toString: () => commands.join('/')
      } as unknown as UrlTree)
    };

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(RoleGuard);
  });

  it('should redirect unauthenticated users to /login', () => {
    mockAuthService.isAuthenticated = false;
    mockAuthService.currentRole = null;

    const result = guard.canActivate(createRouteSnapshot('ADMIN'), dummyState);
    expect(result.toString()).toBe('/login');
  });

  it('should allow access when role matches expectedRole (ADMIN -> ADMIN)', () => {
    mockAuthService.isAuthenticated = true;
    mockAuthService.currentRole = 'ADMIN';

    const result = guard.canActivate(createRouteSnapshot('ADMIN'), dummyState);
    expect(result).toBe(true);
  });

  it('should allow access when role matches expectedRole (EMPLOYEE -> EMPLOYEE)', () => {
    mockAuthService.isAuthenticated = true;
    mockAuthService.currentRole = 'EMPLOYEE';

    const result = guard.canActivate(createRouteSnapshot('EMPLOYEE'), dummyState);
    expect(result).toBe(true);
  });

  it('should redirect EMPLOYEE to /employee when trying to access ADMIN route', () => {
    mockAuthService.isAuthenticated = true;
    mockAuthService.currentRole = 'EMPLOYEE';

    const result = guard.canActivate(createRouteSnapshot('ADMIN'), dummyState);
    expect(result.toString()).toBe('/employee');
  });

  it('should redirect ADMIN to /admin when trying to access EMPLOYEE route', () => {
    mockAuthService.isAuthenticated = true;
    mockAuthService.currentRole = 'ADMIN';

    const result = guard.canActivate(createRouteSnapshot('EMPLOYEE'), dummyState);
    expect(result.toString()).toBe('/admin');
  });
});
