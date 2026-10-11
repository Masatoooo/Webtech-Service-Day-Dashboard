export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'CHECKED_IN';
export type CheckInMethod = 'QR_SCAN' | 'MANUAL_FALLBACK';

export interface Attendance {
  id: string;
  registrationId: string;    // Foreign key to Registration.id
  activityId: string;        // Foreign key to Activity.id
  employeeId: string;        // Foreign key to User.id
  checkedInAt: string;       // ISO 8601
  status: AttendanceStatus;
  verificationMethod: CheckInMethod;
  token: string;             // Opaque token for activity check-in (no PII)
}

export interface ActivityQrInfo {
  activityId: string;
  token: string;
  qrPayload: string;
  qrDataUrl?: string;
  generatedAt: string;
}

export interface CheckInValidationResult {
  allowed: boolean;
  reason?: string;
  activity?: import('./activity.model').Activity;
  registration?: import('./registration.model').Registration;
  existingAttendance?: Attendance;
}

export interface CheckInSuccessResult {
  attendance: Attendance;
  activity: import('./activity.model').Activity;
  registration: import('./registration.model').Registration;
  isDemoSimulation: true;
}
