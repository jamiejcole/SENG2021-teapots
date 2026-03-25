import request from 'supertest';
import app from '../src/app';

describe('app routes', () => {
  const originalApiKey = process.env.BACKEND_API_KEY;

  beforeEach(() => {
    process.env.BACKEND_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    process.env.BACKEND_API_KEY = originalApiKey;
  });

  it('GET /api/v1/health returns service health payload', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'ubl-invoice-generator',
        version: '1.0.0',
      }),
    );
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('returns 404 JSON for unknown routes', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: 'NOT_FOUND',
      message: 'Route not found',
    });
  });

  it('POST /api/v1/orders/validate requires x-api-key', async () => {
    const response = await request(app)
      .post('/api/v1/orders/validate')
      .send({ orderXml: '<Order></Order>' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'UNAUTHORIZED',
      message: 'Invalid or missing API key',
    });
  });

  it('POST /api/v1/orders/validate reaches controller with valid x-api-key', async () => {
    const response = await request(app)
      .post('/api/v1/orders/validate')
      .set('x-api-key', 'test-api-key')
      .send({ orderXml: 'not-xml' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });
});
