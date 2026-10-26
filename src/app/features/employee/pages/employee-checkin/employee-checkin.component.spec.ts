import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmployeeCheckinComponent } from './employee-checkin.component';
import { AuthService } from '../../../../core/services/auth.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Activity, Attendance, CheckInSuccessResult, Registration, User } from '../../../../models';

describe('EmployeeCheckinComponent', () => {
  let component: EmployeeCheckinComponent;
  let fixture: ComponentFixture<EmployeeCheckinComponent>;
  let mockAuthService: any;
  let mockAttendanceService: any;
  let mockDataStore: any;

  const mockUser: User = {
    id: 'usr-alice',
    name: 'Alice Chen',
    email: 'alice@corp.com',
    role: 'EMPLOYEE',
    department: 'Engineering'
  };

  const mockActivity: Activity = {
    id: 'act-1',
    ngoId: 'ngo-1',
    title: 'Mangrove Coastal Restoration',
    description: 'Planting trees',
    serviceType: 'ENVIRONMENT',
    location: 'Pasir Ris Park',
    startDateTime: '2026-11-20T08:00:00Z',
    endDateTime: '2026-11-20T12:00:00Z',
    registrationCutoff: '2026-11-15T23:59:59Z',
    capacity: 25,
    publicationStatus: 'PUBLISHED'
  };

  const mockRegistration: Registration = {
    id: 'reg-alice-1',
    employeeId: 'usr-alice',
    activityId: 'act-1',
    status: 'ACTIVE',
    registeredAt: '2026-10-01T08:00:00Z'
  };

  const mockAttendance: Attendance = {
    id: 'att-1',
    registrationId: 'reg-alice-1',
    activityId: 'act-1',
    employeeId: 'usr-alice',
    checkedInAt: '2026-11-20T08:00:00Z',
    status: 'CHECKED_IN',
    verificationMethod: 'MANUAL_FALLBACK',
    token: 'SDD-CHK-act-1-TEST'
  };

  beforeEach(async () => {
    mockAuthService = {
      currentUser$: of(mockUser),
      currentUserSnapshot: mockUser
    };

    mockAttendanceService = {
      generateActivityToken: vi.fn((id: string) => `SDD-CHK-${id}-TEST`),
      executeCheckIn: vi.fn((params: any) =>
        of({
          attendance: mockAttendance,
          activity: mockActivity,
          registration: mockRegistration,
          isDemoSimulation: true
        } as CheckInSuccessResult)
      )
    };

    mockDataStore = {
      registrations$: of([mockRegistration]),
      activities$: of([mockActivity]),
      attendance$: of([]),
      registrationsSnapshot: [mockRegistration],
      activitiesSnapshot: [mockActivity],
      attendanceSnapshot: []
    };

    await TestBed.configureTestingModule({
      declarations: [EmployeeCheckinComponent, StatusBadgeComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: DataStoreService, useValue: mockDataStore },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeCheckinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load employee registered initiatives', () => {
    expect(component.currentUser?.id).toBe('usr-alice');
    expect(component.employeeRegistrations.length).toBe(1);
    expect(component.employeeRegistrations[0].activity.id).toBe('act-1');
    expect(component.employeeRegistrations[0].isCheckedIn).toBe(false);
  });

  it('should toggle between SCANNER and MANUAL modes', () => {
    expect(component.activeMode).toBe('SCANNER');
    component.setMode('MANUAL');
    expect(component.activeMode).toBe('MANUAL');
    component.setMode('SCANNER');
    expect(component.activeMode).toBe('SCANNER');
  });

  it('should prefill demo token when helper button is clicked', () => {
    component.selectDemoActivityToken('act-1');
    expect(component.manualTokenInput).toBe('SDD-CHK-act-1-TEST');
  });

  it('should successfully submit manual check-in', () => {
    component.manualTokenInput = 'SDD-CHK-act-1-TEST';
    component.submitManualCheckIn();

    expect(mockAttendanceService.executeCheckIn).toHaveBeenCalledWith({
      tokenInput: 'SDD-CHK-act-1-TEST',
      employeeId: 'usr-alice',
      method: 'MANUAL_FALLBACK'
    });
    expect(component.checkInSuccess).toBeTruthy();
    expect(component.checkInSuccess?.activity.title).toBe('Mangrove Coastal Restoration');
  });

  it('should handle validation error and display message', () => {
    mockAttendanceService.executeCheckIn.mockReturnValue(
      throwError(() => new Error('Duplicate Check-In: You already checked in.'))
    );

    component.manualTokenInput = 'SDD-CHK-act-1-TEST';
    component.submitManualCheckIn();

    expect(component.checkInError).toContain('Duplicate Check-In');
    expect(component.checkInSuccess).toBeNull();
  });

  it('should reset check-in state on resetCheckIn', () => {
    component.checkInSuccess = {
      attendance: mockAttendance,
      activity: mockActivity,
      registration: mockRegistration,
      isDemoSimulation: true
    };
    component.resetCheckIn();
    expect(component.checkInSuccess).toBeNull();
    expect(component.checkInError).toBe('');
  });
});
