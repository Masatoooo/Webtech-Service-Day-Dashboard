import { Component, OnInit, OnDestroy, Optional } from '@angular/core';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { RegistrationService } from '../../../../core/services/registration.service';
import {
  Registration,
  Activity,
  User,
  NGO,
  ActivitySlotSummary,
  ServiceType
} from '../../../../models';

export type RegistrationTab = 'UPCOMING' | 'PAST' | 'CANCELLED' | 'ALL';

export interface MyRegistrationItem {
  registration: Registration;
  activity?: Activity;
  ngo?: NGO;
  slotSummary?: ActivitySlotSummary;
  isCutoffPassed: boolean;
  canCancel: boolean;
  cancelBlockReason?: string;
  canTransfer: boolean;
  transferBlockReason?: string;
}

export interface EligibleTargetActivity {
  activity: Activity;
  ngo?: NGO;
  slotSummary: ActivitySlotSummary;
}

@Component({
  selector: 'app-my-registrations',
  templateUrl: './my-registrations.component.html',
  styleUrls: ['./my-registrations.component.css'],
  standalone: false
})
export class MyRegistrationsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  currentUser: User | null = null;
  activeTab: RegistrationTab = 'UPCOMING';

  // Master items list
  allRegistrationItems: MyRegistrationItem[] = [];

  // Feedback Banner
  feedbackBanner: { type: 'success' | 'error'; message: string } | null = null;

  // Cancel Modal State
  cancelModalItem: MyRegistrationItem | null = null;
  cancelReason: string = '';
  isCancelling: boolean = false;
  cancelError: string | null = null;

  // Transfer Modal State
  transferModalItem: MyRegistrationItem | null = null;
  selectedTargetActivityId: string = '';
  transferReason: string = '';
  isTransferring: boolean = false;
  transferError: string | null = null;
  eligibleTransferActivities: EligibleTargetActivity[] = [];
  transferOverlappingActivities: Activity[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly dataStore: DataStoreService,
    private readonly activityService: ActivityService,
    @Optional() private readonly registrationService?: RegistrationService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.authService.currentUser$,
      this.dataStore.registrations$,
      this.dataStore.activities$,
      this.dataStore.ngos$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([user, registrations, activities, ngos]) => {
        this.currentUser = user;
        if (!user) {
          this.allRegistrationItems = [];
          return;
        }

        const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));
        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));

        const userRegs = registrations.filter((r) => r.employeeId === user.id);

        this.allRegistrationItems = userRegs.map((reg) => {
          const act = actMap.get(reg.activityId);
          const ngo = act ? ngoMap.get(act.ngoId) : undefined;
          const slotSummary = act ? this.activityService.computeSlotSummary(act, registrations) : undefined;
          const isCutoffPassed = act ? this.activityService.isCutoffPassed(act) : false;

          let canCancel = reg.status === 'ACTIVE' && !isCutoffPassed;
          let cancelBlockReason: string | undefined;
          if (reg.status !== 'ACTIVE') {
            canCancel = false;
            cancelBlockReason = 'Registration is already cancelled.';
          } else if (isCutoffPassed) {
            canCancel = false;
            cancelBlockReason = `Cut-off deadline passed on ${this.formatDate(act?.registrationCutoff || '')}. Attendance rosters are locked.`;
          }

          let canTransfer = reg.status === 'ACTIVE' && !isCutoffPassed;
          let transferBlockReason: string | undefined;
          if (reg.status !== 'ACTIVE') {
            canTransfer = false;
            transferBlockReason = 'Only active registrations can be transferred.';
          } else if (isCutoffPassed) {
            canTransfer = false;
            transferBlockReason = `Cut-off passed on ${this.formatDate(act?.registrationCutoff || '')}. Cannot transfer.`;
          }

          return {
            registration: reg,
            activity: act,
            ngo,
            slotSummary,
            isCutoffPassed,
            canCancel,
            cancelBlockReason,
            canTransfer,
            transferBlockReason
          };
        });

        // Re-evaluate eligible transfer activities if transfer modal is active
        if (this.transferModalItem) {
          const freshItem = this.allRegistrationItems.find(
            (i) => i.registration.id === this.transferModalItem?.registration.id
          );
          if (freshItem) {
            this.transferModalItem = freshItem;
            this.computeEligibleTransferActivities(freshItem);
          } else {
            this.closeTransferModal();
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: RegistrationTab): void {
    this.activeTab = tab;
  }

  get filteredItems(): MyRegistrationItem[] {
    const now = Date.now();

    switch (this.activeTab) {
      case 'UPCOMING':
        return this.allRegistrationItems.filter((item) => {
          if (item.registration.status !== 'ACTIVE') return false;
          if (!item.activity) return true;
          const end = new Date(item.activity.endDateTime).getTime();
          return end >= now;
        });

      case 'PAST':
        return this.allRegistrationItems.filter((item) => {
          if (!item.activity) return false;
          const end = new Date(item.activity.endDateTime).getTime();
          return item.activity.publicationStatus === 'COMPLETED' || (end < now && item.registration.status === 'ACTIVE');
        });

      case 'CANCELLED':
        return this.allRegistrationItems.filter((item) => item.registration.status === 'CANCELLED');

      case 'ALL':
      default:
        return this.allRegistrationItems;
    }
  }

  get upcomingCount(): number {
    const now = Date.now();
    return this.allRegistrationItems.filter((item) => {
      if (item.registration.status !== 'ACTIVE') return false;
      if (!item.activity) return true;
      return new Date(item.activity.endDateTime).getTime() >= now;
    }).length;
  }

  get pastCount(): number {
    const now = Date.now();
    return this.allRegistrationItems.filter((item) => {
      if (!item.activity) return false;
      const end = new Date(item.activity.endDateTime).getTime();
      return item.activity.publicationStatus === 'COMPLETED' || (end < now && item.registration.status === 'ACTIVE');
    }).length;
  }

  get cancelledCount(): number {
    return this.allRegistrationItems.filter((item) => item.registration.status === 'CANCELLED').length;
  }

  get allCount(): number {
    return this.allRegistrationItems.length;
  }

  // --- Cancellation Workflow (BR-09, FR-18) ---

  openCancelModal(item: MyRegistrationItem): void {
    this.cancelError = null;
    this.cancelReason = '';

    if (!item.canCancel) {
      this.feedbackBanner = {
        type: 'error',
        message: item.cancelBlockReason || 'Cannot cancel this registration.'
      };
      return;
    }

    this.cancelModalItem = item;
  }

  confirmCancel(): void {
    if (!this.cancelModalItem || !this.registrationService) return;

    this.isCancelling = true;
    this.cancelError = null;

    try {
      this.registrationService
        .cancelRegistration(this.cancelModalItem.registration.id, this.cancelReason)
        .subscribe({
          next: () => {
            const title = this.cancelModalItem?.activity?.title || 'Activity';
            this.feedbackBanner = {
              type: 'success',
              message: `Registration for "${title}" was successfully withdrawn. Your spot has been restored to the available pool.`
            };
            this.isCancelling = false;
            this.closeCancelModal();
          },
          error: (err) => {
            this.isCancelling = false;
            this.cancelError = err?.message || 'Failed to cancel registration.';
          }
        });
    } catch (err: any) {
      this.isCancelling = false;
      this.cancelError = err?.message || 'Failed to cancel registration.';
    }
  }

  closeCancelModal(): void {
    this.cancelModalItem = null;
    this.cancelReason = '';
    this.cancelError = null;
    this.isCancelling = false;
  }

  // --- Transfer Workflow (BR-10, FR-19) ---

  openTransferModal(item: MyRegistrationItem): void {
    this.transferError = null;
    this.transferReason = '';
    this.selectedTargetActivityId = '';
    this.transferOverlappingActivities = [];

    if (!item.canTransfer) {
      this.feedbackBanner = {
        type: 'error',
        message: item.transferBlockReason || 'Cannot transfer this registration.'
      };
      return;
    }

    this.transferModalItem = item;
    this.computeEligibleTransferActivities(item);
  }

  private computeEligibleTransferActivities(item: MyRegistrationItem): void {
    const activities = this.dataStore.activitiesSnapshot;
    const ngos = this.dataStore.ngosSnapshot;
    const registrations = this.dataStore.registrationsSnapshot;
    const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));

    const userActiveActIds = new Set<string>(
      registrations
        .filter((r) => r.employeeId === this.currentUser?.id && r.status === 'ACTIVE')
        .map((r) => r.activityId)
    );

    this.eligibleTransferActivities = activities
      .filter((act) => {
        // Exclude current activity
        if (act.id === item.activity?.id) return false;

        // NGO must be approved
        const ngo = ngoMap.get(act.ngoId);
        if (!ngo || ngo.approvalStatus !== 'APPROVED') return false;

        // Must be published
        if (act.publicationStatus !== 'PUBLISHED') return false;

        // Cutoff must not have passed
        if (this.activityService.isCutoffPassed(act)) return false;

        // Employee cannot already be registered in target
        if (userActiveActIds.has(act.id)) return false;

        // Must have remaining capacity
        const slotSummary = this.activityService.computeSlotSummary(act, registrations);
        if (slotSummary.remainingSlots <= 0) return false;

        return true;
      })
      .map((act) => {
        const ngo = ngoMap.get(act.ngoId);
        const slotSummary = this.activityService.computeSlotSummary(act, registrations);
        return { activity: act, ngo, slotSummary };
      });
  }

  onSelectTargetActivity(targetId: string): void {
    this.selectedTargetActivityId = targetId;
    this.transferError = null;

    if (!this.currentUser || !this.registrationService || !this.transferModalItem) {
      this.transferOverlappingActivities = [];
      return;
    }

    const targetOption = this.eligibleTransferActivities.find((t) => t.activity.id === targetId);
    if (targetOption) {
      // Exclude source registration activity when checking conflicts
      this.transferOverlappingActivities = this.registrationService.getOverlappingActivities(
        this.currentUser.id,
        targetOption.activity,
        this.transferModalItem.activity?.id
      );
    } else {
      this.transferOverlappingActivities = [];
    }
  }

  confirmTransfer(): void {
    if (!this.transferModalItem || !this.selectedTargetActivityId || !this.registrationService) return;

    this.isTransferring = true;
    this.transferError = null;

    const sourceTitle = this.transferModalItem.activity?.title || 'Current activity';
    const targetItem = this.eligibleTransferActivities.find(
      (t) => t.activity.id === this.selectedTargetActivityId
    );
    const targetTitle = targetItem?.activity.title || 'New activity';

    try {
      this.registrationService
        .transferRegistration(
          this.transferModalItem.registration.id,
          this.selectedTargetActivityId,
          this.transferReason
        )
        .subscribe({
          next: () => {
            this.feedbackBanner = {
              type: 'success',
              message: `Successfully transferred participation from "${sourceTitle}" to "${targetTitle}"! 1 spot reserved.`
            };
            this.isTransferring = false;
            this.closeTransferModal();
          },
          error: (err) => {
            this.isTransferring = false;
            this.transferError = err?.message || 'Transfer failed. Your original registration is preserved.';
          }
        });
    } catch (err: any) {
      this.isTransferring = false;
      this.transferError = err?.message || 'Transfer validation failed. Your original registration is preserved.';
    }
  }

  closeTransferModal(): void {
    this.transferModalItem = null;
    this.selectedTargetActivityId = '';
    this.transferReason = '';
    this.transferError = null;
    this.isTransferring = false;
    this.transferOverlappingActivities = [];
  }

  dismissFeedbackBanner(): void {
    this.feedbackBanner = null;
  }

  formatDate(isoString: string): string {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getCategoryLabel(type?: ServiceType): string {
    if (!type) return '';
    switch (type) {
      case 'ENVIRONMENT':
        return 'Environment & Nature';
      case 'EDUCATION':
        return 'Education & Youth';
      case 'FOOD_SECURITY':
        return 'Food Security';
      case 'COMMUNITY':
        return 'Community Support';
      case 'HEALTH':
        return 'Public Health';
      default:
        return type;
    }
  }
}
