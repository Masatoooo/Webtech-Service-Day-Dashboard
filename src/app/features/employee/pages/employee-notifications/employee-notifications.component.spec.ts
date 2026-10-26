import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach } from 'vitest';
import { EmployeeNotificationsComponent } from './employee-notifications.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Notification, User } from '../../../../models';

describe('EmployeeNotificationsComponent', () => {
  let component: EmployeeNotificationsComponent;
  let fixture: ComponentFixture<EmployeeNotificationsComponent>;
  let mockAuthService: any;
  let mockDataStore: any;
  let notificationsSubject: BehaviorSubject<Notification[]>;

  const mockUser: User = {
    id: 'usr-emp-1',
    name: 'Alice Chen',
    email: 'alice.chen@corp.example.com',
    role: 'EMPLOYEE',
    department: 'Engineering'
  };

  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      recipientUserId: 'usr-emp-1',
      title: 'Registration Confirmed',
      message: 'Mangrove Coastal Restoration confirmed.',
      type: 'REGISTRATION',
      createdAt: '2026-10-08T09:15:00',
      readAt: '2026-10-08T10:00:00',
      deliveryStatus: 'DELIVERED',
      activityId: 'act-1'
    },
    {
      id: 'notif-2',
      recipientUserId: 'usr-emp-1',
      title: 'Registration Confirmed',
      message: 'Youth STEM Robotics confirmed.',
      type: 'REGISTRATION',
      createdAt: '2026-10-09T11:00:00',
      readAt: null, // unread
      deliveryStatus: 'DELIVERED',
      activityId: 'act-2'
    },
    {
      id: 'notif-3',
      recipientUserId: 'ALL',
      title: 'Service Day 2026 Opportunities Published',
      message: 'Welcome to Service Day.',
      type: 'BROADCAST',
      createdAt: '2026-10-07T08:00:00',
      readAt: null, // unread
      deliveryStatus: 'DELIVERED'
    },
    {
      id: 'notif-4',
      recipientUserId: 'usr-emp-99', // Different employee
      title: 'Other Employee Notification',
      message: 'Should not be visible to Alice.',
      type: 'REGISTRATION',
      createdAt: '2026-10-09T08:00:00',
      readAt: null,
      deliveryStatus: 'DELIVERED'
    },
    {
      id: 'notif-5',
      recipientUserId: 'usr-emp-1',
      title: 'Upcoming Service Day in 7 Days',
      message: 'Reminder for your scheduled volunteer day.',
      type: 'REMINDER',
      createdAt: '2026-10-10T08:00:00',
      readAt: null,
      deliveryStatus: 'DELIVERED',
      activityId: 'act-1'
    },
    {
      id: 'notif-6',
      recipientUserId: 'usr-emp-1',
      title: 'Registration Transfer Confirmed',
      message: 'Transferred to Youth STEM Robotics.',
      type: 'TRANSFER',
      createdAt: '2026-10-10T09:00:00',
      readAt: '2026-10-10T10:00:00',
      deliveryStatus: 'DELIVERED',
      activityId: 'act-2'
    }
  ];

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<Notification[]>(mockNotifications);

    mockAuthService = {
      currentUser$: of(mockUser),
      currentUserSnapshot: mockUser
    };

    mockDataStore = {
      notifications$: notificationsSubject.asObservable(),
      get notificationsSnapshot() {
        return notificationsSubject.getValue();
      },
      setNotifications: (updated: Notification[]) => {
        notificationsSubject.next(updated);
      }
    };

    await TestBed.configureTestingModule({
      declarations: [EmployeeNotificationsComponent, StatusBadgeComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: DataStoreService, useValue: mockDataStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should filter notifications for current employee and ALL broadcasts only', () => {
    // 5 notifications for usr-emp-1 or ALL (notif-1, notif-2, notif-3, notif-5, notif-6)
    expect(component.allNotifications.length).toBe(5);
    expect(component.totalCount).toBe(5);
    // Unread: notif-2, notif-3, notif-5 = 3
    expect(component.unreadCount).toBe(3);
    // Registration & Transfer: notif-1, notif-2, notif-6 = 3
    expect(component.registrationCount).toBe(3);
    // Reminders: notif-5 = 1
    expect(component.reminderCount).toBe(1);
    // Broadcast: notif-3 = 1
    expect(component.broadcastCount).toBe(1);
  });

  it('should filter notifications by tab selection', () => {
    component.setTab('UNREAD');
    expect(component.filteredNotifications.length).toBe(3);

    component.setTab('REGISTRATION');
    expect(component.filteredNotifications.length).toBe(3);

    component.setTab('REMINDER');
    expect(component.filteredNotifications.length).toBe(1);
    expect(component.filteredNotifications[0].id).toBe('notif-5');

    component.setTab('BROADCAST');
    expect(component.filteredNotifications.length).toBe(1);
    expect(component.filteredNotifications[0].id).toBe('notif-3');
  });

  it('should toggle read status of a notification', () => {
    const unread = component.allNotifications.find((n) => n.id === 'notif-2')!;
    expect(unread.readAt).toBeNull();

    component.toggleReadStatus(unread);
    const updated = component.allNotifications.find((n) => n.id === 'notif-2')!;
    expect(updated.readAt).toBeTruthy();

    // Toggle back to unread
    component.toggleReadStatus(updated);
    const toggledBack = component.allNotifications.find((n) => n.id === 'notif-2')!;
    expect(toggledBack.readAt).toBeNull();
  });

  it('should mark all unread notifications as read', () => {
    expect(component.unreadCount).toBe(3);
    component.markAllAsRead();
    expect(component.unreadCount).toBe(0);
  });
});
