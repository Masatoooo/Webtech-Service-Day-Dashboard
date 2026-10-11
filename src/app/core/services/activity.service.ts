import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import {
  Activity,
  ActivitySlotSummary,
  ActivityAvailabilityStatus,
  PublicationStatus,
  Registration
} from '../../models';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  constructor(private readonly store: DataStoreService) {}

  getActivities(): Observable<Activity[]> {
    return this.store.activities$;
  }

  /**
   * FR-06 / FR-08: Only published & approved activities are visible for employee catalog.
   */
  getPublishedActivities(): Observable<Activity[]> {
    return combineLatest([this.store.activities$, this.store.ngos$]).pipe(
      map(([activities, ngos]) => {
        const approvedNgoIds = new Set(
          ngos.filter((n) => n.approvalStatus === 'APPROVED').map((n) => n.id)
        );
        return activities.filter(
          (act) => act.publicationStatus === 'PUBLISHED' && approvedNgoIds.has(act.ngoId)
        );
      })
    );
  }

  /**
   * UC-02 / FR-08: Approved opportunities visible to employees (excluding internal drafts).
   */
  getEmployeeActivities(): Observable<Activity[]> {
    return combineLatest([this.store.activities$, this.store.ngos$]).pipe(
      map(([activities, ngos]) => {
        const approvedNgoIds = new Set(
          ngos.filter((n) => n.approvalStatus === 'APPROVED').map((n) => n.id)
        );
        return activities.filter(
          (act) => act.publicationStatus !== 'DRAFT' && approvedNgoIds.has(act.ngoId)
        );
      })
    );
  }

  getActivityById(id: string): Observable<Activity | undefined> {
    return this.store.activities$.pipe(
      map((list) => list.find((act) => act.id === id))
    );
  }

  createActivity(data: Omit<Activity, 'id'>): Observable<Activity> {
    const current = this.store.activitiesSnapshot;
    const newActivity: Activity = {
      ...data,
      id: `act-${Date.now()}`
    };
    this.store.setActivities([...current, newActivity]);
    return of(newActivity);
  }

  updateActivity(id: string, updates: Partial<Omit<Activity, 'id'>>): Observable<Activity> {
    const current = this.store.activitiesSnapshot;
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`[ActivityService] Activity with id "${id}" not found.`);
    }
    const updated: Activity = { ...current[index], ...updates };
    const nextList = [...current];
    nextList[index] = updated;
    this.store.setActivities(nextList);
    return of(updated);
  }

  canDeleteActivity(id: string): { allowed: boolean; reason?: string; activeCount: number } {
    const registrations = this.store.registrationsSnapshot;
    const activeCount = registrations.filter(
      (r) => r.activityId === id && r.status === 'ACTIVE'
    ).length;
    if (activeCount > 0) {
      return {
        allowed: false,
        reason: `Activity has ${activeCount} active registration(s). To preserve records and prevent orphaned enrollments, cancel or deactivate the activity instead of deleting.`,
        activeCount
      };
    }
    return { allowed: true, activeCount: 0 };
  }

  changePublicationStatus(id: string, status: PublicationStatus): Observable<Activity> {
    return this.updateActivity(id, { publicationStatus: status });
  }

  deleteActivity(id: string, force = false): Observable<boolean> {
    const check = this.canDeleteActivity(id);
    if (!check.allowed && !force) {
      throw new Error(check.reason);
    }
    const current = this.store.activitiesSnapshot;
    const filtered = current.filter((a) => a.id !== id);
    if (filtered.length === current.length) {
      return of(false);
    }
    this.store.setActivities(filtered);
    return of(true);
  }

  /**
   * BR-02 / BR-03 / FR-22: Slot calculations derived from active registrations.
   * Slot terisi = jumlah pendaftaran aktif.
   * Sisa slot = kapasitas - slot terisi (min 0).
   * Utilisasi % = (slot terisi / kapasitas) * 100%.
   */
  computeSlotSummary(activity: Activity, allRegistrations: Registration[]): ActivitySlotSummary {
    const activeRegistrations = allRegistrations.filter(
      (reg) => reg.activityId === activity.id && reg.status === 'ACTIVE'
    );
    const filledSlots = activeRegistrations.length;
    const remainingSlots = Math.max(0, activity.capacity - filledSlots);
    const utilisationPercentage =
      activity.capacity > 0
        ? Math.min(100, Math.round((filledSlots / activity.capacity) * 100))
        : 0;

    let availabilityStatus: ActivityAvailabilityStatus = 'AVAILABLE';
    const now = new Date();
    const cutoffDate = new Date(activity.registrationCutoff);

    if (activity.publicationStatus === 'CANCELLED') {
      availabilityStatus = 'CANCELLED';
    } else if (activity.publicationStatus === 'COMPLETED') {
      availabilityStatus = 'COMPLETED';
    } else if (now > cutoffDate) {
      availabilityStatus = 'REGISTRATION_CLOSED';
    } else if (remainingSlots === 0) {
      availabilityStatus = 'FULL';
    } else if (remainingSlots <= 3) {
      availabilityStatus = 'ALMOST_FULL';
    } else {
      availabilityStatus = 'AVAILABLE';
    }

    return {
      activityId: activity.id,
      capacity: activity.capacity,
      filledSlots,
      remainingSlots,
      utilisationPercentage,
      availabilityStatus
    };
  }

  /**
   * Reactively combines activities with live registrations to produce slot summaries.
   */
  getActivitySlotSummary(activityId: string): Observable<ActivitySlotSummary | undefined> {
    return combineLatest([this.store.activities$, this.store.registrations$]).pipe(
      map(([activities, registrations]) => {
        const activity = activities.find((a) => a.id === activityId);
        if (!activity) {
          return undefined;
        }
        return this.computeSlotSummary(activity, registrations);
      })
    );
  }

  isCutoffPassed(activity: Activity): boolean {
    return new Date() > new Date(activity.registrationCutoff);
  }
}
