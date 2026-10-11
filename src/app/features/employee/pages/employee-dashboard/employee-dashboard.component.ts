import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { User, Activity, Registration } from '../../../../models';

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

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;

    // Only approved and published opportunities for employee discovery
    this.availableActivities$ = this.activityService.getPublishedActivities();

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
  }
}
