'use strict';

const { anonymous } = require('./helpers');

/**
 * These guard a failure mode that is genuinely confusing to debug: the browser
 * reports "CORS error" with no status code, so a rejected origin looks like a
 * bug in the frontend rather than a mismatch in configuration.
 */
describe('CORS', () => {
  it('allows the configured client origin', async () => {
    const res = await anonymous().get('/api/health').set('Origin', 'http://localhost:5173');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('allows credentials so the session cookie is sent', async () => {
    const res = await anonymous().get('/api/health').set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('answers the preflight a JSON POST triggers', async () => {
    const res = await anonymous()
      .options('/api/auth/register')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it.each([
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
  ])('accepts the loopback origin %s outside production', async (origin) => {
    // Vite drifts to the next free port when 5173 is taken; a dev server on
    // 5174 must not be rejected.
    const res = await anonymous().get('/api/health').set('Origin', origin);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
  });

  it('rejects a non-loopback origin with 403 rather than 500', async () => {
    const res = await anonymous().get('/api/health').set('Origin', 'http://evil.example');

    expect(res.status).toBe(403);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects an origin that merely contains localhost', async () => {
    const res = await anonymous()
      .get('/api/health')
      .set('Origin', 'http://localhost.evil.example');

    expect(res.status).toBe(403);
  });

  it('still serves requests that carry no Origin at all', async () => {
    const res = await anonymous().get('/api/health');
    expect(res.status).toBe(200);
  });
});
