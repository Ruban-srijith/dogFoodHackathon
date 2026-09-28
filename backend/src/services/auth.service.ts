import { userRepository } from '../repositories/user.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken, TokenPayload } from '../utils/jwt';
import { BadRequestError, UnauthorizedError, ConflictError } from '../utils/errors';
import { auditService } from './audit.service';
import { SafeUser, UserRole } from '../models';

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export class AuthService {
  async register(data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role?: UserRole;
    bio?: string | null;
    avatar_url?: string | null;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthResult> {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('A user with this email address already exists');
    }

    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictError('A user with this username already exists');
    }

    // Default role is PARTICIPANT if not specified or unless specifically assigned
    const assignedRole = data.role || 'PARTICIPANT';
    const passwordHash = await hashPassword(data.password);

    const user = await userRepository.create({
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      role: assignedRole,
      full_name: data.full_name,
      bio: data.bio,
      avatar_url: data.avatar_url,
    });

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    const token = generateToken(payload);

    await auditService.log({
      user_id: user.id,
      action: 'USER_CREATED',
      entity_type: 'user',
      entity_id: user.id,
      details: { username: user.username, role: user.role },
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });

    return { user, token };
  }

  async login(data: {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuthResult> {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await comparePassword(data.password, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    const token = generateToken(payload);

    await auditService.log({
      user_id: user.id,
      action: 'LOGIN',
      entity_type: 'user',
      entity_id: user.id,
      details: { email: user.email, role: user.role },
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await auditService.log({
      user_id: userId,
      action: 'LOGOUT',
      entity_type: 'user',
      entity_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await userRepository.findSafeById(userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }
    return user;
  }
}

export const authService = new AuthService();
