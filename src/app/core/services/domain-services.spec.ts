import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ActivityService } from './activity.service';
import { RegistrationService } from './registration.service';
import { AttendanceService } from './attendance.service';
import { DataStoreService } from './data-store.service';
import { StorageService } from './storage.service';
import { MockDataService } from './mock-data.service';
import { Activity, Registration, NGO, User, Attendance, Notification } from '../../models';

// Import raw JSON files to test relationship integrity
import ngosData from '../../../../public/assets/data/ngos.json';
import activitiesData from '../../../../public/assets/data/activities.json';
import usersData from '../../../../public/assets/data/users.json';
import registrationsData from '../../../../public/assets/data/registrations.json';
import notificationsData from '../../../../public/assets/data/notifications.json';
import attendanceData from '../../../../public/assets/data/attendance.json';

describe('Domain Services & Data Relationship Consistency', () => {
  let activityService: ActivityService;
  let registrationService: RegistrationService;
  let attendanceService: AttendanceService;
  let store: DataStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: MockDataService, useValue: {} },
        DataStoreService,
        ActivityService,
        RegistrationService,
        AttendanceService
      ]
    });

    activityService = TestBed.inject(ActivityService);
    registrationService = TestBed.inject(RegistrationService);
    attendanceService = TestBed.inject(AttendanceService);
    store = TestBed.inject(DataStoreService);

    store.setNGOs(ngosData as NGO[]);
    store.setActivities(activitiesData as Activity[]);
    store.setUsers(usersData as User[]);
    store.setRegistrations(registrationsData as Registration[]);
    store.setAttendance(attendanceData as Attendance[]);
    store.setNotifications(notificationsData as Notification[]);
  });

  describe('Activity Slot Computations (BR-02, BR-03, FR-22)', () => {
    it('should compute remaining slots and utilisation percentage correctly', () => {
      const activity: Activity = {
        id: 'act-test',
        ngoId: 'ngo-1',
        title: 'Test Clean-up',
        description: 'Clean-up',
        serviceType: 'ENVIRONMENT',
        location: 'Beach',
        startDateTime: '2026-11-20T08:00:00',
        endDateTime: '2026-11-20T12:00:00',
        registrationCutoff: '2026-11-18T23:59:59',
        capacity: 10,
        publicationStatus: 'PUBLISHED'
      };

      const registrations: Registration[] = [
        { id: 'r1', employeeId: 'u1', activityId: 'act-test', status: 'ACTIVE', registeredAt: '2026-10-01T00:00:00' },
        { id: 'r2', employeeId: 'u2', activityId: 'act-test', status: 'ACTIVE', registeredAt: '2026-10-01T00:00:00' },
        { id: 'r3', employeeId: 'u3', activityId: 'act-test', status: 'CANCELLED', registeredAt: '2026-10-01T00:00:00' } // cancelled should NOT count
      ];

      const summary = activityService.computeSlotSummary(activity, registrations);
      expect(summary.filledSlots).toBe(2);
      expect(summary.remainingSlots).toBe(8);
      expect(summary.utilisationPercentage).toBe(20);
      expect(summary.availabilityStatus).toBe('AVAILABLE');
    });

    it('should mark activity as FULL when remaining slots reach 0', () => {
      const activity: Activity = {
        id: 'act-full',
        ngoId: 'ngo-1',
        title: 'Full Session',
        description: 'Full',
        serviceType: 'EDUCATION',
        location: 'School',
        startDateTime: '2026-11-20T08:00:00',
        endDateTime: '2026-11-20T12:00:00',
        registrationCutoff: '2026-11-18T23:59:59',
        capacity: 2,
        publicationStatus: 'PUBLISHED'
      };

      const registrations: Registration[] = [
        { id: 'r1', employeeId: 'u1', activityId: 'act-full', status: 'ACTIVE', registeredAt: '2026-10-01T00:00:00' },
        { id: 'r2', employeeId: 'u2', activityId: 'act-full', status: 'ACTIVE', registeredAt: '2026-10-01T00:00:00' }
      ];

      const summary = activityService.computeSlotSummary(activity, registrations);
      expect(summary.filledSlots).toBe(2);
      expect(summary.remainingSlots).toBe(0);
      expect(summary.utilisationPercentage).toBe(100);
      expect(summary.availabilityStatus).toBe('FULL');
    });

    it('should mark activity as REGISTRATION_CLOSED when cutoff date is in the past', () => {
      const activity: Activity = {
        id: 'act-expired',
        ngoId: 'ngo-1',
        title: 'Past Cutoff',
        description: 'Past',
        serviceType: 'ENVIRONMENT',
        location: 'Park',
        startDateTime: '2026-10-05T08:00:00',
        endDateTime: '2026-10-05T12:00:00',
        registrationCutoff: '2026-09-30T23:59:59', // Past cutoff
        capacity: 10,
        publicationStatus: 'PUBLISHED'
      };

      const summary = activityService.computeSlotSummary(activity, []);
      expect(summary.availabilityStatus).toBe('REGISTRATION_CLOSED');
    });

    it('should only return PUBLISHED activities from APPROVED NGOs for employee discovery (FR-06, FR-08)', async () => {
      const published = await firstValueFrom(activityService.getPublishedActivities());
      // act-1..act-6 are published and have approved NGOs
      expect(published.length).toBeGreaterThan(0);
      published.forEach((act) => {
        expect(act.publicationStatus).toBe('PUBLISHED');
        // act-9 has NGO-5 which is PENDING, so act-9 must never be in published
        expect(act.id).not.toBe('act-9');
      });
    });

    it('should prevent deletion of an activity with active registrations (BR-14)', () => {
      const check = activityService.canDeleteActivity('act-1');
      expect(check.allowed).toBe(false);
      expect(check.activeCount).toBeGreaterThan(0);
      expect(check.reason).toContain('active registration');

      expect(() => {
        activityService.deleteActivity('act-1');
      }).toThrowError(/active registration/);
    });

    it('should allow deletion of an activity without registrations and persist change', async () => {
      // act-8 is draft and has 0 registrations
      const check = activityService.canDeleteActivity('act-8');
      expect(check.allowed).toBe(true);
      expect(check.activeCount).toBe(0);

      const deleted = await firstValueFrom(activityService.deleteActivity('act-8'));
      expect(deleted).toBe(true);

      const remaining = await firstValueFrom(activityService.getActivities());
      expect(remaining.find((a) => a.id === 'act-8')).toBeUndefined();
    });

    it('should update publication status via changePublicationStatus', async () => {
      const updated = await firstValueFrom(activityService.changePublicationStatus('act-2', 'CANCELLED'));
      expect(updated.publicationStatus).toBe('CANCELLED');

      const current = await firstValueFrom(activityService.getActivityById('act-2'));
      expect(current?.publicationStatus).toBe('CANCELLED');
    });
  });

  describe('Registration Rules (BR-08, BR-09, FR-15)', () => {
    it('should prevent duplicate active registration for the same employee and activity', () => {
      expect(() => {
        registrationService.register('usr-emp-1', 'act-1');
      }).toThrowError(/already has an active registration/);
    });

    it('should cancel registration and update timestamp and reason', async () => {
      const reg = await firstValueFrom(
        registrationService.cancelRegistration('reg-1', 'Personal emergency')
      );
      expect(reg.status).toBe('CANCELLED');
      expect(reg.cancellationReason).toBe('Personal emergency');
      expect(reg.updatedAt).toBeTruthy();
    });
  });

  describe('Attendance Rules (BR-10, BR-11, FR-35)', () => {
    it('should record check-in successfully', async () => {
      const att = await firstValueFrom(
        attendanceService.recordCheckIn({
          registrationId: 'reg-3',
          activityId: 'act-1',
          employeeId: 'usr-emp-3',
          verificationMethod: 'QR_SCAN',
          token: 'TOKEN-ACT1-DEMO-001'
        })
      );
      expect(att.status).toBe('CHECKED_IN');
      expect(att.registrationId).toBe('reg-3');
    });

    it('should reject duplicate check-in for the same registration', () => {
      expect(() => {
        attendanceService.recordCheckIn({
          registrationId: 'reg-12', // Already checked-in in seed data
          activityId: 'act-10',
          employeeId: 'usr-emp-1',
          verificationMethod: 'QR_SCAN',
          token: 'TOKEN-ACT10-DEMO-991'
        });
      }).toThrowError(/is already checked in/);
    });
  });

  describe('Mock Seed Data Relationship Consistency', () => {
    it('all activities should reference valid NGOs', () => {
      const ngoIds = new Set(ngosData.map((n) => n.id));
      activitiesData.forEach((act) => {
        expect(ngoIds.has(act.ngoId)).toBe(true);
      });
    });

    it('all registrations should reference valid employees and activities', () => {
      const userIds = new Set(usersData.map((u) => u.id));
      const activityIds = new Set(activitiesData.map((a) => a.id));

      registrationsData.forEach((reg) => {
        expect(userIds.has(reg.employeeId)).toBe(true);
        expect(activityIds.has(reg.activityId)).toBe(true);
      });
    });

    it('all attendance records should reference valid registrations, activities, and employees', () => {
      const registrationIds = new Set(registrationsData.map((r) => r.id));
      const activityIds = new Set(activitiesData.map((a) => a.id));
      const userIds = new Set(usersData.map((u) => u.id));

      attendanceData.forEach((att) => {
        expect(registrationIds.has(att.registrationId)).toBe(true);
        expect(activityIds.has(att.activityId)).toBe(true);
        expect(userIds.has(att.employeeId)).toBe(true);
      });
    });

    it('all notifications should reference valid users or ALL broadcast', () => {
      const userIds = new Set(usersData.map((u) => u.id));
      notificationsData.forEach((notif) => {
        const isValidRecipient = notif.recipientUserId === 'ALL' || userIds.has(notif.recipientUserId);
        expect(isValidRecipient).toBe(true);
      });
    });
  });
});
