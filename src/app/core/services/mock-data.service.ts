import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  NGO,
  Activity,
  User,
  Registration,
  Notification,
  Attendance
} from '../../models';

export interface SeedDataBundle {
  ngos: NGO[];
  activities: Activity[];
  users: User[];
  registrations: Registration[];
  notifications: Notification[];
  attendance: Attendance[];
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private readonly baseUrl = 'assets/data';

  constructor(private readonly http: HttpClient) {}

  loadNGOs(): Observable<NGO[]> {
    return this.http
      .get<NGO[]>(`${this.baseUrl}/ngos.json`)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(`[MockDataService] Failed to load NGOs seed data: ${error.message || error}`))
        )
      );
  }

  loadActivities(): Observable<Activity[]> {
    return this.http
      .get<Activity[]>(`${this.baseUrl}/activities.json`)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(`[MockDataService] Failed to load Activities seed data: ${error.message || error}`))
        )
      );
  }

  loadUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.baseUrl}/users.json`)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(`[MockDataService] Failed to load Users seed data: ${error.message || error}`))
        )
      );
  }

  loadRegistrations(): Observable<Registration[]> {
    return this.http
      .get<Registration[]>(`${this.baseUrl}/registrations.json`)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(`[MockDataService] Failed to load Registrations seed data: ${error.message || error}`))
        )
      );
  }

  loadNotifications(): Observable<Notification[]> {
    return this.http
      .get<Notification[]>(`${this.baseUrl}/notifications.json`)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(`[MockDataService] Failed to load Notifications seed data: ${error.message || error}`))
        )
      );
  }

  loadAttendance(): Observable<Attendance[]> {
    return this.http
      .get<Attendance[]>(`${this.baseUrl}/attendance.json`)
      .pipe(
        catchError((error) =>
          throwError(() => new Error(`[MockDataService] Failed to load Attendance seed data: ${error.message || error}`))
        )
      );
  }

  /**
   * Loads all six mock JSON seed datasets concurrently via forkJoin.
   */
  loadAllSeedData(): Observable<SeedDataBundle> {
    return forkJoin({
      ngos: this.loadNGOs(),
      activities: this.loadActivities(),
      users: this.loadUsers(),
      registrations: this.loadRegistrations(),
      notifications: this.loadNotifications(),
      attendance: this.loadAttendance()
    }).pipe(
      catchError((error) =>
        throwError(() => new Error(`[MockDataService] Failed to load complete seed bundle: ${error.message || error}`))
      )
    );
  }
}
