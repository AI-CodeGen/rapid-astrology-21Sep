import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';

/**
 * End-to-end style integration test exercising:
 *  - OTP request & verify
 *  - PATCH /api/v1/auth/me with full structured userBasicDetails (dob, time, place with coordinates)
 *  - GET /api/v1/auth/me persistence round-trip
 *  - Asserts presence of virtuals (timeString/placeString) and coordinate fields
 */

describe('Profile basicDetails full coordinate round-trip', () => {
  let mongoServer; let token; const phone = '+19998887777';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.disconnect();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test('PATCH /api/v1/auth/me persists full place object & returns coordinates + virtuals', async () => {
    // 1. Request OTP
  const reqRes = await request(app).post('/api/v1/auth/otp/request').send({ phone }).expect(200);
    expect(reqRes.body).toHaveProperty('otp');
    const otp = reqRes.body.otp;

    // 2. Verify OTP -> token
  const verifyRes = await request(app).post('/api/v1/auth/otp/verify').send({ phone, otp }).expect(200);
  expect(verifyRes.body).toHaveProperty(['data','token']);
  token = verifyRes.body.data.token;

    // 3. Patch with full basic details
    const payload = {
      userBasicDetails: {
        dob: '1995-04-23',
        time: { hour: 6, minute: 15, second: 9 },
        place: {
          name: 'Sample City',
          district: 'Sample District',
            state: 'Sample State',
            country: 'Sample Country',
            latitude: 11.2233,
            longitude: 77.8899
        }
      }
    };
    const patchRes = await request(app)
  .patch('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + token)
      .send(payload)
      .expect(200);

  const user = patchRes.body.data.user;
    expect(user).toBeDefined();
    expect(user.userBasicDetails).toBeDefined();
    const bd = user.userBasicDetails;
    expect(bd.place).toBeDefined();
    expect(bd.place.latitude).toBe(11.2233);
    expect(bd.place.longitude).toBe(77.8899);
    // Virtuals
    expect(bd.timeString).toBe('06:15:09');
    expect(typeof bd.placeString).toBe('string');
    expect(bd.placeString).toMatch(/Sample City/);

    // 4. GET round-trip
    const meRes = await request(app)
  .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);
  const user2 = meRes.body.data.user;
    const bd2 = user2.userBasicDetails;
    expect(bd2.place.latitude).toBe(11.2233);
    expect(bd2.place.longitude).toBe(77.8899);
    expect(bd2.timeString).toBe('06:15:09');
    expect(bd2.placeString).toMatch(/Sample City/);
  });
});
