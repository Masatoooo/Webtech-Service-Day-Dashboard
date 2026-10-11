import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminDashboardComponent, ExecutiveTotals } from './admin-dashboard.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import {
  User,
  Activity,
  NGO,
  Registration,
  Attendance,
  ActivitySlotSummary
} from '../../../../models';

describe('AdminDashboardComponent (Task 08: Use Case 4)', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  let mockAuthService: any;
  let mockDataStore: any;
  let mockActivityService: any;
  let mockAttendanceService: any;

  // BehaviorSubjects to simulate dynamic reactive updates from data store
  let activitiesSubject: BehaviorSubject<Activity[]>;
  let ngosSubject: BehaviorSubject<NGO[]>;
  let registrationsSubject: BehaviorSubject<Registration[]>;
  let usersSubject: BehaviorSubject<User[]>;
  let attendanceSubject: BehaviorSubject<Attendance[]>;

  const mockAdminUser: User = {
    id: 'usr-admin-1',
    name: 'Marcus Vance',
    email: 'marcus.vance@company.org',
    role: 'ADMIN',
    department: 'Corporate Sustainability'
  };

  const mockNgo1: NGO = {
    id: 'ngo-1',
    name: 'Yayasan Konservasi Laut',
    description: 'Marine conservation',
    contactName: 'Hendra',
    contactEmail: 'hendra@test.org',
    approvalStatus: 'APPROVED'
  };

  const mockNgo2: NGO = {
    id: 'ngo-2',
    name: 'Sahabat Belajar Anak',
    description: 'Youth education',
    contactName: 'Rina',
    contactEmail: 'rina@test.org',
    approvalStatus: 'APPROVED'
  };

  const mockActivities: Activity[] = [
    {
      id: 'act-1',
      ngoId: 'ngo-1',
      title: 'Mangrove Coastal Restoration',
      description: 'Coastal planting project',
      serviceType: 'ENVIRONMENT',
      location: 'Pantai Indah Kapuk',
      startDateTime: '2026-11-20T08:00:00Z',
      endDateTime: '2026-11-20T14:00:00Z',
      registrationCutoff: '2026-11-15T23:59:59Z',
      capacity: 10,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-2',
      ngoId: 'ngo-2',
      title: 'Coding Class for Underprivileged Youth',
      description: 'Teach basics of programming',
      serviceType: 'EDUCATION',
      location: 'Jakarta Community Hub',
      startDateTime: '2026-11-25T09:00:00Z',
      endDateTime: '2026-11-25T15:00:00Z',
      registrationCutoff: '2026-11-18T23:59:59Z',
      capacity: 5,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-3',
      ngoId: 'ngo-1',
      title: 'Community Food Kitchen Packing',
      description: 'Food prep and boxing',
      serviceType: 'FOOD_SECURITY',
      location: 'Tebet Central Depot',
      startDateTime: '2026-12-01T07:00:00Z',
      endDateTime: '2026-12-01T12:00:00Z',
      registrationCutoff: '2026-11-28T23:59:59Z',
      capacity: 15,
      publicationStatus: 'PUBLISHED'
    }
  ];

  const mockUsers: User[] = [
    mockAdminUser,
    {
      id: 'usr-emp-1',
      name: 'Alice Chen',
      email: 'alice.chen@company.org',
      role: 'EMPLOYEE',
      department: 'Engineering'
    },
    {
      id: 'usr-emp-2',
      name: 'David Pratama',
      email: 'david.pratama@company.org',
      role: 'EMPLOYEE',
      department: 'Human Resources'
    }
  ];

  const mockRegistrations: Registration[] = [
    {
      id: 'reg-1',
      activityId: 'act-1',
      employeeId: 'usr-emp-1',
      status: 'ACTIVE',
      registeredAt: '2026-10-01T10:00:00Z'
    },
    {
      id: 'reg-2',
      activityId: 'act-1',
      employeeId: 'usr-emp-2',
      status: 'ACTIVE',
      registeredAt: '2026-10-02T11:00:00Z'
    },
    {
      id: 'reg-3',
      activityId: 'act-2',
      employeeId: 'usr-emp-1',
      status: 'CANCELLED',
      cancellationReason: 'Schedule conflict',
      registeredAt: '2026-10-03T09:00:00Z',
      updatedAt: '2026-10-04T14:00:00Z'
    }
  ];

  const mockAttendances: Attendance[] = [
    {
      id: 'att-1',
      registrationId: 'reg-1',
      activityId: 'act-1',
      employeeId: 'usr-emp-1',
      status: 'CHECKED_IN',
      checkedInAt: '2026-11-20T08:15:00Z',
      verificationMethod: 'QR_SCAN',
      token: 'tok-mock-123'
    }
  ];

  beforeEach(async () => {
    activitiesSubject = new BehaviorSubject<Activity[]>([...mockActivities]);
    ngosSubject = new BehaviorSubject<NGO[]>([mockNgo1, mockNgo2]);
    registrationsSubject = new BehaviorSubject<Registration[]>([...mockRegistrations]);
    usersSubject = new BehaviorSubject<User[]>([...mockUsers]);
    attendanceSubject = new BehaviorSubject<Attendance[]>([...mockAttendances]);

    mockAuthService = {
      currentUser$: of(mockAdminUser)
    };

    mockDataStore = {
      activities$: activitiesSubject.asObservable(),
      ngos$: ngosSubject.asObservable(),
      registrations$: registrationsSubject.asObservable(),
      users$: usersSubject.asObservable(),
      attendance$: attendanceSubject.asObservable()
    };

    mockActivityService = {
      computeSlotSummary: vi.fn().mockImplementation(
        (act: Activity, regs: Registration[]): ActivitySlotSummary => {
          const activeRegs = regs.filter((r) => r.activityId === act.id && r.status === 'ACTIVE');
          const filled = activeRegs.length;
          const remaining = Math.max(0, act.capacity - filled);
          const pct = act.capacity > 0 ? Math.min(100, Math.round((filled / act.capacity) * 100)) : 0;
          let status = 'AVAILABLE';
          if (remaining === 0) status = 'FULL';
          else if (remaining <= 3) status = 'ALMOST_FULL';
          return {
            activityId: act.id,
            capacity: act.capacity,
            filledSlots: filled,
            remainingSlots: remaining,
            utilisationPercentage: pct,
            availabilityStatus: status as any
          };
        }
      ),
      isCutoffPassed: vi.fn().mockReturnValue(false)
    };

    mockAttendanceService = {
      getAttendanceByRegistrationId: vi.fn().mockReturnValue(of(null))
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: DataStoreService, useValue: mockDataStore },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: AttendanceService, useValue: mockAttendanceService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and create AdminDashboardComponent', () => {
    expect(component).toBeTruthy();
  });

  describe('Executive Reconciled Totals (Scope 1 & Scope 2)', () => {
    it('should calculate metrics dynamically from data store without hardcoding', async () => {
      const totals = await firstValueFrom(component.totals$);

      // Total activities: 3
      expect(totals.totalActivities).toBe(3);
      expect(totals.publishedActivities).toBe(3);

      // Total offered places = 10 + 5 + 15 = 30
      expect(totals.totalOfferedPlaces).toBe(30);

      // Active registrations: reg-1 and reg-2 = 2
      expect(totals.placesTaken).toBe(2);
      expect(totals.activeRegistrations).toBe(2);

      // Cancelled registrations: reg-3 = 1
      expect(totals.cancelledRegistrations).toBe(1);

      // Remaining places = 30 - 2 = 28
      expect(totals.placesRemaining).toBe(28);

      // Capacity utilisation = round(2 / 30 * 100) = 7%
      expect(totals.capacityUtilisationPct).toBe(7);

      // Reconcile invariant: Offered = Taken + Remaining
      expect(totals.placesTaken + totals.placesRemaining).toBe(totals.totalOfferedPlaces);
    });

    it('should dynamically update totals without page reload when registrations change', async () => {
      // Simulate new active registration on act-2
      const updatedRegs: Registration[] = [
        ...mockRegistrations,
        {
          id: 'reg-4',
          activityId: 'act-2',
          employeeId: 'usr-emp-2',
          status: 'ACTIVE',
          registeredAt: '2026-10-11T12:00:00Z'
        }
      ];

      registrationsSubject.next(updatedRegs);
      fixture.detectChanges();

      const totals = await firstValueFrom(component.totals$);
      expect(totals.placesTaken).toBe(3);
      expect(totals.placesRemaining).toBe(27);
      expect(totals.totalOfferedPlaces).toBe(30);
      // Utilisation: 3 / 30 = 10%
      expect(totals.capacityUtilisationPct).toBe(10);
    });

    it('should handle zero offered places gracefully without division by zero', async () => {
      activitiesSubject.next([]);
      fixture.detectChanges();

      const totals = await firstValueFrom(component.totals$);
      expect(totals.totalOfferedPlaces).toBe(0);
      expect(totals.placesRemaining).toBe(0);
      expect(totals.capacityUtilisationPct).toBe(0);
    });

    it('should clamp remaining places safely at zero when registrations exceed capacity', async () => {
      // Create an activity with capacity 1 and 2 active registrations
      const smallActivity: Activity = {
        ...mockActivities[0],
        capacity: 1
      };
      activitiesSubject.next([smallActivity]);

      const overflowRegs: Registration[] = [
        {
          id: 'r1',
          activityId: 'act-1',
          employeeId: 'usr-emp-1',
          status: 'ACTIVE',
          registeredAt: '2026-10-01T10:00:00Z'
        },
        {
          id: 'r2',
          activityId: 'act-1',
          employeeId: 'usr-emp-2',
          status: 'ACTIVE',
          registeredAt: '2026-10-01T11:00:00Z'
        }
      ];
      registrationsSubject.next(overflowRegs);
      fixture.detectChanges();

      const totals = await firstValueFrom(component.totals$);
      expect(totals.totalOfferedPlaces).toBe(1);
      expect(totals.placesTaken).toBe(2);
      expect(totals.placesRemaining).toBe(0); // Clamped at 0
    });
  });

  describe('Needs Attention Radar (Scope 4)', () => {
    it('should flag activities nearing capacity (Almost Full)', () => {
      // Mock act-2 as having 2 remaining slots (<= 3)
      mockActivityService.computeSlotSummary.mockImplementation((act: Activity) => ({
        activityId: act.id,
        capacity: act.capacity,
        filledSlots: act.capacity - 2,
        remainingSlots: 2,
        utilisationPercentage: 60,
        availabilityStatus: 'ALMOST_FULL'
      }));

      // Trigger recomputation
      activitiesSubject.next([...mockActivities]);
      fixture.detectChanges();

      const almostFullItem = component.needsAttentionItems.find((i) => i.type === 'ALMOST_FULL');
      expect(almostFullItem).toBeDefined();
      expect(almostFullItem?.severity).toBe('medium');
    });

    it('should flag activities with passed cut-off date', () => {
      mockActivityService.isCutoffPassed.mockImplementation((act: Activity) => act.id === 'act-1');

      activitiesSubject.next([...mockActivities]);
      fixture.detectChanges();

      const cutoffItem = component.needsAttentionItems.find((i) => i.activity.id === 'act-1' && i.type === 'APPROACHING_CUTOFF');
      expect(cutoffItem).toBeDefined();
      expect(cutoffItem?.severity).toBe('high');
    });
  });

  describe('Activity Operational Table Filtering (Scope 3 & 6)', () => {
    it('should list all operational activities by default', () => {
      expect(component.filteredOperationalRows.length).toBe(3);
    });

    it('should filter operational activities by search term', () => {
      component.activitySearchTerm = 'Mangrove';
      expect(component.filteredOperationalRows.length).toBe(1);
      expect(component.filteredOperationalRows[0].activity.id).toBe('act-1');
    });

    it('should filter operational activities by category', () => {
      component.selectedCategory = 'FOOD_SECURITY';
      expect(component.filteredOperationalRows.length).toBe(1);
      expect(component.filteredOperationalRows[0].activity.id).toBe('act-3');
    });

    it('should reset activity filters', () => {
      component.activitySearchTerm = 'Youth';
      component.selectedCategory = 'EDUCATION';
      expect(component.filteredOperationalRows.length).toBe(1);

      component.resetActivityFilters();
      expect(component.activitySearchTerm).toBe('');
      expect(component.selectedCategory).toBe('ALL');
      expect(component.filteredOperationalRows.length).toBe(3);
    });
  });

  describe('Participant Monitoring Roster (Scope 5)', () => {
    it('should list all registrations mapped with user and activity details', () => {
      expect(component.filteredRosterRows.length).toBe(3);

      const row1 = component.filteredRosterRows.find((r) => r.registration.id === 'reg-1');
      expect(row1?.user?.name).toBe('Alice Chen');
      expect(row1?.activity?.title).toBe('Mangrove Coastal Restoration');
      expect(row1?.attendance?.status).toBe('CHECKED_IN');
    });

    it('should filter roster by participant name or email search', () => {
      component.participantSearchTerm = 'David';
      expect(component.filteredRosterRows.length).toBe(1);
      expect(component.filteredRosterRows[0].registration.id).toBe('reg-2');
    });

    it('should filter roster by selected activity', () => {
      component.selectedRosterActivityId = 'act-2';
      expect(component.filteredRosterRows.length).toBe(1);
      expect(component.filteredRosterRows[0].registration.id).toBe('reg-3');
    });

    it('should filter roster by registration state (ACTIVE / CANCELLED)', () => {
      component.selectedRegistrationStatus = 'CANCELLED';
      expect(component.filteredRosterRows.length).toBe(1);
      expect(component.filteredRosterRows[0].registration.id).toBe('reg-3');
      expect(component.filteredRosterRows[0].isCancelled).toBe(true);
    });

    it('should set roster filter when filterRosterByActivity is triggered from activity row action', () => {
      component.filterRosterByActivity('act-1');
      expect(component.selectedRosterActivityId).toBe('act-1');
      expect(component.filteredRosterRows.length).toBe(2);
    });

    it('should reset roster filters', () => {
      component.participantSearchTerm = 'Alice';
      component.selectedRegistrationStatus = 'ACTIVE';
      expect(component.filteredRosterRows.length).toBe(1);

      component.resetRosterFilters();
      expect(component.participantSearchTerm).toBe('');
      expect(component.selectedRegistrationStatus).toBe('ALL');
      expect(component.filteredRosterRows.length).toBe(3);
    });
  });
});
