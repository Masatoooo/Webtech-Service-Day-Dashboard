import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from '../../../shared/shared.module';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockAuthService = {
      isAuthenticated: false,
      register: vi.fn().mockReturnValue(
        of({
          id: 'usr-new-1',
          name: 'Jane Doe',
          email: 'jane.doe@corp.example.com',
          role: 'EMPLOYEE',
          department: 'Software Engineering'
        })
      )
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule, SharedModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create RegisterComponent and initialize the registration form', () => {
    expect(component).toBeTruthy();
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('name')).toBeDefined();
    expect(component.registerForm.get('email')).toBeDefined();
    expect(component.registerForm.get('password')).toBeDefined();
    expect(component.registerForm.get('confirmPassword')).toBeDefined();
    expect(component.registerForm.get('department')).toBeDefined();
  });

  it('should toggle password visibility flags', () => {
    expect(component.showPassword).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);

    expect(component.showConfirmPassword).toBe(false);
    component.toggleConfirmPasswordVisibility();
    expect(component.showConfirmPassword).toBe(true);
  });

  it('should validate password mismatch', () => {
    component.registerForm.patchValue({
      name: 'Jane Doe',
      email: 'jane.doe@corp.example.com',
      department: 'Software Engineering',
      password: 'password123',
      confirmPassword: 'differentPassword'
    });

    component.onSubmit();
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
    expect(component.errorMessage).toContain('Passwords do not match');
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should submit valid registration and redirect to employee view', () => {
    component.registerForm.patchValue({
      name: 'Jane Doe',
      email: 'jane.doe@corp.example.com',
      department: 'Software Engineering',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();
    expect(mockAuthService.register).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane.doe@corp.example.com',
      department: 'Software Engineering'
    });
    expect(component.successMessage).toContain('Account created successfully');
  });

  it('should display error when registration service fails', () => {
    mockAuthService.register.mockReturnValue(
      throwError(() => new Error('An account with this corporate email already exists.'))
    );

    component.registerForm.patchValue({
      name: 'Jane Doe',
      email: 'jane.doe@corp.example.com',
      department: 'Software Engineering',
      password: 'password123',
      confirmPassword: 'password123'
    });

    component.onSubmit();
    expect(component.errorMessage).toContain('already exists');
  });
});
