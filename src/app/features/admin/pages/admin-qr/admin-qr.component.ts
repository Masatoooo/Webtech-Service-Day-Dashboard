import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  Activity,
  ActivityQrInfo,
  Attendance,
  NGO,
  Registration,
  User
} from '../../../../models';
import { ActivityService } from '../../../../core/services/activity.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { DataStoreService } from '../../../../core/services/data-store.service';

export interface ParticipantAttendanceRow {
  employeeId: string;
  employeeName: string;
  department: string;
  registrationId: string;
  registrationStatus: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
  method?: string;
}

@Component({
  selector: 'app-admin-qr',
  templateUrl: './admin-qr.component.html',
  styleUrls: ['./admin-qr.component.css'],
  standalone: false
})
export class AdminQrComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  activities: Activity[] = [];
  selectedActivityId: string = '';
  selectedActivity: Activity | null = null;
  selectedNgo: NGO | null = null;

  qrInfo: ActivityQrInfo | null = null;
  generatingQr = false;
  copyFeedback = '';

  // Roster metrics
  participantRoster: ParticipantAttendanceRow[] = [];
  registeredCount = 0;
  checkedInCount = 0;
  attendanceRate = 0;

  constructor(
    private readonly activityService: ActivityService,
    private readonly attendanceService: AttendanceService,
    private readonly dataStore: DataStoreService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.activityService.getActivities(),
      this.dataStore.ngos$,
      this.dataStore.registrations$,
      this.dataStore.attendance$,
      this.dataStore.users$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([activities, ngos, regs, atts, users]) => {
        this.activities = activities.filter((a) => a.publicationStatus === 'PUBLISHED');

        if (this.activities.length > 0 && !this.selectedActivityId) {
          this.selectedActivityId = this.activities[0].id;
        }

        if (this.selectedActivityId) {
          this.updateSelectedActivityState(ngos, regs, atts, users);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectActivity(activityId: string): void {
    this.selectedActivityId = activityId;
    this.updateSelectedActivityState(
      this.dataStore.ngosSnapshot,
      this.dataStore.registrationsSnapshot,
      this.dataStore.attendanceSnapshot,
      this.dataStore.usersSnapshot
    );
  }

  private async updateSelectedActivityState(
    ngos: NGO[],
    regs: Registration[],
    atts: Attendance[],
    users: User[]
  ): Promise<void> {
    const act = this.activities.find((a) => a.id === this.selectedActivityId);
    this.selectedActivity = act || null;
    if (!act) {
      this.qrInfo = null;
      this.participantRoster = [];
      return;
    }

    this.selectedNgo = ngos.find((n) => n.id === act.ngoId) || null;

    // Generate or update QR code
    this.generatingQr = true;
    try {
      this.qrInfo = await this.attendanceService.generateActivityQr(act);
    } finally {
      this.generatingQr = false;
    }

    // Build participant attendance roster
    const userMap = new Map<string, User>(users.map((u) => [u.id, u]));
    const activityRegs = regs.filter((r) => r.activityId === act.id);
    const activityAtts = atts.filter((a) => a.activityId === act.id);

    const attMap = new Map<string, Attendance>(
      activityAtts.map((a) => [a.registrationId, a])
    );

    this.participantRoster = activityRegs.map((reg) => {
      const user = userMap.get(reg.employeeId);
      const att = attMap.get(reg.id);
      return {
        employeeId: reg.employeeId,
        employeeName: user ? user.name : `Employee (${reg.employeeId})`,
        department: user?.department || 'Staff',
        registrationId: reg.id,
        registrationStatus: reg.status,
        isCheckedIn: !!att && att.status === 'CHECKED_IN',
        checkedInAt: att?.checkedInAt,
        method: att?.verificationMethod === 'QR_SCAN' ? 'QR Code Scan' : att?.verificationMethod === 'MANUAL_FALLBACK' ? 'Manual Demo Fallback' : undefined
      };
    });

    const activeRegs = this.participantRoster.filter((p) => p.registrationStatus === 'ACTIVE');
    this.registeredCount = activeRegs.length;
    this.checkedInCount = activeRegs.filter((p) => p.isCheckedIn).length;
    this.attendanceRate = this.registeredCount > 0 ? Math.round((this.checkedInCount / this.registeredCount) * 100) : 0;
  }

  copyTokenToClipboard(): void {
    if (!this.qrInfo) return;
    navigator.clipboard?.writeText(this.qrInfo.token).then(
      () => {
        this.copyFeedback = 'Token copied!';
        setTimeout(() => (this.copyFeedback = ''), 3000);
      },
      () => {
        this.copyFeedback = this.qrInfo?.token || '';
      }
    );
  }

  printPoster(): void {
    window.print();
  }

  downloadQrImage(): void {
    if (!this.qrInfo?.qrDataUrl || !this.selectedActivity) return;
    const link = document.createElement('a');
    link.href = this.qrInfo.qrDataUrl;
    link.download = `service-day-qr-${this.selectedActivity.id}.png`;
    link.click();
  }
}
