import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, combineLatest } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import {
  User,
  Activity,
  NGO,
  Registration,
  ActivitySlotSummary,
  ActivityAvailabilityStatus,
  ServiceType,
  Attendance
} from '../../../../models';

export interface ExecutiveTotals {
  totalActivities: number;
  publishedActivities: number;
  totalNgos: number;
  approvedNgos: number;
  activeRegistrations: number;
  cancelledRegistrations: number;
  totalOfferedPlaces: number;
  placesTaken: number;
  placesRemaining: number;
  capacityUtilisationPct: number;
}

export interface OperationalActivityRow {
  activity: Activity;
  ngo?: NGO;
  slotSummary: ActivitySlotSummary;
  isCutoffPassed: boolean;
}

export interface NeedsAttentionItem {
  activity: Activity;
  ngoName: string;
  type: 'CAPACITY_FULL' | 'ALMOST_FULL' | 'APPROACHING_CUTOFF' | 'LOW_ENROLLMENT';
  severity: 'high' | 'medium' | 'info';
  title: string;
  detail: string;
  remainingSlots: number;
  capacity: number;
  cutoffDate: string;
}

export interface ParticipantRosterRow {
  registration: Registration;
  user?: User;
  activity?: Activity;
  attendance?: Attendance;
  isCancelled: boolean;
}

export interface FeaturedActivityItem {
  activity: Activity;
  ngoName: string;
  slotSummary: ActivitySlotSummary;
  accentColor: string;
}

export interface CalendarEventItem {
  dateHeader: string;
  timeRange: string;
  title: string;
  location: string;
  category: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  currentUser$!: Observable<User | null>;
  todayFormatted: string = '';

  // Executive Reconciled Metrics
  totals$!: Observable<ExecutiveTotals>;

  // Featured Initiatives & Schedule Timeline (Hero Sections from Foto 1)
  featuredActivities$!: Observable<FeaturedActivityItem[]>;
  calendarEvents$!: Observable<CalendarEventItem[]>;

  // Needs Attention Radar
  needsAttentionItems: NeedsAttentionItem[] = [];

  // Master Data Cache
  allOperationalRows: OperationalActivityRow[] = [];
  allRosterRows: ParticipantRosterRow[] = [];
  availableActivitiesList: Activity[] = [];

  // Activity Operational Table Filter States
  activitySearchTerm: string = '';
  selectedCategory: string = 'ALL';
  selectedStatus: string = 'ALL';

  // Participant Monitoring Roster Filter States
  participantSearchTerm: string = '';
  selectedRosterActivityId: string = 'ALL';
  selectedRegistrationStatus: string = 'ALL';

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService,
    private readonly attendanceService: AttendanceService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    this.todayFormatted = `Today is ${today.toLocaleDateString('en-GB', options)}`;

    // Reconciled Executive Totals (Scope 1 & 2)
    this.totals$ = combineLatest([
      this.dataStore.activities$,
      this.dataStore.ngos$,
      this.dataStore.registrations$
    ]).pipe(
      map(([activities, ngos, registrations]) => {
        const totalActivities = activities.length;
        const publishedActivities = activities.filter((a) => a.publicationStatus === 'PUBLISHED').length;

        const totalNgos = ngos.length;
        const approvedNgos = ngos.filter((n) => n.approvalStatus === 'APPROVED').length;

        const activeRegistrations = registrations.filter((r) => r.status === 'ACTIVE').length;
        const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED').length;

        // Total offered capacity across active/published initiatives
        const totalOfferedPlaces = activities
          .filter((a) => a.publicationStatus !== 'CANCELLED')
          .reduce((sum, a) => sum + a.capacity, 0);

        const placesTaken = activeRegistrations;
        const placesRemaining = Math.max(0, totalOfferedPlaces - placesTaken);
        const capacityUtilisationPct =
          totalOfferedPlaces > 0 ? Math.min(100, Math.round((placesTaken / totalOfferedPlaces) * 100)) : 0;

        return {
          totalActivities,
          publishedActivities,
          totalNgos,
          approvedNgos,
          activeRegistrations,
          cancelledRegistrations,
          totalOfferedPlaces,
          placesTaken,
          placesRemaining,
          capacityUtilisationPct
        };
      })
    );

