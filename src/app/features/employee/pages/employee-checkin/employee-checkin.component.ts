import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Activity,
  CheckInMethod,
  CheckInSuccessResult,
  Registration,
  User
} from '../../../../models';
import { AuthService } from '../../../../core/services/auth.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { DataStoreService } from '../../../../core/services/data-store.service';

export type ScannerState =
  | 'IDLE'
  | 'STARTING'
  | 'SCANNING'
  | 'PERMISSION_DENIED'
  | 'UNAVAILABLE'
  | 'STOPPED';

@Component({
  selector: 'app-employee-checkin',
  templateUrl: './employee-checkin.component.html',
  styleUrls: ['./employee-checkin.component.css'],
  standalone: false
})
export class EmployeeCheckinComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private html5QrCode: Html5Qrcode | null = null;

  currentUser: User | null = null;
  activeMode: 'SCANNER' | 'MANUAL' = 'SCANNER';
  scannerState: ScannerState = 'IDLE';

  manualTokenInput = '';
  isCheckingIn = false;

  // Outcome states
  checkInSuccess: CheckInSuccessResult | null = null;
  checkInError: string = '';

  // Current employee's registered activities for demo assistance
  employeeRegistrations: { registration: Registration; activity: Activity; isCheckedIn: boolean }[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly attendanceService: AttendanceService,
    private readonly dataStore: DataStoreService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.authService.currentUser$,
      this.dataStore.registrations$,
      this.dataStore.activities$,
      this.dataStore.attendance$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([user, regs, activities, atts]) => {
        this.currentUser = user;
        if (!user) {
          this.employeeRegistrations = [];
          return;
        }

        const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));
        const myRegs = regs.filter((r) => r.employeeId === user.id && r.status === 'ACTIVE');

        this.employeeRegistrations = myRegs.map((r) => {
          const act = actMap.get(r.activityId)!;
          const isCheckedIn = atts.some(
            (a) => a.registrationId === r.id && a.status === 'CHECKED_IN'
          );
          return { registration: r, activity: act, isCheckedIn };
        });
      });

    // Check optional query params
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['token']) {
        this.manualTokenInput = params['token'];
        this.activeMode = 'MANUAL';
      } else if (params['activityId']) {
        this.manualTokenInput = this.attendanceService.generateActivityToken(params['activityId']);
        this.activeMode = 'MANUAL';
      }
    });
  }

  ngOnDestroy(): void {
    this.stopScannerCleanly();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // CAMERA SCANNER LIFECYCLE (Scope 4 & Acceptance Criteria)
  // =========================================================================

  async startScanner(): Promise<void> {
    this.checkInError = '';
    this.checkInSuccess = null;
    this.scannerState = 'STARTING';
    this.cdr.detectChanges();

    try {
      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode('qr-scanner-viewfinder', false);
      }

      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.max(Math.floor(minEdge * 0.72), 160);
            return { width: edgeSize, height: edgeSize };
          }
        },
        (decodedText: string) => {
          this.ngZone.run(() => {
            this.onQrScanned(decodedText);
          });
        },
        () => {
          // Frame decode pass errors are expected when no QR in view; ignore
        }
      );

      this.ngZone.run(() => {
        this.scannerState = 'SCANNING';
        this.cdr.detectChanges();
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        const errStr = err?.toString?.() || '';
        if (
          errStr.includes('NotAllowedError') ||
          errStr.includes('Permission') ||
          errStr.includes('denied')
        ) {
          this.scannerState = 'PERMISSION_DENIED';
          this.checkInError = 'Camera access was denied. Please allow camera permissions in your browser or switch to the Manual Fallback code below.';
        } else {
          this.scannerState = 'UNAVAILABLE';
          this.checkInError = 'Camera scanner is unavailable on this device or environment. Please use the Manual Demo Fallback.';
        }
        this.cdr.detectChanges();
      });
    }
  }

  async stopScanner(): Promise<void> {
    await this.stopScannerCleanly();
    this.ngZone.run(() => {
      this.scannerState = 'STOPPED';
      this.cdr.detectChanges();
    });
  }

  private async stopScannerCleanly(): Promise<void> {
    try {
      if (this.html5QrCode) {
        if (this.html5QrCode.isScanning) {
          await this.html5QrCode.stop();
        }
        this.html5QrCode.clear();
        this.html5QrCode = null;
      }
    } catch {
      this.html5QrCode = null;
    }
  }

  private onQrScanned(decodedText: string): void {
    // Stop camera immediately upon detection to freeze frame
    this.stopScanner();
    this.performCheckIn(decodedText, 'QR_SCAN');
    this.cdr.detectChanges();
  }

  // =========================================================================
  // MANUAL FALLBACK CHECK-IN (Scope 4, 5, 6, 7, 8)
  // =========================================================================

  submitManualCheckIn(): void {
    if (!this.manualTokenInput.trim()) {
      this.checkInError = 'Please enter a valid activity check-in token or code.';
      this.cdr.detectChanges();
      return;
    }
    this.performCheckIn(this.manualTokenInput.trim(), 'MANUAL_FALLBACK');
  }

  selectDemoActivityToken(activityId: string): void {
    this.manualTokenInput = this.attendanceService.generateActivityToken(activityId);
    this.checkInError = '';
    this.cdr.detectChanges();
  }

  // =========================================================================
  // CHECK-IN EXECUTION & VALIDATION DISPATCH
  // =========================================================================

  private performCheckIn(tokenInput: string, method: CheckInMethod): void {
    if (!this.currentUser) {
      this.checkInError = 'You must be signed in to check in to an activity.';
      this.cdr.detectChanges();
      return;
    }

    this.checkInError = '';
    this.checkInSuccess = null;
    this.isCheckingIn = true;
    this.cdr.detectChanges();

    this.attendanceService
      .executeCheckIn({
        tokenInput,
        employeeId: this.currentUser.id,
        method
      })
      .subscribe({
        next: (result) => {
          this.ngZone.run(() => {
            this.isCheckingIn = false;
            this.checkInSuccess = result;
            this.manualTokenInput = '';
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.isCheckingIn = false;
            this.checkInError = err?.message || 'Check-in validation failed.';
            this.cdr.detectChanges();
          });
        }
      });
  }

  setMode(mode: 'SCANNER' | 'MANUAL'): void {
    this.activeMode = mode;
    this.checkInError = '';
    if (mode === 'MANUAL') {
      this.stopScanner();
    }
    this.cdr.detectChanges();
  }

  resetCheckIn(): void {
    this.checkInSuccess = null;
    this.checkInError = '';
    this.manualTokenInput = '';
    this.scannerState = 'IDLE';
    this.cdr.detectChanges();
  }
}
