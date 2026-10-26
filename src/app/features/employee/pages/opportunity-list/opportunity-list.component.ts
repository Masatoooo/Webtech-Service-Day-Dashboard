import { Component, OnInit, OnDestroy, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivityService } from '../../../../core/services/activity.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import {
  Activity,
  NGO,
  ActivitySlotSummary,
  ActivityAvailabilityStatus,
  ServiceType,
  User
} from '../../../../models';

export interface OpportunityItem {
  activity: Activity;
  ngo?: NGO;
  slotSummary: ActivitySlotSummary;
}

@Component({
  selector: 'app-opportunity-list',
  templateUrl: './opportunity-list.component.html',
  styleUrls: ['./opportunity-list.component.css'],
  standalone: false
})
export class OpportunityListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Raw combined items from data store
  allOpportunities: OpportunityItem[] = [];
  filteredOpportunities: OpportunityItem[] = [];

  // Filter states
  searchQuery: string = '';
  selectedCategory: string = 'ALL';
  selectedStatus: string = 'ALL';
  selectedLocation: string = 'ALL';

  // Dynamic filter options
  availableLocations: string[] = [];

  // Metrics summary
  totalApproved: number = 0;
  totalAvailable: number = 0;
  totalAlmostFull: number = 0;

  // Logged in user & active enrollments
  currentUser: User | null = null;
  registeredActivityIds = new Set<string>();

  // Active Registration Modal State
  registerModalItem: OpportunityItem | null = null;
  overlappingActivities: Activity[] = [];
  isSubmittingRegistration: boolean = false;
  registrationModalError: string | null = null;

  // Legacy/Contract modal item compatibility
  contractModalItem: OpportunityItem | null = null;

  // Toast / Feedback banner
  feedbackBanner: { type: 'success' | 'error'; message: string } | null = null;

  constructor(
    private readonly activityService: ActivityService,
    private readonly dataStore: DataStoreService,
    private readonly router: Router,
    @Optional() private readonly authService?: AuthService,
    @Optional() private readonly registrationService?: RegistrationService
  ) {}

  ngOnInit(): void {
    const user$ = this.authService ? this.authService.currentUser$ : of(null);

    combineLatest([
      this.activityService.getEmployeeActivities(),
      this.dataStore.ngos$,
      this.dataStore.registrations$,
      user$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([activities, ngos, registrations, user]) => {
        this.currentUser = user;

        const activeIds = new Set<string>();
        if (user) {
          registrations
            .filter((r) => r.employeeId === user.id && r.status === 'ACTIVE')
            .forEach((r) => activeIds.add(r.activityId));
        }
        this.registeredActivityIds = activeIds;

        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));

        this.allOpportunities = activities.map((activity) => {
          const ngo = ngoMap.get(activity.ngoId);
          const slotSummary = this.activityService.computeSlotSummary(activity, registrations);
          return { activity, ngo, slotSummary };
        });

        // Compute unique locations for filter dropdown
        const locSet = new Set<string>();
        this.allOpportunities.forEach((item) => {
          if (item.activity.location) {
            locSet.add(item.activity.location.split(',')[0].trim());
          }
        });
        this.availableLocations = Array.from(locSet).sort();

        // Calculate summary counters
        this.totalApproved = this.allOpportunities.length;
        this.totalAvailable = this.allOpportunities.filter(
          (o) => o.slotSummary.availabilityStatus === 'AVAILABLE'
        ).length;
        this.totalAlmostFull = this.allOpportunities.filter(
          (o) => o.slotSummary.availabilityStatus === 'ALMOST_FULL'
        ).length;

        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredOpportunities = this.allOpportunities.filter((item) => {
      const act = item.activity;
      const ngoName = item.ngo?.name || '';

      // Text search matching title, description, NGO partner, or location
      if (query) {
        const matchesQuery =
          act.title.toLowerCase().includes(query) ||
          act.description.toLowerCase().includes(query) ||
          ngoName.toLowerCase().includes(query) ||
          act.location.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Service category filter
      if (this.selectedCategory !== 'ALL' && act.serviceType !== this.selectedCategory) {
        return false;
      }

      // Availability status filter
      if (this.selectedStatus !== 'ALL' && item.slotSummary.availabilityStatus !== this.selectedStatus) {
        return false;
      }

      // Location filter
      if (this.selectedLocation !== 'ALL') {
        const primaryLoc = act.location.split(',')[0].trim();
        if (primaryLoc !== this.selectedLocation) {
          return false;
        }
      }

      return true;
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'ALL';
    this.selectedStatus = 'ALL';
    this.selectedLocation = 'ALL';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return (
      this.searchQuery !== '' ||
      this.selectedCategory !== 'ALL' ||
      this.selectedStatus !== 'ALL' ||
      this.selectedLocation !== 'ALL'
    );
  }

  isRegistered(activityId: string): boolean {
    return this.registeredActivityIds.has(activityId);
  }

  openRegistrationModal(item: OpportunityItem): void {
    this.feedbackBanner = null;
    this.registrationModalError = null;
    this.contractModalItem = item;

    if (!this.currentUser) {
      this.feedbackBanner = {
        type: 'error',
        message: 'Please log in as an employee to register for this activity.'
      };
      return;
    }

    if (this.isRegistered(item.activity.id)) {
      this.feedbackBanner = {
        type: 'error',
        message: `You already have an active registration for "${item.activity.title}".`
      };
      return;
    }

    if (this.registrationService) {
      const check = this.registrationService.canRegister(this.currentUser.id, item.activity.id);
      if (!check.allowed) {
        this.feedbackBanner = {
          type: 'error',
          message: check.reason || 'This activity cannot accept registrations.'
        };
        return;
      }
      this.overlappingActivities = check.overlappingActivities || [];
    } else {
      this.overlappingActivities = [];
    }

    this.registerModalItem = item;
  }

  confirmRegistration(): void {
    if (!this.registerModalItem || !this.currentUser) return;

    if (!this.registrationService) {
      this.closeRegistrationModal();
      return;
    }

    this.isSubmittingRegistration = true;
    this.registrationModalError = null;

    try {
      this.registrationService.register(this.currentUser.id, this.registerModalItem.activity.id).subscribe({
        next: (reg) => {
          const title = this.registerModalItem?.activity.title || 'the activity';
          this.feedbackBanner = {
            type: 'success',
            message: `Successfully registered for "${title}"! 1 volunteer spot reserved.`
          };
          this.isSubmittingRegistration = false;
          this.closeRegistrationModal();
        },
        error: (err) => {
          this.isSubmittingRegistration = false;
          this.registrationModalError = err?.message || 'Registration failed. Please try again.';
        }
      });
    } catch (err: any) {
      this.isSubmittingRegistration = false;
      this.registrationModalError = err?.message || 'Registration failed.';
    }
  }

  closeRegistrationModal(): void {
    this.registerModalItem = null;
    this.overlappingActivities = [];
    this.registrationModalError = null;
    this.contractModalItem = null;
  }

  openRegistrationContract(item: OpportunityItem): void {
    this.openRegistrationModal(item);
  }

  closeRegistrationContract(): void {
    this.closeRegistrationModal();
  }

  dismissFeedbackBanner(): void {
    this.feedbackBanner = null;
  }

  navigateToDetails(activityId: string): void {
    this.closeRegistrationModal();
    this.router.navigate(['/employee/activities', activityId]);
  }

  isActionable(status: ActivityAvailabilityStatus): boolean {
    return status === 'AVAILABLE' || status === 'ALMOST_FULL';
  }

  getCategoryLabel(type: ServiceType): string {
    switch (type) {
      case 'ENVIRONMENT':
        return 'Environment & Nature';
      case 'EDUCATION':
        return 'Education & Youth';
      case 'FOOD_SECURITY':
        return 'Food Security';
      case 'COMMUNITY':
        return 'Community Support';
      case 'HEALTH':
        return 'Public Health';
      default:
        return type;
    }
  }
}
