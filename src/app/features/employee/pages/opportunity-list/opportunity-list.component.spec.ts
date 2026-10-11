import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { OpportunityListComponent } from './opportunity-list.component';
import { ActivityService } from '../../../../core/services/activity.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { FormsModule } from '@angular/forms';
import { Activity, NGO, Registration } from '../../../../models';

describe('OpportunityListComponent (Task 06: Use Case 2)', () => {
  let component: OpportunityListComponent;
  let fixture: ComponentFixture<OpportunityListComponent>;
  let mockActivityService: any;
  let mockDataStore: any;
  let mockRouter: any;

  const mockApprovedNgo: NGO = {
    id: 'ngo-1',
    name: 'Mangrove Foundation',
    description: 'Protecting coastal habitats and community shorelines',
    contactName: 'Budi Santoso',
    contactEmail: 'budi@mangrove.org',
    approvalStatus: 'APPROVED'
  };

  const mockPendingNgo: NGO = {
    id: 'ngo-pending',
    name: 'Unverified NGO',
    description: 'Pending verification',
    contactName: 'Siti',
    contactEmail: 'siti@unverified.org',
    approvalStatus: 'PENDING'
  };

  const mockActivities: Activity[] = [
    {
      id: 'act-1',
      ngoId: 'ngo-1',
      title: 'Mangrove Coastal Planting',
      description: 'Planting propagules along coast',
      serviceType: 'ENVIRONMENT',
      location: 'North Jakarta Coastal Park',
      startDateTime: '2026-11-14T08:00:00',
      endDateTime: '2026-11-14T13:00:00',
      registrationCutoff: '2026-11-10T23:59:59',
      capacity: 20,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-2',
      ngoId: 'ngo-1',
      title: 'Youth Robotics Workshop',
      description: 'STEM robotics mentoring',
      serviceType: 'EDUCATION',
      location: 'Palmerah Youth Center',
      startDateTime: '2026-11-15T09:00:00',
      endDateTime: '2026-11-15T15:00:00',
      registrationCutoff: '2026-11-12T23:59:59',
      capacity: 2,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-3',
      ngoId: 'ngo-1',
      title: 'Past Cutoff Cleanup',
      description: 'Beach cleanup past deadline',
      serviceType: 'ENVIRONMENT',
      location: 'Ancol Beach',
      startDateTime: '2026-10-01T08:00:00',
      endDateTime: '2026-10-01T12:00:00',
      registrationCutoff: '2026-09-25T23:59:59',
      capacity: 10,
      publicationStatus: 'PUBLISHED'
    }
  ];

  const mockRegistrations: Registration[] = [
    { id: 'r1', employeeId: 'u1', activityId: 'act-2', status: 'ACTIVE', registeredAt: '2026-10-01T00:00:00' },
    { id: 'r2', employeeId: 'u2', activityId: 'act-2', status: 'ACTIVE', registeredAt: '2026-10-01T00:00:00' }
    // act-2 capacity is 2 and has 2 active registrations -> FULL!
  ];

  beforeEach(async () => {
    mockActivityService = {
      getEmployeeActivities: () => of(mockActivities),
      computeSlotSummary: (act: Activity, regs: Registration[]) => {
        const filled = regs.filter((r) => r.activityId === act.id && r.status === 'ACTIVE').length;
        const remaining = Math.max(0, act.capacity - filled);
        const cutoffPassed = new Date() > new Date(act.registrationCutoff);
        let status = 'AVAILABLE';
        if (act.publicationStatus === 'CANCELLED') status = 'CANCELLED';
        else if (act.publicationStatus === 'COMPLETED') status = 'COMPLETED';
        else if (cutoffPassed) status = 'REGISTRATION_CLOSED';
        else if (remaining === 0) status = 'FULL';
        else if (remaining <= 3) status = 'ALMOST_FULL';

        return {
          activityId: act.id,
          capacity: act.capacity,
          filledSlots: filled,
          remainingSlots: remaining,
          utilisationPercentage: Math.round((filled / act.capacity) * 100),
          availabilityStatus: status
        };
      }
    };

    mockDataStore = {
      ngos$: of([mockApprovedNgo, mockPendingNgo]),
      registrations$: of(mockRegistrations)
    };

    await TestBed.configureTestingModule({
      declarations: [OpportunityListComponent, StatusBadgeComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [
        { provide: ActivityService, useValue: mockActivityService },
        { provide: DataStoreService, useValue: mockDataStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityListComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router);
    vi.spyOn(mockRouter, 'navigate').mockResolvedValue(true as any);
    fixture.detectChanges();
  });

  it('should initialize and load all approved employee opportunities', () => {
    expect(component.allOpportunities.length).toBe(3);
    expect(component.filteredOpportunities.length).toBe(3);
    expect(component.totalApproved).toBe(3);
  });

  it('should distinguish availability states correctly (Available, Full, Registration Closed)', () => {
    const opp1 = component.allOpportunities.find((o) => o.activity.id === 'act-1');
    const opp2 = component.allOpportunities.find((o) => o.activity.id === 'act-2');
    const opp3 = component.allOpportunities.find((o) => o.activity.id === 'act-3');

    expect(opp1?.slotSummary.availabilityStatus).toBe('AVAILABLE');
    expect(opp2?.slotSummary.availabilityStatus).toBe('FULL');
    expect(opp3?.slotSummary.availabilityStatus).toBe('REGISTRATION_CLOSED');
  });

  it('should filter opportunities by text search query', () => {
    component.searchQuery = 'robotics';
    component.applyFilters();
    expect(component.filteredOpportunities.length).toBe(1);
    expect(component.filteredOpportunities[0].activity.id).toBe('act-2');

    // Search by NGO name
    component.searchQuery = 'Mangrove Foundation';
    component.applyFilters();
    expect(component.filteredOpportunities.length).toBe(3);
  });

  it('should filter opportunities by service category', () => {
    component.selectedCategory = 'EDUCATION';
    component.applyFilters();
    expect(component.filteredOpportunities.length).toBe(1);
    expect(component.filteredOpportunities[0].activity.serviceType).toBe('EDUCATION');
  });

  it('should filter opportunities by availability status', () => {
    component.selectedStatus = 'FULL';
    component.applyFilters();
    expect(component.filteredOpportunities.length).toBe(1);
    expect(component.filteredOpportunities[0].activity.id).toBe('act-2');

    component.selectedStatus = 'REGISTRATION_CLOSED';
    component.applyFilters();
    expect(component.filteredOpportunities.length).toBe(1);
    expect(component.filteredOpportunities[0].activity.id).toBe('act-3');
  });

  it('should reset filters to show all approved opportunities', () => {
    component.searchQuery = 'nonexistent keyword';
    component.applyFilters();
    expect(component.filteredOpportunities.length).toBe(0);

    component.resetFilters();
    expect(component.searchQuery).toBe('');
    expect(component.selectedCategory).toBe('ALL');
    expect(component.selectedStatus).toBe('ALL');
    expect(component.filteredOpportunities.length).toBe(3);
  });

  it('should manage the Task 06 registration contract modal without triggering fake mutations', () => {
    const item = component.allOpportunities[0];
    component.openRegistrationContract(item);
    expect(component.contractModalItem).toBe(item);

    component.closeRegistrationContract();
    expect(component.contractModalItem).toBeNull();
  });
});
