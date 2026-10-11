import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import {
  Activity,
  NGO,
  Registration,
  ActivitySlotSummary,
  ServiceType,
  PublicationStatus
} from '../../../../models';
import { ActivityService } from '../../../../core/services/activity.service';
import { NGOService } from '../../../../core/services/ngo.service';
import { RegistrationService } from '../../../../core/services/registration.service';

export interface ActivityTableRow {
  activity: Activity;
  ngo?: NGO;
  slotSummary: ActivitySlotSummary;
  isCutoffPassed: boolean;
  activeRegistrationsCount: number;
  canDelete: boolean;
  deleteReason?: string;
}

@Component({
  selector: 'app-activity-management',
  templateUrl: './activity-management.component.html',
  styleUrls: ['./activity-management.component.css'],
  standalone: false
})
export class ActivityManagementComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Raw data streams
  activities$!: Observable<Activity[]>;
  ngos$!: Observable<NGO[]>;
  registrations$!: Observable<Registration[]>;

  // Combined rows
  allRows: ActivityTableRow[] = [];
  filteredRows: ActivityTableRow[] = [];
  availableNGOs: NGO[] = [];
  isLoading = true;

  // Filter & Search state
  searchTerm = '';
  selectedStatus = 'ALL';
  selectedServiceType = 'ALL';
  selectedNgoId = 'ALL';

  // Metrics counters
  metrics = {
    total: 0,
    published: 0,
    draft: 0,
    cancelled: 0,
    completed: 0,
    totalCapacity: 0,
    totalRegistered: 0,
    utilisationRate: 0
  };

  // Create / Edit Modal State
  isFormModalOpen = false;
  isEditing = false;
  editingActivityId: string | null = null;
  editingActiveRegistrationsCount = 0;
  activityForm!: FormGroup;
  formSubmitted = false;
  formError: string | null = null;

  // Confirmation / Destructive Dialog State
  isConfirmDialogOpen = false;
  confirmDialogType: 'DELETE' | 'DELETE_BLOCKED' | 'CANCEL' = 'DELETE';
  targetRow: ActivityTableRow | null = null;

  // Toast Feedback State
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer?: any;

  readonly serviceTypes: { value: ServiceType; label: string }[] = [
    { value: 'ENVIRONMENT', label: 'Environmental Conservation' },
    { value: 'EDUCATION', label: 'Youth & Education' },
    { value: 'FOOD_SECURITY', label: 'Food Security & Relief' },
    { value: 'COMMUNITY', label: 'Community & Civic Services' },
    { value: 'HEALTH', label: 'Health & Well-being' }
  ];

  readonly publicationStatuses: { value: PublicationStatus; label: string }[] = [
    { value: 'DRAFT', label: 'Draft (Admin Only)' },
    { value: 'PUBLISHED', label: 'Published (Open to Staff)' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly activityService: ActivityService,
    private readonly ngoService: NGOService,
    private readonly registrationService: RegistrationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.activities$ = this.activityService.getActivities();
    this.ngos$ = this.ngoService.getNGOs();
    this.registrations$ = this.registrationService.getRegistrations();

    combineLatest([this.activities$, this.ngos$, this.registrations$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([activities, ngos, registrations]) => {
        this.availableNGOs = ngos;
        const ngoMap = new Map<string, NGO>(ngos.map((n) => [n.id, n]));

        this.allRows = activities.map((activity) => {
          const ngo = ngoMap.get(activity.ngoId);
          const slotSummary = this.activityService.computeSlotSummary(activity, registrations);
          const isCutoffPassed = this.activityService.isCutoffPassed(activity);
          const deleteCheck = this.activityService.canDeleteActivity(activity.id);

          return {
            activity,
            ngo,
            slotSummary,
            isCutoffPassed,
            activeRegistrationsCount: deleteCheck.activeCount,
            canDelete: deleteCheck.allowed,
            deleteReason: deleteCheck.reason
          };
        });

        this.calculateMetrics(this.allRows);
        this.applyFilters();
        this.isLoading = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  /* --------------------------------------------------------------------------
     Form Initialization & Validation
     -------------------------------------------------------------------------- */
  private initForm(): void {
    this.activityForm = this.fb.group(
      {
        title: ['', [Validators.required, Validators.minLength(3)]],
        ngoId: ['', Validators.required],
        serviceType: ['ENVIRONMENT', Validators.required],
        location: ['', Validators.required],
        capacity: [
          20,
          [
            Validators.required,
            Validators.min(1),
            Validators.pattern('^[0-9]+$')
          ]
        ],
        startDateTime: ['', Validators.required],
        endDateTime: ['', Validators.required],
        registrationCutoff: ['', Validators.required],
        publicationStatus: ['DRAFT', Validators.required],
        description: ['', [Validators.required, Validators.minLength(10)]]
      },
      {
        validators: [this.scheduleValidityValidator.bind(this)]
      }
    );
  }

  /**
   * Cross-field schedule validator:
   * 1. endDateTime must be after startDateTime
   * 2. registrationCutoff must be at or before startDateTime
   */
  private scheduleValidityValidator(control: AbstractControl): ValidationErrors | null {
    const start = control.get('startDateTime')?.value;
    const end = control.get('endDateTime')?.value;
    const cutoff = control.get('registrationCutoff')?.value;

    const errors: ValidationErrors = {};

    if (start && end) {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      if (endTime <= startTime) {
        errors['invalidDateOrder'] = 'Activity end time must be after the start time.';
      }
    }

    if (start && cutoff) {
      const startTime = new Date(start).getTime();
      const cutoffTime = new Date(cutoff).getTime();
      if (cutoffTime > startTime) {
        errors['invalidCutoff'] = 'Registration cut-off must be at or before the activity start time.';
      }
    }

    // Capacity floor check when editing existing activity with active registrations
    if (this.isEditing && this.editingActiveRegistrationsCount > 0) {
      const capacity = Number(control.get('capacity')?.value);
      if (capacity && capacity < this.editingActiveRegistrationsCount) {
        errors['capacityBelowRegistrations'] =
          `Capacity cannot be reduced below current active registrations (${this.editingActiveRegistrationsCount}).`;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /* --------------------------------------------------------------------------
     Filtering & Search
     -------------------------------------------------------------------------- */
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  onFilterStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onFilterServiceTypeChange(type: string): void {
    this.selectedServiceType = type;
    this.applyFilters();
  }

  onFilterNgoChange(ngoId: string): void {
    this.selectedNgoId = ngoId;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.selectedServiceType = 'ALL';
    this.selectedNgoId = 'ALL';
    this.applyFilters();
  }

  private applyFilters(): void {
    let rows = [...this.allRows];
    const q = this.searchTerm.trim().toLowerCase();

    if (q) {
      rows = rows.filter(
        (r) =>
          r.activity.title.toLowerCase().includes(q) ||
          r.activity.description.toLowerCase().includes(q) ||
          r.activity.location.toLowerCase().includes(q) ||
          (r.ngo && r.ngo.name.toLowerCase().includes(q))
      );
    }

    if (this.selectedStatus !== 'ALL') {
      rows = rows.filter((r) => r.activity.publicationStatus === this.selectedStatus);
    }

    if (this.selectedServiceType !== 'ALL') {
      rows = rows.filter((r) => r.activity.serviceType === this.selectedServiceType);
    }

    if (this.selectedNgoId !== 'ALL') {
      rows = rows.filter((r) => r.activity.ngoId === this.selectedNgoId);
    }

    this.filteredRows = rows;
  }

  private calculateMetrics(rows: ActivityTableRow[]): void {
    let published = 0;
    let draft = 0;
    let cancelled = 0;
    let completed = 0;
    let totalCap = 0;
    let totalReg = 0;

    rows.forEach((r) => {
      const s = r.activity.publicationStatus;
      if (s === 'PUBLISHED') published++;
      else if (s === 'DRAFT') draft++;
      else if (s === 'CANCELLED') cancelled++;
      else if (s === 'COMPLETED') completed++;

      if (s !== 'CANCELLED') {
        totalCap += r.activity.capacity;
        totalReg += r.slotSummary.filledSlots;
      }
    });

    const rate = totalCap > 0 ? Math.round((totalReg / totalCap) * 100) : 0;

    this.metrics = {
      total: rows.length,
      published,
      draft,
      cancelled,
      completed,
      totalCapacity: totalCap,
      totalRegistered: totalReg,
      utilisationRate: rate
    };
  }

  /* --------------------------------------------------------------------------
     Create / Edit Modal Actions
     -------------------------------------------------------------------------- */
  openCreateModal(): void {
    this.isEditing = false;
    this.editingActivityId = null;
    this.editingActiveRegistrationsCount = 0;
    this.formSubmitted = false;
    this.formError = null;

    // Pick first approved NGO as sensible default if available
    const firstApproved = this.availableNGOs.find((n) => n.approvalStatus === 'APPROVED');
    const defaultNgoId = firstApproved ? firstApproved.id : (this.availableNGOs[0]?.id || '');

    // Default dates: tomorrow 09:00 - 15:00, cut-off tomorrow - 2 days
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 9, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 15, 0);
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 23, 59);

    this.activityForm.reset({
      title: '',
      ngoId: defaultNgoId,
      serviceType: 'ENVIRONMENT',
      location: '',
      capacity: 20,
      startDateTime: this.formatToDateTimeLocal(start),
      endDateTime: this.formatToDateTimeLocal(end),
      registrationCutoff: this.formatToDateTimeLocal(cutoff),
      publicationStatus: 'DRAFT',
      description: ''
    });

    this.isFormModalOpen = true;
  }

  openEditModal(row: ActivityTableRow): void {
    this.isEditing = true;
    this.editingActivityId = row.activity.id;
    this.editingActiveRegistrationsCount = row.activeRegistrationsCount;
    this.formSubmitted = false;
    this.formError = null;

    const act = row.activity;
    this.activityForm.reset({
      title: act.title,
      ngoId: act.ngoId,
      serviceType: act.serviceType,
      location: act.location,
      capacity: act.capacity,
      startDateTime: this.cleanDateTimeLocal(act.startDateTime),
      endDateTime: this.cleanDateTimeLocal(act.endDateTime),
      registrationCutoff: this.cleanDateTimeLocal(act.registrationCutoff),
      publicationStatus: act.publicationStatus,
      description: act.description
    });

    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.isEditing = false;
    this.editingActivityId = null;
    this.formError = null;
  }

  onSaveActivity(): void {
    this.formSubmitted = true;
    this.formError = null;

    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
      return;
    }

    const val = this.activityForm.value;
    const activityPayload = {
      title: val.title.trim(),
      ngoId: val.ngoId,
      serviceType: val.serviceType,
      location: val.location.trim(),
      capacity: Number(val.capacity),
      startDateTime: this.normalizeToIso(val.startDateTime),
      endDateTime: this.normalizeToIso(val.endDateTime),
      registrationCutoff: this.normalizeToIso(val.registrationCutoff),
      publicationStatus: val.publicationStatus,
      description: val.description.trim()
    };

    if (this.isEditing && this.editingActivityId) {
      this.activityService.updateActivity(this.editingActivityId, activityPayload).subscribe({
        next: (updated) => {
          this.closeFormModal();
          this.showToast(`Activity "${updated.title}" successfully updated.`);
        },
        error: (err) => {
          this.formError = err.message || 'Failed to update activity.';
        }
      });
    } else {
      this.activityService.createActivity(activityPayload).subscribe({
        next: (created) => {
          this.closeFormModal();
          this.showToast(`Activity "${created.title}" successfully created.`);
        },
        error: (err) => {
          this.formError = err.message || 'Failed to create activity.';
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     Quick Status Toggle Action
     -------------------------------------------------------------------------- */
  onQuickStatusChange(activity: Activity, newStatus: PublicationStatus): void {
    if (activity.publicationStatus === newStatus) return;

    this.activityService.changePublicationStatus(activity.id, newStatus).subscribe({
      next: (updated) => {
        this.showToast(`Activity "${updated.title}" publication status set to ${newStatus}.`);
      },
      error: (err) => {
        this.showToast(err.message || 'Failed to change status.', 'error');
      }
    });
  }

  /* --------------------------------------------------------------------------
     Destructive Actions & Safe Confirmation Dialog
     -------------------------------------------------------------------------- */
  openDeleteDialog(row: ActivityTableRow): void {
    this.targetRow = row;
    if (!row.canDelete) {
      this.confirmDialogType = 'DELETE_BLOCKED';
    } else {
      this.confirmDialogType = 'DELETE';
    }
    this.isConfirmDialogOpen = true;
  }

  openCancelDialog(row: ActivityTableRow): void {
    this.targetRow = row;
    this.confirmDialogType = 'CANCEL';
    this.isConfirmDialogOpen = true;
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogOpen = false;
    this.targetRow = null;
  }

  onConfirmAction(): void {
    if (!this.targetRow) return;

    const row = this.targetRow;

    if (this.confirmDialogType === 'DELETE') {
      this.activityService.deleteActivity(row.activity.id).subscribe({
        next: () => {
          this.closeConfirmDialog();
          this.showToast(`Activity "${row.activity.title}" permanently removed.`);
        },
        error: (err) => {
          this.closeConfirmDialog();
          this.showToast(err.message || 'Unable to delete activity.', 'error');
        }
      });
    } else if (this.confirmDialogType === 'CANCEL' || this.confirmDialogType === 'DELETE_BLOCKED') {
      // Mark as CANCELLED to preserve registrations safely (BR-14)
      this.activityService.changePublicationStatus(row.activity.id, 'CANCELLED').subscribe({
        next: () => {
          this.closeConfirmDialog();
          this.showToast(
            `Activity "${row.activity.title}" has been marked as CANCELLED. Volunteer records are preserved.`
          );
        },
        error: (err) => {
          this.closeConfirmDialog();
          this.showToast(err.message || 'Unable to cancel activity.', 'error');
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     Helpers & Utilities
     -------------------------------------------------------------------------- */
  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }

  dismissToast(): void {
    this.toastMessage = null;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  getSelectedNgo(): NGO | undefined {
    const ngoId = this.activityForm?.get('ngoId')?.value;
    return this.availableNGOs.find((n) => n.id === ngoId);
  }

  private formatToDateTimeLocal(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private cleanDateTimeLocal(isoString: string): string {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  }

  private normalizeToIso(localString: string): string {
    if (!localString) return '';
    if (localString.length === 16) {
      return `${localString}:00`;
    }
    return localString;
  }
}
