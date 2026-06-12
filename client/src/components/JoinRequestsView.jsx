import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDate } from '../utils/format.js';
import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';

export default function JoinRequestsView({ projectId }) {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState({});

  useEffect(() => {
    api.getJoinRequests(projectId)
      .then(setRequests)
      .catch((err) => setError(err.message));
  }, [projectId]);

  async function respond(requestId, status) {
    setBusy((b) => ({ ...b, [requestId]: true }));
    try {
      await api.respondToJoinRequest(requestId, status);
      setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status } : r));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy((b) => ({ ...b, [requestId]: false }));
    }
  }

  if (!requests) return <div className="loading-state">Loading requests…</div>;

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="join-requests-view">
      {error && <p className="form-error">{error}</p>}

      <h4>Pending Requests ({pending.length})</h4>
      {pending.length ? (
        pending.map((r) => (
          <div key={r.id} className="join-request-card">
            <div className="join-request-header">
              <Avatar name={r.display_name || r.username} size="sm" />
              <div>
                <strong>{r.display_name || r.username}</strong>
                {r.role_title && <span className="skill-tag small">{r.role_title}</span>}
                <small>{formatDate(r.created_at)}</small>
              </div>
            </div>
            {r.message && <p className="join-request-msg">"{r.message}"</p>}
            <div className="join-request-actions">
              <button className="btn-accept" onClick={() => respond(r.id, 'accepted')} disabled={busy[r.id]}>
                Accept
              </button>
              <button className="btn-reject" onClick={() => respond(r.id, 'rejected')} disabled={busy[r.id]}>
                Reject
              </button>
            </div>
          </div>
        ))
      ) : (
        <EmptyState title="No pending requests" text="No one has requested to join yet." />
      )}

      {decided.length > 0 && (
        <>
          <h4 style={{ marginTop: '24px' }}>Decided ({decided.length})</h4>
          {decided.map((r) => (
            <div key={r.id} className={`join-request-card decided join-status-${r.status}`}>
              <div className="join-request-header">
                <Avatar name={r.display_name || r.username} size="sm" />
                <div>
                  <strong>{r.display_name || r.username}</strong>
                  <span className={`join-badge join-badge-${r.status}`}>{r.status}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
