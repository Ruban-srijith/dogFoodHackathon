import { registerSchema, loginSchema, createEventSchema } from '../../backend/src/schemas';
import { hashPassword, comparePassword } from '../../backend/src/utils/password';
import { generateToken, verifyToken } from '../../backend/src/utils/jwt';

describe('Unit Tests: Validation & Security Primitives', () => {
  describe('Password Hashing & Verification', () => {
    it('should hash passwords and verify correctly', async () => {
      const password = 'StrongPassword123!';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(hash).not.toEqual(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongPassword!', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Generation & Verification', () => {
    it('should sign and verify valid payload', () => {
      const payload = {
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'test@dogfood.local',
        role: 'PARTICIPANT' as const,
        username: 'testuser',
      };

      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });

  describe('Zod Schema Validations', () => {
    it('should validate valid user registration payload', async () => {
      const validData = {
        body: {
          username: 'valid_user',
          email: 'valid@example.com',
          password: 'SecretPassword123!',
          full_name: 'Valid User',
          role: 'PARTICIPANT',
        },
      };
      await expect(registerSchema.parseAsync(validData)).resolves.toBeDefined();
    });

    it('should reject invalid username characters', async () => {
      const invalidData = {
        body: {
          username: 'invalid user with spaces!',
          email: 'valid@example.com',
          password: 'SecretPassword123!',
          full_name: 'Valid User',
        },
      };
      await expect(registerSchema.parseAsync(invalidData)).rejects.toThrow();
    });

    it('should reject invalid event dates (end date before start date)', async () => {
      const invalidDates = {
        body: {
          title: 'Invalid Date Hackathon',
          slug: 'invalid-dates',
          description: 'Testing end date before start date',
          start_date: '2026-10-10T00:00:00Z',
          end_date: '2026-10-05T00:00:00Z',
          submission_deadline: '2026-10-04T00:00:00Z',
        },
      };
      await expect(createEventSchema.parseAsync(invalidDates)).rejects.toThrow();
    });
  });
});
