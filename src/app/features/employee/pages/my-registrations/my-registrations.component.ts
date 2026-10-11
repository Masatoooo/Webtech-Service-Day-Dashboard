import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { Registration, Activity, User } from '../../../../models';

export interface MyRegistrationItem {
  registration: Registration;
  activity?: Activity;
}

@Component({
  selector: 'app-my-registrations',
  templateUrl: './my-registrations.component.html',
  styleUrls: ['./my-registrations.component.css'],
  standalone: false
})
export class MyRegistrationsComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  myRegistrations$!: Observable<MyRegistrationItem[]>;

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;

    this.myRegistrations$ = combineLatest([
      this.dataStore.registrations$,
      this.dataStore.activities$,
      this.currentUser$
    ]).pipe(
      map(([registrations, activities, user]) => {
        if (!user) return [];
        const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));
        return registrations
          .filter((r) => r.employeeId === user.id)
          .map((reg) => ({
            registration: reg,
            activity: actMap.get(reg.activityId)
          }));
      })
    );
  }
}
