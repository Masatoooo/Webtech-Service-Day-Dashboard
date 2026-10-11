import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { Notification, User } from '../../../../models';

export type NotificationTab = 'ALL' | 'UNREAD' | 'REGISTRATION' | 'REMINDER' | 'BROADCAST';

@Component({
  selector: 'app-employee-notifications',
  templateUrl: './employee-notifications.component.html',
  styleUrls: ['./employee-notifications.component.css'],
  standalone: false
})
export class EmployeeNotificationsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  currentUser: User | null = null;
  allNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];

  activeTab: NotificationTab = 'ALL';

  totalCount: number = 0;
  unreadCount: number = 0;
  registrationCount: number = 0;
  reminderCount: number = 0;
  broadcastCount: number = 0;

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService
  ) {}

  ngOnInit(): void {
    combineLatest([this.authService.currentUser$, this.dataStore.notifications$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([user, list]) => {
        this.currentUser = user;
        if (!user) {
          this.allNotifications = [];
          this.filteredNotifications = [];
          return;
        }

        // Filter notifications targeted to current user or ALL broadcast
        this.allNotifications = list
          .filter((n) => n.recipientUserId === 'ALL' || n.recipientUserId === user.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Recalculate counter metrics
        this.totalCount = this.allNotifications.length;
        this.unreadCount = this.allNotifications.filter((n) => !n.readAt).length;
        this.registrationCount = this.allNotifications.filter(
          (n) => n.type === 'REGISTRATION' || n.type === 'TRANSFER' || n.type === 'CANCELLATION'
        ).length;
        this.reminderCount = this.allNotifications.filter((n) => n.type === 'REMINDER').length;
        this.broadcastCount = this.allNotifications.filter(
          (n) => n.type === 'BROADCAST' || n.type === 'ACTIVITY_UPDATE'
        ).length;

        this.applyFilter();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: NotificationTab): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter(): void {
    switch (this.activeTab) {
      case 'UNREAD':
        this.filteredNotifications = this.allNotifications.filter((n) => !n.readAt);
        break;
      case 'REGISTRATION':
        this.filteredNotifications = this.allNotifications.filter(
          (n) => n.type === 'REGISTRATION' || n.type === 'TRANSFER' || n.type === 'CANCELLATION'
        );
        break;
      case 'REMINDER':
        this.filteredNotifications = this.allNotifications.filter((n) => n.type === 'REMINDER');
        break;
      case 'BROADCAST':
        this.filteredNotifications = this.allNotifications.filter(
          (n) => n.type === 'BROADCAST' || n.type === 'ACTIVITY_UPDATE'
        );
        break;
      case 'ALL':
      default:
        this.filteredNotifications = [...this.allNotifications];
        break;
    }
  }

  toggleReadStatus(notification: Notification): void {
    const all = this.dataStore.notificationsSnapshot;
    const index = all.findIndex((n) => n.id === notification.id);
    if (index === -1) return;

    const nextReadAt = notification.readAt ? null : new Date().toISOString();
    const updated = [...all];
    updated[index] = { ...notification, readAt: nextReadAt };

    this.dataStore.setNotifications(updated);
  }

  markAllAsRead(): void {
    if (!this.currentUser) return;
    const all = this.dataStore.notificationsSnapshot;
    const userId = this.currentUser.id;
    const nowIso = new Date().toISOString();

    const updated = all.map((n) => {
      if ((n.recipientUserId === 'ALL' || n.recipientUserId === userId) && !n.readAt) {
        return { ...n, readAt: nowIso };
      }
      return n;
    });

    this.dataStore.setNotifications(updated);
  }
}
