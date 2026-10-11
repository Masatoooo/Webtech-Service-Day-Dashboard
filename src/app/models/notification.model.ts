export type NotificationType =
  | 'REGISTRATION'
  | 'REMINDER'
  | 'CANCELLATION'
  | 'BROADCAST'
  | 'SYSTEM';

export type DeliveryStatus = 'DELIVERED' | 'SIMULATED_PENDING';

export interface Notification {
  id: string;
  recipientUserId: string; // User.id or 'ALL' for broadcasts
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;       // ISO 8601
  readAt: string | null;   // ISO 8601 when read, null when unread
  deliveryStatus: DeliveryStatus;
  activityId?: string;     // Optional reference to Activity.id
}
