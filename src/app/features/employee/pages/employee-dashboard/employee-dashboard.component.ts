import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { User, Activity, Registration, NGO } from '../../../../models';

export interface EnrolledPreview {
  registration: Registration;
  activity: Activity;
  ngo?: NGO;
}

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.css'],
  standalone: false
})
export class EmployeeDashboardComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  availableActivities$!: Observable<Activity[]>;
  myRegistrations$!: Observable<Registration[]>;
  unreadCount$!: Observable<number>;
  upcomingEnrolled$!: Observable<EnrolledPreview | null>;

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;

    // Only approved and published opportunities for employee discovery
    this.availableActivities$ = this.activityService.getPublishedActivities();

    // Live unread in-app notification count
    this.unreadCount$ = combineLatest([
      this.authService.currentUser$,
      this.dataStore.notifications$
    ]).pipe(
      map(([user, list]) => {
        if (!user) return 0;
        return list.filter(
          (n) => (n.recipientUserId === 'ALL' || n.recipientUserId === user.id) && !n.readAt
        ).length;
      })
    );

    // Registrations belonging to currently active employee
    this.myRegistrations$ = combineLatest([
      this.dataStore.registrations$,
      this.currentUser$
    ]).pipe(
      map(([registrations, user]) => {
        if (!user) return [];
        return registrations.filter((r) => r.employeeId === user.id && r.status === 'ACTIVE');
      })
    );

    // Enriched upcoming enrolled activity for rapid portal access
    this.upcomingEnrolled$ = combineLatest([
      this.myRegistrations$,
      this.dataStore.activities$,
      this.dataStore.ngos$
    ]).pipe(
      map(([myRegs, activities, ngos]) => {
        if (myRegs.length === 0) return null;
        const firstReg = myRegs[0];
        const act = activities.find((a) => a.id === firstReg.activityId);
        if (!act) return null;
        const ngo = ngos.find((n) => n.id === act.ngoId);
        return {
          registration: firstReg,
          activity: act,
          ngo
        };
      })
    );
  }
}
