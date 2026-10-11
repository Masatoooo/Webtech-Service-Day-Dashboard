import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RootRedirectGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (!this.authService.isAuthenticated) {
      return this.router.createUrlTree(['/login']);
    }

    const role = this.authService.currentRole;
    if (role === 'ADMIN') {
      return this.router.createUrlTree(['/admin']);
    } else if (role === 'EMPLOYEE') {
      return this.router.createUrlTree(['/employee']);
    }

    return this.router.createUrlTree(['/login']);
  }
}
