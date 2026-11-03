import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { AppError } from '../src/errors/AppError.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { validateRequest } from '../src/middleware/validate-request.js';
import { successResponse } from '../src/lib/response.js';
import { organizationParamsSchema } from '../src/validation/organization.schema.js';
import { validate } from '../src/validation/validate.js';

it('returns a parsed numeric ID without mutating the input', () => {
  const params = { orgId: ' 42 ' };

  expect(validate(organizationParamsSchema, params)).toEqual({ orgId: 42 });
  expect(params).toEqual({ orgId: ' 42 ' });
});

it.each([undefined, null, '', ' ', ['1'], { id: '1' }, true, '1.5', 'Infinity', '2147483648'])
  ('rejects invalid organization input %j as an application error', (orgId) => {
    expect(() => validate(organizationParamsSchema, { orgId })).toThrow(AppError);
  });

describe('query parameter validation', () => {
  const app = express();
  const querySchema = z.object({ search: z.string().trim().min(1) });

  // Test-only route to exercise the actual Express query parser.
  app.get('/search', validateRequest(querySchema, { source: 'query' }), (req, res) => {
    res.json(successResponse(res.locals.validated.query));
  });
  app.get('/orgs/:orgId/search',
    validateRequest(organizationParamsSchema),
    validateRequest(querySchema, { source: 'query' }),
    (req, res) => res.json(successResponse(res.locals.validated)),
  );
  app.use(errorHandler);

  it('parses and trims a scalar query parameter', async () => {
    const res = await request(app).get('/search?search=%20Maria%20');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ search: 'Maria' });
    expect(res.body.error).toBe(false);
  });

  it('preserves validated params when a later middleware validates query parameters', async () => {
    const res = await request(app).get('/orgs/42/search?search=%20Maria%20');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ params: { orgId: 42 }, query: { search: 'Maria' } });
  });

  it.each(['', '?search=', '?search=Maria&search=David', '?search[name]=Maria'])
    ('rejects missing, empty or structured query parameters: %s', async (query) => {
      const res = await request(app).get(`/search${query}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ data: {}, error: true, code: 1003, msg: 'Invalid request parameters.' });
    });
});
