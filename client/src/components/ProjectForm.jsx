import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Button from './Button.jsx';

const CATEGORIES = ['Robotics', 'Firmware', 'Embedded Systems', 'Web Development', 'AI/ML', 'PCB Design', 'CAD/Mechanical', 'Data/Cloud', 'Electrical Design', 'Other'];
const STATUSES = [['idea', 'Idea'], ['in_progress', 'In Progress'], ['recruiting', 'Recruiting'], ['completed', 'Completed']];
const SUGGESTED_TAGS = ['React', 'Node.js', 'PostgreSQL', 'C++', 'Python', 'Arduino', 'STM32', 'ESP32', 'ROS', 'OpenCV', 'CAD', 'PCB', 'KiCad', 'SolidWorks', 'Docker', 'AWS', 'GitHub Actions'];

export default function ProjectForm({ projectId, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    title: '', short_description: '', full_description: '',
    category: 'Web Development', status: 'idea', visibility: 'public',
    github_url: '', demo_url: ''
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(!!projectId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) return;
    api.getProject(projectId).then((p) => {
      setForm({
        title: p.title, short_description: p.short_description,
        full_description: p.full_description || '',
        category: p.category, status: p.status, visibility: p.visibility,
        github_url: p.github_url || '', demo_url: p.demo_url || ''
      });
      setTags(p.tags || []);
      setRoles((p.roles || []).map((r) => ({ title: r.title, description: r.description || '', skill_area: r.skill_area || '' })));
      setLoading(false);
    }).catch((err) => { setError(err.message); setLoading(false); });
  }, [projectId]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function addTag(tag) {
    const t = tag.trim();
    if (t && !tags.includes(t) && tags.length < 15) setTags((prev) => [...prev, t]);
    setTagInput('');
  }

  function removeTag(tag) { setTags((prev) => prev.filter((t) => t !== tag)); }

  function addRole() { setRoles((prev) => [...prev, { title: '', description: '', skill_area: '' }]); }

  function removeRole(i) { setRoles((prev) => prev.filter((_, idx) => idx !== i)); }

  function setRole(i, field, value) {
    setRoles((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, tags, roles: roles.filter((r) => r.title.trim()) };
      const result = projectId
        ? await api.updateProject(projectId, payload)
        : await api.createProject(payload);
      onSuccess(result.id || projectId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading-state">Loading project…</div>;

  return (
    <div className="project-form-page">
      <div className="project-form-header">
        <h1>{projectId ? 'Edit Project' : 'Create Project'}</h1>
        <button className="btn-ghost" onClick={onCancel} type="button">Cancel</button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <form className="project-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>Basics</h3>
          <label>
            <span>Project Title *</span>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} placeholder="e.g. Autonomous Rover Platform" required />
          </label>
          <label>
            <span>Short Description * <small>(max 300 chars)</small></span>
            <textarea value={form.short_description} onChange={(e) => set('short_description', e.target.value)} maxLength={300} rows={2} placeholder="One or two sentences describing the project." required />
          </label>
          <div className="form-row">
            <label>
              <span>Category *</span>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} required>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label>
              <span>Visibility</span>
              <select value={form.visibility} onChange={(e) => set('visibility', e.target.value)}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>
        </section>

        <section className="form-section">
          <h3>Details</h3>
          <label>
            <span>Full Description</span>
            <textarea value={form.full_description} onChange={(e) => set('full_description', e.target.value)} rows={6} placeholder="Describe your project in detail — architecture, goals, challenges..." />
          </label>
          <div className="form-row">
            <label>
              <span>GitHub URL</span>
              <input type="url" value={form.github_url} onChange={(e) => set('github_url', e.target.value)} placeholder="https://github.com/..." />
            </label>
            <label>
              <span>Demo / Live URL</span>
              <input type="url" value={form.demo_url} onChange={(e) => set('demo_url', e.target.value)} placeholder="https://..." />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h3>Skill Tags</h3>
          <div className="tag-input-row">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
              placeholder="Add a tag and press Enter"
              maxLength={60}
            />
          </div>
          <div className="tag-suggestions">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
              <button key={t} type="button" className="suggestion-chip" onClick={() => addTag(t)}>{t}</button>
            ))}
          </div>
          {tags.length > 0 && (
            <div className="tag-list">
              {tags.map((tag) => (
                <span key={tag} className="skill-tag removable">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-header">
            <h3>Open Roles</h3>
            <button type="button" className="btn-ghost" onClick={addRole}>+ Add Role</button>
          </div>
          {roles.map((role, i) => (
            <div key={i} className="role-form-row">
              <input value={role.title} onChange={(e) => setRole(i, 'title', e.target.value)} placeholder="Role title (e.g. Firmware Developer)" />
              <input value={role.skill_area} onChange={(e) => setRole(i, 'skill_area', e.target.value)} placeholder="Skill area (optional)" />
              <input value={role.description} onChange={(e) => setRole(i, 'description', e.target.value)} placeholder="Brief description (optional)" />
              <button type="button" className="icon-btn" onClick={() => removeRole(i)} aria-label="Remove role"><X size={16} /></button>
            </div>
          ))}
          {roles.length === 0 && <p className="muted-text">No open roles yet. Add roles to recruit teammates.</p>}
        </section>

        <div className="form-submit-row">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : projectId ? 'Save Changes' : 'Create Project'}</Button>
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
