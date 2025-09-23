import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';

// This test ensures standardized success envelope fields exist across core endpoints.
// We sample a few endpoints (health, auth OTP request, predictions list after auth flow)
// to guard against accidental regression in middleware/controller responses.

describe('Success envelope consistency', () => {
  // Use unique phones to avoid min resend interval conflicts
  const basePhone = '+19995550';
  let seq = 1200;
  function nextPhone() { seq += 1; return basePhone + String(seq).padStart(3,'0'); }
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

  test('health endpoint includes requestId & timestamp', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('requestId');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('time'); // legacy
  });

  test('OTP request returns standardized envelope', async () => {
    const p = nextPhone();
    const res = await request(app).post('/api/auth/otp/request').send({ phone: p }).expect(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('requestId');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('OTP verify (invalid code) returns standardized error envelope', async () => {
    const p = nextPhone();
    await request(app).post('/api/auth/otp/request').send({ phone: p }).expect(200);
    const verifyAttempt = await request(app).post('/api/auth/otp/verify').send({ phone: p, otp: '0000' }).expect(400);
    expect(verifyAttempt.body).toHaveProperty('success', false);
    expect(verifyAttempt.body).toHaveProperty('requestId');
    expect(verifyAttempt.body).toHaveProperty('timestamp');
  });
});
