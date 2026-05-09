import { Search } from 'lucide-react';
import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';
import { pluralize } from '../utils/format.js';

export default function ProfileDirectory({ users, search, onSearch, onOpenProfile }) {
  return (
    <section className="profiles-view">
      <label className="search-box" htmlFor="profile-search">
        <Search size={18} aria-hidden="true" />
        <input
          id="profile-search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search users"
        />
      </label>

      <div className="profile-list">
        {users.length ? (
          users.map((user) => (
            <button
              className="profile-row"
              key={user.id}
              type="button"
              onClick={() => onOpenProfile(user.id)}
            >
              <Avatar name={user.username} />
              <span>
                <strong>{user.username}</strong>
                <small>@{user.username.toLowerCase()}</small>
              </span>
              <em>{pluralize(Number(user.posts_count) || 0, 'post')}</em>
            </button>
          ))
        ) : (
          <EmptyState title="No profiles found" text="Try a different search." />
        )}
      </div>
    </section>
  );
}
