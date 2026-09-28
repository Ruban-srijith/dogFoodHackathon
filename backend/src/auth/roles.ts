import { UserRole } from '../models';

export const RoleRank: Record<UserRole, number> = {
  VISITOR: 10,
  PARTICIPANT: 20,
  JUDGE: 30,
  ORGANIZER: 40,
  ADMIN: 50,
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return RoleRank[userRole] >= RoleRank[requiredRole];
};

export const isOneOf = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};
