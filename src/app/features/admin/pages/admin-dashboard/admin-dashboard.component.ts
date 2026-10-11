import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { User, Activity, NGO, Registration, ActivitySlotSummary } from '../../../../models';

export interface DashboardMetricSummary {
  totalActivities: number;
  publishedActivities: number;
  publishedPct: number;
  totalNgos: number;
  approvedNgos: number;
  totalCapacity: number;
  enrolledSlots: number;
  utilisationPct: number;
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
export class AdminDashboardComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  activities$!: Observable<Activity[]>;
  ngos$!: Observable<NGO[]>;
  registrations$!: Observable<Registration[]>;

  metrics$!: Observable<DashboardMetricSummary>;
  featuredActivities$!: Observable<FeaturedActivityItem[]>;
  calendarEvents$!: Observable<CalendarEventItem[]>;

  todayFormatted: string = '';

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;
    this.activities$ = this.dataStore.activities$;
    this.ngos$ = this.dataStore.ngos$;
    this.registrations$ = this.dataStore.registrations$;

    // Date formatting matching screenshot: "Today is Sunday, 11 October 2026"
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    this.todayFormatted = `Today is ${today.toLocaleDateString('en-GB', options)}`;

    // Metrics for the 3 top highlight cards
    this.metrics$ = combineLatest([this.activities$, this.ngos$, this.registrations$]).pipe(
      map(([activities, ngos, registrations]) => {
        const totalActivities = activities.length;
        const publishedActivities = activities.filter((a) => a.publicationStatus === 'PUBLISHED').length;
        const publishedPct = totalActivities > 0 ? Math.round((publishedActivities / totalActivities) * 100) : 0;

        const totalNgos = ngos.length;
        const approvedNgos = ngos.filter((n) => n.approvalStatus === 'APPROVED').length;

        const activeRegistrations = registrations.filter((r) => r.status === 'ACTIVE').length;
        const totalCapacity = activities
          .filter((a) => a.publicationStatus !== 'CANCELLED')
          .reduce((sum, a) => sum + a.capacity, 0);

        const utilisationPct = totalCapacity > 0 ? Math.round((activeRegistrations / totalCapacity) * 100) : 0;

        return {
          totalActivities,
          publishedActivities,
          publishedPct,
          totalNgos,
          approvedNgos,
          totalCapacity,
          enrolledSlots: activeRegistrations,
          utilisationPct
        };
      })
    );

    // Featured initiatives for the "Tasks for today" style list
    this.featuredActivities$ = combineLatest([this.activities$, this.ngos$, this.registrations$]).pipe(
      map(([activities, ngos, registrations]) => {
        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));
        const colors = ['#356859', '#C9A66B', '#202C3B', '#1F486B'];

        return activities.slice(0, 4).map((activity, index) => {
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

    // Calendar & Upcoming Schedule Timeline
    this.calendarEvents$ = this.activities$.pipe(
      map((activities) => {
        const sorted = [...activities]
          .filter((a) => a.publicationStatus === 'PUBLISHED')
          .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

        return sorted.slice(0, 5).map((act) => {
          const startDate = new Date(act.startDateTime);
          const endDate = new Date(act.endDateTime);

          const dateHeader = startDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          const startTimeStr = startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

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
  }
}
