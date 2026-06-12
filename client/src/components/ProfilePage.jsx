import { formatDate } from '../utils/format.js';
import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';

const STATUS_LABELS = { idea: 'Idea', in_progress: 'In Progress', recruiting: 'Recruiting', completed: 'Completed' };

export default function ProfilePage({ profile, currentUser, isCurrentUser, onOpenProject }) {
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const owned = profile.owned_projects || [];
  const joined = profile.joined_projects || [];
  const updates = profile.recent_updates || [];

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="profile-banner" />
        <div className="profile-avatar-row">
          <Avatar name={profile.display_name || profile.username} size="lg" />
        </div>
        <div className="profile-info">
          <h2>{profile.display_name || profile.username}</h2>
          <p className="profile-handle">@{profile.username}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          {skills.length > 0 && (
            <div className="tag-list profile-skills">
              {skills.map((s) => <span key={s} className="skill-tag">{s}</span>)}
            </div>
          )}
          <div className="profile-stats">
            <span>{owned.length} project{owned.length !== 1 ? 's' : ''}</span>
            {joined.length > 0 && <span>{joined.length} team{joined.length !== 1 ? 's' : ''}</span>}
            {profile.created_at && <span>Joined {formatDate(profile.created_at)}</span>}
            {isCurrentUser && <span className="you-badge">· You</span>}
          </div>
        </div>
      </section>

      <div className="profile-body">
        <section className="profile-section">
          <h3>Projects</h3>
          {owned.length ? (
            <div className="profile-projects-list">
              {owned.map((p) => (
                <button key={p.id} className="profile-project-row" onClick={() => onOpenProject(p.id)} type="button">
                  <div>
                    <div className="profile-project-title">
                      <strong>{p.title}</strong>
                      <span className={`status-badge status-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                    </div>
                    <p>{p.short_description}</p>
                    {Array.isArray(p.tags) && p.tags.length > 0 && (
                      <div className="tag-list">
                        {p.tags.slice(0, 5).map((t) => <span key={t} className="skill-tag small">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <span className="category-tag">{p.category}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No projects yet" text={isCurrentUser ? "Create your first project." : "This engineer hasn't posted any projects yet."} />
          )}
        </section>

        {joined.length > 0 && (
          <section className="profile-section">
            <h3>Teams</h3>
            <div className="profile-projects-list">
              {joined.map((p) => (
                <button key={p.id} className="profile-project-row" onClick={() => onOpenProject(p.id)} type="button">
                  <div>
                    <strong>{p.title}</strong>
                    {p.role && <span className="skill-tag small">{p.role}</span>}
                    <p>{p.short_description}</p>
                  </div>
                  <span className="category-tag">{p.category}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {updates.length > 0 && (
          <section className="profile-section">
            <h3>Recent Build Logs</h3>
            {updates.map((u) => (
              <div key={u.id} className="profile-update-row">
                <div>
                  {u.title && <strong>{u.title}</strong>}
                  <p>{u.body.slice(0, 180)}{u.body.length > 180 ? '…' : ''}</p>
                  <small>
                    in <button className="link-inline" onClick={() => onOpenProject(u.project_id)} type="button">{u.project_title}</button>
                    {' · '}{formatDate(u.created_at)}
                  </small>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
