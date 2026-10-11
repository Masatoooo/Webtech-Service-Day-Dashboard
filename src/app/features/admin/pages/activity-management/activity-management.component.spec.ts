import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ActivityManagementComponent } from './activity-management.component';
import { ActivityService } from '../../../../core/services/activity.service';
import { NGOService } from '../../../../core/services/ngo.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import { Activity, NGO, Registration, ActivitySlotSummary } from '../../../../models';

describe('ActivityManagementComponent (Task 05 - Use Case 1)', () => {
  let component: ActivityManagementComponent;
  let fixture: ComponentFixture<ActivityManagementComponent>;

  let mockActivityService: {
    getActivities: () => any;
    createActivity: (data: any) => any;
    updateActivity: (id: string, updates: any) => any;
    deleteActivity: (id: string) => any;
    changePublicationStatus: (id: string, status: any) => any;
    computeSlotSummary: (act: Activity, regs: Registration[]) => ActivitySlotSummary;
    isCutoffPassed: (act: Activity) => boolean;
    canDeleteActivity: (id: string) => { allowed: boolean; reason?: string; activeCount: number };
  };

  let mockNgoService: {
    getNGOs: () => any;
  };

  let mockRegistrationService: {
    getRegistrations: () => any;
  };

  const mockNGOs: NGO[] = [
    {
      id: 'ngo-1',
      name: 'Yayasan Konservasi Laut',
      description: 'Marine conservation',
      contactName: 'Hendra',
      contactEmail: 'hendra@test.org',
      approvalStatus: 'APPROVED'
    },
    {
      id: 'ngo-5',
      name: 'Yayasan Bina Sehat',
      description: 'Health outreach',
      contactName: 'Wahyu',
      contactEmail: 'wahyu@test.org',
      approvalStatus: 'PENDING'
    }
  ];

  const mockActivities: Activity[] = [
    {
      id: 'act-1',
      ngoId: 'ngo-1',
      title: 'Mangrove Coastal Restoration',
      description: 'Planting 500 mangrove trees.',
      serviceType: 'ENVIRONMENT',
      location: 'Angke Kapuk',
      startDateTime: '2026-11-14T08:00:00',
      endDateTime: '2026-11-14T13:00:00',
      registrationCutoff: '2026-11-10T23:59:59',
      capacity: 20,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-8',
      ngoId: 'ngo-1',
      title: 'Clean Water Piping Support',
      description: 'Laying secondary water pipes.',
      serviceType: 'COMMUNITY',
      location: 'Cilincing',
      startDateTime: '2026-12-05T08:30:00',
      endDateTime: '2026-12-05T16:00:00',
      registrationCutoff: '2026-11-30T23:59:59',
      capacity: 15,
      publicationStatus: 'DRAFT'
    }
  ];

  const mockRegistrations: Registration[] = [
    {
      id: 'reg-1',
      employeeId: 'emp-1',
      activityId: 'act-1',
      status: 'ACTIVE',
      registeredAt: '2026-10-08T09:15:00'
    }
  ];

  let createdActivityPayload: any = null;
  let updatedActivityPayload: any = null;
  let deletedActivityId: string | null = null;
  let statusChangeId: string | null = null;
  let statusChangeValue: any = null;

  beforeEach(async () => {
    createdActivityPayload = null;
    updatedActivityPayload = null;
    deletedActivityId = null;
    statusChangeId = null;
    statusChangeValue = null;

    mockActivityService = {
      getActivities: () => of(mockActivities),
      createActivity: (data: any) => {
        createdActivityPayload = data;
        return of({ ...data, id: 'act-new-99' });
      },
      updateActivity: (id: string, updates: any) => {
        updatedActivityPayload = { id, ...updates };
        return of({ id, ...updates });
      },
      deleteActivity: (id: string) => {
        deletedActivityId = id;
        return of(true);
      },
      changePublicationStatus: (id: string, status: any) => {
        statusChangeId = id;
        statusChangeValue = status;
        const found = mockActivities.find((a) => a.id === id);
        return of({ ...(found || mockActivities[0]), publicationStatus: status });
      },
      computeSlotSummary: (act: Activity) => {
        const isAct1 = act.id === 'act-1';
        return {
          activityId: act.id,
          capacity: act.capacity,
          filledSlots: isAct1 ? 1 : 0,
          remainingSlots: isAct1 ? act.capacity - 1 : act.capacity,
          utilisationPercentage: isAct1 ? 5 : 0,
          availabilityStatus: 'AVAILABLE'
        };
      },
      isCutoffPassed: () => false,
      canDeleteActivity: (id: string) => {
        if (id === 'act-1') {
          return {
            allowed: false,
            reason: 'Activity has 1 active registration(s). Cancel instead of deleting.',
            activeCount: 1
          };
        }
        return { allowed: true, activeCount: 0 };
      }
    };

    mockNgoService = {
      getNGOs: () => of(mockNGOs)
    };

    mockRegistrationService = {
      getRegistrations: () => of(mockRegistrations)
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ActivityManagementComponent],
      providers: [
        { provide: ActivityService, useValue: mockActivityService },
        { provide: NGOService, useValue: mockNgoService },
        { provide: RegistrationService, useValue: mockRegistrationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load all activity rows with calculated metrics', () => {
    expect(component).toBeTruthy();
    expect(component.allRows.length).toBe(2);
    expect(component.filteredRows.length).toBe(2);
    expect(component.metrics.total).toBe(2);
    expect(component.metrics.published).toBe(1);
    expect(component.metrics.draft).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should filter activities by search keyword and status', () => {
    component.onSearchChange('Mangrove');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].activity.id).toBe('act-1');

    component.onSearchChange('');
    component.onFilterStatusChange('DRAFT');
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].activity.id).toBe('act-8');

    component.resetFilters();
    expect(component.filteredRows.length).toBe(2);
  });

  it('should open create modal and validate schedule order (end > start) and cut-off (cutoff <= start)', () => {
    component.openCreateModal();
    expect(component.isFormModalOpen).toBe(true);
    expect(component.isEditing).toBe(false);

    // Contradictory schedule: end before start
    component.activityForm.patchValue({
      title: 'Invalid Schedule Event',
      ngoId: 'ngo-1',
      serviceType: 'ENVIRONMENT',
      location: 'Test Location',
      capacity: 10,
      startDateTime: '2026-11-20T10:00',
      endDateTime: '2026-11-20T08:00', // End before start
      registrationCutoff: '2026-11-18T10:00',
      publicationStatus: 'DRAFT',
      description: 'Valid description with sufficient length.'
    });

    component.onSaveActivity();
    expect(component.activityForm.errors?.['invalidDateOrder']).toBeTruthy();
    expect(createdActivityPayload).toBeNull();

    // Contradictory schedule: cut-off after start
    component.activityForm.patchValue({
      endDateTime: '2026-11-20T14:00',
      registrationCutoff: '2026-11-20T12:00' // Cutoff after start
    });

    component.onSaveActivity();
    expect(component.activityForm.errors?.['invalidCutoff']).toBeTruthy();
    expect(createdActivityPayload).toBeNull();
  });

  it('should successfully create activity when form is valid', () => {
    component.openCreateModal();

    const newActivityPayload = {
      title: 'Beach Cleanup Drive',
      ngoId: 'ngo-1',
      serviceType: 'ENVIRONMENT',
      location: 'Ancol Beach',
      capacity: 25,
      startDateTime: '2026-11-25T08:00',
      endDateTime: '2026-11-25T14:00',
      registrationCutoff: '2026-11-23T23:59',
      publicationStatus: 'DRAFT',
      description: 'Community volunteer drive to remove plastic waste.'
    };

    component.activityForm.patchValue(newActivityPayload);

    component.onSaveActivity();

    expect(createdActivityPayload).toBeTruthy();
    expect(createdActivityPayload.title).toBe('Beach Cleanup Drive');
    expect(component.isFormModalOpen).toBe(false);
    expect(component.toastMessage).toContain('Beach Cleanup Drive');
  });

  it('should open edit modal with populated values and enforce capacity floor', () => {
    const row = component.allRows[0]; // act-1, has 1 active registration
    component.openEditModal(row);

    expect(component.isFormModalOpen).toBe(true);
    expect(component.isEditing).toBe(true);
    expect(component.editingActivityId).toBe('act-1');
    expect(component.activityForm.get('title')?.value).toBe('Mangrove Coastal Restoration');

    // Attempting to reduce capacity to 0
    component.activityForm.patchValue({
      capacity: 0
    });

    component.onSaveActivity();
    expect(component.activityForm.get('capacity')?.errors).toBeTruthy();

    component.closeFormModal();
    expect(component.isFormModalOpen).toBe(false);
  });

  it('should update publication status via quick status change', () => {
    const act = mockActivities[1]; // act-8 is DRAFT

    component.onQuickStatusChange(act, 'PUBLISHED');

    expect(statusChangeId).toBe('act-8');
    expect(statusChangeValue).toBe('PUBLISHED');
    expect(component.toastMessage).toContain('PUBLISHED');
  });

  it('should open DELETE_BLOCKED dialog for activity with active registrations (BR-14)', () => {
    const row = component.allRows[0]; // act-1 has 1 registration
    component.openDeleteDialog(row);

    expect(component.isConfirmDialogOpen).toBe(true);
    expect(component.confirmDialogType).toBe('DELETE_BLOCKED');

    // Choosing to cancel instead
    component.onConfirmAction();

    expect(statusChangeId).toBe('act-1');
    expect(statusChangeValue).toBe('CANCELLED');
    expect(component.isConfirmDialogOpen).toBe(false);
  });

  it('should open DELETE dialog and permanently remove activity when 0 registrations exist', () => {
    const row = component.allRows[1]; // act-8 has 0 registrations
    component.openDeleteDialog(row);

    expect(component.isConfirmDialogOpen).toBe(true);
    expect(component.confirmDialogType).toBe('DELETE');

    component.onConfirmAction();

    expect(deletedActivityId).toBe('act-8');
    expect(component.isConfirmDialogOpen).toBe(false);
    expect(component.toastMessage).toContain('permanently removed');
  });
});
