import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../src/models/User.js';

// NOTE: Simple integration style test using the running app instance.
// Assumes a test database (set MONGO_URI to a throwaway DB when running jest).

describe('Auth & Profile email persistence', () => {
  let phone = '+19995550000';
  let token;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test('OTP request, verify, and email update persists', async () => {
    // Request OTP (test env returns OTP inline)
    const reqRes = await request(app).post('/api/auth/otp/request').send({ phone }).expect(200);
    expect(reqRes.body).toHaveProperty('otp');
    const otp = reqRes.body.otp;

    // Verify OTP
    const verifyRes = await request(app).post('/api/auth/otp/verify').send({ phone, otp }).expect(200);
    expect(verifyRes.body).toHaveProperty('token');
    token = verifyRes.body.token;

    // Update email
    const newEmail = 'user@test.dev';
    const patchRes = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', 'Bearer ' + token)
      .send({ email: newEmail })
      .expect(200);
    expect(patchRes.body.user.email).toBe(newEmail);

    // Fetch profile
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
    expect(meRes.body.user.email).toBe(newEmail);
  });
});