    // Featured CSR initiatives (Matching Foto 1 "Active CSR Initiatives" card list)
    this.featuredActivities$ = combineLatest([
      this.dataStore.activities$,
      this.dataStore.ngos$,
      this.dataStore.registrations$
    ]).pipe(
      map(([activities, ngos, registrations]) => {
        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));
        const colors = ['#356859', '#C9A66B', '#202C3B', '#1F486B'];

        return activities
          .filter((a) => a.publicationStatus === 'PUBLISHED')
          .slice(0, 4)
          .map((activity, index) => {
            const ngo = ngoMap.get(activity.ngoId);
            const slotSummary = this.activityService.computeSlotSummary(activity, registrations);
            return {
              activity,
              ngoName: ngo ? ngo.name : 'Vetted NGO',
              slotSummary,
              accentColor: colors[index % colors.length]
            };
          });
      })
    );

    // Upcoming Schedule Calendar (Matching Foto 1 "Schedule Calendar" timeline)
    this.calendarEvents$ = this.dataStore.activities$.pipe(
      map((activities) => {
        const sorted = [...activities]
          .filter((a) => a.publicationStatus === 'PUBLISHED')
          .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

        return sorted.slice(0, 5).map((act) => {
          const startDate = new Date(act.startDateTime);
          const endDate = new Date(act.endDateTime);

          const dateHeader = isNaN(startDate.getTime())
            ? act.startDateTime
            : startDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

          const startTimeStr = isNaN(startDate.getTime())
            ? ''
            : startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = isNaN(endDate.getTime())
            ? ''
            : endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

          return {
            dateHeader,
            timeRange: `${startTimeStr} - ${endTimeStr}`,
            title: act.title,
            location: act.location,
            category: act.serviceType
          };
        });
      })
    );

    // Combined Data Subscriptions for Table and Roster
    combineLatest([
      this.dataStore.activities$,
      this.dataStore.ngos$,
      this.dataStore.registrations$,
      this.dataStore.users$,
      this.dataStore.attendance$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([activities, ngos, registrations, users, attendances]) => {
        this.availableActivitiesList = activities;
        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));
        const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));
        const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
        const attMap = new Map<string, Attendance>(attendances.map((at) => [at.registrationId, at]));

        // 1. Build Operational Activity Rows
        this.allOperationalRows = activities.map((act) => {
          const ngo = ngoMap.get(act.ngoId);
          const slotSummary = this.activityService.computeSlotSummary(act, registrations);
          const isCutoffPassed = this.activityService.isCutoffPassed(act);
          return {
            activity: act,
            ngo,
            slotSummary,
            isCutoffPassed
          };
        });

        // 2. Build Needs Attention Items (Scope 4)
        this.computeNeedsAttention(this.allOperationalRows);

        // 3. Build Participant Monitoring Roster Rows (Scope 5)
        this.allRosterRows = registrations.map((reg) => {
          const user = userMap.get(reg.employeeId);
          const activity = actMap.get(reg.activityId);
          const attendance = attMap.get(reg.id);
          return {
            registration: reg,
            user,
            activity,
            attendance,
            isCancelled: reg.status === 'CANCELLED'
          };
        });

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Scope 4: Needs Attention Triage List ---
  private computeNeedsAttention(rows: OperationalActivityRow[]): void {
    const list: NeedsAttentionItem[] = [];

    for (const row of rows) {
      const act = row.activity;
      const ngoName = row.ngo?.name || 'Vetted NGO';
      const slots = row.slotSummary;

      // Rule: Full Capacity
      if (slots.availabilityStatus === 'FULL' || slots.remainingSlots === 0) {
        list.push({
          activity: act,
          ngoName,
          type: 'CAPACITY_FULL',
          severity: 'high',
          title: 'Maximum Capacity Reached',
          detail: `All ${act.capacity} places are occupied. No places remaining for employees.`,
          remainingSlots: 0,
          capacity: act.capacity,
          cutoffDate: act.registrationCutoff
        });
      }
      // Rule: Almost Full (<= 3 slots remaining)
      else if (slots.remainingSlots <= 3 && slots.remainingSlots > 0 && act.publicationStatus === 'PUBLISHED') {
        list.push({
          activity: act,
          ngoName,
          type: 'ALMOST_FULL',
          severity: 'medium',
          title: 'High Demand (Almost Full)',
          detail: `Only ${slots.remainingSlots} place(s) remaining of ${act.capacity} offered.`,
          remainingSlots: slots.remainingSlots,
          capacity: act.capacity,
          cutoffDate: act.registrationCutoff
        });
      }
      // Rule: Approaching/Passed Cutoff
      else if (row.isCutoffPassed && act.publicationStatus === 'PUBLISHED') {
        list.push({
          activity: act,
          ngoName,
          type: 'APPROACHING_CUTOFF',
          severity: 'high',
          title: 'Registration Cut-off Closed',
          detail: `Cut-off passed on ${this.formatDate(act.registrationCutoff)}. Attendance rosters are locked.`,
          remainingSlots: slots.remainingSlots,
          capacity: act.capacity,
          cutoffDate: act.registrationCutoff
        });
      }
      // Rule: Low Registration (0 or 1 volunteer with open deadline)
      else if (act.publicationStatus === 'PUBLISHED' && slots.filledSlots <= 1 && !row.isCutoffPassed) {
        list.push({
          activity: act,
          ngoName,
          type: 'LOW_ENROLLMENT',
          severity: 'info',
          title: 'Low Staff Enrollment',
          detail: `Only ${slots.filledSlots}/${act.capacity} signed up. Consider promoting before cut-off.`,
          remainingSlots: slots.remainingSlots,
          capacity: act.capacity,
          cutoffDate: act.registrationCutoff
        });
      }
    }

    this.needsAttentionItems = list.slice(0, 6);
  }

  // --- Scope 3 & 6: Operational Table Filtered Rows ---
  get filteredOperationalRows(): OperationalActivityRow[] {
    const query = this.activitySearchTerm.trim().toLowerCase();

    return this.allOperationalRows.filter((row) => {
      const act = row.activity;
      const ngoName = row.ngo?.name || '';

      if (query) {
        const matchesQuery =
          act.title.toLowerCase().includes(query) ||
          act.description.toLowerCase().includes(query) ||
          ngoName.toLowerCase().includes(query) ||
          act.location.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (this.selectedCategory !== 'ALL' && act.serviceType !== this.selectedCategory) {
        return false;
      }

      if (this.selectedStatus !== 'ALL' && row.slotSummary.availabilityStatus !== this.selectedStatus) {
        return false;
      }

      return true;
    });
  }

  resetActivityFilters(): void {
    this.activitySearchTerm = '';
    this.selectedCategory = 'ALL';
    this.selectedStatus = 'ALL';
  }

  // --- Scope 5: Participant Roster Filtered Rows ---
  get filteredRosterRows(): ParticipantRosterRow[] {
    const query = this.participantSearchTerm.trim().toLowerCase();

    return this.allRosterRows.filter((item) => {
      if (this.selectedRosterActivityId !== 'ALL' && item.registration.activityId !== this.selectedRosterActivityId) {
        return false;
      }

      if (this.selectedRegistrationStatus !== 'ALL' && item.registration.status !== this.selectedRegistrationStatus) {
        return false;
      }

      if (query) {
        const userName = item.user?.name || '';
        const userEmail = item.user?.email || '';
        const userDept = item.user?.department || '';
        const actTitle = item.activity?.title || '';
        const matches =
          userName.toLowerCase().includes(query) ||
          userEmail.toLowerCase().includes(query) ||
          userDept.toLowerCase().includes(query) ||
          actTitle.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });
  }

  resetRosterFilters(): void {
    this.participantSearchTerm = '';
    this.selectedRosterActivityId = 'ALL';
    this.selectedRegistrationStatus = 'ALL';
  }

  filterRosterByActivity(activityId: string): void {
    this.selectedRosterActivityId = activityId;
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const element = document.getElementById('participant-roster-section');
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getCategoryLabel(type?: ServiceType): string {
    if (!type) return '';
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
