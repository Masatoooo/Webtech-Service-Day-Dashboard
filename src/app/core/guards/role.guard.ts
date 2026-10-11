import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (!this.authService.isAuthenticated) {
      return this.router.createUrlTree(['/login']);
    }

    const expectedRole = route.data['expectedRole'] as UserRole | undefined;
    const currentRole = this.authService.currentRole;

    if (!expectedRole || currentRole === expectedRole) {
      return true;
    }

    // Role mismatch: redirect user to their own role-appropriate landing page
    if (currentRole === 'ADMIN') {
      return this.router.createUrlTree(['/admin']);
    } else if (currentRole === 'EMPLOYEE') {
      return this.router.createUrlTree(['/employee']);
    }

    return this.router.createUrlTree(['/login']);
  }
}
