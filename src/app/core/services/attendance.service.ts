import { Injectable } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import * as QRCode from 'qrcode';
import {
  Activity,
  Attendance,
  CheckInMethod,
  CheckInSuccessResult,
  CheckInValidationResult,
  ActivityQrInfo,
  Registration
} from '../../models';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private readonly store: DataStoreService) {}

  getAttendanceRecords(): Observable<Attendance[]> {
    return this.store.attendance$;
  }

  getAttendanceByActivity(activityId: string): Observable<Attendance[]> {
    return this.store.attendance$.pipe(
      map((list) => list.filter((a) => a.activityId === activityId))
    );
  }

  getAttendanceByEmployee(employeeId: string): Observable<Attendance[]> {
    return this.store.attendance$.pipe(
      map((list) => list.filter((a) => a.employeeId === employeeId))
    );
  }

  hasCheckedIn(registrationId: string): Observable<boolean> {
    return this.store.attendance$.pipe(
      map((list) => list.some((a) => a.registrationId === registrationId && a.status === 'CHECKED_IN'))
    );
  }

  /**
   * Generates a deterministic, opaque demo token for an activity (without PII).
   */
  generateActivityToken(activityId: string): string {
    let hash = 0;
    for (let i = 0; i < activityId.length; i++) {
      hash = ((hash << 5) - hash + activityId.charCodeAt(i)) & 0xffffffff;
    }
    const cleanHash = Math.abs(hash).toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
    return `SDD-CHK-${activityId}-${cleanHash}`;
  }

  /**
   * Generates an activity-specific QR code data URL and payload.
   * Does NOT contain employee PII or passwords.
   */
  async generateActivityQr(activity: Activity): Promise<ActivityQrInfo> {
    const token = this.generateActivityToken(activity.id);
    const payload = JSON.stringify({
      protocol: 'SDD_CHECKIN_V1',
      token,
      activityId: activity.id,
      title: activity.title,
      date: activity.startDateTime
    });

    try {
      const qrDataUrl = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#09090B',
          light: '#FFFFFF'
        }
      });

      return {
        activityId: activity.id,
        token,
        qrPayload: payload,
        qrDataUrl,
        generatedAt: new Date().toISOString()
      };
    } catch (err) {
      // Fallback in case canvas generation fails in headless environments
      return {
        activityId: activity.id,
        token,
        qrPayload: payload,
        generatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Extracts an activity ID from either a JSON QR payload, an opaque token string, or raw ID.
   */
  extractActivityIdFromToken(input: string): string | null {
    if (!input || !input.trim()) return null;
    const trimmed = input.trim();

    // 1. Check if JSON payload from QR scan
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.activityId && typeof parsed.activityId === 'string') {
          return parsed.activityId;
        }
      } catch {
        // Fall through
      }
    }

    const activities = this.store.activitiesSnapshot;

    // 2. Exact match on activity ID (e.g. "act-1")
    const exactMatch = activities.find((a) => a.id.toLowerCase() === trimmed.toLowerCase());
    if (exactMatch) {
      return exactMatch.id;
    }

    // 3. Token pattern SDD-CHK-<activityId>-<hash> (e.g. "SDD-CHK-act-1-WXYZ" or "SDD-CHK-act-999-ABCD")
    const tokenMatch = trimmed.match(/^SDD-CHK-(.+?)(?:-[a-zA-Z0-9]{3,})?$/i);
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1];
    }

    // 4. Any token containing known activity ID
    for (const act of activities) {
      if (trimmed.toLowerCase().includes(act.id.toLowerCase())) {
        return act.id;
      }
    }

    return null;
  }

  /**
   * Validates eligibility for check-in against business rules (FR-35, BR-10, BR-11).
   */
  validateCheckIn(tokenInput: string, employeeId: string): CheckInValidationResult {
    const activityId = this.extractActivityIdFromToken(tokenInput);
    if (!activityId) {
      return {
        allowed: false,
        reason: 'Invalid Check-In Code: The scanned QR code or input code does not match a recognized Service Day activity token.'
      };
    }

    const activities = this.store.activitiesSnapshot;
    const activity = activities.find((a) => a.id === activityId);
    if (!activity) {
      return {
        allowed: false,
        reason: `Activity Not Found: No active initiative exists for activity reference "${activityId}".`
      };
    }

    // Check activity publication status
    if (activity.publicationStatus !== 'PUBLISHED') {
      return {
        allowed: false,
        reason: `Activity Ineligible: "${activity.title}" is currently ${activity.publicationStatus.toLowerCase()} and cannot accept check-ins.`,
        activity
      };
    }

    // Check partner NGO approval status
    const ngos = this.store.ngosSnapshot;
    const ngo = ngos.find((n) => n.id === activity.ngoId);
    if (!ngo || ngo.approvalStatus !== 'APPROVED') {
      return {
        allowed: false,
        reason: `Activity Ineligible: The partner NGO for "${activity.title}" is not approved for participation.`,
        activity
      };
    }

    // Check employee registrations
    const registrations = this.store.registrationsSnapshot;
    const employeeRegs = registrations.filter(
      (r) => r.employeeId === employeeId && r.activityId === activity.id
    );

    if (employeeRegs.length === 0) {
      return {
        allowed: false,
        reason: `Missing Registration: You are not registered for "${activity.title}". Only registered volunteers can complete event check-in.`,
        activity
      };
    }

    const activeReg = employeeRegs.find((r) => r.status === 'ACTIVE');
    if (!activeReg) {
      return {
        allowed: false,
        reason: `Cancelled Registration: Your registration for "${activity.title}" was previously cancelled. Only active registrations are eligible for check-in.`,
        activity
      };
    }

    // Check duplicate check-in
    const attendanceRecords = this.store.attendanceSnapshot;
    const existing = attendanceRecords.find(
      (a) => a.registrationId === activeReg.id && a.status === 'CHECKED_IN'
    );
    if (existing) {
      const formattedDate = new Date(existing.checkedInAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      const methodLabel = existing.verificationMethod === 'QR_SCAN' ? 'QR Code scan' : 'manual demo fallback';
      return {
        allowed: false,
        reason: `Already Checked In: You already checked in to "${activity.title}" at ${formattedDate} via ${methodLabel}. Duplicate check-in is not permitted.`,
        activity,
        registration: activeReg,
        existingAttendance: existing
      };
    }

    return {
      allowed: true,
      activity,
      registration: activeReg
    };
  }

  /**
   * Executes check-in, records timestamp, and saves attendance to local state and storage.
   */
  executeCheckIn(params: {
    tokenInput: string;
    employeeId: string;
    method: CheckInMethod;
  }): Observable<CheckInSuccessResult> {
    const validation = this.validateCheckIn(params.tokenInput, params.employeeId);
    if (!validation.allowed || !validation.activity || !validation.registration) {
      return throwError(() => new Error(validation.reason || 'Check-in validation failed.'));
    }

    const current = this.store.attendanceSnapshot;
    const newRecord: Attendance = {
      id: `att-${Date.now()}`,
      registrationId: validation.registration.id,
      activityId: validation.activity.id,
      employeeId: params.employeeId,
      checkedInAt: new Date().toISOString(),
      status: 'CHECKED_IN',
      verificationMethod: params.method,
      token: params.tokenInput.trim()
    };

    this.store.setAttendance([...current, newRecord]);

    return of({
      attendance: newRecord,
      activity: validation.activity,
      registration: validation.registration,
      isDemoSimulation: true
    });
  }

  /**
   * Backwards compatible legacy method for existing unit tests.
   */
  recordCheckIn(params: {
    registrationId: string;
    activityId: string;
    employeeId: string;
    verificationMethod: CheckInMethod;
    token: string;
  }): Observable<Attendance> {
    const current = this.store.attendanceSnapshot;
    const existing = current.find(
      (a) => a.registrationId === params.registrationId && a.status === 'CHECKED_IN'
    );
    if (existing) {
      throw new Error(`[AttendanceService] Registration "${params.registrationId}" is already checked in.`);
    }

    const newRecord: Attendance = {
      id: `att-${Date.now()}`,
      registrationId: params.registrationId,
      activityId: params.activityId,
      employeeId: params.employeeId,
      checkedInAt: new Date().toISOString(),
      status: 'CHECKED_IN',
      verificationMethod: params.verificationMethod,
      token: params.token
    };

    this.store.setAttendance([...current, newRecord]);
    return of(newRecord);
  }
}
