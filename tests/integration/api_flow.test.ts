import request from 'supertest';
import { createApp } from '../../backend/src/app/app';

describe('Integration Tests: Core Endpoints (Rule 11 & 21)', () => {
  const app = createApp();

  describe('Health & Readiness Endpoints (Rule 21)', () => {
    it('GET /health returns status ok with code 200 without authentication', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('GET /ready returns database connectivity check', async () => {
      const res = await request(app).get('/ready');
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('status');
    });
  });

  describe('Authentication Flow & Input Validation', () => {
    it('POST /api/v1/auth/login with missing payload returns 422 Validation Error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/register with invalid email returns 422', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'validuser',
          email: 'not-an-email',
          password: 'Password123!',
          full_name: 'Test Person',
        });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Non-Existent Route 404 Handling', () => {
    it('GET /api/v1/nonexistent returns 404 NOT_FOUND', async () => {
      const res = await request(app).get('/api/v1/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
