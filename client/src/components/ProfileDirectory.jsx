import { Search } from 'lucide-react';
import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';
import { pluralize } from '../utils/format.js';

export default function ProfileDirectory({ users, search, onSearch, onOpenProfile }) {
  return (
    <section className="profiles-view">
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', background: 'var(--surface)' }}>
        <label className="search-box" htmlFor="profile-search" style={{ maxWidth: 320 }}>
          <Search size={16} aria-hidden="true" />
          <input
            id="profile-search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search engineers…"
          />
        </label>
      </div>

      <div className="profile-list">
        {users.length ? (
          users.map((user) => (
            <button
              className="profile-row"
              key={user.id}
              type="button"
              onClick={() => onOpenProfile(user.id)}
            >
              <Avatar name={user.display_name || user.username} />
              <span>
                <strong>{user.display_name || user.username}</strong>
                <small>@{user.username}</small>
              </span>
              <em>{pluralize(Number(user.posts_count) || 0, 'project')}</em>
            </button>
          ))
        ) : (
          <EmptyState title="No engineers found" text="Try a different search." />
        )}
      </div>
    </section>
  );
}
