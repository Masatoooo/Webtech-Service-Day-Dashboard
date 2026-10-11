import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';
import { ActivityDetailComponent } from './activity-detail.component';
import { ActivityService } from '../../../../core/services/activity.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Activity, NGO, Registration } from '../../../../models';

describe('ActivityDetailComponent (Task 06: Use Case 2)', () => {
  let component: ActivityDetailComponent;
  let fixture: ComponentFixture<ActivityDetailComponent>;
  let mockActivityService: any;
  let mockDataStore: any;
  let mockRouter: any;
  let routeParamSubject: BehaviorSubject<any>;

  const mockNgo: NGO = {
    id: 'ngo-1',
    name: 'Mangrove Foundation',
    description: 'Dedicated to coastal ecosystem preservation',
    contactName: 'Budi Santoso',
    contactEmail: 'contact@mangrove.org',
    approvalStatus: 'APPROVED'
  };

  const mockActivity: Activity = {
    id: 'act-1',
    ngoId: 'ngo-1',
    title: 'Mangrove Coastal Restoration',
    description: 'Planting propagules along critical shoreline',
    serviceType: 'ENVIRONMENT',
    location: 'Angke Kapuk Conservation Forest, North Jakarta',
    startDateTime: '2026-11-14T08:00:00',
    endDateTime: '2026-11-14T13:00:00',
    registrationCutoff: '2026-11-10T23:59:59',
    capacity: 20,
    publicationStatus: 'PUBLISHED'
  };

  beforeEach(async () => {
    routeParamSubject = new BehaviorSubject(convertToParamMap({ id: 'act-1' }));

    mockActivityService = {
      getActivityById: (id: string) => of(id === 'act-1' ? mockActivity : undefined),
      computeSlotSummary: (act: Activity, regs: Registration[]) => {
        return {
          activityId: act.id,
          capacity: act.capacity,
          filledSlots: 3,
          remainingSlots: 17,
          utilisationPercentage: 15,
          availabilityStatus: 'AVAILABLE'
        };
      }
    };

    mockDataStore = {
      ngos$: of([mockNgo]),
      registrations$: of([])
    };

    mockRouter = {
      navigate: () => Promise.resolve(true)
    };

    await TestBed.configureTestingModule({
      declarations: [ActivityDetailComponent, StatusBadgeComponent],
      imports: [RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParamSubject.asObservable() }
        },
        { provide: Router, useValue: mockRouter },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: DataStoreService, useValue: mockDataStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load activity and partner NGO from the unified data store', () => {
    expect(component.activity).toBeTruthy();
    expect(component.activity?.title).toBe('Mangrove Coastal Restoration');
    expect(component.ngo?.name).toBe('Mangrove Foundation');
    expect(component.notFound).toBe(false);
  });

  it('should calculate volunteering duration correctly in hours', () => {
    // 08:00 to 13:00 = 5 hours
    expect(component.volunteeringHours).toBe(5);
  });

  it('should supply structured volunteer contribution expectations for environment category', () => {
    const expectations = component.expectations;
    expect(expectations.tasks.length).toBeGreaterThan(0);
    expect(expectations.equipmentProvided.length).toBeGreaterThan(0);
    expect(expectations.volunteerRequirements.length).toBeGreaterThan(0);
    expect(expectations.tasks[0]).toContain('Seedling');
  });

  it('should display the clean Task 06 registration contract notice when triggered without fake success', () => {
    expect(component.showContractNotice).toBe(false);
    component.triggerRegistrationContract();
    expect(component.showContractNotice).toBe(true);

    component.dismissContractNotice();
    expect(component.showContractNotice).toBe(false);
  });

  it('should handle non-existent activity ID by setting notFound flag', async () => {
    routeParamSubject.next(convertToParamMap({ id: 'non-existent-id' }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.notFound).toBe(true);
    expect(component.activity).toBeNull();
  });
});
