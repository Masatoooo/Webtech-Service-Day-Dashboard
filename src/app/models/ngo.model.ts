export type NGOApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface NGO {
  id: string;
  name: string;
  description: string;
  contactName: string;
  contactEmail: string;
  approvalStatus: NGOApprovalStatus;
  serviceArea?: string;
}
