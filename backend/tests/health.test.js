import request from 'supertest';
import app from '../app.js';

// Simple health endpoint smoke test to ensure middleware stack initializes.
// No DB dependency required because route responds before any model usage.

describe('Health endpoint', () => {
  test('GET /health returns status and security headers', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('time');
    // Helmet should set some common security headers
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('x-content-type-options');
  });
});
