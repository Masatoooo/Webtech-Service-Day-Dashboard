import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, BehaviorSubject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminRemindersComponent } from './admin-reminders.component';
import { NotificationService, ReminderPreviewResult, DEFAULT_REMINDER_RULES } from '../../../../core/services/notification.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Activity, NotificationHistoryItem, ReminderRule } from '../../../../models';

describe('AdminRemindersComponent', () => {
  let component: AdminRemindersComponent;
  let fixture: ComponentFixture<AdminRemindersComponent>;
  let mockNotificationService: any;
  let mockActivityService: any;

  let reminderRulesSubject: BehaviorSubject<ReminderRule[]>;
  let notificationHistorySubject: BehaviorSubject<NotificationHistoryItem[]>;

  const mockActivities: Activity[] = [
    {
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
    }
  ];

  const mockHistoryItems: NotificationHistoryItem[] = [
    {
      id: 'hist-1',
      title: '7-Day Advance Reminder',
      message: 'Your service day initiative is coming up in one week.',
      type: 'REMINDER',
      targetGroup: 'Participants of Mangrove Coastal Restoration',
      recipientCount: 5,
      activityId: 'act-1',
      activityTitle: 'Mangrove Coastal Restoration',
      status: 'SIMULATED',
      statusLabel: 'Simulated in app',
      createdAt: '2026-10-10T08:00:00Z'
    },
    {
      id: 'hist-2',
      title: 'Corporate Broadcast Bulletin',
      message: 'Registration cut-offs will close on Friday.',
      type: 'BROADCAST',
      targetGroup: 'All Corporate Employees',
      recipientCount: 25,
      status: 'SIMULATED',
      statusLabel: 'Simulated in app',
      createdAt: '2026-10-09T08:00:00Z'
    }
  ];

  beforeEach(async () => {
    reminderRulesSubject = new BehaviorSubject<ReminderRule[]>(DEFAULT_REMINDER_RULES);
    notificationHistorySubject = new BehaviorSubject<NotificationHistoryItem[]>(mockHistoryItems);

    mockNotificationService = {
      reminderRules$: reminderRulesSubject.asObservable(),
      notificationHistory$: notificationHistorySubject.asObservable(),
      toggleReminderRule: vi.fn((id: string, enabled: boolean) => {
        const rules = reminderRulesSubject.getValue().map((r) => (r.id === id ? { ...r, enabled } : r));
        reminderRulesSubject.next(rules);
      }),
      resetReminderRules: vi.fn(() => {
        reminderRulesSubject.next(DEFAULT_REMINDER_RULES);
      }),
      previewReminder: vi.fn(() => ({
        rule: DEFAULT_REMINDER_RULES[0],
        activity: mockActivities[0],
        recipientCount: 3,
        sampleTitle: 'Upcoming Service Day in 7 Days: Mangrove Coastal Restoration',
        sampleMessage: 'Your volunteer initiative starts in one week.',
        scheduledDateStr: 'Nov 13, 2026',
        recipientNames: ['Alice Chen', 'Bob Miller']
      } as ReminderPreviewResult)),
      triggerReminderSimulation: vi.fn(() =>
        of({
          id: 'hist-new',
          title: 'Upcoming Service Day in 7 Days: Mangrove Coastal Restoration',
          message: 'Your volunteer initiative starts in one week.',
          type: 'REMINDER',
          targetGroup: 'Participants of Mangrove Coastal Restoration',
          recipientCount: 2,
          activityId: 'act-1',
          status: 'SIMULATED',
          statusLabel: 'Simulated in app',
          createdAt: new Date().toISOString()
        } as NotificationHistoryItem)
      ),
      composeBroadcast: vi.fn(() =>
        of({
          id: 'hist-bcast',
          title: 'Special Notice',
          message: 'Broadcast message body text here',
          type: 'BROADCAST',
          targetGroup: 'All Corporate Employees',
          recipientCount: 10,
          status: 'SIMULATED',
          statusLabel: 'Simulated in app',
          createdAt: new Date().toISOString()
        } as NotificationHistoryItem)
      ),
      clearHistory: vi.fn(() => {
        notificationHistorySubject.next([]);
      })
    };

    mockActivityService = {
      getActivities: vi.fn(() => of(mockActivities))
    };

    await TestBed.configureTestingModule({
      declarations: [AdminRemindersComponent, StatusBadgeComponent],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ActivityService, useValue: mockActivityService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRemindersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with reminder rules, activities, and notification history', () => {
    expect(component.reminderRules.length).toBe(3);
    expect(component.activities.length).toBe(1);
    expect(component.notificationHistory.length).toBe(2);
    expect(component.filteredHistory.length).toBe(2);
    expect(component.selectedSimActivityId).toBe('act-1');
  });

  it('should toggle reminder rule when requested', () => {
    const rule7d = component.reminderRules[0];
    component.toggleRule(rule7d);

    expect(mockNotificationService.toggleReminderRule).toHaveBeenCalledWith('rule-7d', false);
  });

  it('should generate simulation preview on demand without sending notifications', () => {
    component.selectedSimActivityId = 'act-1';
    component.selectedSimDaysBefore = 7;
    component.generateSimulationPreview();

    expect(mockNotificationService.previewReminder).toHaveBeenCalledWith('act-1', 7);
    expect(component.simPreviewResult).toBeTruthy();
    expect(component.simPreviewResult?.recipientCount).toBe(3);
    expect(component.simPreviewResult?.sampleTitle).toContain('Mangrove Coastal Restoration');
  });

  it('should trigger reminder simulation and show success message', () => {
    component.selectedSimActivityId = 'act-1';
    component.selectedSimDaysBefore = 7;
    component.triggerSimulation();

    expect(mockNotificationService.triggerReminderSimulation).toHaveBeenCalledWith('act-1', 7);
    expect(component.simTriggerSuccessMessage).toContain('Reminder simulation dispatched');
  });

  describe('Broadcast Form Validation & Submission', () => {
    it('should validate broadcast form fields', () => {
      const form = component.broadcastForm;
      expect(form.valid).toBe(false);

      form.patchValue({
        subject: 'Valid Subject',
        body: 'Valid message body text exceeding min length',
        targetGroup: 'ALL_EMPLOYEES'
      });
      expect(form.valid).toBe(true);

      // When targetGroup is ACTIVITY_PARTICIPANTS, activityId is required
      form.patchValue({ targetGroup: 'ACTIVITY_PARTICIPANTS', activityId: '' });
      expect(form.valid).toBe(false);

      form.patchValue({ activityId: 'act-1' });
      expect(form.valid).toBe(true);
    });

    it('should submit broadcast form and display success alert', () => {
      component.broadcastForm.patchValue({
        subject: 'All-Hands Volunteer Meeting',
        body: 'Please attend the pre-departure briefing at 8am.',
        targetGroup: 'ALL_EMPLOYEES'
      });

      component.sendBroadcast();

      expect(mockNotificationService.composeBroadcast).toHaveBeenCalledWith({
        subject: 'All-Hands Volunteer Meeting',
        body: 'Please attend the pre-departure briefing at 8am.',
        targetGroup: 'ALL_EMPLOYEES',
        activityId: undefined
      });
      expect(component.broadcastSuccessMessage).toContain('Broadcast bulletin simulated successfully');
    });
  });

  describe('History Filtering & Audit Log', () => {
    it('should filter history items by type', () => {
      component.setHistoryType('REMINDER');
      expect(component.filteredHistory.length).toBe(1);
      expect(component.filteredHistory[0].type).toBe('REMINDER');

      component.setHistoryType('BROADCAST');
      expect(component.filteredHistory.length).toBe(1);
      expect(component.filteredHistory[0].type).toBe('BROADCAST');

      component.setHistoryType('ALL');
      expect(component.filteredHistory.length).toBe(2);
    });

    it('should filter history items by search query', () => {
      component.onHistorySearch('Mangrove');
      expect(component.filteredHistory.length).toBe(1);
      expect(component.filteredHistory[0].title).toContain('7-Day Advance Reminder');

      component.onHistorySearch('Friday');
      expect(component.filteredHistory.length).toBe(1);
      expect(component.filteredHistory[0].title).toContain('Corporate Broadcast');
    });

    it('should clear history log after confirmation', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.clearHistoryLog();
      expect(mockNotificationService.clearHistory).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });
});
