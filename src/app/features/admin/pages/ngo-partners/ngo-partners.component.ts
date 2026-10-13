import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NGO, NGOApprovalStatus, Activity } from '../../../../models';
import { NGOService } from '../../../../core/services/ngo.service';
import { DataStoreService } from '../../../../core/services/data-store.service';

export interface NGORow {
  ngo: NGO;
  associatedActivities: Activity[];
  activityCount: number;
}

@Component({
  selector: 'app-ngo-partners',
  templateUrl: './ngo-partners.component.html',
  styleUrls: ['./ngo-partners.component.css'],
  standalone: false
})
export class NgoPartnersComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  allRows: NGORow[] = [];
  filteredRows: NGORow[] = [];
  isLoading = true;

  // Search & Filters
  searchTerm = '';
  selectedStatus: 'ALL' | NGOApprovalStatus = 'ALL';

  // KPI Metrics
  metrics = {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalActivities: 0
  };

  // Create / Edit Modal State
  isModalOpen = false;
  isEditing = false;
  editingNgoId: string | null = null;
  ngoForm!: FormGroup;
  formSubmitted = false;
  formError: string | null = null;

  // Confirmation Dialog
  isConfirmDialogOpen = false;
  targetNgo: NGO | null = null;
  targetAssociatedActivitiesCount = 0;

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer?: any;

  readonly approvalStatuses: { value: NGOApprovalStatus; label: string }[] = [
    { value: 'APPROVED', label: 'Approved & Accredited' },
    { value: 'PENDING', label: 'Pending Compliance Review' },
    { value: 'REJECTED', label: 'Rejected / Disqualified' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly ngoService: NGOService,
    private readonly dataStore: DataStoreService
  ) {}

  ngOnInit(): void {
    this.initForm();

    combineLatest([this.dataStore.ngos$, this.dataStore.activities$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([ngos, activities]) => {
        this.isLoading = false;
        this.processRows(ngos, activities);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  private initForm(): void {
    this.ngoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      contactName: ['', [Validators.required, Validators.minLength(2)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      approvalStatus: ['APPROVED', Validators.required],
      serviceArea: ['Environmental & Community Welfare']
    });
  }

  private processRows(ngos: NGO[], activities: Activity[]): void {
    let totalActs = 0;
    this.allRows = ngos.map((ngo) => {
      const associated = activities.filter((a) => a.ngoId === ngo.id);
      totalActs += associated.length;
      return {
        ngo,
        associatedActivities: associated,
        activityCount: associated.length
      };
    });

    this.metrics = {
      total: ngos.length,
      approved: ngos.filter((n) => n.approvalStatus === 'APPROVED').length,
      pending: ngos.filter((n) => n.approvalStatus === 'PENDING').length,
      rejected: ngos.filter((n) => n.approvalStatus === 'REJECTED').length,
      totalActivities: totalActs
    };

    this.applyFilters();
  }

  applyFilters(): void {
    const term = (this.searchTerm || '').trim().toLowerCase();
    this.filteredRows = this.allRows.filter((row) => {
      const n = row.ngo;
      const matchesSearch =
        !term ||
        n.name.toLowerCase().includes(term) ||
        n.contactName.toLowerCase().includes(term) ||
        n.contactEmail.toLowerCase().includes(term) ||
        (n.serviceArea && n.serviceArea.toLowerCase().includes(term)) ||
        n.description.toLowerCase().includes(term);

      const matchesStatus =
        this.selectedStatus === 'ALL' || n.approvalStatus === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'ALL';
    this.applyFilters();
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.editingNgoId = null;
    this.formSubmitted = false;
    this.formError = null;
    this.ngoForm.reset({
      name: '',
      description: '',
      contactName: '',
      contactEmail: '',
      approvalStatus: 'APPROVED',
      serviceArea: 'Environmental & Community Welfare'
    });
    this.isModalOpen = true;
  }

  openEditModal(ngo: NGO): void {
    this.isEditing = true;
    this.editingNgoId = ngo.id;
    this.formSubmitted = false;
    this.formError = null;
    this.ngoForm.patchValue({
      name: ngo.name,
      description: ngo.description,
      contactName: ngo.contactName,
      contactEmail: ngo.contactEmail,
      approvalStatus: ngo.approvalStatus,
      serviceArea: ngo.serviceArea || 'General CSR Alliance'
    });
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSubmitForm(): void {
    this.formSubmitted = true;
    this.formError = null;

    if (this.ngoForm.invalid) {
      this.formError = 'Please ensure all required NGO details and a valid email are filled.';
      return;
    }

    const val = this.ngoForm.value;

    if (this.isEditing && this.editingNgoId) {
      try {
        this.ngoService.updateNGO(this.editingNgoId, {
          name: val.name,
          description: val.description,
          contactName: val.contactName,
          contactEmail: val.contactEmail,
          approvalStatus: val.approvalStatus,
          serviceArea: val.serviceArea
        });
        this.showToast(`Partner NGO "${val.name}" updated successfully.`, 'success');
        this.closeModal();
      } catch (err: any) {
        this.formError = err?.message || 'Failed to update NGO.';
      }
    } else {
      this.ngoService.createNGO({
        name: val.name,
        description: val.description,
        contactName: val.contactName,
        contactEmail: val.contactEmail,
        approvalStatus: val.approvalStatus,
        serviceArea: val.serviceArea
      });
      this.showToast(`Partner NGO "${val.name}" onboarded successfully.`, 'success');
      this.closeModal();
    }
  }

  quickSetStatus(ngo: NGO, status: NGOApprovalStatus): void {
    this.ngoService.updateNGO(ngo.id, { approvalStatus: status });
    this.showToast(`"${ngo.name}" status changed to ${status}.`, 'info');
  }

  openDeleteDialog(row: NGORow): void {
    this.targetNgo = row.ngo;
    this.targetAssociatedActivitiesCount = row.activityCount;
    this.isConfirmDialogOpen = true;
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogOpen = false;
    this.targetNgo = null;
  }

  confirmDelete(): void {
    if (!this.targetNgo) return;
    const name = this.targetNgo.name;
    this.ngoService.deleteNGO(this.targetNgo.id);
    this.showToast(`Partner NGO "${name}" removed from registry.`, 'info');
    this.closeConfirmDialog();
  }

  showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 4000);
  }

  dismissToast(): void {
    this.toastMessage = null;
  }
}
