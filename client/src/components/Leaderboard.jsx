import React from 'react';

export default function Leaderboard({ entries, status, error, onRetry }) {
  return (
    <section className="leaderboard-card" aria-labelledby="standings-title" aria-busy={status === 'loading'}>
      <div className="card-heading">
        <div><h2 id="standings-title">Team standings</h2><p>Celebrating the practice behind the progress.</p></div>
        <span className="top-badge">TOP 10</span>
      </div>

      {status === 'loading' && (
        <div className="loading-state">
          <p role="status">Loading the leaderboard…</p>
          <div aria-hidden="true" className="skeleton-list">
            {[0, 1, 2, 3, 4].map((index) => <div className="skeleton-row" key={index}><span /><span /><span /></div>)}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="message-state">
          <div role="alert"><h3>We couldn’t load the leaderboard.</h3><p>{error || 'Please try again in a moment.'}</p></div>
          <button className="button button-primary" onClick={onRetry}>Try again</button>
        </div>
      )}

      {status === 'success' && entries.length === 0 && (
        <div className="message-state" role="status">
          <span className="empty-icon" aria-hidden="true">↗</span>
          <h3>No one has qualified yet.</h3>
          <p>Complete 3 practice sessions to join the board.</p>
        </div>
      )}

      {status === 'success' && entries.length > 0 && (
        <>
          <div className="table-scroll" role="region" aria-label="Team leaderboard table" tabIndex={0}>
            <table>
              <caption className="sr-only">Team leaderboard ranked by average score over the displayed date window.</caption>
              <thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">Score</th><th scope="col" className="sessions-column">Sessions</th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.learner_id} className={entry.rank === 1 ? 'leading-row' : undefined}>
                    <td><span className={`rank-badge${entry.rank <= 3 ? ` rank-${entry.rank}` : ''}`}>{entry.rank}</span></td>
                    <th scope="row">
                      <div className="learner-name"><span className="avatar" aria-hidden="true">{entry.display_name.charAt(0)}</span>{entry.display_name}</div>
                    </th>
                    <td>
                      <div className="score-cell">
                        <span className="score-value">{Number.isFinite(entry.score_pct) ? `${entry.score_pct.toFixed(1)}%` : '—'}</span>
                        <span className="score-track" aria-hidden="true"><span style={{ width: `${Number.isFinite(entry.score_pct) ? Math.max(0, Math.min(100, entry.score_pct)) : 0}%` }} /></span>
                      </div>
                    </td>
                    <td className="sessions-column"><span className="session-count">{entry.session_count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">Showing {entries.length} {entries.length === 1 ? 'learner' : 'learners'} <span>Scores rounded to one decimal place</span></div>
        </>
      )}
    </section>
  );
}
