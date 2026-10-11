import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationService, DEFAULT_REMINDER_RULES } from './notification.service';
import { DataStoreService } from './data-store.service';
import { StorageService } from './storage.service';
import { Activity, Registration, User } from '../../models';

describe('NotificationService (Task 09: Notifications & Reminder Simulation)', () => {
  let service: NotificationService;
  let dataStore: DataStoreService;
  let storage: StorageService;

  const mockUsers: User[] = [
    {
      id: 'usr-1',
      name: 'Alice Chen',
      email: 'alice@corp.com',
      role: 'EMPLOYEE',
      department: 'Engineering'
    },
    {
      id: 'usr-2',
      name: 'Bob Miller',
      email: 'bob@corp.com',
      role: 'EMPLOYEE',
      department: 'Product'
    }
  ];

  const mockActivity: Activity = {
    id: 'act-1',
    ngoId: 'ngo-1',
    title: 'Mangrove Coastal Restoration',
    description: 'Planting trees along coastal zones',
    serviceType: 'ENVIRONMENT',
    location: 'Pasir Ris Park',
    startDateTime: '2026-11-20T08:00:00Z',
    endDateTime: '2026-11-20T12:00:00Z',
    registrationCutoff: '2026-11-15T23:59:59Z',
    capacity: 25,
    publicationStatus: 'PUBLISHED'
  };

  const mockRegistrations: Registration[] = [
    {
      id: 'reg-1',
      employeeId: 'usr-1',
      activityId: 'act-1',
      status: 'ACTIVE',
      registeredAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'reg-2',
      employeeId: 'usr-2',
      activityId: 'act-1',
      status: 'ACTIVE',
      registeredAt: '2026-10-02T08:00:00Z'
    }
  ];

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [NotificationService, DataStoreService, StorageService]
    });

    service = TestBed.inject(NotificationService);
    dataStore = TestBed.inject(DataStoreService);
    storage = TestBed.inject(StorageService);

    dataStore.setUsers(mockUsers);
    dataStore.setActivities([mockActivity]);
    dataStore.setRegistrations(mockRegistrations);
    dataStore.setNotifications([]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Reminder Rules Management (Scope 3 & 4)', () => {
    it('should initialize with default 7d, 3d, 1d reminder rules', async () => {
      const rules = await firstValueFrom(service.reminderRules$);
      expect(rules.length).toBe(3);
      expect(rules.map((r) => r.daysBefore)).toEqual([7, 3, 1]);
    });

    it('should toggle rule enabled state and persist to storage', () => {
      service.toggleReminderRule('rule-7d', false);
      const rule = service.reminderRulesSnapshot.find((r) => r.id === 'rule-7d');
      expect(rule?.enabled).toBe(false);

      // Toggle back on
      service.toggleReminderRule('rule-7d', true);
      const restored = service.reminderRulesSnapshot.find((r) => r.id === 'rule-7d');
      expect(restored?.enabled).toBe(true);
    });

    it('should reset reminder rules to defaults', () => {
      service.toggleReminderRule('rule-7d', false);
      service.toggleReminderRule('rule-3d', false);
      service.resetReminderRules();

      const rules = service.reminderRulesSnapshot;
      expect(rules.every((r) => r.enabled)).toBe(true);
    });
  });

  describe('Reminder Simulation & Test Trigger (Scope 5 & 6)', () => {
    it('should generate a preview with template placeholders interpolated', () => {
      const preview = service.previewReminder('act-1', 7);

      expect(preview.activity.id).toBe('act-1');
      expect(preview.recipientCount).toBe(2);
      expect(preview.sampleTitle).toContain('Mangrove Coastal Restoration');
      expect(preview.sampleMessage).toContain('Pasir Ris Park');
      expect(preview.recipientNames).toContain('Alice Chen');
      expect(preview.recipientNames).toContain('Bob Miller');
    });

    it('should trigger reminder simulation and dispatch in-app notifications with "Simulated in app" label', async () => {
      const historyItem = await firstValueFrom(service.triggerReminderSimulation('act-1', 7));

      expect(historyItem.status).toBe('SIMULATED');
      expect(historyItem.statusLabel).toBe('Simulated in app');
      expect(historyItem.recipientCount).toBe(2);
      expect(historyItem.type).toBe('REMINDER');

      // Verify in-app notifications dispatched to dataStore
      const notifs = dataStore.notificationsSnapshot;
      expect(notifs.length).toBe(2);
      expect(notifs[0].type).toBe('REMINDER');
      expect(notifs[0].simulationLabel).toBe('Simulated in app');
      expect(notifs[0].activityId).toBe('act-1');
    });

    it('should record FAILED history and throw if rule is disabled', async () => {
      service.toggleReminderRule('rule-7d', false);

      let caughtError: any;
      try {
        await firstValueFrom(service.triggerReminderSimulation('act-1', 7));
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('disabled');
      const history = service.notificationHistorySnapshot;
      expect(history[0].status).toBe('FAILED');
      expect(history[0].statusLabel).toContain('disabled');
    });
  });

  describe('Broadcast Composition (Scope 4 & 5)', () => {
    it('should broadcast bulletin to ALL employees and label as Simulated in app', async () => {
      const historyItem = await firstValueFrom(
        service.composeBroadcast({
          subject: 'Corporate All-Hands Service Day Notice',
          body: 'All employees please note that volunteer transportation hubs are open.',
          targetGroup: 'ALL_EMPLOYEES'
        })
      );

      expect(historyItem.status).toBe('SIMULATED');
      expect(historyItem.statusLabel).toBe('Simulated in app');
      expect(historyItem.targetGroup).toBe('All Corporate Employees');

      const notifs = dataStore.notificationsSnapshot;
      const broadcastNotif = notifs.find((n) => n.recipientUserId === 'ALL');
      expect(broadcastNotif).toBeDefined();
      expect(broadcastNotif?.type).toBe('BROADCAST');
      expect(broadcastNotif?.simulationLabel).toBe('Simulated in app');
    });

    it('should broadcast bulletin to participants of a specific activity', async () => {
      const historyItem = await firstValueFrom(
        service.composeBroadcast({
          subject: 'Special Equipment Briefing',
          body: 'Please bring sunscreen and boots for Mangrove Restoration.',
          targetGroup: 'ACTIVITY_PARTICIPANTS',
          activityId: 'act-1'
        })
      );

      expect(historyItem.status).toBe('SIMULATED');
      expect(historyItem.recipientCount).toBe(2);

      const notifs = dataStore.notificationsSnapshot;
      expect(notifs.filter((n) => n.activityId === 'act-1').length).toBe(2);
    });

    it('should reject broadcast with empty subject or body', async () => {
      let caughtError: any;
      try {
        await firstValueFrom(service.composeBroadcast({ subject: '', body: 'Valid message', targetGroup: 'ALL_EMPLOYEES' }));
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('subject');
    });
  });

  describe('Activity Update & History Audit (Scope 1 & 5)', () => {
    it('should notify participants when activity details are updated', () => {
      service.notifyActivityUpdated(mockActivity, 'Time changed to 09:00 AM');

      const notifs = dataStore.notificationsSnapshot;
      expect(notifs.length).toBe(2);
      expect(notifs[0].type).toBe('ACTIVITY_UPDATE');
      expect(notifs[0].message).toContain('Time changed to 09:00 AM');

      const history = service.notificationHistorySnapshot;
      expect(history[0].type).toBe('ACTIVITY_UPDATE');
      expect(history[0].status).toBe('SIMULATED');
    });

    it('should clear history log', () => {
      expect(service.notificationHistorySnapshot.length).toBeGreaterThan(0);
      service.clearHistory();
      expect(service.notificationHistorySnapshot.length).toBe(0);
    });
  });
});
