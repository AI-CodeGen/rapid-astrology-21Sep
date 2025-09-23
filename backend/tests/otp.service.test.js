import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { generateAndStoreOTP, verifyOTP } from '../src/services/otp.service.js';
import User from '../src/models/User.js';

// Force test env behavior
process.env.NODE_ENV = 'test';

describe('OTP service logic', () => {
  let mongoServer;
  const phone = '+15550001111';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test('generates OTP with test leakage and verifies', async () => {
    const res1 = await generateAndStoreOTP({ phone });
    expect(res1.success).toBe(true);
    expect(res1).toHaveProperty('otp');
    const verify = await verifyOTP({ phone, otp: res1.otp });
    expect(verify.valid).toBe(true);
  });

  test('resend too soon triggers throttle', async () => {
    const first = await generateAndStoreOTP({ phone: '+15550002222' });
    expect(first.success).toBe(true);
    const second = await generateAndStoreOTP({ phone: '+15550002222' });
    expect(second.success).toBe(false);
    expect(second.reason).toBe('resend_too_soon');
  });

  test('lock after excessive attempts in retry window', async () => {
    const phoneX = '+15550003333';
    const r = await generateAndStoreOTP({ phone: phoneX });
    const wrong = '000000';
    for (let i = 0; i < 6; i++) { // 6 attempts > threshold 5
      const v = await verifyOTP({ phone: phoneX, otp: wrong });
      if (i < 5) expect(v.valid).toBe(false);
      if (i === 5) expect(v.reason).toBe('locked');
    }
  });
});
