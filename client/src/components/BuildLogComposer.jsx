import { useState } from 'react';
import Button from './Button.jsx';

const MILESTONE_TAGS = ['Prototype', 'Debugging', 'CAD', 'Firmware', 'Testing', 'Deployment', 'Demo', 'Final Build'];

export default function BuildLogComposer({ projectId, onSubmit }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [milestone, setMilestone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit({ title: title.trim() || undefined, body: body.trim(), milestone_tag: milestone || undefined });
      setTitle('');
      setBody('');
      setMilestone('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="build-log-composer" onSubmit={handleSubmit}>
      <h4>Post a Build Log Update</h4>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Update title (optional)"
        maxLength={200}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you build, fix, or learn? Share your progress…"
        rows={4}
        required
      />
      <div className="composer-footer">
        <select value={milestone} onChange={(e) => setMilestone(e.target.value)} aria-label="Milestone tag">
          <option value="">Milestone tag (optional)</option>
          {MILESTONE_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Button type="submit" disabled={busy || !body.trim()}>{busy ? 'Posting…' : 'Post Update'}</Button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
