import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MyRegistrationsComponent } from './my-registrations.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Activity, NGO, Registration, User } from '../../../../models';

describe('MyRegistrationsComponent', () => {
  let component: MyRegistrationsComponent;
  let fixture: ComponentFixture<MyRegistrationsComponent>;
  let mockAuthService: any;
  let mockDataStore: any;
  let mockActivityService: any;
  let mockRegistrationService: any;

  const mockUser: User = {
    id: 'usr-alice',
    name: 'Alice Chen',
    email: 'alice.chen@corp.example.com',
    role: 'EMPLOYEE',
    department: 'Engineering'
  };

  const mockNgo1: NGO = {
    id: 'ngo-1',
    name: 'Coastal Care NGO',
    description: 'Eco NGO',
    contactName: 'Budi',
    contactEmail: 'budi@coastal.org',
    approvalStatus: 'APPROVED'
  };

  const mockNgo2: NGO = {
    id: 'ngo-2',
    name: 'Youth Edu Foundation',
    description: 'Edu NGO',
    contactName: 'Siti',
    contactEmail: 'siti@edu.org',
    approvalStatus: 'APPROVED'
  };

  // 1. Future active activity (upcoming)
  const actUpcoming: Activity = {
    id: 'act-upcoming-1',
    ngoId: 'ngo-1',
    title: 'Future Mangrove Restoration',
    description: 'Restoration',
    serviceType: 'ENVIRONMENT',
    location: 'North Jakarta',
    startDateTime: '2026-11-20T08:00:00',
    endDateTime: '2026-11-20T13:00:00',
    registrationCutoff: '2026-11-15T23:59:59',
    capacity: 20,
    publicationStatus: 'PUBLISHED'
  };

  // 2. Future active activity with passed cutoff (locked)
  const actLocked: Activity = {
    id: 'act-locked-1',
    ngoId: 'ngo-2',
    title: 'Locked Deadline Workshop',
    description: 'Deadline passed',
    serviceType: 'EDUCATION',
    location: 'Palmerah',
    startDateTime: '2026-11-25T09:00:00',
    endDateTime: '2026-11-25T15:00:00',
    registrationCutoff: '2026-10-01T23:59:59', // cutoff passed!
    capacity: 10,
    publicationStatus: 'PUBLISHED'
  };

  // 3. Past completed activity
  const actPast: Activity = {
    id: 'act-past-1',
    ngoId: 'ngo-1',
    title: 'Concluded Beach Cleanup',
    description: 'Finished',
    serviceType: 'ENVIRONMENT',
    location: 'Ancol',
    startDateTime: '2026-09-10T08:00:00',
    endDateTime: '2026-09-10T12:00:00',
    registrationCutoff: '2026-09-05T23:59:59',
    capacity: 15,
    publicationStatus: 'COMPLETED'
  };

  // 4. Eligible destination activity for transfer
  const actDestEligible: Activity = {
    id: 'act-dest-1',
    ngoId: 'ngo-2',
    title: 'Eligible Transfer STEM Day',
    description: 'Destination STEM',
    serviceType: 'EDUCATION',
    location: 'Central Jakarta',
    startDateTime: '2026-11-22T09:00:00',
    endDateTime: '2026-11-22T14:00:00',
    registrationCutoff: '2026-11-18T23:59:59',
    capacity: 10,
    publicationStatus: 'PUBLISHED'
  };

  const mockRegistrations: Registration[] = [
    {
      id: 'reg-up-1',
      employeeId: 'usr-alice',
      activityId: 'act-upcoming-1',
      status: 'ACTIVE',
      registeredAt: '2026-10-01T08:00:00'
    },
    {
      id: 'reg-locked-1',
      employeeId: 'usr-alice',
      activityId: 'act-locked-1',
      status: 'ACTIVE',
      registeredAt: '2026-09-20T08:00:00'
    },
    {
      id: 'reg-past-1',
      employeeId: 'usr-alice',
      activityId: 'act-past-1',
      status: 'ACTIVE',
      registeredAt: '2026-09-01T08:00:00'
    },
    {
      id: 'reg-can-1',
      employeeId: 'usr-alice',
      activityId: 'act-upcoming-1',
      status: 'CANCELLED',
      cancellationReason: 'Prior commitment',
      registeredAt: '2026-08-15T08:00:00',
      updatedAt: '2026-08-20T08:00:00'
    }
  ];

  beforeEach(async () => {
    mockAuthService = {
      currentUser$: of(mockUser)
    };

    mockDataStore = {
      registrations$: of(mockRegistrations),
      activities$: of([actUpcoming, actLocked, actPast, actDestEligible]),
      ngos$: of([mockNgo1, mockNgo2]),
      activitiesSnapshot: [actUpcoming, actLocked, actPast, actDestEligible],
      ngosSnapshot: [mockNgo1, mockNgo2],
      registrationsSnapshot: mockRegistrations
    };

    mockActivityService = {
      isCutoffPassed: (act: Activity) => act.id === 'act-locked-1' || act.id === 'act-past-1',
      computeSlotSummary: (act: Activity, regs: Registration[]) => ({
        activityId: act.id,
        capacity: act.capacity,
        filledSlots: 2,
        remainingSlots: act.capacity - 2,
        utilisationPercentage: 20,
        availabilityStatus: 'AVAILABLE'
      })
    };

    mockRegistrationService = {
      cancelRegistration: vi.fn().mockImplementation((regId: string, reason?: string) => {
        return of({
          id: regId,
          status: 'CANCELLED',
          cancellationReason: reason
        });
      }),
      transferRegistration: vi.fn().mockImplementation((regId: string, targetId: string, reason?: string) => {
        return of({
          oldRegistration: { id: regId, status: 'CANCELLED' },
          newRegistration: { id: 'reg-new-1', activityId: targetId, status: 'ACTIVE' }
        });
      }),
      getOverlappingActivities: vi.fn().mockReturnValue([])
    };

    await TestBed.configureTestingModule({
      declarations: [MyRegistrationsComponent, StatusBadgeComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: DataStoreService, useValue: mockDataStore },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: RegistrationService, useValue: mockRegistrationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyRegistrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and categorize registrations with correct counts', () => {
    expect(component.allCount).toBe(4);
    // Upcoming = reg-up-1 and reg-locked-1 (both active with endDateTime >= now)
    expect(component.upcomingCount).toBe(2);
    // Past = reg-past-1 (completed/past)
    expect(component.pastCount).toBe(1);
    // Cancelled = reg-can-1
    expect(component.cancelledCount).toBe(1);
  });

  it('should filter items accurately across tabs', () => {
    // Default tab is UPCOMING
    expect(component.activeTab).toBe('UPCOMING');
    expect(component.filteredItems.length).toBe(2);

    // Switch to PAST
    component.setTab('PAST');
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].registration.id).toBe('reg-past-1');

    // Switch to CANCELLED
    component.setTab('CANCELLED');
    expect(component.filteredItems.length).toBe(1);
    expect(component.filteredItems[0].registration.id).toBe('reg-can-1');

    // Switch to ALL
    component.setTab('ALL');
    expect(component.filteredItems.length).toBe(4);
  });

  it('should allow cancellation before cutoff and disable it once cutoff has passed (BR-09)', () => {
    const upcomingItem = component.allRegistrationItems.find((i) => i.registration.id === 'reg-up-1')!;
    expect(upcomingItem.canCancel).toBe(true);
    expect(upcomingItem.canTransfer).toBe(true);

    const lockedItem = component.allRegistrationItems.find((i) => i.registration.id === 'reg-locked-1')!;
    expect(lockedItem.canCancel).toBe(false);
    expect(lockedItem.cancelBlockReason).toContain('Cut-off deadline passed');
    expect(lockedItem.canTransfer).toBe(false);
  });

  it('should open cancel modal, submit cancellation, and display success banner', () => {
    const upcomingItem = component.allRegistrationItems.find((i) => i.registration.id === 'reg-up-1')!;
    component.openCancelModal(upcomingItem);
    expect(component.cancelModalItem).toBe(upcomingItem);

    component.cancelReason = 'Client commitment clash';
    component.confirmCancel();

    expect(mockRegistrationService.cancelRegistration).toHaveBeenCalledWith('reg-up-1', 'Client commitment clash');
    expect(component.cancelModalItem).toBeNull();
    expect(component.feedbackBanner?.type).toBe('success');
    expect(component.feedbackBanner?.message).toContain('successfully withdrawn');
  });

  it('should open transfer modal, populate eligible target activities, and complete atomic transfer', () => {
    const upcomingItem = component.allRegistrationItems.find((i) => i.registration.id === 'reg-up-1')!;
    component.openTransferModal(upcomingItem);

    expect(component.transferModalItem).toBe(upcomingItem);
    // Should list actDestEligible (approved NGO, published, open slots, cutoff active, not identical)
    expect(component.eligibleTransferActivities.length).toBeGreaterThan(0);
    expect(component.eligibleTransferActivities.some((t) => t.activity.id === 'act-dest-1')).toBe(true);

    // Select destination
    component.onSelectTargetActivity('act-dest-1');
    expect(component.selectedTargetActivityId).toBe('act-dest-1');

    component.transferReason = 'Switching to education focus';
    component.confirmTransfer();

    expect(mockRegistrationService.transferRegistration).toHaveBeenCalledWith(
      'reg-up-1',
      'act-dest-1',
      'Switching to education focus'
    );
    expect(component.transferModalItem).toBeNull();
    expect(component.feedbackBanner?.type).toBe('success');
    expect(component.feedbackBanner?.message).toContain('Successfully transferred');
  });

  it('should display warning banner if selected transfer activity overlaps with existing schedule (BR-11)', () => {
    mockRegistrationService.getOverlappingActivities.mockReturnValue([actLocked]);

    const upcomingItem = component.allRegistrationItems.find((i) => i.registration.id === 'reg-up-1')!;
    component.openTransferModal(upcomingItem);
    component.onSelectTargetActivity('act-dest-1');

    expect(component.transferOverlappingActivities.length).toBe(1);
    expect(component.transferOverlappingActivities[0].id).toBe('act-locked-1');
  });

  it('should preserve state and display error when transfer fails', () => {
    mockRegistrationService.transferRegistration.mockReturnValue(
      throwError(() => new Error('Destination activity has reached full capacity.'))
    );

    const upcomingItem = component.allRegistrationItems.find((i) => i.registration.id === 'reg-up-1')!;
    component.openTransferModal(upcomingItem);
    component.onSelectTargetActivity('act-dest-1');
    component.confirmTransfer();

    expect(component.transferError).toContain('full capacity');
    // Modal stays open so user is aware and source registration is preserved
    expect(component.transferModalItem).toBe(upcomingItem);
  });
});
