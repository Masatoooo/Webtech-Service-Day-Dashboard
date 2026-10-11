import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivityService } from '../../../../core/services/activity.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import {
  Activity,
  NGO,
  ActivitySlotSummary,
  ActivityAvailabilityStatus,
  ServiceType
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

  // Task 06 clean registration contract modal state
  contractModalItem: OpportunityItem | null = null;

  constructor(
    private readonly activityService: ActivityService,
    private readonly dataStore: DataStoreService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.activityService.getEmployeeActivities(),
      this.dataStore.ngos$,
      this.dataStore.registrations$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([activities, ngos, registrations]) => {
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

  openRegistrationContract(item: OpportunityItem): void {
    this.contractModalItem = item;
  }

  closeRegistrationContract(): void {
    this.contractModalItem = null;
  }

  navigateToDetails(activityId: string): void {
    this.closeRegistrationContract();
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
