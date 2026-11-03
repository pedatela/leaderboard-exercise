import React, { useEffect, useState } from 'react';
import { getJson } from '../api.js';
import Leaderboard from '../components/Leaderboard.jsx';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

export default function LeaderboardPage({ orgId }) {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ status: 'loading', data: null, error: null });

    async function loadLeaderboard() {
      try {
        const data = await getJson(`/api/orgs/${encodeURIComponent(orgId)}/leaderboard`, {
          signal: controller.signal,
        });
        if (!Array.isArray(data?.entries)
          || !Number.isFinite(Date.parse(data?.window?.start))
          || !Number.isFinite(Date.parse(data?.window?.end))) {
          throw new Error('The leaderboard response could not be loaded. Please try again.');
        }
        if (active) setState({ status: 'success', data, error: null });
      } catch (error) {
        if (active) setState({ status: 'error', data: null, error: error.message });
      }
    }

    loadLeaderboard();
    return () => {
      active = false;
      controller.abort();
    };
  }, [orgId, requestVersion]);

  const { data, status, error } = state;
  const refresh = () => setRequestVersion((version) => version + 1);
  const entries = data?.entries ?? [];
  const topScore = entries.find((entry) => Number.isFinite(entry.score_pct))?.score_pct;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to leaderboard</a>
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            RemoteBridge<span className="brand-dot">.</span>
          </div>
          <span className="workspace-label">Team workspace</span>
        </div>
      </header>

      <main id="main-content" className="page-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">PRACTICE & PROGRESS</p>
            <h1>Team Leaderboard</h1>
            <p className="page-description">A little friendly competition. A lot of progress.</p>
          </div>
          <button className="button button-secondary" onClick={refresh} disabled={status === 'loading'}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M5.2 8a7.5 7.5 0 0 1 12.3-2L20 9M4 15l2.5 3A7.5 7.5 0 0 0 18.8 16" />
            </svg>
            {status === 'loading' ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        <div className="organization-line">
          <span className="organization-name">{data?.organization_name || `Organization ${orgId}`}</span>
          <span className="date-window">
            {data
              ? `${dateFormatter.format(new Date(data.window.start))} – ${dateFormatter.format(new Date(data.window.end))} · UTC`
              : 'Last 30 days'}
          </span>
        </div>

        <dl className="summary-grid">
          <div className="summary-card">
            <dt>Learners on the board</dt>
            <dd>{data ? entries.length : '—'}<span> / 10</span></dd>
          </div>
          <div className="summary-card">
            <dt>Highest average score</dt>
            <dd>{Number.isFinite(topScore) ? `${topScore.toFixed(1)}%` : '—'}</dd>
          </div>
          <div className="summary-card">
            <dt>Sessions on this board</dt>
            <dd>{data ? entries.reduce((total, entry) => total + entry.session_count, 0) : '—'}</dd>
          </div>
        </dl>

        <div className="leaderboard-layout">
          <Leaderboard entries={entries} status={status} error={error} onRetry={refresh} />

          <aside className="guide-card" aria-labelledby="guide-title">
            <span className="guide-icon" aria-hidden="true">↗</span>
            <p className="eyebrow">KEEP MOVING FORWARD</p>
            <h2 id="guide-title">Every session counts.</h2>
            <p>Build your skills, practice consistently, and grow with your team.</p>
            <ol className="guide-list">
              <li><span>01</span><div><strong>Complete 3 sessions</strong><p>At least three completed sessions get you on the board.</p></div></li>
              <li><span>02</span><div><strong>Keep it current</strong><p>Only sessions completed in the last 30 days count.</p></div></li>
              <li><span>03</span><div><strong>Aim for consistency</strong><p>Your score is the average of all qualifying sessions.</p></div></li>
            </ol>
            <div className="guide-note">Equal averages share a rank. Rankings use the full average before rounding.</div>
          </aside>
        </div>
        <footer className="page-footer">Small steps. Stronger skills. Better together.</footer>
      </main>
    </div>
  );
}
