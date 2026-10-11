import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Registration } from '../../models';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  constructor(private readonly store: DataStoreService) {}

  getRegistrations(): Observable<Registration[]> {
    return this.store.registrations$;
  }

  getActiveRegistrations(): Observable<Registration[]> {
    return this.store.registrations$.pipe(
      map((list) => list.filter((r) => r.status === 'ACTIVE'))
    );
  }

  getRegistrationsByEmployee(employeeId: string): Observable<Registration[]> {
    return this.store.registrations$.pipe(
      map((list) => list.filter((r) => r.employeeId === employeeId))
    );
  }

  getRegistrationsByActivity(activityId: string): Observable<Registration[]> {
    return this.store.registrations$.pipe(
      map((list) => list.filter((r) => r.activityId === activityId))
    );
  }

  getActiveRegistration(employeeId: string, activityId: string): Observable<Registration | undefined> {
    return this.store.registrations$.pipe(
      map((list) =>
        list.find((r) => r.employeeId === employeeId && r.activityId === activityId && r.status === 'ACTIVE')
      )
    );
  }

  isEmployeeRegistered(employeeId: string, activityId: string): Observable<boolean> {
    return this.getActiveRegistration(employeeId, activityId).pipe(
      map((reg) => !!reg)
    );
  }

  /**
   * BR-08 / FR-15: Prevents duplicate active registration for same employee on same activity.
   */
  register(employeeId: string, activityId: string): Observable<Registration> {
    const current = this.store.registrationsSnapshot;
    const existing = current.find(
      (r) => r.employeeId === employeeId && r.activityId === activityId && r.status === 'ACTIVE'
    );
    if (existing) {
      throw new Error(`[RegistrationService] Employee "${employeeId}" already has an active registration for activity "${activityId}".`);
    }

    const newRegistration: Registration = {
      id: `reg-${Date.now()}`,
      employeeId,
      activityId,
      status: 'ACTIVE',
      registeredAt: new Date().toISOString()
    };

    this.store.setRegistrations([...current, newRegistration]);
    return of(newRegistration);
  }

  /**
   * BR-09 / FR-18: Cancels an active registration and records timestamp & reason.
   */
  cancelRegistration(registrationId: string, reason?: string): Observable<Registration> {
    const current = this.store.registrationsSnapshot;
    const index = current.findIndex((r) => r.id === registrationId);
    if (index === -1) {
      throw new Error(`[RegistrationService] Registration "${registrationId}" not found.`);
    }

    const updated: Registration = {
      ...current[index],
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
      cancellationReason: reason ?? 'User requested cancellation'
    };

    const nextList = [...current];
    nextList[index] = updated;
    this.store.setRegistrations(nextList);
    return of(updated);
  }
}
