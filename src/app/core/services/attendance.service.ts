import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Attendance, CheckInMethod } from '../../models';
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
   * BR-10 / BR-11 / FR-35: Enforces single check-in per registration.
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
