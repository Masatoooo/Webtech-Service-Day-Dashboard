import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Activity,
  NotificationHistoryItem,
  ReminderRule,
  SimulationStatus
} from '../../../../models';
import {
  NotificationService,
  ReminderPreviewResult
} from '../../../../core/services/notification.service';
import { ActivityService } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-admin-reminders',
  templateUrl: './admin-reminders.component.html',
  styleUrls: ['./admin-reminders.component.css'],
  standalone: false
})
export class AdminRemindersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  reminderRules: ReminderRule[] = [];
  notificationHistory: NotificationHistoryItem[] = [];
  filteredHistory: NotificationHistoryItem[] = [];
  activities: Activity[] = [];

  // Broadcast form
  broadcastForm!: FormGroup;
  broadcastSubmitting = false;
  broadcastSuccessMessage = '';
  broadcastErrorMessage = '';

  // Reminder simulation control state
  selectedSimActivityId = '';
  selectedSimDaysBefore = 7;
  simPreviewResult: ReminderPreviewResult | null = null;
  simPreviewLoading = false;
  simTriggerSuccessMessage = '';
  simTriggerErrorMessage = '';

  // History filtering
  historySearchQuery = '';
  historyTypeFilter: string = 'ALL';

  constructor(
    private readonly notificationService: NotificationService,
    private readonly activityService: ActivityService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadActivities();

    // Subscribe to reminder rules
    this.notificationService.reminderRules$
      .pipe(takeUntil(this.destroy$))
      .subscribe((rules) => {
        this.reminderRules = rules;
      });

    // Subscribe to notification history
    this.notificationService.notificationHistory$
      .pipe(takeUntil(this.destroy$))
      .subscribe((history) => {
        this.notificationHistory = history;
        this.applyHistoryFilter();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.broadcastForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
      body: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      targetGroup: ['ALL_EMPLOYEES', [Validators.required]],
      activityId: ['']
    });

    // Reactively adjust validation when target group switches
    this.broadcastForm.get('targetGroup')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((target) => {
        const actCtrl = this.broadcastForm.get('activityId');
        if (target === 'ACTIVITY_PARTICIPANTS') {
          actCtrl?.setValidators([Validators.required]);
        } else {
          actCtrl?.clearValidators();
        }
        actCtrl?.updateValueAndValidity();
      });
  }

  private loadActivities(): void {
    this.activityService.getActivities()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.activities = list;
        if (list.length > 0 && !this.selectedSimActivityId) {
          this.selectedSimActivityId = list[0].id;
        }
      });
  }

  // =========================================================================
  // RULE TOGGLE & RESET (Scope 3 & 4)
  // =========================================================================

  toggleRule(rule: ReminderRule): void {
    this.notificationService.toggleReminderRule(rule.id, !rule.enabled);
    if (this.simPreviewResult && this.simPreviewResult.rule.id === rule.id) {
      this.generateSimulationPreview();
    }
  }

  resetRulesToDefault(): void {
    this.notificationService.resetReminderRules();
    this.simTriggerSuccessMessage = 'Reminder schedule rules reset to corporate defaults (7d, 3d, 1d).';
    setTimeout(() => (this.simTriggerSuccessMessage = ''), 4000);
  }

  // =========================================================================
  // REMINDER PREVIEW & SIMULATION TRIGGER (Scope 5 & 6)
  // =========================================================================

  generateSimulationPreview(): void {
    if (!this.selectedSimActivityId) {
      this.simTriggerErrorMessage = 'Please select a valid activity to preview.';
      return;
    }

    try {
      this.simPreviewLoading = true;
      this.simTriggerErrorMessage = '';
      this.simPreviewResult = this.notificationService.previewReminder(
        this.selectedSimActivityId,
        this.selectedSimDaysBefore
      );
    } catch (err: any) {
      this.simTriggerErrorMessage = err?.message || 'Could not generate simulation preview.';
      this.simPreviewResult = null;
    } finally {
      this.simPreviewLoading = false;
    }
  }

  triggerSimulation(): void {
    if (!this.selectedSimActivityId) {
      this.simTriggerErrorMessage = 'Please select an activity.';
      return;
    }

    this.simTriggerErrorMessage = '';
    this.simTriggerSuccessMessage = '';

    this.notificationService
      .triggerReminderSimulation(this.selectedSimActivityId, this.selectedSimDaysBefore)
      .subscribe({
        next: (item) => {
          this.simTriggerSuccessMessage = `Reminder simulation dispatched to ${item.recipientCount} enrolled participant(s). Marked: "Simulated in app".`;
          // Refresh preview
          this.generateSimulationPreview();
          setTimeout(() => (this.simTriggerSuccessMessage = ''), 6000);
        },
        error: (err) => {
          this.simTriggerErrorMessage = err?.message || 'Failed to trigger reminder simulation.';
        }
      });
  }

  // =========================================================================
  // BROADCAST BULLETIN (Scope 4)
  // =========================================================================

  sendBroadcast(): void {
    this.broadcastSuccessMessage = '';
    this.broadcastErrorMessage = '';

    if (this.broadcastForm.invalid) {
      this.broadcastForm.markAllAsTouched();
      this.broadcastErrorMessage = 'Please complete all required broadcast fields correctly.';
      return;
    }

    const val = this.broadcastForm.value;
    this.broadcastSubmitting = true;

    this.notificationService
      .composeBroadcast({
        subject: val.subject,
        body: val.body,
        targetGroup: val.targetGroup,
        activityId: val.activityId || undefined
      })
      .subscribe({
        next: (item) => {
          this.broadcastSubmitting = false;
          this.broadcastSuccessMessage = `Broadcast bulletin simulated successfully for ${item.targetGroup} (${item.recipientCount} recipient(s)).`;
          this.broadcastForm.reset({
            targetGroup: 'ALL_EMPLOYEES',
            activityId: ''
          });
          setTimeout(() => (this.broadcastSuccessMessage = ''), 6000);
        },
        error: (err) => {
          this.broadcastSubmitting = false;
          this.broadcastErrorMessage = err?.message || 'Failed to dispatch broadcast.';
        }
      });
  }

  // =========================================================================
  // NOTIFICATION HISTORY & AUDIT LOG (Scope 5)
  // =========================================================================

  applyHistoryFilter(): void {
    let list = [...this.notificationHistory];

    if (this.historyTypeFilter !== 'ALL') {
      list = list.filter((item) => item.type === this.historyTypeFilter);
    }

    if (this.historySearchQuery.trim()) {
      const q = this.historySearchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.targetGroup.toLowerCase().includes(q) ||
          (item.activityTitle && item.activityTitle.toLowerCase().includes(q))
      );
    }

    this.filteredHistory = list;
  }

  setHistoryType(type: string): void {
    this.historyTypeFilter = type;
    this.applyHistoryFilter();
  }

  onHistorySearch(query: string): void {
    this.historySearchQuery = query;
    this.applyHistoryFilter();
  }

  clearHistoryLog(): void {
    if (confirm('Clear simulated notification history? In-app notifications in employee inboxes will remain intact.')) {
      this.notificationService.clearHistory();
    }
  }

  getSimRuleForDays(days: number): ReminderRule | undefined {
    return this.reminderRules.find((r) => r.daysBefore === days);
  }
}
