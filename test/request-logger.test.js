import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { logger } from '../src/lib/logger.js';
import { requestLogger } from '../src/middleware/request-logger.js';
import { RosterService } from '../src/service/roster.service.js';

let logs;

beforeEach(() => {
  logs = [];
  for (const level of ['info', 'warn', 'error']) {
    jest.spyOn(console, level).mockImplementation((line) => logs.push(JSON.parse(line)));
  }
});

afterEach(() => jest.restoreAllMocks());

it('logs a completed request once with duration and a server-generated request ID', async () => {
  const response = await request(app).get('/api/health')
    .set('X-Request-ID', 'untrusted-client-id');

  expect(response.status).toBe(200);
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({
    event: 'request_completed', level: 'info', method: 'GET', status_code: 200,
    request_id: response.headers['x-request-id'],
  });
  expect(logs[0].request_id).not.toBe('untrusted-client-id');
  expect(logs[0].request_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(logs[0].duration_ms).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(Date.parse(logs[0].timestamp))).toBe(true);
});

it('logs validation errors at warn level using the route template', async () => {
  const service = jest.spyOn(RosterService.prototype, 'getOrgRoster').mockResolvedValue({});
  const response = await request(app).get('/api/orgs/private-value/roster?token=private-query')
    .set('Authorization', 'Bearer private-token');

  expect(response.status).toBe(400);
  expect(service).not.toHaveBeenCalled();
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({
    level: 'warn', status_code: 400, route: '/orgs/:orgId/roster', error_code: 1001,
  });
  expect(JSON.stringify(logs)).not.toContain('private-');
});

it('logs database failures with safe diagnostics without leaking their details', async () => {
  const error = Object.assign(new Error('private SQL connection details'), {
    code: '08006', detail: 'private learner email',
    cause: new Error('private credential'),
  });
  jest.spyOn(RosterService.prototype, 'getOrgRoster').mockRejectedValue(error);

  const response = await request(app).get('/api/orgs/1/roster');

  expect(response.status).toBe(500);
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({
    level: 'error', error_code: 1000, error_type: 'Error', database_code: '08006',
    request_id: response.headers['x-request-id'],
  });
  expect(JSON.stringify(logs)).not.toContain('private');
});

it('captures JSON parser failures without logging the body', async () => {
  const response = await request(app).post('/api/health')
    .set('Content-Type', 'application/json').send('{"private":');

  expect(response.status).toBe(500);
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({ event: 'request_completed', level: 'error', error_type: 'SyntaxError' });
  expect(JSON.stringify(logs)).not.toContain('private');
});

it('does not log raw paths or query strings for unmatched routes', async () => {
  await request(app).get('/private-customer?token=private-token');

  expect(logs[0]).toMatchObject({ level: 'warn', route: '<unmatched>', status_code: 404, error_code: 1002 });
  expect(JSON.stringify(logs)).not.toContain('private');
});

it('records aborted responses once even when finish later fires', () => {
  const req = { method: 'GET', route: { path: '/slow' } };
  const res = Object.assign(new EventEmitter(), {
    locals: {}, statusCode: 200, writableFinished: false, setHeader: jest.fn(),
  });
  const next = jest.fn();

  requestLogger(req, res, next);
  res.emit('close');
  res.emit('finish');

  expect(next).toHaveBeenCalledTimes(1);
  expect(logs).toHaveLength(1);
  expect(logs[0]).toMatchObject({ event: 'request_aborted', level: 'warn' });
});

it('ignores unsupported fields and circular objects in application logs', () => {
  const circular = {};
  circular.self = circular;
  logger.info('server_started', {
    port: 3001, password: 'private-password', request: circular,
    error_type: circular, duration_ms: Infinity,
  });

  expect(logs[0]).toEqual({
    timestamp: expect.any(String), level: 'info', event: 'server_started', port: 3001,
  });
});
