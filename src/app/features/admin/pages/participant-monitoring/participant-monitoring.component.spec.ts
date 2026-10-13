import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ParticipantMonitoringComponent } from './participant-monitoring.component';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import {
  Activity,
  User,
  Registration,
  Attendance,
  NGO
} from '../../../../models';

describe('ParticipantMonitoringComponent', () => {
  let component: ParticipantMonitoringComponent;
  let fixture: ComponentFixture<ParticipantMonitoringComponent>;

  let mockActivitiesSubject: BehaviorSubject<Activity[]>;
  let mockRegistrationsSubject: BehaviorSubject<Registration[]>;
  let mockUsersSubject: BehaviorSubject<User[]>;
  let mockAttendanceSubject: BehaviorSubject<Attendance[]>;
  let mockNgosSubject: BehaviorSubject<NGO[]>;

  let mockDataStore: any;
  let mockActivityService: any;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockUsers: User[] = [
    {
      id: 'usr-1',
      name: 'Alice Chen',
      email: 'alice@company.org',
      role: 'EMPLOYEE',
      department: 'Engineering'
    },
    {
      id: 'usr-2',
      name: 'Bob Tan',
      email: 'bob@company.org',
      role: 'EMPLOYEE',
      department: 'Finance'
    }
  ];

  const mockNgos: NGO[] = [
    {
      id: 'ngo-1',
      name: 'Yayasan Konservasi Laut',
      description: 'Marine conservation',
      contactName: 'Hendra Wijaya',
      contactEmail: 'hendra@test.org',
      approvalStatus: 'APPROVED'
    }
  ];

  const mockActivities: Activity[] = [
    {
      id: 'act-1',
      ngoId: 'ngo-1',
      title: 'Mangrove Coastal Restoration',
      description: 'Planting mangroves',
      serviceType: 'ENVIRONMENT',
      location: 'Pantai Indah Kapuk',
      startDateTime: '2026-11-20T08:00:00Z',
      endDateTime: '2026-11-20T14:00:00Z',
      registrationCutoff: '2026-11-15T23:59:59Z',
      capacity: 20,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-2',
      ngoId: 'ngo-1',
      title: 'Coding Class for Kids',
      description: 'Teaching coding',
      serviceType: 'EDUCATION',
      location: 'Hub',
      startDateTime: '2026-11-25T09:00:00Z',
      endDateTime: '2026-11-25T15:00:00Z',
      registrationCutoff: '2026-11-18T23:59:59Z',
      capacity: 10,
      publicationStatus: 'PUBLISHED'
    }
  ];

  const mockRegistrations: Registration[] = [
    {
      id: 'reg-1',
      activityId: 'act-1',
      employeeId: 'usr-1',
      status: 'ACTIVE',
      registeredAt: '2026-10-01T10:00:00Z'
    },
    {
      id: 'reg-2',
      activityId: 'act-1',
      employeeId: 'usr-2',
      status: 'CANCELLED',
      cancellationReason: 'Doctor appointment',
      registeredAt: '2026-10-02T11:00:00Z'
    }
  ];

  const mockAttendances: Attendance[] = [
    {
      id: 'att-1',
      registrationId: 'reg-1',
      activityId: 'act-1',
      employeeId: 'usr-1',
      status: 'CHECKED_IN',
      checkedInAt: '2026-11-20T08:15:00Z',
      verificationMethod: 'QR_SCAN',
      token: 'tok-123'
    }
  ];

  beforeEach(async () => {
    mockActivitiesSubject = new BehaviorSubject<Activity[]>([...mockActivities]);
    mockRegistrationsSubject = new BehaviorSubject<Registration[]>([...mockRegistrations]);
    mockUsersSubject = new BehaviorSubject<User[]>([...mockUsers]);
    mockAttendanceSubject = new BehaviorSubject<Attendance[]>([...mockAttendances]);
    mockNgosSubject = new BehaviorSubject<NGO[]>([...mockNgos]);
    queryParamsSubject = new BehaviorSubject<any>({});

    mockDataStore = {
      activities$: mockActivitiesSubject.asObservable(),
      registrations$: mockRegistrationsSubject.asObservable(),
      users$: mockUsersSubject.asObservable(),
      attendance$: mockAttendanceSubject.asObservable(),
      ngos$: mockNgosSubject.asObservable()
    };

    mockActivityService = {
      computeSlotSummary: vi.fn().mockReturnValue({
        activityId: 'act-1',
        capacity: 20,
        filledSlots: 1,
        remainingSlots: 19,
        utilisationPercentage: 5,
        availabilityStatus: 'AVAILABLE'
      })
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [ParticipantMonitoringComponent],
      providers: [
        { provide: DataStoreService, useValue: mockDataStore },
        { provide: ActivityService, useValue: mockActivityService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and create ParticipantMonitoringComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should list mapped registrations with user and attendance data', () => {
    expect(component.allRosterRows.length).toBe(2);
    const row1 = component.allRosterRows.find((r) => r.registration.id === 'reg-1');
    expect(row1?.user?.name).toBe('Alice Chen');
    expect(row1?.isCheckedIn).toBe(true);
    expect(row1?.isCancelled).toBe(false);

    const row2 = component.allRosterRows.find((r) => r.registration.id === 'reg-2');
    expect(row2?.user?.name).toBe('Bob Tan');
    expect(row2?.isCancelled).toBe(true);
  });

  it('should compute view KPI metrics', () => {
    expect(component.metrics.totalEnrollments).toBe(2);
    expect(component.metrics.activeVolunteers).toBe(1);
    expect(component.metrics.confirmedAttendance).toBe(1);
    expect(component.metrics.withdrawn).toBe(1);
  });

  it('should filter roster by participant name or email search', () => {
    component.participantSearchTerm = 'Alice';
    component.applyFilters();
    expect(component.filteredRosterRows.length).toBe(1);
    expect(component.filteredRosterRows[0].registration.id).toBe('reg-1');
  });

  it('should filter roster by registration status (ACTIVE vs CANCELLED)', () => {
    component.selectedRegistrationStatus = 'CANCELLED';
    component.applyFilters();
    expect(component.filteredRosterRows.length).toBe(1);
    expect(component.filteredRosterRows[0].registration.id).toBe('reg-2');
  });

  it('should filter roster by attendance status (CHECKED_IN)', () => {
    component.selectedAttendanceStatus = 'CHECKED_IN';
    component.applyFilters();
    expect(component.filteredRosterRows.length).toBe(1);
    expect(component.filteredRosterRows[0].isCheckedIn).toBe(true);
  });

  it('should reset roster filters', () => {
    component.participantSearchTerm = 'Bob';
    component.selectedRegistrationStatus = 'CANCELLED';
    component.applyFilters();
    expect(component.filteredRosterRows.length).toBe(1);

    component.resetFilters();
    expect(component.participantSearchTerm).toBe('');
    expect(component.selectedRegistrationStatus).toBe('ALL');
    expect(component.filteredRosterRows.length).toBe(2);
  });

  it('should filter by activity when onActivityChange is called', () => {
    component.onActivityChange('act-2');
    expect(component.selectedActivityId).toBe('act-2');
    expect(component.filteredRosterRows.length).toBe(0);
  });
});
