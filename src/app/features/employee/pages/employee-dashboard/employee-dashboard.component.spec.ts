import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, firstValueFrom } from 'rxjs';
import { EmployeeDashboardComponent } from './employee-dashboard.component';
import { AuthService } from '../../../../core/services/auth.service';
import { DataStoreService } from '../../../../core/services/data-store.service';
import { ActivityService } from '../../../../core/services/activity.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { User, Activity, Registration, NGO } from '../../../../models';

describe('EmployeeDashboardComponent', () => {
  let component: EmployeeDashboardComponent;
  let fixture: ComponentFixture<EmployeeDashboardComponent>;

  const mockUser: User = {
    id: 'user-emp-1',
    name: 'Alice Chen',
    email: 'alice.chen@corp.example.com',
    role: 'EMPLOYEE',
    department: 'Engineering'
  };

  const mockActivity: Activity = {
    id: 'act-1',
    title: 'Urban River Cleanup',
    ngoId: 'ngo-1',
    serviceType: 'ENVIRONMENT',
    capacity: 30,
    registrationCutoff: '2026-10-20T23:59:00Z',
    startDateTime: '2026-10-22T09:00:00Z',
    endDateTime: '2026-10-22T13:00:00Z',
    location: 'Central Riverside',
    description: 'Clean up riverbanks',
    publicationStatus: 'PUBLISHED'
  };

  const mockNgo: NGO = {
    id: 'ngo-1',
    name: 'Green Earth Foundation',
    description: 'Environmental preservation',
    contactName: 'Jane Green',
    contactEmail: 'contact@greenearth.org',
    approvalStatus: 'APPROVED'
  };

  const mockRegistration: Registration = {
    id: 'reg-1',
    employeeId: 'user-emp-1',
    activityId: 'act-1',
    status: 'ACTIVE',
    registeredAt: '2026-10-05T10:00:00Z'
  };

  beforeEach(async () => {
    const authServiceStub = {
      currentUser$: of(mockUser)
    };

    const dataStoreStub = {
      registrations$: of([mockRegistration]),
      activities$: of([mockActivity]),
      ngos$: of([mockNgo]),
      notifications$: of([
        {
          id: 'n-1',
          recipientUserId: 'user-emp-1',
          title: 'Welcome',
          message: 'Welcome to Service Day',
          type: 'REGISTRATION',
          readAt: null,
          createdAt: '2026-10-05T10:00:00Z'
        }
      ])
    };

    const activityServiceStub = {
      getPublishedActivities: () => of([mockActivity])
    };

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [EmployeeDashboardComponent, StatusBadgeComponent],
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: DataStoreService, useValue: dataStoreStub },
        { provide: ActivityService, useValue: activityServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create EmployeeDashboardComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load current user and approved activities', async () => {
    const user = await firstValueFrom(component.currentUser$);
    expect(user?.name).toBe('Alice Chen');

    const activities = await firstValueFrom(component.availableActivities$);
    expect(activities.length).toBe(1);
    expect(activities[0].title).toBe('Urban River Cleanup');
  });

  it('should filter active registrations for current employee', async () => {
    const myRegs = await firstValueFrom(component.myRegistrations$);
    expect(myRegs.length).toBe(1);
    expect(myRegs[0].activityId).toBe('act-1');
  });

  it('should calculate unread notifications count correctly', async () => {
    const unread = await firstValueFrom(component.unreadCount$);
    expect(unread).toBe(1);
  });

  it('should compute upcoming enrolled initiative preview with NGO details', async () => {
    const preview = await firstValueFrom(component.upcomingEnrolled$);
    expect(preview).toBeTruthy();
    expect(preview?.activity.title).toBe('Urban River Cleanup');
    expect(preview?.ngo?.name).toBe('Green Earth Foundation');
  });
});
