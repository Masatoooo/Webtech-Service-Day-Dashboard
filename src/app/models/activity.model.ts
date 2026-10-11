export type ServiceType =
  | 'ENVIRONMENT'
  | 'EDUCATION'
  | 'FOOD_SECURITY'
  | 'COMMUNITY'
  | 'HEALTH';

export type PublicationStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'CANCELLED'
  | 'COMPLETED';

export type ActivityAvailabilityStatus =
  | 'AVAILABLE'
  | 'ALMOST_FULL'
  | 'FULL'
  | 'REGISTRATION_CLOSED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Activity {
  id: string;
  ngoId: string;
  title: string;
  description: string;
  serviceType: ServiceType;
  location: string;
  startDateTime: string; // ISO 8601 (e.g. "2026-11-14T08:30:00")
  endDateTime: string;   // ISO 8601 (e.g. "2026-11-14T14:30:00")
  registrationCutoff: string; // ISO 8601 (e.g. "2026-11-11T23:59:59")
  capacity: number;
  publicationStatus: PublicationStatus;
}

export interface ActivitySlotSummary {
  activityId: string;
  capacity: number;
  filledSlots: number;
  remainingSlots: number;
  utilisationPercentage: number;
  availabilityStatus: ActivityAvailabilityStatus;
}
