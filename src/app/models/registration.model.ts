export type RegistrationStatus = 'ACTIVE' | 'CANCELLED';

export interface Registration {
  id: string;
  employeeId: string; // Foreign key to User.id (Role: EMPLOYEE)
  activityId: string; // Foreign key to Activity.id
  status: RegistrationStatus;
  registeredAt: string; // ISO 8601
  updatedAt?: string;   // ISO 8601
  cancellationReason?: string;
}
