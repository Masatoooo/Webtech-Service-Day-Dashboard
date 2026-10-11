import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
  standalone: false
})
export class NotFoundComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  get returnRoute(): string {
    if (!this.authService.isAuthenticated) {
      return '/login';
    }
    return this.authService.currentRole === 'ADMIN' ? '/admin' : '/employee';
  }

  get returnLabel(): string {
    if (!this.authService.isAuthenticated) {
      return 'Return to Login';
    }
    return this.authService.currentRole === 'ADMIN'
      ? 'Return to Administrator Overview'
      : 'Return to Volunteer Portal';
  }

  navigateReturn(): void {
    this.router.navigate([this.returnRoute]);
  }
}
