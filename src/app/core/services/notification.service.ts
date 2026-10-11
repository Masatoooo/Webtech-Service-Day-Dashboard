import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import {
  Activity,
  BroadcastPayload,
  Notification,
  NotificationHistoryItem,
  ReminderRule,
  SimulationStatus,
  User
} from '../../models';
import { DataStoreService } from './data-store.service';
import { StorageService, STORAGE_KEYS } from './storage.service';

export const DEFAULT_REMINDER_RULES: ReminderRule[] = [
  {
    id: 'rule-7d',
    daysBefore: 7,
    name: '7-Day Advance Notice',
    description: 'Advance notification for logistics preparation, transit planning, and calendar booking.',
    enabled: true,
    subjectTemplate: 'Upcoming Service Day in 7 Days: {activityTitle}',
    bodyTemplate:
      'Your volunteer initiative "{activityTitle}" is coming up in one week on {startDate}. Please review meeting point instructions at {location}.'
  },
  {
    id: 'rule-3d',
    daysBefore: 3,
    name: '3-Day Readiness Check',
    description: 'Logistics check: weather forecast, transit directions, and volunteer safety gear.',
    enabled: true,
    subjectTemplate: '3 Days Until Service Day: {activityTitle}',
    bodyTemplate:
      'Reminder: "{activityTitle}" starts in 3 days on {startDate} at {location}. Remember to bring comfortable clothing and water.'
  },
  {
    id: 'rule-1d',
    daysBefore: 1,
    name: '24-Hour Final Alert',
    description: 'Final briefing alert, arrival time confirmation, and check-in preparation.',
    enabled: true,
    subjectTemplate: 'Tomorrow: Service Day {activityTitle}',
    bodyTemplate:
      'Final Alert: "{activityTitle}" takes place tomorrow on {startDate} at {location}. Please arrive 15 minutes before start time.'
  }
];

export const SEED_NOTIFICATION_HISTORY: NotificationHistoryItem[] = [
  {
    id: 'hist-seed-1',
    title: 'Service Day 2026 Opportunities Published',
    message: 'Welcome to Annual Corporate Service Day. Please browse approved NGO initiatives and reserve your contribution slot before cut-off deadlines.',
    type: 'BROADCAST',
    targetGroup: 'All Corporate Employees',
    recipientCount: 5,
    status: 'SIMULATED',
    statusLabel: 'Simulated in app',
    createdAt: '2026-10-07T08:00:00Z'
  },
  {
    id: 'hist-seed-2',
    title: 'Upcoming Registration Cut-Off Notice',
    message: 'Registration for "Coral Reef Nursery Monitoring & Cleanup" will close in 24 hours. Please finalize any adjustments promptly.',
    type: 'REMINDER',
    targetGroup: 'Coral Reef Nursery Monitoring & Cleanup',
    recipientCount: 2,
    activityId: 'act-5',
    activityTitle: 'Coral Reef Nursery Monitoring & Cleanup',
    status: 'SIMULATED',
    statusLabel: 'Simulated in app',
    createdAt: '2026-10-04T09:00:00Z'
  }
];

export interface ReminderPreviewResult {
  rule: ReminderRule;
  activity: Activity;
  recipientCount: number;
  sampleTitle: string;
  sampleMessage: string;
  scheduledDateStr: string;
  recipientNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _reminderRules$ = new BehaviorSubject<ReminderRule[]>([]);
  private readonly _notificationHistory$ = new BehaviorSubject<NotificationHistoryItem[]>([]);

  readonly reminderRules$: Observable<ReminderRule[]> = this._reminderRules$.asObservable();
  readonly notificationHistory$: Observable<NotificationHistoryItem[]> = this._notificationHistory$.asObservable();

  constructor(
    private readonly dataStore: DataStoreService,
    private readonly storage: StorageService
  ) {
    this.loadInitialState();
  }

