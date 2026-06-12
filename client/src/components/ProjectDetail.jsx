import { ArrowLeft, ExternalLink, Github, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDate } from '../utils/format.js';
import Avatar from './Avatar.jsx';
import BuildLogCard from './BuildLogCard.jsx';
import BuildLogComposer from './BuildLogComposer.jsx';
import Button from './Button.jsx';
import EmptyState from './EmptyState.jsx';
import JoinRequestsView from './JoinRequestsView.jsx';

const STATUS_LABELS = { idea: 'Idea', in_progress: 'In Progress', recruiting: 'Recruiting', completed: 'Completed' };

export default function ProjectDetail({ projectId, currentUser, onBack, onEdit, onOpenProfile }) {
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinMsg, setJoinMsg] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [joinBusy, setJoinBusy] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [activeTab, setActiveTab] = useState('updates');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.getProject(projectId), api.getUpdates(projectId)])
      .then(([proj, upd]) => {
        if (cancelled) return;
        setProject(proj);
        setUpdates(upd);
        setLoading(false);
      })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [projectId]);

  async function handleJoinRequest() {
    if (!currentUser) return;
    setJoinBusy(true);
    try {
      await api.submitJoinRequest(project.id, { role_id: selectedRole || undefined, message: joinMsg || undefined });
      setProject((p) => ({ ...p, user_join_request: { status: 'pending' } }));
      setShowJoinForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoinBusy(false);
    }
  }

  async function handleNewUpdate(data) {
    try {
      const update = await api.createUpdate(project.id, data);
      setUpdates((prev) => [update, ...prev]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteUpdate(updateId) {
    try {
      await api.deleteUpdate(updateId);
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLike(updateId) {
    try {
      const res = await api.toggleLike(updateId);
      setUpdates((prev) => prev.map((u) => u.id === updateId ? { ...u, likes_count: res.likes_count, user_liked: res.user_liked } : u));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="loading-state">Loading project…</div>;
  if (!project) return <div className="loading-state">{error || 'Project not found.'}</div>;

  const isOwnerAdmin = project.user_permission === 'owner' || project.user_permission === 'admin';
  const isMember = project.is_member;
  const joinRequest = project.user_join_request;
  const canJoin = currentUser && !isMember && !joinRequest && project.owner_id !== currentUser?.id;

  return (
    <div className="project-detail">
      <div className="project-detail-nav">
        <button className="back-btn" onClick={onBack} type="button">
          <ArrowLeft size={18} /> Projects
        </button>
        {isOwnerAdmin && (
          <Button variant="soft" onClick={() => onEdit(project.id)}>Edit Project</Button>
        )}
      </div>

      <div className="project-detail-hero">
        <div className="project-detail-meta">
          <span className={`status-badge status-${project.status}`}>{STATUS_LABELS[project.status]}</span>
          <span className="category-tag">{project.category}</span>
        </div>
        <h1 className="project-detail-title">{project.title}</h1>
        <p className="project-detail-desc">{project.short_description}</p>

        <div className="project-detail-links">
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="link-btn">
              <Github size={16} /> GitHub
            </a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="link-btn">
              <ExternalLink size={16} /> Live Demo
            </a>
          )}
        </div>

        {Array.isArray(project.tags) && project.tags.length > 0 && (
          <div className="tag-list">
            {project.tags.map((tag) => <span key={tag} className="skill-tag">{tag}</span>)}
          </div>
        )}
      </div>

      <div className="project-detail-body">
        <div className="project-detail-main">
          <div className="tab-bar">
            <button className={`tab-btn${activeTab === 'updates' ? ' active' : ''}`} onClick={() => setActiveTab('updates')}>
              Build Log {updates.length > 0 && <span className="tab-count">{updates.length}</span>}
            </button>
            <button className={`tab-btn${activeTab === 'about' ? ' active' : ''}`} onClick={() => setActiveTab('about')}>
              About
            </button>
            {isOwnerAdmin && (
              <button className={`tab-btn${activeTab === 'requests' ? ' active' : ''}`} onClick={() => setActiveTab('requests')}>
                Join Requests
              </button>
            )}
          </div>

          {activeTab === 'updates' && (
            <div>
              {isMember && (
                <BuildLogComposer projectId={project.id} onSubmit={handleNewUpdate} />
              )}
              {updates.length ? (
                updates.map((u) => (
                  <BuildLogCard
                    key={u.id}
                    update={u}
                    currentUser={currentUser}
                    projectOwnerId={project.owner_id}
                    userPermission={project.user_permission}
                    onLike={handleLike}
                    onDelete={handleDeleteUpdate}
                    onOpenProfile={onOpenProfile}
                  />
                ))
              ) : (
                <EmptyState title="No build logs yet" text={isMember ? "Post your first build log update." : "The team hasn't posted any updates yet."} />
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="project-about">
              {project.full_description ? (
                <div className="project-full-desc">
                  {project.full_description.split('\n').map((line, i) => (
                    line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No description yet" text="The project owner hasn't added a full description." />
              )}
            </div>
          )}

          {activeTab === 'requests' && isOwnerAdmin && (
            <JoinRequestsView projectId={project.id} />
          )}
        </div>

        <aside className="project-detail-sidebar">
          <div className="sidebar-section">
            <h4>Owner</h4>
            <button className="member-row" onClick={() => onOpenProfile(project.owner_id)} type="button">
              <Avatar name={project.owner_display_name || project.owner_username} size="sm" />
              <span>{project.owner_display_name || project.owner_username}</span>
            </button>
          </div>

          {project.members && project.members.length > 0 && (
            <div className="sidebar-section">
              <h4><Users size={14} /> Team ({project.members.length})</h4>
              {project.members.map((m) => (
                <button key={m.id} className="member-row" onClick={() => onOpenProfile(m.id)} type="button">
                  <Avatar name={m.display_name || m.username} size="sm" />
                  <span>
                    <strong>{m.display_name || m.username}</strong>
                    {m.role && <small>{m.role}</small>}
                  </span>
                </button>
              ))}
            </div>
          )}

          {project.roles && project.roles.length > 0 && (
            <div className="sidebar-section">
              <h4>Open Roles</h4>
              {project.roles.filter((r) => r.is_open).map((role) => (
                <div key={role.id} className="role-item">
                  <strong>{role.title}</strong>
                  {role.skill_area && <span className="skill-tag small">{role.skill_area}</span>}
                  {role.description && <p>{role.description}</p>}
                </div>
              ))}
              {project.roles.every((r) => !r.is_open) && <p className="muted-text">All roles filled.</p>}
            </div>
          )}

          {canJoin && !showJoinForm && (
            <Button onClick={() => setShowJoinForm(true)}>Request to Join</Button>
          )}

          {canJoin && showJoinForm && (
            <div className="join-form">
              <h4>Request to Join</h4>
              {project.roles && project.roles.filter((r) => r.is_open).length > 0 && (
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="">Select a role (optional)</option>
                  {project.roles.filter((r) => r.is_open).map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              )}
              <textarea
                value={joinMsg}
                onChange={(e) => setJoinMsg(e.target.value)}
                placeholder="Tell the team why you'd like to join…"
                rows={3}
              />
              <div className="join-form-actions">
                <Button onClick={handleJoinRequest} disabled={joinBusy}>Send Request</Button>
                <button className="btn-ghost" onClick={() => setShowJoinForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {joinRequest && (
            <div className={`join-status join-status-${joinRequest.status}`}>
              Request {joinRequest.status}
            </div>
          )}

          {project.created_at && (
            <p className="muted-text sidebar-date">Started {formatDate(project.created_at)}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
