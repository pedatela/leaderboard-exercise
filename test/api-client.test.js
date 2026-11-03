import { jest } from '@jest/globals';
import { getJson } from '../client/src/api.js';

afterEach(() => jest.restoreAllMocks());

it('forwards the abort signal so pages can cancel obsolete requests', async () => {
  const controller = new AbortController();
  const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data: {}, error: false, code: 0, msg: 'Success' }),
  });

  await getJson('/api/orgs/1/leaderboard', { signal: controller.signal });

  expect(fetchMock).toHaveBeenCalledWith('/api/orgs/1/leaderboard', { signal: controller.signal });
});

it('returns only the domain data from a successful API response', async () => {
  const data = { organization_id: 1, entries: [] };
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ data, error: false, code: 0, msg: 'Request completed successfully.' }),
  });

  await expect(getJson('/api/orgs/1/leaderboard')).resolves.toEqual(data);
});

it.each([true, false])('uses the public API error message when HTTP ok is %s', async (ok) => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok, status: ok ? 200 : 400,
    json: async () => ({ data: {}, error: true, code: 1001, msg: 'The organization ID is invalid.' }),
  });

  await expect(getJson('/api/orgs/abc/leaderboard')).rejects.toThrow('The organization ID is invalid.');
});

it('falls back to the HTTP status when an upstream failure is not JSON', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false, status: 502,
    json: async () => { throw new SyntaxError('Unexpected HTML response'); },
  });

  await expect(getJson('/api/health')).rejects.toThrow('Request failed: 502');
});

it('rejects a successful HTTP response that lacks the API envelope', async () => {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ entries: [] }) });

  await expect(getJson('/api/orgs/1/leaderboard')).rejects.toThrow('Invalid API response');
});
