import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage: string | null = null;
  returnUrl: string | null = null;

  // Forgot password interactive state
  showForgotPasswordModal = false;
  forgotPasswordEmail = '';
  forgotPasswordSuccess = '';
  forgotPasswordError = '';
  isResetting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.redirectUserByRole();
      return;
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['']
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openForgotPassword(): void {
    this.showForgotPasswordModal = true;
    this.forgotPasswordSuccess = '';
    this.forgotPasswordError = '';
    this.forgotPasswordEmail = this.loginForm.get('email')?.value || '';
  }

  closeForgotPassword(): void {
    this.showForgotPasswordModal = false;
    this.forgotPasswordSuccess = '';
    this.forgotPasswordError = '';
  }

  onSendPasswordReset(): void {
    if (!this.forgotPasswordEmail || !this.forgotPasswordEmail.includes('@')) {
      this.forgotPasswordError = 'Please provide a valid corporate email address.';
      return;
    }

    this.forgotPasswordError = '';
    this.isResetting = true;

    this.authService.requestPasswordReset(this.forgotPasswordEmail).subscribe({
      next: (res) => {
        this.isResetting = false;
        this.forgotPasswordSuccess = res.message;
      },
      error: (err: Error) => {
        this.isResetting = false;
        this.forgotPasswordError = err?.message || 'Failed to dispatch reset instructions.';
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please provide a valid corporate email address.';
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (this.returnUrl) {
          const isAdminRoute = this.returnUrl.startsWith('/admin');
          const isEmployeeRoute = this.returnUrl.startsWith('/employee');

          if (user.role === 'ADMIN' && isAdminRoute) {
            this.router.navigateByUrl(this.returnUrl);
            return;
          }
          if (user.role === 'EMPLOYEE' && isEmployeeRoute) {
            this.router.navigateByUrl(this.returnUrl);
            return;
          }
        }

        this.redirectUserByRole();
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Invalid credentials. Please verify your email.';
      }
    });
  }

  private redirectUserByRole(): void {
    const role = this.authService.currentRole;
    if (role === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else if (role === 'EMPLOYEE') {
      this.router.navigate(['/employee']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
