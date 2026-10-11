export type NotificationType =
  | 'REGISTRATION'
  | 'TRANSFER'
  | 'CANCELLATION'
  | 'REMINDER'
  | 'BROADCAST'
  | 'ACTIVITY_UPDATE'
  | 'SYSTEM';

export type DeliveryStatus = 'DELIVERED' | 'SIMULATED_PENDING';

export type SimulationStatus = 'PREVIEW' | 'SCHEDULED_DEMO' | 'SIMULATED' | 'FAILED';

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
  simulationLabel?: string; // e.g. "Simulated in app"
}

export interface ReminderRule {
  id: string;
  daysBefore: number;      // 7, 3, or 1
  name: string;
  description: string;
  enabled: boolean;
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface BroadcastPayload {
  subject: string;
  body: string;
  targetGroup: 'ALL_EMPLOYEES' | 'ACTIVITY_PARTICIPANTS';
  activityId?: string;
}

export interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetGroup: string;     // e.g. 'All Employees' or 'Participants of Mangrove Restoration'
  recipientCount: number;
  activityId?: string;
  activityTitle?: string;
  status: SimulationStatus;
  statusLabel: string;     // e.g. 'Simulated in app', 'Scheduled (demo)', 'Preview', 'Simulation Failed'
  createdAt: string;       // ISO 8601
}

