import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Notification } from '../../models';
import { DataStoreService } from './data-store.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private readonly store: DataStoreService) {}

  getNotifications(): Observable<Notification[]> {
    return this.store.notifications$;
  }

  /**
   * Retrieves notifications intended for a specific user, plus all system-wide broadcasts ('ALL').
   */
  getNotificationsForUser(userId: string): Observable<Notification[]> {
    return this.store.notifications$.pipe(
      map((list) =>
        list
          .filter((n) => n.recipientUserId === userId || n.recipientUserId === 'ALL')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    );
  }

  getUnreadCountForUser(userId: string): Observable<number> {
    return this.getNotificationsForUser(userId).pipe(
      map((list) => list.filter((n) => n.readAt === null).length)
    );
  }

  markAsRead(notificationId: string): Observable<Notification> {
    const current = this.store.notificationsSnapshot;
    const index = current.findIndex((n) => n.id === notificationId);
    if (index === -1) {
      throw new Error(`[NotificationService] Notification "${notificationId}" not found.`);
    }

    const updated: Notification = {
      ...current[index],
      readAt: new Date().toISOString()
    };

    const nextList = [...current];
    nextList[index] = updated;
    this.store.setNotifications(nextList);
    return of(updated);
  }

  createNotification(data: Omit<Notification, 'id' | 'createdAt'>): Observable<Notification> {
    const current = this.store.notificationsSnapshot;
    const newNotif: Notification = {
      ...data,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    this.store.setNotifications([newNotif, ...current]);
    return of(newNotif);
  }
}
