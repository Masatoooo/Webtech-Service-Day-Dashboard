import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModule } from '../auth.module';
import { User } from '../../../models';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: {
    isAuthenticated: boolean;
    currentRole: string | null;
    login: (email: string, password?: string) => any;
    requestPasswordReset?: (email: string) => any;
  };
  let navigatedRoutes: any[] = [];
  let mockRouter: {
    navigate: (commands: any[]) => Promise<boolean>;
    navigateByUrl: (url: string) => Promise<boolean>;
  };

  const adminUser: User = {
    id: 'usr-admin-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@corp.example.com',
    role: 'ADMIN',
    department: 'Corporate Sustainability & CSR'
  };

  const employeeUser: User = {
    id: 'usr-emp-1',
    name: 'Alice Chen',
    email: 'alice.chen@corp.example.com',
    role: 'EMPLOYEE',
    department: 'Software Engineering'
  };

  beforeEach(async () => {
    navigatedRoutes = [];

    mockAuthService = {
      isAuthenticated: false,
      currentRole: null,
      login: () => of(adminUser)
    };

    mockRouter = {
      navigate: async (commands: any[]) => {
        navigatedRoutes.push(commands);
        return true;
      },
      navigateByUrl: async (url: string) => {
        navigatedRoutes.push([url]);
        return true;
      }
    };

    await TestBed.configureTestingModule({
      imports: [AuthModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render email and password inputs', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#login-email')).toBeTruthy();
    expect(compiled.querySelector('#login-password')).toBeTruthy();
    expect(compiled.querySelector('#btn-login-submit')).toBeTruthy();
  });

  it('must NOT render any role selector, role radio, or role cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('select[name="role"]')).toBeFalsy();
    expect(compiled.querySelector('.role-selector')).toBeFalsy();
    expect(compiled.querySelector('.role-toggle')).toBeFalsy();
    expect(compiled.querySelector('.role-card')).toBeFalsy();
  });

  it('should display validation error when submitting with empty or invalid email', () => {
    component.loginForm.controls['email'].setValue('invalid-format');
    component.onSubmit();

    expect(component.errorMessage).toContain('valid corporate email address');
  });

  it('should authenticate admin and navigate to /admin', async () => {
    mockAuthService.login = () => of(adminUser);
    mockAuthService.currentRole = 'ADMIN';

    component.loginForm.controls['email'].setValue('admin@serviceday.demo');
    component.loginForm.controls['password'].setValue('demo123');

    component.onSubmit();

    expect(navigatedRoutes).toContainEqual(['/admin']);
  });

  it('should authenticate employee and navigate to /employee', async () => {
    mockAuthService.login = () => of(employeeUser);
    mockAuthService.currentRole = 'EMPLOYEE';

    component.loginForm.controls['email'].setValue('employee@serviceday.demo');
    component.loginForm.controls['password'].setValue('demo123');

    component.onSubmit();

    expect(navigatedRoutes).toContainEqual(['/employee']);
  });

  it('should display error message on invalid credentials', () => {
    mockAuthService.login = () =>
      throwError(() => new Error('Invalid credentials. Please enter a recognized employee or administrator email.'));

    component.loginForm.controls['email'].setValue('wrong@corp.example.com');
    component.loginForm.controls['password'].setValue('invalid');

    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Invalid credentials');
    expect(component.isLoading).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('Invalid credentials');
  });

  it('should notify change detection and clear loading when login fails asynchronously', () => {
    const cdr = (component as unknown as { cdr: { markForCheck: () => void } }).cdr;
    const markForCheck = vi.spyOn(cdr, 'markForCheck');
    mockAuthService.login = () =>
      throwError(() => new Error('Invalid credentials.'));

    component.loginForm.controls['email'].setValue('wrong@corp.example.com');
    component.loginForm.controls['password'].setValue('invalid');

    component.onSubmit();

    expect(component.isLoading).toBe(false);
    expect(markForCheck).toHaveBeenCalled();
  });

  it('should clear loading if the auth service throws synchronously', () => {
    mockAuthService.login = () => {
      throw new Error('Unexpected authentication failure.');
    };

    component.loginForm.controls['email'].setValue('wrong@corp.example.com');
    component.loginForm.controls['password'].setValue('invalid');

    component.onSubmit();

    expect(component.isLoading).toBe(false);
    expect(component.errorMessage).toContain('Unexpected authentication failure.');
  });

  it('should render the error and reset the button after an async login failure', async () => {
    fixture.autoDetectChanges();
    mockAuthService.login = () =>
      timer(0).pipe(
        switchMap(() =>
          throwError(() => new Error('Invalid credentials. Please try again.'))
        )
      );

    component.loginForm.controls['email'].setValue('wrong@corp.example.com');
    component.loginForm.controls['password'].setValue('invalid');

    component.onSubmit();

    const compiled = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => {
      expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('Invalid credentials');
    });
    expect(compiled.querySelector('#btn-login-submit')?.textContent).toContain('SIGN IN');
  });

  it('should toggle password visibility on button click', () => {
    expect(component.showPassword).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    const toggleBtn = compiled.querySelector('#btn-toggle-password') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showPassword).toBe(true);

    const passwordInput = compiled.querySelector('#login-password') as HTMLInputElement;
    expect(passwordInput.type).toBe('text');

    toggleBtn.click();
    fixture.detectChanges();
    expect(component.showPassword).toBe(false);
    expect(passwordInput.type).toBe('password');
  });

  it('should open and handle forgot password view', () => {
    mockAuthService.requestPasswordReset = vi.fn().mockReturnValue(
      of({ success: true, message: 'Password reset instructions have been dispatched' })
    );

    const compiled = fixture.nativeElement as HTMLElement;
    const forgotBtn = compiled.querySelector('#btn-forgot-password') as HTMLButtonElement;
    expect(forgotBtn).toBeTruthy();

    forgotBtn.click();
    fixture.detectChanges();
    expect(component.showForgotPasswordModal).toBe(true);

    const resetEmailInput = compiled.querySelector('#reset-email') as HTMLInputElement;
    resetEmailInput.value = 'test@corp.example.com';
    resetEmailInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const submitResetBtn = compiled.querySelector('#btn-submit-reset') as HTMLButtonElement;
    submitResetBtn.click();
    fixture.detectChanges();

    expect(component.forgotPasswordSuccess).toContain('dispatched');

    const backBtn = compiled.querySelector('#btn-back-to-login') as HTMLButtonElement;
    backBtn.click();
    fixture.detectChanges();
    expect(component.showForgotPasswordModal).toBe(false);
  });

  it('should render a register navigation link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const registerLink = compiled.querySelector('#link-goto-register');
    expect(registerLink).toBeTruthy();
    expect(registerLink?.getAttribute('routerLink')).toBe('/register');
  });
});
