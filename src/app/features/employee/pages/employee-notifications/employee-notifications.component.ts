import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { Notification, User } from '../../../../models';

@Component({
  selector: 'app-employee-notifications',
  templateUrl: './employee-notifications.component.html',
  styleUrls: ['./employee-notifications.component.css'],
  standalone: false
})
export class EmployeeNotificationsComponent implements OnInit {
  currentUser$!: Observable<User | null>;
  notifications$!: Observable<Notification[]>;

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService
  ) {}

  ngOnInit(): void {
    this.currentUser$ = this.authService.currentUser$;

    this.notifications$ = this.dataStore.notifications$.pipe(
      map((list) => {
        const user = this.authService.currentUserSnapshot;
        if (!user) return [];
        return list.filter(
          (n) => n.recipientUserId === 'ALL' || n.recipientUserId === user.id
        );
      })
    );
  }
}
