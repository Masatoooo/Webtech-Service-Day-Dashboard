import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthService: { isAuthenticated: boolean };
  let mockRouter: {
    createUrlTree: (commands: any[], extras?: any) => UrlTree;
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: '/admin/activities' } as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = { isAuthenticated: false };
    mockRouter = {
      createUrlTree: (commands: any[], extras?: any) => ({
        toString: () => `${commands.join('/')}?${JSON.stringify(extras || {})}`
      } as unknown as UrlTree)
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', () => {
    mockAuthService.isAuthenticated = true;
    const result = guard.canActivate(dummyRoute, dummyState);
    expect(result).toBe(true);
  });

  it('should redirect unauthenticated user to /login with returnUrl query param', () => {
    mockAuthService.isAuthenticated = false;
    const result = guard.canActivate(dummyRoute, dummyState);
    expect(result).not.toBe(true);
    expect(result.toString()).toContain('/login');
    expect(result.toString()).toContain('/admin/activities');
  });
});
