import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';

/**
 * Contract test: verifies standard success envelope shape for key endpoints.
 * Guards against regressions where user/token might appear at root instead of data.*
 */

describe('Standard success envelope shape', () => {
  let mongoServer; let token; const phone = '+19997776666';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test('OTP verify returns token & user under data.*', async () => {
  const reqRes = await request(app).post('/api/v1/auth/otp/request').send({ phone }).expect(200);
  const otp = reqRes.body.otp; // test env only
  const verify = await request(app).post('/api/v1/auth/otp/verify').send({ phone, otp }).expect(200);
  expect(verify.body.success).toBe(true);
  expect(verify.body).toHaveProperty('data.token');
  expect(verify.body).toHaveProperty('data.user');
  expect(verify.body.token).toBeUndefined();
  expect(verify.body.user).toBeUndefined();
  token = verify.body.data.token;
  });

  test('GET /api/v1/auth/me returns user under data.user only', async () => {
    const me = await request(app).get('/api/v1/auth/me').set('Authorization','Bearer '+token).expect(200);
    expect(me.body.success).toBe(true);
    expect(me.body).toHaveProperty('data.user');
    expect(me.body.user).toBeUndefined(); // No legacy root user
  });

  test('PATCH /api/v1/auth/me returns user under data.user only', async () => {
    const patch = await request(app).patch('/api/v1/auth/me').set('Authorization','Bearer '+token).send({ name: 'ContractUser' }).expect(200);
    expect(patch.body.success).toBe(true);
    expect(patch.body).toHaveProperty('data.user');
    expect(patch.body.data.user.name).toBe('ContractUser');
    expect(patch.body.user).toBeUndefined();
  });
});
