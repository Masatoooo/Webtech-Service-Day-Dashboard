import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Activity,
  User,
  Registration,
  Attendance,
  NGO,
  RegistrationStatus,
  AttendanceStatus
} from '../../../../models';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';

export interface ParticipantRosterRow {
  registration: Registration;
  user?: User;
  activity?: Activity;
  ngo?: NGO;
  attendance?: Attendance | null;
  isCheckedIn: boolean;
  isCancelled: boolean;
}

@Component({
  selector: 'app-participant-monitoring',
  templateUrl: './participant-monitoring.component.html',
  styleUrls: ['./participant-monitoring.component.css'],
  standalone: false
})
export class ParticipantMonitoringComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = true;
  activities: Activity[] = [];
  ngos: NGO[] = [];
  allRosterRows: ParticipantRosterRow[] = [];
  filteredRosterRows: ParticipantRosterRow[] = [];

  // Filter & Search Controls
  selectedActivityId = 'ALL';
  participantSearchTerm = '';
  selectedRegistrationStatus: 'ALL' | RegistrationStatus = 'ALL';
  selectedAttendanceStatus: 'ALL' | AttendanceStatus | 'PENDING' = 'ALL';

  // Selected Activity Context Card
  selectedActivity: Activity | null = null;
  selectedActivityNgo: NGO | null = null;
  selectedActivityStats = {
    capacity: 0,
    filled: 0,
    remaining: 0,
    checkedInCount: 0,
    pctUtilised: 0
  };

  // KPI Metrics for Current View
  metrics = {
    totalEnrollments: 0,
    activeVolunteers: 0,
    confirmedAttendance: 0,
    withdrawn: 0
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService
  ) {}

  ngOnInit(): void {
    // Check initial query parameter
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['activityId']) {
        this.selectedActivityId = params['activityId'];
      }
    });

    combineLatest([
      this.dataStore.activities$,
      this.dataStore.registrations$,
      this.dataStore.users$,
      this.dataStore.attendance$,
      this.dataStore.ngos$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([activities, registrations, users, attendances, ngos]) => {
        this.isLoading = false;
        this.activities = activities;
        this.ngos = ngos;

        const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
        const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));
        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));
        const attMap = new Map<string, Attendance>(attendances.map((att) => [att.registrationId, att]));

        this.allRosterRows = registrations.map((reg) => {
          const act = actMap.get(reg.activityId);
          const ngo = act ? ngoMap.get(act.ngoId) : undefined;
          const user = userMap.get(reg.employeeId);
          const att = attMap.get(reg.id) || null;

          return {
            registration: reg,
            user,
            activity: act,
            ngo,
            attendance: att,
            isCheckedIn: att?.status === 'CHECKED_IN',
            isCancelled: reg.status === 'CANCELLED'
          };
        });

        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    const term = (this.participantSearchTerm || '').trim().toLowerCase();

    this.filteredRosterRows = this.allRosterRows.filter((row) => {
      // 1. Activity Filter
      if (this.selectedActivityId !== 'ALL' && row.registration.activityId !== this.selectedActivityId) {
        return false;
      }

      // 2. Registration Status Filter
      if (this.selectedRegistrationStatus !== 'ALL' && row.registration.status !== this.selectedRegistrationStatus) {
        return false;
      }

      // 3. Attendance Status Filter
      if (this.selectedAttendanceStatus !== 'ALL') {
        if (this.selectedAttendanceStatus === 'CHECKED_IN' && !row.isCheckedIn) {
          return false;
        }
        if (this.selectedAttendanceStatus === 'PENDING' && row.isCheckedIn) {
          return false;
        }
      }

      // 4. Search Query (name, email, department, activity title)
      if (term) {
        const u = row.user;
        const act = row.activity;
        const matchesName = u?.name?.toLowerCase().includes(term);
        const matchesEmail = u?.email?.toLowerCase().includes(term);
        const matchesDept = u?.department?.toLowerCase().includes(term);
        const matchesAct = act?.title?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesAct) {
          return false;
        }
      }

      return true;
    });

    this.updateMetrics();
    this.updateSelectedActivityContext();
  }

  onActivityChange(actId: string): void {
    this.selectedActivityId = actId;
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedActivityId = 'ALL';
    this.participantSearchTerm = '';
    this.selectedRegistrationStatus = 'ALL';
    this.selectedAttendanceStatus = 'ALL';
    this.applyFilters();
  }

  private updateMetrics(): void {
    const rows = this.filteredRosterRows;
    this.metrics = {
      totalEnrollments: rows.length,
      activeVolunteers: rows.filter((r) => r.registration.status === 'ACTIVE').length,
      confirmedAttendance: rows.filter((r) => r.isCheckedIn).length,
      withdrawn: rows.filter((r) => r.isCancelled).length
    };
  }

  private updateSelectedActivityContext(): void {
    if (this.selectedActivityId === 'ALL') {
      this.selectedActivity = null;
      this.selectedActivityNgo = null;
      return;
    }

    this.selectedActivity = this.activities.find((a) => a.id === this.selectedActivityId) || null;
    if (this.selectedActivity) {
      this.selectedActivityNgo = this.ngos.find((n) => n.id === this.selectedActivity?.ngoId) || null;

      const actRegs = this.allRosterRows.filter((r) => r.registration.activityId === this.selectedActivity?.id);
      const activeRegs = actRegs.filter((r) => r.registration.status === 'ACTIVE');
      const checkedIn = actRegs.filter((r) => r.isCheckedIn);

      const capacity = this.selectedActivity.capacity || 0;
      const filled = activeRegs.length;
      const remaining = Math.max(0, capacity - filled);
      const pct = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;

      this.selectedActivityStats = {
        capacity,
        filled,
        remaining,
        checkedInCount: checkedIn.length,
        pctUtilised: pct
      };
    }
  }
}
