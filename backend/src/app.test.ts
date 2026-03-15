import request from 'supertest';
import app from './app';

describe('app routes', () => {
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
});
