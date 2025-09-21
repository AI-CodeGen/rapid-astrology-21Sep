/**
 * Basic integration tests for numerology endpoints & pagination.
 * Uses supertest against the running Express app module (app exports the express instance).
 * NOTE: For a production grade test suite we'd spin up an in-memory MongoDB (mongodb-memory-server)
 * but here we assume a test database connection string or the same dev DB.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../src/models/User.js';
import { signToken } from '../src/services/jwt.service.js';

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

describe('Numerology & Predictions API', () => {
  let serverToken;
  let mongoServer;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret';
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect();
    await mongoose.connect(uri);
    const user = await User.create({ phone: '+10000000001' });
    serverToken = signToken({ uid: user._id, roles: user.roles || ['user'] });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  });

  test('POST /api/predictions/numerology/name-number returns prediction with result.number', async () => {
    const res = await request(app)
      .post('/api/predictions/numerology/name-number')
      .set(authHeader(serverToken))
      .send({ name: 'Alice' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prediction');
    expect(res.body.prediction).toHaveProperty('result');
    expect(res.body.prediction.result).toHaveProperty('number');
  });

  test('POST /api/predictions/numerology/destiny-match returns prediction with compatibility score', async () => {
    const res = await request(app)
      .post('/api/predictions/numerology/destiny-match')
      .set(authHeader(serverToken))
      .send({ firstName: 'Alice', secondName: 'Bob' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prediction');
  expect(res.body.prediction.result).toHaveProperty('compatibility');
  });

  test('GET /api/predictions paginated list works', async () => {
    const res = await request(app)
      .get('/api/predictions?page=1&limit=5')
      .set(authHeader(serverToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.predictions)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('total');
  });
});
