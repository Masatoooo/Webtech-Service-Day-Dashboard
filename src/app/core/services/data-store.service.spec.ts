import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { DataStoreService } from './data-store.service';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { MockDataService, SeedDataBundle } from './mock-data.service';
import { NGO, Activity, User, Registration, Notification, Attendance } from '../../models';

describe('DataStoreService', () => {
  let store: DataStoreService;
  let storage: StorageService;
  let mockLoadCount = 0;

  const sampleBundle: SeedDataBundle = {
    ngos: [{ id: 'ngo-1', name: 'N1', description: 'D1', contactName: 'C1', contactEmail: 'e@1.org', approvalStatus: 'APPROVED' }],
    activities: [{ id: 'act-1', ngoId: 'ngo-1', title: 'A1', description: 'AD1', serviceType: 'ENVIRONMENT', location: 'L1', startDateTime: '2026-11-14T08:00:00', endDateTime: '2026-11-14T12:00:00', registrationCutoff: '2026-11-10T23:59:59', capacity: 10, publicationStatus: 'PUBLISHED' }],
    users: [{ id: 'usr-1', name: 'U1', email: 'u1@corp.example.com', role: 'EMPLOYEE' }],
    registrations: [{ id: 'reg-1', employeeId: 'usr-1', activityId: 'act-1', status: 'ACTIVE', registeredAt: '2026-10-08T09:00:00' }],
    notifications: [{ id: 'notif-1', recipientUserId: 'usr-1', title: 'N1', message: 'NM1', type: 'REGISTRATION', createdAt: '2026-10-08T09:00:00', readAt: null, deliveryStatus: 'DELIVERED' }],
    attendance: [{ id: 'att-1', registrationId: 'reg-1', activityId: 'act-1', employeeId: 'usr-1', checkedInAt: '2026-10-08T10:00:00', status: 'CHECKED_IN', verificationMethod: 'QR_SCAN', token: 'T1' }]
  };

  const fakeMockDataService = {
    loadAllSeedData: () => {
      mockLoadCount++;
      return of(sampleBundle);
    }
  };

  beforeEach(() => {
    mockLoadCount = 0;

    TestBed.configureTestingModule({
      providers: [
        StorageService,
        { provide: MockDataService, useValue: fakeMockDataService },
        DataStoreService
      ]
    });

    store = TestBed.inject(DataStoreService);
    storage = TestBed.inject(StorageService);
    storage.clearAllDemoData();
  });

  afterEach(() => {
    storage.clearAllDemoData();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should initialize and load from mockDataService when localStorage is empty', async () => {
    const ready = await firstValueFrom(store.init());
    expect(ready).toBe(true);
    expect(mockLoadCount).toBe(1);

    expect(store.ngosSnapshot.length).toBe(1);
    expect(store.activitiesSnapshot.length).toBe(1);
    expect(store.usersSnapshot.length).toBe(1);
    expect(store.registrationsSnapshot.length).toBe(1);
    expect(store.isInitialized).toBe(true);

    // Verify stored in localStorage
    expect(storage.getItem<NGO[]>(STORAGE_KEYS.NGOS)?.length).toBe(1);
  });

  it('should restore existing data from localStorage without calling mockDataService', async () => {
    const existingNGOs: NGO[] = [{ id: 'ngo-custom', name: 'Persisted NGO', description: 'D', contactName: 'C', contactEmail: 'e@x.org', approvalStatus: 'APPROVED' }];
    storage.setItem(STORAGE_KEYS.NGOS, existingNGOs);
    storage.setItem(STORAGE_KEYS.ACTIVITIES, sampleBundle.activities);
    storage.setItem(STORAGE_KEYS.USERS, sampleBundle.users);
    storage.setItem(STORAGE_KEYS.REGISTRATIONS, sampleBundle.registrations);
    storage.setItem(STORAGE_KEYS.NOTIFICATIONS, sampleBundle.notifications);
    storage.setItem(STORAGE_KEYS.ATTENDANCE, sampleBundle.attendance);

    const ready = await firstValueFrom(store.init());
    expect(ready).toBe(true);
    // Must NOT call mockDataService because localStorage was complete
    expect(mockLoadCount).toBe(0);
    expect(store.ngosSnapshot[0].name).toBe('Persisted NGO');
  });

  it('should persist mutations to both subject stream and localStorage', () => {
    const updatedActivities: Activity[] = [
      ...sampleBundle.activities,
      {
        id: 'act-new',
        ngoId: 'ngo-1',
        title: 'New Activity',
        description: 'New Desc',
        serviceType: 'COMMUNITY',
        location: 'Loc',
        startDateTime: '2026-11-20T08:00:00',
        endDateTime: '2026-11-20T12:00:00',
        registrationCutoff: '2026-11-18T23:59:59',
        capacity: 5,
        publicationStatus: 'PUBLISHED'
      }
    ];

    store.setActivities(updatedActivities);
    expect(store.activitiesSnapshot.length).toBe(2);

    const fromStorage = storage.getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES);
    expect(fromStorage?.length).toBe(2);
    expect(fromStorage?.[1].title).toBe('New Activity');
  });

  it('should reset demo data back to mock seed bundle', async () => {
    // Alter state first
    store.setNGOs([]);
    expect(store.ngosSnapshot.length).toBe(0);

    const success = await firstValueFrom(store.resetDemoData());
    expect(success).toBe(true);
    expect(store.ngosSnapshot.length).toBe(1);
    expect(mockLoadCount).toBe(1);
  });
});
