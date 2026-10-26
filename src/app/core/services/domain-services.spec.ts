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

  describe('Registration Rules & Business Workflows', () => {
    it('should prevent duplicate active registration for the same employee and activity', () => {
      expect(() => {
        registrationService.register('usr-emp-1', 'act-1');
      }).toThrowError(/already has an active registration/);
    });

    it('should successfully register employee, reduce remaining slots, and generate a notification', async () => {
      // Act-3 capacity is 15, let's see initial slots
      const initialSummary = activityService.computeSlotSummary(
        store.activitiesSnapshot.find((a) => a.id === 'act-3')!,
        store.registrationsSnapshot
      );
      const initialRemaining = initialSummary.remainingSlots;

      // Register a user not currently registered for act-3
      const reg = await firstValueFrom(registrationService.register('usr-emp-1', 'act-3'));
      expect(reg.id).toBeTruthy();
      expect(reg.status).toBe('ACTIVE');
      expect(reg.employeeId).toBe('usr-emp-1');
      expect(reg.activityId).toBe('act-3');

      // Verify slot deduction
      const updatedSummary = activityService.computeSlotSummary(
        store.activitiesSnapshot.find((a) => a.id === 'act-3')!,
        store.registrationsSnapshot
      );
      expect(updatedSummary.remainingSlots).toBe(initialRemaining - 1);
      expect(updatedSummary.filledSlots).toBe(initialSummary.filledSlots + 1);

      // Verify notification generated
      const notifs = store.notificationsSnapshot;
      const regNotif = notifs.find((n) => n.recipientUserId === 'usr-emp-1' && n.activityId === 'act-3' && n.type === 'REGISTRATION');
      expect(regNotif).toBeTruthy();
    });

    it('should reject registration when activity capacity is full', () => {
      // Create test activity with capacity 1 and 1 active registration
      const fullAct: Activity = {
        id: 'act-full-test',
        ngoId: 'ngo-1',
        title: 'Full Initiative',
        description: 'Test',
        serviceType: 'ENVIRONMENT',
        location: 'Jakarta',
        startDateTime: '2026-11-20T08:00:00',
        endDateTime: '2026-11-20T12:00:00',
        registrationCutoff: '2026-11-18T23:59:59',
        capacity: 1,
        publicationStatus: 'PUBLISHED'
      };
      const fullReg: Registration = {
        id: 'reg-full-1',
        employeeId: 'usr-emp-2',
        activityId: 'act-full-test',
        status: 'ACTIVE',
        registeredAt: '2026-10-01T00:00:00'
      };
      store.setActivities([...store.activitiesSnapshot, fullAct]);
      store.setRegistrations([...store.registrationsSnapshot, fullReg]);

      const check = registrationService.canRegister('usr-emp-1', 'act-full-test');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('maximum capacity');

      expect(() => {
        registrationService.register('usr-emp-1', 'act-full-test');
      }).toThrowError(/maximum capacity/);
    });

    it('should reject registration when activity cut-off has passed', () => {
      const pastAct: Activity = {
        id: 'act-past-test',
        ngoId: 'ngo-1',
        title: 'Expired Initiative',
        description: 'Test',
        serviceType: 'ENVIRONMENT',
        location: 'Jakarta',
        startDateTime: '2026-10-01T08:00:00',
        endDateTime: '2026-10-01T12:00:00',
        registrationCutoff: '2026-09-25T23:59:59',
        capacity: 10,
        publicationStatus: 'PUBLISHED'
      };
      store.setActivities([...store.activitiesSnapshot, pastAct]);

      const check = registrationService.canRegister('usr-emp-1', 'act-past-test');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('cut-off date');

      expect(() => {
        registrationService.register('usr-emp-1', 'act-past-test');
      }).toThrowError(/cut-off date/);
    });

    it('should reject registration when partner NGO is unapproved or activity not published', () => {
      // act-9 is unapproved NGO
      const check = registrationService.canRegister('usr-emp-1', 'act-9');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('not approved');

      // act-8 is DRAFT
      const checkDraft = registrationService.canRegister('usr-emp-1', 'act-8');
      expect(checkDraft.allowed).toBe(false);
      expect(checkDraft.reason).toContain('draft');

      // act-7 is CANCELLED
      const checkCancelled = registrationService.canRegister('usr-emp-1', 'act-7');
      expect(checkCancelled.allowed).toBe(false);
      expect(checkCancelled.reason).toContain('cancelled');
    });

    it('should detect schedule overlap without blocking registration (BR-11)', () => {
      // Find active registration for user
      const userActive = store.registrationsSnapshot.find((r) => r.employeeId === 'usr-emp-1' && r.status === 'ACTIVE')!;
      const existingAct = store.activitiesSnapshot.find((a) => a.id === userActive.activityId)!;

      // Create overlapping activity on the exact same date & time
      const overlapAct: Activity = {
        id: 'act-overlap-test',
        ngoId: 'ngo-1',
        title: 'Simultaneous Initiative',
        description: 'Overlapping',
        serviceType: 'COMMUNITY',
        location: 'Jakarta',
        startDateTime: existingAct.startDateTime,
        endDateTime: existingAct.endDateTime,
        registrationCutoff: '2026-11-20T23:59:59',
        capacity: 15,
        publicationStatus: 'PUBLISHED'
      };
      store.setActivities([...store.activitiesSnapshot, overlapAct]);

      const check = registrationService.canRegister('usr-emp-1', 'act-overlap-test');
      expect(check.allowed).toBe(true);
      expect(check.overlappingActivities?.length).toBeGreaterThan(0);
      expect(check.overlappingActivities?.[0].id).toBe(existingAct.id);
    });

    it('should cancel registration before cut-off and restore activity available capacity', async () => {
      // Get an active registration
      const reg = store.registrationsSnapshot.find((r) => r.id === 'reg-1')!;
      const act = store.activitiesSnapshot.find((a) => a.id === reg.activityId)!;

      const beforeSummary = activityService.computeSlotSummary(act, store.registrationsSnapshot);
      const initialRemaining = beforeSummary.remainingSlots;

      const cancelled = await firstValueFrom(
        registrationService.cancelRegistration('reg-1', 'Personal schedule conflict')
      );
      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancellationReason).toBe('Personal schedule conflict');

      // Verify slot is restored
      const afterSummary = activityService.computeSlotSummary(act, store.registrationsSnapshot);
      expect(afterSummary.remainingSlots).toBe(initialRemaining + 1);

      // Verify cancellation notification
      const cancelNotif = store.notificationsSnapshot.find(
        (n) => n.recipientUserId === reg.employeeId && n.type === 'CANCELLATION'
      );
      expect(cancelNotif).toBeTruthy();
    });

    it('should reject cancellation when cut-off has passed', () => {
      const expiredAct: Activity = {
        id: 'act-cutoff-past',
        ngoId: 'ngo-1',
        title: 'Locked Initiative',
        description: 'Test',
        serviceType: 'ENVIRONMENT',
        location: 'Jakarta',
        startDateTime: '2026-10-01T08:00:00',
        endDateTime: '2026-10-01T12:00:00',
        registrationCutoff: '2026-09-25T23:59:59', // Past cutoff
        capacity: 10,
        publicationStatus: 'PUBLISHED'
      };
      const reg: Registration = {
        id: 'reg-locked-test',
        employeeId: 'usr-emp-1',
        activityId: 'act-cutoff-past',
        status: 'ACTIVE',
        registeredAt: '2026-09-20T00:00:00'
      };
      store.setActivities([...store.activitiesSnapshot, expiredAct]);
      store.setRegistrations([...store.registrationsSnapshot, reg]);

      const check = registrationService.canCancelRegistration('reg-locked-test');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('cut-off deadline');

      expect(() => {
        registrationService.cancelRegistration('reg-locked-test');
      }).toThrowError(/cut-off deadline/);
    });

    it('should perform atomic transfer: destination validated first, old registration cancelled, new registration created', async () => {
      // Find an active registration for usr-emp-2
      const reg = store.registrationsSnapshot.find((r) => r.employeeId === 'usr-emp-2' && r.status === 'ACTIVE')!;
      const oldActId = reg.activityId;
      // Transfer to act-4
      const targetActId = 'act-4';

      const result = await firstValueFrom(
        registrationService.transferRegistration(reg.id, targetActId, 'Switched focus area')
      );

      expect(result.oldRegistration.status).toBe('CANCELLED');
      expect(result.oldRegistration.cancellationReason).toBe('Switched focus area');
      expect(result.newRegistration.status).toBe('ACTIVE');
      expect(result.newRegistration.activityId).toBe(targetActId);
      expect(result.newRegistration.employeeId).toBe('usr-emp-2');

      // Verify transfer notification generated
      const transferNotif = store.notificationsSnapshot.find(
        (n) => n.recipientUserId === 'usr-emp-2' && n.activityId === targetActId && n.title.includes('Transfer')
      );
      expect(transferNotif).toBeTruthy();
    });

    it('should preserve original registration when destination activity check fails (atomic transfer rule)', () => {
      // Create destination that is FULL
      const fullDest: Activity = {
        id: 'act-dest-full',
        ngoId: 'ngo-1',
        title: 'Full Destination',
        description: 'Test',
        serviceType: 'EDUCATION',
        location: 'Jakarta',
        startDateTime: '2026-11-20T08:00:00',
        endDateTime: '2026-11-20T12:00:00',
        registrationCutoff: '2026-11-18T23:59:59',
        capacity: 1,
        publicationStatus: 'PUBLISHED'
      };
      const existingRegInDest: Registration = {
        id: 'reg-dest-1',
        employeeId: 'usr-emp-9',
        activityId: 'act-dest-full',
        status: 'ACTIVE',
        registeredAt: '2026-10-01T00:00:00'
      };
      // Active source registration for usr-emp-3
      const sourceReg: Registration = {
        id: 'reg-source-test',
        employeeId: 'usr-emp-3',
        activityId: 'act-1',
        status: 'ACTIVE',
        registeredAt: '2026-10-01T00:00:00'
      };

      store.setActivities([...store.activitiesSnapshot, fullDest]);
      store.setRegistrations([...store.registrationsSnapshot, fullDest as any, existingRegInDest, sourceReg]);

      // Attempt transfer to full destination
      expect(() => {
        registrationService.transferRegistration('reg-source-test', 'act-dest-full');
      }).toThrowError(/full capacity/);

      // Verify source registration is completely PRESERVED and untouched
      const sourceAfter = store.registrationsSnapshot.find((r) => r.id === 'reg-source-test');
      expect(sourceAfter?.status).toBe('ACTIVE');
    });

    it('should reject transfer when destination is identical to source activity', () => {
      const sourceReg: Registration = {
        id: 'reg-identical-test',
        employeeId: 'usr-emp-1',
        activityId: 'act-1',
        status: 'ACTIVE',
        registeredAt: '2026-10-01T00:00:00'
      };
      store.setRegistrations([...store.registrationsSnapshot, sourceReg]);

      const check = registrationService.canTransferRegistration('reg-identical-test', 'act-1');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('identical');
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
