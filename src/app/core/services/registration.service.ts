import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Registration, Activity, Notification } from '../../models';
import { DataStoreService } from './data-store.service';

export interface CanRegisterResult {
  allowed: boolean;
  reason?: string;
  overlappingActivities?: Activity[];
}

export interface CanTransferResult {
  allowed: boolean;
  reason?: string;
  overlappingActivities?: Activity[];
}

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
   * Helper to format dates cleanly for user messages.
   */
  private formatDate(isoString: string): string {
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? isoString : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Safely parses cut-off date strings (including date-only YYYY-MM-DD end-of-day).
   */
  parseCutoff(cutoffStr: string): Date {
    if (!cutoffStr) return new Date();
    if (cutoffStr.length === 10 && !cutoffStr.includes('T')) {
      return new Date(`${cutoffStr}T23:59:59`);
    }
    return new Date(cutoffStr);
  }

  /**
   * BR-11: Detect schedule conflicts with other active enrollments of the employee.
   */
  getOverlappingActivities(employeeId: string, targetActivity: Activity, excludeActivityId?: string): Activity[] {
    const registrations = this.store.registrationsSnapshot.filter(
      (r) => r.employeeId === employeeId && r.status === 'ACTIVE' && r.activityId !== targetActivity.id && r.activityId !== excludeActivityId
    );
    const activities = this.store.activitiesSnapshot;
    const actMap = new Map<string, Activity>(activities.map((a) => [a.id, a]));

    const targetStart = new Date(targetActivity.startDateTime).getTime();
    const targetEnd = new Date(targetActivity.endDateTime).getTime();

    const overlapping: Activity[] = [];
    for (const reg of registrations) {
      const act = actMap.get(reg.activityId);
      if (act) {
        const start = new Date(act.startDateTime).getTime();
        const end = new Date(act.endDateTime).getTime();
        if (start < targetEnd && end > targetStart) {
          overlapping.push(act);
        }
      }
    }
    return overlapping;
  }

  /**
   * BR-01 / BR-08 / FR-14 / FR-15: Pre-registration validation.
   */
  canRegister(employeeId: string, activityId: string): CanRegisterResult {
    const activities = this.store.activitiesSnapshot;
    const ngos = this.store.ngosSnapshot;
    const registrations = this.store.registrationsSnapshot;

    const activity = activities.find((a) => a.id === activityId);
    if (!activity) {
      return { allowed: false, reason: `Activity with id "${activityId}" does not exist.` };
    }

    const ngo = ngos.find((n) => n.id === activity.ngoId);
    if (!ngo || ngo.approvalStatus !== 'APPROVED') {
      return { allowed: false, reason: `Activity is not approved for participation (partner NGO is unverified).` };
    }

    if (activity.publicationStatus !== 'PUBLISHED') {
      return {
        allowed: false,
        reason: `Activity is ${activity.publicationStatus.toLowerCase()} and cannot accept volunteer sign-ups.`
      };
    }

    // Cut-off deadline check
    const now = new Date();
    const cutoffDate = this.parseCutoff(activity.registrationCutoff);
    if (now > cutoffDate) {
      return {
        allowed: false,
        reason: `Registration cut-off date (${this.formatDate(activity.registrationCutoff)}) has passed for this activity. Sign-up is closed.`
      };
    }

    // Duplicate active registration check
    const existing = registrations.find(
      (r) => r.employeeId === employeeId && r.activityId === activityId && r.status === 'ACTIVE'
    );
    if (existing) {
      return {
        allowed: false,
        reason: `[RegistrationService] Employee "${employeeId}" already has an active registration for activity "${activityId}".`
      };
    }

    // Capacity limit check
    const activeCount = registrations.filter(
      (r) => r.activityId === activityId && r.status === 'ACTIVE'
    ).length;
    if (activeCount >= activity.capacity) {
      return {
        allowed: false,
        reason: `Activity "${activity.title}" has reached maximum capacity (${activity.capacity} volunteers). No remaining places available.`
      };
    }

    // Schedule overlap detection (warning, not hard block per PRD)
    const overlapping = this.getOverlappingActivities(employeeId, activity);

    return { allowed: true, overlappingActivities: overlapping };
  }

  /**
   * BR-08 / FR-13: Register for an approved activity.
   */
  register(employeeId: string, activityId: string): Observable<Registration> {
    const check = this.canRegister(employeeId, activityId);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const activities = this.store.activitiesSnapshot;
    const activity = activities.find((a) => a.id === activityId)!;

    const newRegistration: Registration = {
      id: `reg-${Date.now()}`,
      employeeId,
      activityId,
      status: 'ACTIVE',
      registeredAt: new Date().toISOString()
    };

    // 1. Persist new registration
    const currentRegs = this.store.registrationsSnapshot;
    this.store.setRegistrations([...currentRegs, newRegistration]);

    // 2. Generate and persist confirmation notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      recipientUserId: employeeId,
      title: 'Registration Confirmed',
      message: `Your registration for '${activity.title}' on ${this.formatDate(activity.startDateTime)} has been successfully confirmed. 1 spot reserved.`,
      type: 'REGISTRATION',
      createdAt: new Date().toISOString(),
      readAt: null,
      deliveryStatus: 'DELIVERED',
      activityId: activity.id,
      simulationLabel: 'Simulated in app'
    };
    this.store.setNotifications([...this.store.notificationsSnapshot, newNotif]);

    return of(newRegistration);
  }

  /**
   * BR-09 / FR-18: Check if an active registration can be cancelled before cut-off.
   */
  canCancelRegistration(registrationId: string): { allowed: boolean; reason?: string } {
    const current = this.store.registrationsSnapshot;
    const reg = current.find((r) => r.id === registrationId);
    if (!reg) {
      return { allowed: false, reason: `Registration "${registrationId}" not found.` };
    }
    if (reg.status !== 'ACTIVE') {
      return { allowed: false, reason: 'Registration is already cancelled.' };
    }

    const activities = this.store.activitiesSnapshot;
    const activity = activities.find((a) => a.id === reg.activityId);
    if (activity) {
      const now = new Date();
      const cutoffDate = this.parseCutoff(activity.registrationCutoff);
      if (now > cutoffDate) {
        return {
          allowed: false,
          reason: `Cannot cancel: The registration cut-off deadline for "${activity.title}" passed on ${this.formatDate(activity.registrationCutoff)}. Attendance rosters are locked for partner NGO logistics.`
        };
      }
    }

    return { allowed: true };
  }

  /**
   * BR-09 / FR-18: Cancels an active registration and releases capacity back to the activity.
   */
  cancelRegistration(registrationId: string, reason?: string): Observable<Registration> {
    const check = this.canCancelRegistration(registrationId);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const current = this.store.registrationsSnapshot;
    const index = current.findIndex((r) => r.id === registrationId);
    const reg = current[index];

    const updated: Registration = {
      ...reg,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
      cancellationReason: reason ?? 'User requested cancellation'
    };

    const nextList = [...current];
    nextList[index] = updated;
    this.store.setRegistrations(nextList);

    // Notify employee of cancellation
    const activities = this.store.activitiesSnapshot;
    const activity = activities.find((a) => a.id === reg.activityId);
    const title = activity?.title || 'Activity';

    const cancelNotif: Notification = {
      id: `notif-${Date.now()}`,
      recipientUserId: reg.employeeId,
      title: 'Registration Withdrawn',
      message: `Your registration for '${title}' was successfully cancelled. Your reserved place has been restored to the community pool.`,
      type: 'CANCELLATION',
      createdAt: new Date().toISOString(),
      readAt: null,
      deliveryStatus: 'DELIVERED',
      activityId: reg.activityId,
      simulationLabel: 'Simulated in app'
    };
    this.store.setNotifications([...this.store.notificationsSnapshot, cancelNotif]);

    return of(updated);
  }

  /**
   * BR-10 / FR-19: Validation for activity transfer. Destination must pass all checks first.
   */
  canTransferRegistration(registrationId: string, destinationActivityId: string): CanTransferResult {
    // 1. Source registration check
    const cancelCheck = this.canCancelRegistration(registrationId);
    if (!cancelCheck.allowed) {
      return { allowed: false, reason: cancelCheck.reason };
    }

    const reg = this.store.registrationsSnapshot.find((r) => r.id === registrationId)!;
    if (reg.activityId === destinationActivityId) {
      return { allowed: false, reason: 'Destination activity is identical to your current enrolled activity.' };
    }

    // 2. Destination activity checks
    const activities = this.store.activitiesSnapshot;
    const ngos = this.store.ngosSnapshot;
    const registrations = this.store.registrationsSnapshot;

    const destActivity = activities.find((a) => a.id === destinationActivityId);
    if (!destActivity) {
      return { allowed: false, reason: `Destination activity does not exist.` };
    }

    const destNgo = ngos.find((n) => n.id === destActivity.ngoId);
    if (!destNgo || destNgo.approvalStatus !== 'APPROVED') {
      return { allowed: false, reason: `Destination partner NGO is not approved for participation.` };
    }

    if (destActivity.publicationStatus !== 'PUBLISHED') {
      return {
        allowed: false,
        reason: `Destination activity is ${destActivity.publicationStatus.toLowerCase()} and cannot accept enrollments.`
      };
    }

    // Destination cut-off check
    const now = new Date();
    if (now > this.parseCutoff(destActivity.registrationCutoff)) {
      return {
        allowed: false,
        reason: `Cannot transfer: Registration for "${destActivity.title}" is closed (cut-off passed on ${this.formatDate(destActivity.registrationCutoff)}).`
      };
    }

    // Destination capacity check
    const activeCount = registrations.filter(
      (r) => r.activityId === destinationActivityId && r.status === 'ACTIVE'
    ).length;
    if (activeCount >= destActivity.capacity) {
      return {
        allowed: false,
        reason: `Cannot transfer: Destination activity "${destActivity.title}" has reached full capacity (${destActivity.capacity} places).`
      };
    }

    // Check if employee is already registered in destination
    const alreadyRegistered = registrations.some(
      (r) => r.employeeId === reg.employeeId && r.activityId === destinationActivityId && r.status === 'ACTIVE'
    );
    if (alreadyRegistered) {
      return {
        allowed: false,
        reason: `You already have an active registration for destination activity "${destActivity.title}".`
      };
    }

    // Check schedule overlap for destination
    const overlapping = this.getOverlappingActivities(reg.employeeId, destActivity, reg.activityId);

    return { allowed: true, overlappingActivities: overlapping };
  }

  /**
   * BR-10 / FR-19: Atomic transfer. Destination verified first; only then is old registration cancelled.
   */
  transferRegistration(
    registrationId: string,
    destinationActivityId: string,
    reason?: string
  ): Observable<{ oldRegistration: Registration; newRegistration: Registration }> {
    const check = this.canTransferRegistration(registrationId, destinationActivityId);
    if (!check.allowed) {
      throw new Error(check.reason);
    }

    const currentRegs = this.store.registrationsSnapshot;
    const oldIndex = currentRegs.findIndex((r) => r.id === registrationId);
    const oldReg = currentRegs[oldIndex];

    const activities = this.store.activitiesSnapshot;
    const oldActivity = activities.find((a) => a.id === oldReg.activityId);
    const destActivity = activities.find((a) => a.id === destinationActivityId)!;

    // 1. Cancel old registration
    const updatedOld: Registration = {
      ...oldReg,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
      cancellationReason: reason ?? `Transferred to ${destActivity.title}`
    };

    // 2. Create new registration for destination
    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      employeeId: oldReg.employeeId,
      activityId: destinationActivityId,
      status: 'ACTIVE',
      registeredAt: new Date().toISOString()
    };

    const nextRegs = [...currentRegs];
    nextRegs[oldIndex] = updatedOld;
    nextRegs.push(newReg);
    this.store.setRegistrations(nextRegs);

    // 3. Notify employee
    const transferNotif: Notification = {
      id: `notif-${Date.now()}`,
      recipientUserId: oldReg.employeeId,
      title: 'Registration Transfer Confirmed',
      message: `Your Service Day participation was transferred from '${oldActivity?.title || 'previous activity'}' to '${destActivity.title}'. 1 spot reserved.`,
      type: 'TRANSFER',
      createdAt: new Date().toISOString(),
      readAt: null,
      deliveryStatus: 'DELIVERED',
      activityId: destActivity.id,
      simulationLabel: 'Simulated in app'
    };
    this.store.setNotifications([...this.store.notificationsSnapshot, transferNotif]);

    return of({ oldRegistration: updatedOld, newRegistration: newReg });
  }
}
