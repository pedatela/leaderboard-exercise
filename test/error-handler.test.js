import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { AppError } from '../src/errors/AppError.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { RosterService } from '../src/service/roster.service.js';
import { LeaderboardService } from '../src/service/leaderbord.service.js';

afterEach(() => jest.restoreAllMocks());

describe.each([
  ['roster', RosterService, 'getOrgRoster'],
  ['leaderboard', LeaderboardService, 'getOrgLeaderboard'],
])('%s error responses', (route, Service, method) => {
  it.each(['abc', '1.5', '%20', 'Infinity', '2147483648'])('returns 400 for invalid ID %s without calling the service', async (orgId) => {
    const service = jest.spyOn(Service.prototype, method).mockResolvedValue({});

    const res = await request(app).get(`/api/orgs/${orgId}/${route}`);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ data: {}, error: true, code: 1001, msg: 'The organization ID is invalid.' });
    expect(service).not.toHaveBeenCalled();
  });

  it('uses the shared error code and status for service errors', async () => {
    const cause = new Error('Private diagnostic context');
    jest.spyOn(Service.prototype, method).mockRejectedValue(new AppError(1004, {
      statusCode: 409,
      message: 'Existe um conflito com os dados informados.',
      cause,
    }));

    const res = await request(app).get(`/api/orgs/1/${route}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ data: {}, error: true, code: 1004, msg: 'Existe um conflito com os dados informados.' });
  });

  it('masks unexpected errors even when they contain status and code properties', async () => {
    const error = Object.assign(new Error('Private database details'), {
      statusCode: 400,
      code: 'private_database_code',
    });
    jest.spyOn(Service.prototype, method).mockRejectedValue(error);
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get(`/api/orgs/1/${route}`);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ data: {}, error: true, code: 1000, msg: 'Internal server error.' });
    expect(log).toHaveBeenCalledTimes(1);
    const record = log.mock.calls[0][0];
    expect(record).toContain('ERROR [HTTP] request_completed');
    expect(record).toContain('status_code=500');
    expect(record).toContain('error_code=1000');
    expect(record).toContain('error_type="Error"');
    expect(log.mock.calls[0][0]).not.toContain('Private database details');
    expect(log.mock.calls[0][0]).not.toContain('private_database_code');
  });
});

it('preserves a shared server error status but hides internal details', () => {
  const error = new AppError(1005, { statusCode: 503, message: 'Private database details' });
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  jest.spyOn(console, 'error').mockImplementation(() => {});

  errorHandler(error, {}, res, jest.fn());

  expect(res.status).toHaveBeenCalledWith(503);
  expect(res.json).toHaveBeenCalledWith({ data: {}, error: true, code: 1000, msg: 'Internal server error.' });
});

it('delegates errors after headers have been sent without writing another response', () => {
  const error = new Error('Response already started');
  const res = { headersSent: true, status: jest.fn(), json: jest.fn() };
  const next = jest.fn();

  errorHandler(error, {}, res, next);

  expect(next).toHaveBeenCalledWith(error);
  expect(res.status).not.toHaveBeenCalled();
  expect(res.json).not.toHaveBeenCalled();
});
