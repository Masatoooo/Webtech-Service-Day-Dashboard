import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { DataStoreService } from './core/services/data-store.service';
import { User, UserRole } from './models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class App {
  readonly currentUser$: Observable<User | null>;
  readonly isAuthenticated$: Observable<boolean>;
  readonly userRole$: Observable<UserRole | null>;
  readonly isLoginRoute$: Observable<boolean>;

  isMobileMenuOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.userRole$ = this.authService.userRole$;

    const isAuthPath = (url: string) => url.startsWith('/login') || url.startsWith('/register');

    this.isLoginRoute$ = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((event) => {
        this.isMobileMenuOpen = false; // Auto-close menu on route navigation
        const url = event.urlAfterRedirects || event.url;
        return isAuthPath(url);
      }),
      startWith(this.router.url ? isAuthPath(this.router.url) : false)
    );
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  onLogout(): void {
    this.isMobileMenuOpen = false;
    this.authService.logout();
  }

  onResetDemoData(): void {
    if (confirm('Reset all demo data back to default initial seed state? This will restore all default activities, bookings, and notifications.')) {
      this.dataStore.resetDemoData().subscribe(() => {
        window.location.reload();
      });
    }
  }
}
