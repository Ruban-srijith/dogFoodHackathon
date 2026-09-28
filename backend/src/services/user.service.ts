import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';
import { auditService } from './audit.service';
import { SafeUser, UserRole } from '../models';

export class UserService {
  async listUsers(role?: UserRole): Promise<SafeUser[]> {
    return await userRepository.listAll(role);
  }

  async getUserById(id: string): Promise<SafeUser> {
    const user = await userRepository.findSafeById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUserRole(id: string, role: UserRole, adminUserId: string): Promise<SafeUser> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    const updated = await userRepository.updateRole(id, role);
    if (!updated) {
      throw new NotFoundError('Failed to update user role');
    }

    await auditService.log({
      user_id: adminUserId,
      action: 'USER_ROLE_UPDATED',
      entity_type: 'user',
      entity_id: id,
      details: { previousRole: existing.role, newRole: role },
    });

    return updated;
  }
}

export const userService = new UserService();
