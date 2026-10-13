import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NgoPartnersComponent, NGORow } from './ngo-partners.component';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { NGOService } from '../../../../core/services/ngo.service';
import { NGO, Activity } from '../../../../models';

describe('NgoPartnersComponent', () => {
  let component: NgoPartnersComponent;
  let fixture: ComponentFixture<NgoPartnersComponent>;

  let mockNgosSubject: BehaviorSubject<NGO[]>;
  let mockActivitiesSubject: BehaviorSubject<Activity[]>;
  let mockDataStore: any;
  let mockNgoService: any;

  const initialNgos: NGO[] = [
    {
      id: 'ngo-1',
      name: 'Yayasan Konservasi Laut',
      description: 'Marine preservation and coastal cleanups',
      contactName: 'Hendra Wijaya',
      contactEmail: 'hendra@konservasi.org',
      approvalStatus: 'APPROVED'
    },
    {
      id: 'ngo-2',
      name: 'Sahabat Belajar Anak',
      description: 'Education for underprivileged kids',
      contactName: 'Rina Kusumawati',
      contactEmail: 'rina@sahabatbelajar.org',
      approvalStatus: 'PENDING'
    }
  ];

  const initialActivities: Activity[] = [
    {
      id: 'act-1',
      ngoId: 'ngo-1',
      title: 'Mangrove Coastal Restoration',
      description: 'Planting mangroves',
      serviceType: 'ENVIRONMENT',
      location: 'Pantai Indah Kapuk',
      startDateTime: '2026-11-20T08:00:00Z',
      endDateTime: '2026-11-20T14:00:00Z',
      registrationCutoff: '2026-11-15T23:59:59Z',
      capacity: 25,
      publicationStatus: 'PUBLISHED'
    }
  ];

  beforeEach(async () => {
    mockNgosSubject = new BehaviorSubject<NGO[]>([...initialNgos]);
    mockActivitiesSubject = new BehaviorSubject<Activity[]>([...initialActivities]);

    mockDataStore = {
      ngos$: mockNgosSubject.asObservable(),
      activities$: mockActivitiesSubject.asObservable()
    };

    mockNgoService = {
      createNGO: vi.fn().mockImplementation((n: Partial<NGO>) => {
        const created: NGO = {
          id: 'ngo-new-' + Date.now(),
          name: n.name || '',
          description: n.description || '',
          contactName: n.contactName || '',
          contactEmail: n.contactEmail || '',
          approvalStatus: n.approvalStatus || 'APPROVED'
        };
        mockNgosSubject.next([...mockNgosSubject.value, created]);
        return created;
      }),
      updateNGO: vi.fn().mockImplementation((id: string, n: Partial<NGO>) => {
        const list = mockNgosSubject.value.map((item) =>
          item.id === id ? { ...item, ...n } : item
        );
        mockNgosSubject.next(list);
        return list.find((item) => item.id === id);
      }),
      deleteNGO: vi.fn().mockImplementation((id: string) => {
        const list = mockNgosSubject.value.filter((item) => item.id !== id);
        mockNgosSubject.next(list);
        return true;
      })
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [NgoPartnersComponent],
      providers: [
        { provide: DataStoreService, useValue: mockDataStore },
        { provide: NGOService, useValue: mockNgoService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NgoPartnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile and create NgoPartnersComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should compute KPI summary metrics correctly', () => {
    expect(component.metrics.total).toBe(2);
    expect(component.metrics.approved).toBe(1);
    expect(component.metrics.pending).toBe(1);
    expect(component.metrics.totalActivities).toBe(1);
  });

  it('should filter NGOs by search term', () => {
    component.searchTerm = 'Konservasi';
    component.applyFilters();
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].ngo.id).toBe('ngo-1');
  });

  it('should filter NGOs by approval status', () => {
    component.selectedStatus = 'PENDING';
    component.applyFilters();
    expect(component.filteredRows.length).toBe(1);
    expect(component.filteredRows[0].ngo.name).toBe('Sahabat Belajar Anak');
  });

  it('should reset search and status filters', () => {
    component.searchTerm = 'random';
    component.selectedStatus = 'APPROVED';
    component.applyFilters();
    expect(component.filteredRows.length).toBe(0);

    component.resetFilters();
    expect(component.searchTerm).toBe('');
    expect(component.selectedStatus).toBe('ALL');
    expect(component.filteredRows.length).toBe(2);
  });

  it('should open create modal with empty form', () => {
    component.openCreateModal();
    expect(component.isModalOpen).toBe(true);
    expect(component.isEditing).toBe(false);
    expect(component.ngoForm.get('name')?.value).toBe('');
  });

  it('should open edit modal populated with existing NGO data', () => {
    component.openEditModal(initialNgos[0]);
    expect(component.isModalOpen).toBe(true);
    expect(component.isEditing).toBe(true);
    expect(component.ngoForm.get('name')?.value).toBe('Yayasan Konservasi Laut');
    expect(component.ngoForm.get('contactEmail')?.value).toBe('hendra@konservasi.org');
  });

  it('should update approval status via quickSetStatus', () => {
    component.quickSetStatus(initialNgos[0], 'REJECTED');
    expect(mockNgoService.updateNGO).toHaveBeenCalledWith('ngo-1', { approvalStatus: 'REJECTED' });
  });

  it('should delete an NGO when confirmed', () => {
    const rowToDelete: NGORow = {
      ngo: initialNgos[1],
      associatedActivities: [],
      activityCount: 0
    };
    component.openDeleteDialog(rowToDelete);
    expect(component.isConfirmDialogOpen).toBe(true);
    expect(component.targetNgo?.id).toBe('ngo-2');

    component.confirmDelete();
    expect(mockNgoService.deleteNGO).toHaveBeenCalledWith('ngo-2');
    expect(component.isConfirmDialogOpen).toBe(false);
  });
});
