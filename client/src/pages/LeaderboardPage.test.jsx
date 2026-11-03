import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LeaderboardPage from './LeaderboardPage.jsx';

const leaderboard = {
  organization_id: 1,
  organization_name: 'Acme Contact Centers',
  window: { start: '2026-10-13T12:00:00.000Z', end: '2026-11-12T12:00:00.000Z' },
  entries: [
    { rank: 1, learner_id: 1, display_name: 'Maria G.', score_pct: 95, session_count: 4 },
    { rank: 2, learner_id: 2, display_name: 'David C.', score_pct: 90, session_count: 3 },
    { rank: 2, learner_id: 3, display_name: 'Priya P.', score_pct: 90, session_count: 3 },
    { rank: 4, learner_id: 4, display_name: 'James O.', score_pct: 87.5, session_count: 5 },
  ],
};

function response(data = leaderboard) {
  return { ok: true, status: 200, json: async () => ({ data, error: false, code: 0, msg: 'Success' }) };
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Leaderboard page states', () => {
  it('announces loading and disables refresh while the API is pending', () => {
    fetchMock.mockReturnValue(deferred().promise);

    render(<LeaderboardPage orgId={1} />);

    expect(screen.getByRole('status').textContent).toBe('Loading the leaderboard…');
    expect(screen.getByRole('button', { name: 'Loading…' }).disabled).toBe(true);
    expect(screen.getByRole('region', { name: 'Team standings', busy: true })).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'No one has qualified yet.' })).toBeNull();
  });

  it('renders the API organization, window, tied ranks and scores with one decimal', async () => {
    fetchMock.mockResolvedValue(response());

    render(<LeaderboardPage orgId={1} />);

    const table = await screen.findByRole('table');
    expect(screen.getByText('Acme Contact Centers')).toBeTruthy();
    expect(screen.getByText('Oct 13, 2026 – Nov 12, 2026 · UTC')).toBeTruthy();
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual(['1', '2', '2', '4']);
    expect(rows.map((row) => within(row).getAllByRole('cell')[1].textContent)).toEqual(['95.0%', '90.0%', '90.0%', '87.5%']);
    for (const entry of leaderboard.entries) {
      expect(within(table).getByRole('rowheader', { name: entry.display_name })).toBeTruthy();
    }
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('button', { name: 'Refresh' }).disabled).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('/api/orgs/1/leaderboard', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('shows the required empty-state message and no table when no learners qualify', async () => {
    fetchMock.mockResolvedValue(response({ ...leaderboard, entries: [] }));

    render(<LeaderboardPage orgId={1} />);

    await screen.findByRole('heading', { name: 'No one has qualified yet.' });
    const status = screen.getByRole('status');
    const message = [...status.querySelectorAll('h3, p')].map((node) => node.textContent).join(' ');
    expect(message).toBe('No one has qualified yet. Complete 3 practice sessions to join the board.');
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Acme Contact Centers')).toBeTruthy();
  });

  it('shows an API error and recovers through the retry button', async () => {
    const retry = deferred();
    fetchMock.mockResolvedValueOnce({
      ok: false, status: 500,
      json: async () => ({ data: {}, error: true, code: 1000, msg: 'Internal server error.' }),
    }).mockReturnValueOnce(retry.promise);

    render(<LeaderboardPage orgId={1} />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('We couldn’t load the leaderboard.');
    expect(alert.textContent).toContain('Internal server error.');
    expect(screen.queryByRole('table')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('status').textContent).toBe('Loading the leaderboard…');
    expect(screen.queryByRole('alert')).toBeNull();
    await act(async () => { retry.resolve(response()); });

    expect(await screen.findByRole('table')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shows a recoverable error when the network request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    render(<LeaderboardPage orgId={1} />);

    expect((await screen.findByRole('alert')).textContent).toContain('Failed to fetch');
    expect(screen.getByRole('button', { name: 'Try again' }).disabled).toBe(false);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows an error instead of crashing when the API returns an invalid date window', async () => {
    fetchMock.mockResolvedValue(response({ ...leaderboard, window: { start: 'invalid', end: 'invalid' } }));

    render(<LeaderboardPage orgId={1} />);

    expect((await screen.findByRole('alert')).textContent)
      .toContain('The leaderboard response could not be loaded. Please try again.');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('ignores an old organization response after the organization prop changes', async () => {
    const oldRequest = deferred();
    fetchMock.mockReturnValueOnce(oldRequest.promise).mockResolvedValueOnce(response({
      ...leaderboard, organization_id: 2, organization_name: 'Northwind Health', entries: [],
    }));
    const { rerender } = render(<LeaderboardPage orgId={1} />);
    const oldSignal = fetchMock.mock.calls[0][1].signal;

    rerender(<LeaderboardPage orgId={2} />);
    await screen.findByText('Northwind Health');
    expect(oldSignal.aborted).toBe(true);
    await act(async () => { oldRequest.resolve(response()); });

    expect(screen.getByText('Northwind Health')).toBeTruthy();
    expect(screen.queryByText('Acme Contact Centers')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('cancels an unfinished request when the page is unmounted', async () => {
    const pending = deferred();
    fetchMock.mockReturnValue(pending.promise);
    const { unmount } = render(<LeaderboardPage orgId={1} />);
    const signal = fetchMock.mock.calls[0][1].signal;

    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => { pending.resolve(response()); });
    expect(screen.queryByRole('table')).toBeNull();
  });
});