  private loadInitialState(): void {
    // 1. Reminder rules
    const savedRules = this.storage.getItem<ReminderRule[]>(STORAGE_KEYS.REMINDER_RULES);
    if (savedRules && Array.isArray(savedRules) && savedRules.length > 0) {
      this._reminderRules$.next(savedRules);
    } else {
      this._reminderRules$.next(DEFAULT_REMINDER_RULES);
      this.storage.setItem(STORAGE_KEYS.REMINDER_RULES, DEFAULT_REMINDER_RULES);
    }

    // 2. Notification History
    const savedHistory = this.storage.getItem<NotificationHistoryItem[]>(STORAGE_KEYS.NOTIFICATION_HISTORY);
    if (savedHistory && Array.isArray(savedHistory)) {
      this._notificationHistory$.next(savedHistory);
    } else {
      this._notificationHistory$.next(SEED_NOTIFICATION_HISTORY);
      this.storage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, SEED_NOTIFICATION_HISTORY);
    }
  }

  get reminderRulesSnapshot(): ReminderRule[] {
    return this._reminderRules$.getValue();
  }

  get notificationHistorySnapshot(): NotificationHistoryItem[] {
    return this._notificationHistory$.getValue();
  }

  /**
   * Helper to format dates cleanly for user messages.
   */
  private formatDate(isoString: string): string {
    const d = new Date(isoString);
    return isNaN(d.getTime())
      ? isoString
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // =========================================================================
  // REMINDER SCHEDULE RULES (Scope 3 & 4)
  // =========================================================================

  toggleReminderRule(ruleId: string, enabled: boolean): void {
    const current = this._reminderRules$.getValue();
    const updated = current.map((r) => (r.id === ruleId ? { ...r, enabled } : r));
    this._reminderRules$.next(updated);
    this.storage.setItem(STORAGE_KEYS.REMINDER_RULES, updated);
  }

  setReminderRules(rules: ReminderRule[]): void {
    this._reminderRules$.next(rules);
    this.storage.setItem(STORAGE_KEYS.REMINDER_RULES, rules);
  }

  resetReminderRules(): void {
    this._reminderRules$.next(DEFAULT_REMINDER_RULES);
    this.storage.setItem(STORAGE_KEYS.REMINDER_RULES, DEFAULT_REMINDER_RULES);
  }

  // =========================================================================
  // REMINDER SIMULATION & TEST-TRIGGER (Scope 4, 5, 6)
  // =========================================================================

  /**
   * Generates a preview of the simulated reminder without mutating state.
   */
  previewReminder(activityId: string, daysBefore: number): ReminderPreviewResult {
    const activities = this.dataStore.activitiesSnapshot;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) {
      throw new Error(`[NotificationService] Activity "${activityId}" not found.`);
    }

    const rules = this._reminderRules$.getValue();
    const rule = rules.find((r) => r.daysBefore === daysBefore) || DEFAULT_REMINDER_RULES[0];

    const registrations = this.dataStore.registrationsSnapshot.filter(
      (r) => r.activityId === activityId && r.status === 'ACTIVE'
    );
    const users = this.dataStore.usersSnapshot;
    const userMap = new Map<string, User>(users.map((u) => [u.id, u]));

    const recipientNames = registrations.map((r) => {
      const u = userMap.get(r.employeeId);
      return u ? u.name : `Staff (${r.employeeId})`;
    });

    const startDateStr = this.formatDate(activity.startDateTime);
    const title = rule.subjectTemplate.replace('{activityTitle}', activity.title);
    const message = rule.bodyTemplate
      .replace('{activityTitle}', activity.title)
      .replace('{startDate}', startDateStr)
      .replace('{location}', activity.location);

    const actDate = new Date(activity.startDateTime);
    const scheduledDate = new Date(actDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
    const scheduledDateStr = isNaN(scheduledDate.getTime())
      ? `${daysBefore} days before activity`
      : this.formatDate(scheduledDate.toISOString());

    return {
      rule,
      activity,
      recipientCount: registrations.length,
      sampleTitle: title,
      sampleMessage: message,
      scheduledDateStr,
      recipientNames
    };
  }

  /**
   * Triggers the simulated reminder event, dispatches in-app notifications, and records history.
   */
  triggerReminderSimulation(activityId: string, daysBefore: number): Observable<NotificationHistoryItem> {
    const preview = this.previewReminder(activityId, daysBefore);
    const { activity, rule, sampleTitle, sampleMessage } = preview;

    if (!rule.enabled) {
      const failedItem: NotificationHistoryItem = {
        id: `hist-${Date.now()}`,
        title: sampleTitle,
        message: sampleMessage,
        type: 'REMINDER',
        targetGroup: `Participants of ${activity.title}`,
        recipientCount: 0,
        activityId: activity.id,
        activityTitle: activity.title,
        status: 'FAILED',
        statusLabel: 'Rule is disabled in settings',
        createdAt: new Date().toISOString()
      };
      this.recordHistory(failedItem);
      return throwError(() => new Error(`The ${daysBefore}-day reminder rule is currently disabled in settings.`));
    }

    const registrations = this.dataStore.registrationsSnapshot.filter(
      (r) => r.activityId === activityId && r.status === 'ACTIVE'
    );

    const nowIso = new Date().toISOString();
    const currentNotifs = this.dataStore.notificationsSnapshot;
    const newNotifs: Notification[] = [];

    // Dispatch in-app notification to each active registered employee
    for (const reg of registrations) {
      newNotifs.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        recipientUserId: reg.employeeId,
        title: sampleTitle,
        message: sampleMessage,
        type: 'REMINDER',
        createdAt: nowIso,
        readAt: null,
        deliveryStatus: 'DELIVERED',
        activityId: activity.id,
        simulationLabel: 'Simulated in app'
      });
    }

    if (newNotifs.length > 0) {
      this.dataStore.setNotifications([...currentNotifs, ...newNotifs]);
    }

    const historyItem: NotificationHistoryItem = {
      id: `hist-${Date.now()}`,
      title: sampleTitle,
      message: sampleMessage,
      type: 'REMINDER',
      targetGroup: `Participants of ${activity.title}`,
      recipientCount: registrations.length,
      activityId: activity.id,
      activityTitle: activity.title,
      status: 'SIMULATED',
      statusLabel: 'Simulated in app',
      createdAt: nowIso
    };

    this.recordHistory(historyItem);
    return of(historyItem);
  }

  // =========================================================================
  // BROADCAST BULLETINS (Scope 4 & 5)
  // =========================================================================

  composeBroadcast(payload: BroadcastPayload): Observable<NotificationHistoryItem> {
    if (!payload.subject || !payload.subject.trim()) {
      return throwError(() => new Error('Broadcast subject is required.'));
    }
    if (!payload.body || !payload.body.trim()) {
      return throwError(() => new Error('Broadcast message body is required.'));
    }

    let targetGroupLabel = 'All Corporate Employees';
    let activityTitle: string | undefined;
    let recipientCount = 0;
    const nowIso = new Date().toISOString();
    const currentNotifs = this.dataStore.notificationsSnapshot;
    const newNotifs: Notification[] = [];

    if (payload.targetGroup === 'ACTIVITY_PARTICIPANTS') {
      if (!payload.activityId) {
        return throwError(() => new Error('Associated activity must be selected for participant broadcasts.'));
      }
      const activity = this.dataStore.activitiesSnapshot.find((a) => a.id === payload.activityId);
      if (!activity) {
        return throwError(() => new Error(`Activity with id "${payload.activityId}" not found.`));
      }

      activityTitle = activity.title;
      targetGroupLabel = `Enrolled Participants of ${activity.title}`;

      const registrations = this.dataStore.registrationsSnapshot.filter(
        (r) => r.activityId === payload.activityId && r.status === 'ACTIVE'
      );
      recipientCount = registrations.length;

      for (const reg of registrations) {
        newNotifs.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          recipientUserId: reg.employeeId,
          title: payload.subject.trim(),
          message: payload.body.trim(),
          type: 'BROADCAST',
          createdAt: nowIso,
          readAt: null,
          deliveryStatus: 'DELIVERED',
          activityId: activity.id,
          simulationLabel: 'Simulated in app'
        });
      }
    } else {
      // Broadcast to all employees
      const employeeUsers = this.dataStore.usersSnapshot.filter((u) => u.role === 'EMPLOYEE');
      recipientCount = employeeUsers.length > 0 ? employeeUsers.length : 1;

      newNotifs.push({
        id: `notif-${Date.now()}`,
        recipientUserId: 'ALL',
        title: payload.subject.trim(),
        message: payload.body.trim(),
        type: 'BROADCAST',
        createdAt: nowIso,
        readAt: null,
        deliveryStatus: 'DELIVERED',
        activityId: payload.activityId,
        simulationLabel: 'Simulated in app'
      });
    }

    this.dataStore.setNotifications([...currentNotifs, ...newNotifs]);

    const historyItem: NotificationHistoryItem = {
      id: `hist-${Date.now()}`,
      title: payload.subject.trim(),
      message: payload.body.trim(),
      type: 'BROADCAST',
      targetGroup: targetGroupLabel,
      recipientCount,
      activityId: payload.activityId,
      activityTitle,
      status: 'SIMULATED',
      statusLabel: 'Simulated in app',
      createdAt: nowIso
    };

    this.recordHistory(historyItem);
    return of(historyItem);
  }

  // =========================================================================
  // RELEVANT ACTIVITY UPDATES (Scope 1)
  // =========================================================================

  notifyActivityUpdated(activity: Activity, changeSummary: string): void {
    const registrations = this.dataStore.registrationsSnapshot.filter(
      (r) => r.activityId === activity.id && r.status === 'ACTIVE'
    );
    if (registrations.length === 0) return;

    const nowIso = new Date().toISOString();
    const currentNotifs = this.dataStore.notificationsSnapshot;
    const newNotifs: Notification[] = [];

    const title = `Activity Update: ${activity.title}`;
    const message = `Notice for your enrolled session "${activity.title}": ${changeSummary}. Location: ${activity.location}, Scheduled: ${this.formatDate(activity.startDateTime)}.`;

    for (const reg of registrations) {
      newNotifs.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        recipientUserId: reg.employeeId,
        title,
        message,
        type: 'ACTIVITY_UPDATE',
        createdAt: nowIso,
        readAt: null,
        deliveryStatus: 'DELIVERED',
        activityId: activity.id,
        simulationLabel: 'Simulated in app'
      });
    }

    this.dataStore.setNotifications([...currentNotifs, ...newNotifs]);

    const historyItem: NotificationHistoryItem = {
      id: `hist-${Date.now()}`,
      title,
      message,
      type: 'ACTIVITY_UPDATE',
      targetGroup: `Enrolled Participants of ${activity.title}`,
      recipientCount: registrations.length,
      activityId: activity.id,
      activityTitle: activity.title,
      status: 'SIMULATED',
      statusLabel: 'Simulated in app',
      createdAt: nowIso
    };
    this.recordHistory(historyItem);
  }

  // =========================================================================
  // HISTORY AUDIT LOGGING (Scope 5)
  // =========================================================================

  private recordHistory(item: NotificationHistoryItem): void {
    const current = this._notificationHistory$.getValue();
    const updated = [item, ...current];
    this._notificationHistory$.next(updated);
    this.storage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, updated);
  }

  clearHistory(): void {
    this._notificationHistory$.next([]);
    this.storage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, []);
  }
}
