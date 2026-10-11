import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly departments = [
    'Software Engineering',
    'Human Resources',
    'Finance & Accounting',
    'Operations & Supply',
    'Marketing & PR',
    'Sustainability & CSR'
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/employee']);
      return;
    }

    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        department: ['Software Engineering', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      { validators: passwordMatchValidator }
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      if (this.registerForm.hasError('passwordMismatch')) {
        this.errorMessage = 'Passwords do not match. Please verify.';
      } else {
        this.errorMessage = 'Please complete all required registration fields correctly.';
      }
      return;
    }

    this.errorMessage = null;
    this.isLoading = true;

    const { name, email, department } = this.registerForm.value;

    this.authService.register({ name, email, department }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Directing to employee dashboard...';
        setTimeout(() => {
          this.router.navigate(['/employee']);
        }, 800);
      },
      error: (err: Error) => {
        this.isLoading = false;
        this.errorMessage = err?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
