import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, BehaviorSubject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AdminQrComponent } from './admin-qr.component';
import { ActivityService } from '../../../../core/services/activity.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { Activity, Attendance, NGO, Registration, User } from '../../../../models';

describe('AdminQrComponent', () => {
  let component: AdminQrComponent;
  let fixture: ComponentFixture<AdminQrComponent>;
  let mockActivityService: any;
  let mockAttendanceService: any;
  let mockDataStore: any;

  const mockNgo: NGO = {
    id: 'ngo-1',
    name: 'Yayasan Konservasi Laut',
    description: 'Marine Conservation',
    contactName: 'Hendra',
    contactEmail: 'hendra@test.org',
    approvalStatus: 'APPROVED'
  };

  const mockActivities: Activity[] = [
    {
      id: 'act-1',
      ngoId: 'ngo-1',
      title: 'Mangrove Coastal Restoration',
      description: 'Planting trees',
      serviceType: 'ENVIRONMENT',
      location: 'Pasir Ris Park',
      startDateTime: '2026-11-20T08:00:00Z',
      endDateTime: '2026-11-20T12:00:00Z',
      registrationCutoff: '2026-11-15T23:59:59Z',
      capacity: 25,
      publicationStatus: 'PUBLISHED'
    },
    {
      id: 'act-2',
      ngoId: 'ngo-1',
      title: 'Coral Reef Monitoring',
      description: 'Marine biology',
      serviceType: 'ENVIRONMENT',
      location: 'Pulau Semakau',
      startDateTime: '2026-11-25T08:00:00Z',
      endDateTime: '2026-11-25T13:00:00Z',
      registrationCutoff: '2026-11-20T23:59:59Z',
      capacity: 15,
      publicationStatus: 'PUBLISHED'
    }
  ];

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
      department: 'Marketing'
    }
  ];

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

  const mockAttendance: Attendance[] = [
    {
      id: 'att-1',
      registrationId: 'reg-1',
      activityId: 'act-1',
      employeeId: 'usr-1',
      checkedInAt: '2026-11-20T08:05:00Z',
      status: 'CHECKED_IN',
      verificationMethod: 'QR_SCAN',
      token: 'SDD-CHK-act-1-TEST'
    }
  ];

  beforeEach(async () => {
    mockActivityService = {
      getActivities: vi.fn(() => of(mockActivities))
    };

    mockAttendanceService = {
      generateActivityQr: vi.fn((act: Activity) =>
        Promise.resolve({
          activityId: act.id,
          token: `SDD-CHK-${act.id}-9999`,
          qrPayload: JSON.stringify({ activityId: act.id, token: `SDD-CHK-${act.id}-9999` }),
          qrDataUrl: 'data:image/png;base64,mockQrImageData',
          generatedAt: new Date().toISOString()
        })
      )
    };

    mockDataStore = {
      ngos$: of([mockNgo]),
      registrations$: of(mockRegistrations),
      attendance$: of(mockAttendance),
      users$: of(mockUsers),
      ngosSnapshot: [mockNgo],
      registrationsSnapshot: mockRegistrations,
      attendanceSnapshot: mockAttendance,
      usersSnapshot: mockUsers
    };

    await TestBed.configureTestingModule({
      declarations: [AdminQrComponent, StatusBadgeComponent],
      imports: [FormsModule],
      providers: [
        { provide: ActivityService, useValue: mockActivityService },
        { provide: AttendanceService, useValue: mockAttendanceService },
        { provide: DataStoreService, useValue: mockDataStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminQrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should initialize and load published activities', () => {
    expect(component.activities.length).toBe(2);
    expect(component.selectedActivityId).toBe('act-1');
    expect(component.selectedActivity?.title).toBe('Mangrove Coastal Restoration');
  });

  it('should generate QR code and set qrInfo for selected activity', () => {
    expect(mockAttendanceService.generateActivityQr).toHaveBeenCalledWith(mockActivities[0]);
    expect(component.qrInfo).toBeTruthy();
    expect(component.qrInfo?.token).toBe('SDD-CHK-act-1-9999');
    expect(component.qrInfo?.qrDataUrl).toBe('data:image/png;base64,mockQrImageData');
  });

  it('should compute participant roster and check-in metrics', () => {
    expect(component.participantRoster.length).toBe(2);
    expect(component.registeredCount).toBe(2);
    expect(component.checkedInCount).toBe(1); // Alice checked in, Bob pending
    expect(component.attendanceRate).toBe(50); // 1 out of 2 = 50%

    const aliceRow = component.participantRoster.find((r) => r.employeeId === 'usr-1');
    expect(aliceRow?.isCheckedIn).toBe(true);
    expect(aliceRow?.method).toBe('QR Code Scan');

    const bobRow = component.participantRoster.find((r) => r.employeeId === 'usr-2');
    expect(bobRow?.isCheckedIn).toBe(false);
  });

  it('should switch selected activity and regenerate poster', async () => {
    component.onSelectActivity('act-2');
    await fixture.whenStable();

    expect(component.selectedActivityId).toBe('act-2');
    expect(component.selectedActivity?.title).toBe('Coral Reef Monitoring');
    expect(mockAttendanceService.generateActivityQr).toHaveBeenCalledWith(mockActivities[1]);
  });

  it('should trigger print on printPoster', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printPoster();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
