import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MockDataService } from './mock-data.service';
import { NGO } from '../../models';

describe('MockDataService', () => {
  let service: MockDataService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MockDataService
      ]
    });
    service = TestBed.inject(MockDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load NGOs mock JSON successfully', async () => {
    const mockNGOs: NGO[] = [
      {
        id: 'ngo-test',
        name: 'Test NGO',
        description: 'Test Description',
        contactName: 'Contact',
        contactEmail: 'test@ngo.org',
        approvalStatus: 'APPROVED'
      }
    ];

    const loadPromise = new Promise<NGO[]>((resolve, reject) => {
      service.loadNGOs().subscribe({
        next: (ngos) => resolve(ngos),
        error: (err) => reject(err)
      });
    });

    const req = httpTesting.expectOne('assets/data/ngos.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockNGOs);

    const ngos = await loadPromise;
    expect(ngos).toEqual(mockNGOs);
  });

  it('should throw an error with clear description when HTTP call fails', async () => {
    let errorReceived: Error | null = null;

    const loadPromise = new Promise<void>((resolve) => {
      service.loadNGOs().subscribe({
        next: () => {
          throw new Error('Should have failed with error');
        },
        error: (err) => {
          errorReceived = err;
          resolve();
        }
      });
    });

    const req = httpTesting.expectOne('assets/data/ngos.json');
    req.flush('404 Not Found', { status: 404, statusText: 'Not Found' });

    await loadPromise;
    expect(errorReceived).toBeTruthy();
    expect((errorReceived as any)?.message).toContain('[MockDataService] Failed to load NGOs seed data');
  });

  it('should load all six seed datasets concurrently with loadAllSeedData', async () => {
    const loadPromise = new Promise<any>((resolve, reject) => {
      service.loadAllSeedData().subscribe({
        next: (bundle) => resolve(bundle),
        error: (err) => reject(err)
      });
    });

    httpTesting.expectOne('assets/data/ngos.json').flush([{ id: 'ngo-1' }]);
    httpTesting.expectOne('assets/data/activities.json').flush([{ id: 'act-1' }]);
    httpTesting.expectOne('assets/data/users.json').flush([{ id: 'usr-1' }]);
    httpTesting.expectOne('assets/data/registrations.json').flush([{ id: 'reg-1' }]);
    httpTesting.expectOne('assets/data/notifications.json').flush([{ id: 'notif-1' }]);
    httpTesting.expectOne('assets/data/attendance.json').flush([{ id: 'att-1' }]);

    const bundle = await loadPromise;
    expect(bundle.ngos.length).toBe(1);
    expect(bundle.activities.length).toBe(1);
    expect(bundle.users.length).toBe(1);
    expect(bundle.registrations.length).toBe(1);
    expect(bundle.notifications.length).toBe(1);
    expect(bundle.attendance.length).toBe(1);
  });
});
