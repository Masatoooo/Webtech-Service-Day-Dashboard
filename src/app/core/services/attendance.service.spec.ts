import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AttendanceService } from './attendance.service';
import { DataStoreService } from './data-store.service';
import { StorageService } from './storage.service';
import { Activity, Attendance, NGO, Registration, User } from '../../models';

describe('AttendanceService (Task 10: QR Code Generation & Check-In Validation)', () => {
  let service: AttendanceService;
  let dataStore: DataStoreService;

  const mockNgo: NGO = {
    id: 'ngo-1',
    name: 'Yayasan Konservasi Laut',
    description: 'Marine Conservation NGO',
    contactName: 'Hendra',
    contactEmail: 'hendra@test.org',
    approvalStatus: 'APPROVED'
  };

  const mockActivity: Activity = {
    id: 'act-1',
    ngoId: 'ngo-1',
    title: 'Mangrove Coastal Restoration',
    description: 'Planting trees along coastline',
    serviceType: 'ENVIRONMENT',
    location: 'Pasir Ris Park',
    startDateTime: '2026-11-20T08:00:00Z',
    endDateTime: '2026-11-20T12:00:00Z',
    registrationCutoff: '2026-11-15T23:59:59Z',
    capacity: 25,
    publicationStatus: 'PUBLISHED'
  };

  const mockUser: User = {
    id: 'usr-alice',
    name: 'Alice Chen',
    email: 'alice@corp.com',
    role: 'EMPLOYEE',
    department: 'Engineering'
  };

  const mockRegistration: Registration = {
    id: 'reg-alice-act1',
    employeeId: 'usr-alice',
    activityId: 'act-1',
    status: 'ACTIVE',
    registeredAt: '2026-10-01T08:00:00Z'
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AttendanceService, DataStoreService, StorageService]
    });

    service = TestBed.inject(AttendanceService);
    dataStore = TestBed.inject(DataStoreService);

    dataStore.setNGOs([mockNgo]);
    dataStore.setActivities([mockActivity]);
    dataStore.setUsers([mockUser]);
    dataStore.setRegistrations([mockRegistration]);
    dataStore.setAttendance([]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('QR Generation & Token Management (Scope 2 & 3)', () => {
    it('should generate an opaque activity token without employee PII', () => {
      const token = service.generateActivityToken('act-1');
      expect(token).toContain('SDD-CHK-act-1');
      expect(token).not.toContain('usr-alice');
      expect(token).not.toContain('alice@corp.com');
    });

    it('should generate activity QR info with data URL and JSON payload', async () => {
      const qrInfo = await service.generateActivityQr(mockActivity);

      expect(qrInfo.activityId).toBe('act-1');
      expect(qrInfo.token).toContain('SDD-CHK-act-1');
      expect(qrInfo.qrPayload).toContain('SDD_CHECKIN_V1');
      expect(qrInfo.qrPayload).not.toContain('password');
      expect(qrInfo.qrPayload).not.toContain('email');
      expect(qrInfo.qrDataUrl).toBeTruthy();
    });

    it('should extract activity ID from JSON QR payload, opaque token, or direct ID', () => {
      const jsonPayload = JSON.stringify({
        protocol: 'SDD_CHECKIN_V1',
        activityId: 'act-1',
        token: 'SDD-CHK-act-1-ABCD'
      });
      expect(service.extractActivityIdFromToken(jsonPayload)).toBe('act-1');

      const tokenString = 'SDD-CHK-act-1-WXYZ';
      expect(service.extractActivityIdFromToken(tokenString)).toBe('act-1');

      expect(service.extractActivityIdFromToken('act-1')).toBe('act-1');
      expect(service.extractActivityIdFromToken('invalid-gibberish')).toBeNull();
    });
  });

  describe('Check-In Eligibility Validation (Scope 5, 7, 8)', () => {
    it('should reject invalid or unparseable check-in code', () => {
      const result = service.validateCheckIn('UNKNOWN-TOKEN-1234', 'usr-alice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Invalid Check-In Code');
    });

    it('should reject non-existent activity reference', () => {
      const result = service.validateCheckIn('SDD-CHK-act-999-ABCD', 'usr-alice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Activity Not Found');
    });

    it('should reject unregistered employee', () => {
      const result = service.validateCheckIn('SDD-CHK-act-1-ABCD', 'usr-unregistered');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Missing Registration');
    });

    it('should reject cancelled registration', () => {
      dataStore.setRegistrations([
        { ...mockRegistration, status: 'CANCELLED' }
      ]);

      const result = service.validateCheckIn('SDD-CHK-act-1-ABCD', 'usr-alice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cancelled Registration');
    });

    it('should allow valid check-in for registered employee', () => {
      const result = service.validateCheckIn('SDD-CHK-act-1-ABCD', 'usr-alice');
      expect(result.allowed).toBe(true);
      expect(result.activity?.id).toBe('act-1');
      expect(result.registration?.id).toBe('reg-alice-act1');
    });

    it('should block duplicate check-in with informative timestamp message', () => {
      // Record initial check-in
      const existingRecord: Attendance = {
        id: 'att-prev',
        registrationId: 'reg-alice-act1',
        activityId: 'act-1',
        employeeId: 'usr-alice',
        checkedInAt: '2026-11-20T08:15:00Z',
        status: 'CHECKED_IN',
        verificationMethod: 'QR_SCAN',
        token: 'SDD-CHK-act-1-ABCD'
      };
      dataStore.setAttendance([existingRecord]);

      const result = service.validateCheckIn('SDD-CHK-act-1-ABCD', 'usr-alice');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Already Checked In');
      expect(result.reason).toContain('Duplicate check-in');
    });
  });

  describe('Check-In Execution & State Persistence (Scope 6 & 9)', () => {
    it('should execute check-in, record timestamp, and persist attendance record', async () => {
      const result = await firstValueFrom(
        service.executeCheckIn({
          tokenInput: 'SDD-CHK-act-1-ABCD',
          employeeId: 'usr-alice',
          method: 'QR_SCAN'
        })
      );

      expect(result.attendance.status).toBe('CHECKED_IN');
      expect(result.attendance.verificationMethod).toBe('QR_SCAN');
      expect(result.attendance.checkedInAt).toBeTruthy();
      expect(result.isDemoSimulation).toBe(true);

      // Verify reactive dataStore snapshot
      const atts = dataStore.attendanceSnapshot;
      expect(atts.length).toBe(1);
      expect(atts[0].registrationId).toBe('reg-alice-act1');
    });

    it('should execute check-in via MANUAL_FALLBACK method', async () => {
      const result = await firstValueFrom(
        service.executeCheckIn({
          tokenInput: 'SDD-CHK-act-1-ABCD',
          employeeId: 'usr-alice',
          method: 'MANUAL_FALLBACK'
        })
      );

      expect(result.attendance.verificationMethod).toBe('MANUAL_FALLBACK');
    });

    it('should throw error when executeCheckIn called on ineligible registration', async () => {
      let caughtError: any;
      try {
        await firstValueFrom(
          service.executeCheckIn({
            tokenInput: 'INVALID-TOKEN',
            employeeId: 'usr-alice',
            method: 'QR_SCAN'
          })
        );
      } catch (err: any) {
        caughtError = err;
      }

      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Invalid Check-In Code');
    });
  });
});
