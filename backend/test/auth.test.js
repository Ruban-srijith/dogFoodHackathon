const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const bcrypt = require('bcryptjs');

// Set NODE_ENV to test to prevent auto-connect loop
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-12345';

const app = require('../src/server');
const { generateToken, authenticate, requireRole } = require('../src/auth');
const { User } = require('../src/models');

test('Authentication & Role-Based Authorization Suite', async (t) => {

  // Test Tokens for each role
  const participantUser = { id: 'u_participant_1', email: 'alice@dogfood.local', username: 'alice', role: 'PARTICIPANT' };
  const judgeUser = { id: 'u_judge_1', email: 'judge1@dogfood.local', username: 'judge1', role: 'JUDGE' };
  const organizerUser = { id: 'u_organizer_1', email: 'organizer@dogfood.local', username: 'organizer', role: 'ORGANIZER' };
  const adminUser = { id: 'u_admin_1', email: 'admin@dogfood.local', username: 'admin', role: 'ADMIN' };

  const participantToken = generateToken(participantUser);
  const judgeToken = generateToken(judgeUser);
  const organizerToken = generateToken(organizerUser);
  const adminToken = generateToken(adminUser);

  // ==========================================
  // 1. PUBLIC ROUTES
  // ==========================================
  await t.test('GET /api/health should return 200 without authentication', async () => {
    // Health endpoint returns 503 or 200 depending on db status
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  // ==========================================
  // 2. LOGOUT
  // ==========================================
  await t.test('POST /api/auth/logout should return 200 and clear cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Logged out successfully');
  });

  // ==========================================
  // 3. AUTHENTICATION (401 CASES)
  // ==========================================
  await t.test('GET /api/auth/me should return 401 when no token provided', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  await t.test('GET /api/auth/me should return 401 when malformed token provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.payload');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, 'Unauthorized');
  });

  await t.test('GET /api/auth/me should return 200 when valid Bearer token provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${participantToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, participantUser.email);
    assert.strictEqual(res.body.user.role, 'PARTICIPANT');
  });

  await t.test('GET /api/auth/me should return 200 when valid cookie token provided', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`token=${adminToken}`]);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'ADMIN');
  });

  // ==========================================
  // 4. ROLE ENFORCEMENT: 401 IF NOT LOGGED IN
  // ==========================================
  await t.test('Role routes return 401 if unauthenticated', async () => {
    const routes = [
      '/api/participant/dashboard',
      '/api/judge/evaluations',
      '/api/organizer/events',
      '/api/admin/system'
    ];

    for (const route of routes) {
      const res = await request(app).get(route);
      assert.strictEqual(res.status, 401, `Expected 401 for unauthenticated ${route}, got ${res.status}`);
      assert.strictEqual(res.body.error, 'Unauthorized');
    }
  });

  // ==========================================
  // 5. ROLE ENFORCEMENT: 403 IF WRONG ROLE
  // ==========================================
  await t.test('Participant receives 403 on judge, organizer, and admin routes', async () => {
    // Participant -> Judge route (Forbidden)
    let res = await request(app)
      .get('/api/judge/evaluations')
      .set('Authorization', `Bearer ${participantToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');

    // Participant -> Organizer route (Forbidden)
    res = await request(app)
      .get('/api/organizer/events')
      .set('Authorization', `Bearer ${participantToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');

    // Participant -> Admin route (Forbidden)
    res = await request(app)
      .get('/api/admin/system')
      .set('Authorization', `Bearer ${participantToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');
  });

  await t.test('Judge receives 403 on organizer and admin routes', async () => {
    // Judge -> Organizer route (Forbidden)
    let res = await request(app)
      .get('/api/organizer/events')
      .set('Authorization', `Bearer ${judgeToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');

    // Judge -> Admin route (Forbidden)
    res = await request(app)
      .get('/api/admin/system')
      .set('Authorization', `Bearer ${judgeToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');
  });

  await t.test('Organizer receives 403 on judge and admin routes', async () => {
    // Organizer -> Judge route (Forbidden)
    let res = await request(app)
      .get('/api/judge/evaluations')
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');

    // Organizer -> Admin route (Forbidden)
    res = await request(app)
      .get('/api/admin/system')
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'Forbidden');
  });

  // ==========================================
  // 6. ROLE ENFORCEMENT: 200 IF MATCHING ROLE
  // ==========================================
  await t.test('Matching roles receive 200 OK', async () => {
    // Participant -> Participant route
    let res = await request(app)
      .get('/api/participant/dashboard')
      .set('Authorization', `Bearer ${participantToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Welcome to Participant Dashboard');

    // Judge -> Judge route
    res = await request(app)
      .get('/api/judge/evaluations')
      .set('Authorization', `Bearer ${judgeToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Welcome to Judge Evaluations Portal');

    // Organizer -> Organizer route
    res = await request(app)
      .get('/api/organizer/events')
      .set('Authorization', `Bearer ${organizerToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Welcome to Organizer Event Management');

    // Admin -> Admin route
    res = await request(app)
      .get('/api/admin/system')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Welcome to Root Admin System Control');
  });

  // ==========================================
  // 7. REGISTRATION VALIDATION (400 CASES)
  // ==========================================
  await t.test('POST /api/auth/register should return 400 when required fields missing', async () => {
    let res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@dogfood.local' }); // missing password and username
    assert.strictEqual(res.status, 400);

    res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@dogfood.local', username: 'testuser', password: 'pwd', role: 'INVALID_ROLE' });
    assert.strictEqual(res.status, 400);
    assert.match(res.body.message, /Invalid role/);
  });

  // ==========================================
  // 8. LOGIN VALIDATION & FLOW (400, 401 CASES)
  // ==========================================
  await t.test('POST /api/auth/login should return 400 when email or password missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dogfood.local' }); // missing password
    assert.strictEqual(res.status, 400);
  });

  await t.test('POST /api/auth/login with mocked database checks', async () => {
    const originalFindOne = User.findOne;

    try {
      // Mock 1: User not found
      User.findOne = async () => null;
      let res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@dogfood.local', password: 'Password123!' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Unauthorized');

      // Mock 2: Invalid password
      const hashed = await bcrypt.hash('CorrectPassword123!', 10);
      User.findOne = async () => ({
        _id: 'u_test_1',
        email: 'test@dogfood.local',
        username: 'test',
        password_hash: hashed,
        role: 'PARTICIPANT',
        full_name: 'Test User'
      });

      res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@dogfood.local', password: 'WrongPassword!' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error, 'Unauthorized');

      // Mock 3: Valid credentials
      res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@dogfood.local', password: 'CorrectPassword123!' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.message, 'Logged in successfully');
      assert.ok(res.body.token, 'Token should be returned');
      assert.strictEqual(res.body.user.role, 'PARTICIPANT');

    } finally {
      User.findOne = originalFindOne;
    }
  });

  await t.test('POST /api/auth/register with mocked database checks', async () => {
    const originalFindOne = User.findOne;
    const originalCreate = User.create;

    try {
      // Mock existing user (Duplicate check)
      User.findOne = async () => ({ email: 'existing@dogfood.local' });
      let res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@dogfood.local', username: 'existing', password: 'Password123!' });
      assert.strictEqual(res.status, 400);
      assert.match(res.body.message, /already exists/);

      // Mock successful creation
      User.findOne = async () => null;
      User.create = async (doc) => ({
        _id: 'u_new_user',
        ...doc
      });

      res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@dogfood.local',
          username: 'newuser',
          password: 'NewUserPassword123!',
          role: 'PARTICIPANT',
          full_name: 'New Participant'
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.message, 'User registered successfully');
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.role, 'PARTICIPANT');

    } finally {
      User.findOne = originalFindOne;
      User.create = originalCreate;
    }
  });

});
