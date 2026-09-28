import request from 'supertest';
import { createApp } from '../../backend/src/app/app';
import { generateToken } from '../../backend/src/utils/jwt';

describe('Security & RBAC Access Control Tests (Rule 29)', () => {
  const app = createApp();

  const visitorToken = generateToken({
    userId: '55555555-5555-5555-5555-555555555555',
    email: 'visitor@dogfood.local',
    role: 'VISITOR',
    username: 'visitor',
  });

  const participantToken = generateToken({
    userId: '44444444-4444-4444-4444-444444444441',
    email: 'alice@dogfood.local',
    role: 'PARTICIPANT',
    username: 'alice',
  });

  const judgeToken = generateToken({
    userId: '33333333-3333-3333-3333-333333333331',
    email: 'judge1@dogfood.local',
    role: 'JUDGE',
    username: 'judge1',
  });

  describe('Unauthenticated & Visitor Access Restrictions', () => {
    it('Anonymous user accessing protected Organizer API must receive 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/events/all');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('Visitor accessing Organizer API must receive 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/events/all')
        .set('Authorization', `Bearer ${visitorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Visitor attempting to create a team must receive 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/teams')
        .set('Authorization', `Bearer ${visitorToken}`)
        .send({
          event_id: 'e0000000-0000-0000-0000-000000000001',
          name: 'Unauthorized Visitor Team',
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Participant Access Restrictions', () => {
    it('Participant accessing Judge API must receive 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/judges/assignments')
        .set('Authorization', `Bearer ${participantToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Participant attempting to submit a score must receive 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/scores/submission/s0000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          criterion_id: 'c0000000-0000-0000-0000-000000000001',
          points: 20,
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Participant attempting to assign judges must receive 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/judges/assign')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          event_id: 'e0000000-0000-0000-0000-000000000001',
          judge_id: '33333333-3333-3333-3333-333333333331',
          submission_id: 's0000000-0000-0000-0000-000000000001',
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Role Administration Security', () => {
    it('Judge attempting to promote another user must receive 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/v1/users/44444444-4444-4444-4444-444444444441/role')
        .set('Authorization', `Bearer ${judgeToken}`)
        .send({ role: 'ADMIN' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Participant attempting to inspect audit logs must receive 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit')
        .set('Authorization', `Bearer ${participantToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
