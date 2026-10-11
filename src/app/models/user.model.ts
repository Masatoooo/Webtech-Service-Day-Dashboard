export type UserRole = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarInitials?: string;
}
