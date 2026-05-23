import Avatar from './Avatar.jsx';
import EmptyState from './EmptyState.jsx';
import PostCard from './PostCard.jsx';
import { formatDate, pluralize } from '../utils/format.js';

export default function ProfilePage({ profile, posts, currentUser, isCurrentUser, onLike, onDelete, onOpenProfile }) {
  const count = Number(profile.posts_count ?? posts.length) || 0;

  return (
    <>
      <section className="profile-header">
        <div className="profile-banner" />
        <div className="profile-avatar-row">
          <Avatar name={profile.username} size="lg" />
        </div>
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <p>@{profile.username.toLowerCase()}</p>
        </div>
        <div className="profile-stats">
          <span>{pluralize(count, 'post')}</span>
          {profile.created_at ? <span>Joined {formatDate(profile.created_at)}</span> : null}
          {isCurrentUser ? <span>· You</span> : null}
        </div>
      </section>

      <div className="timeline-list">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={onLike}
              onDelete={onDelete}
              onOpenProfile={onOpenProfile}
            />
          ))
        ) : (
          <EmptyState title="No posts yet" text="This profile has not posted yet." />
        )}
      </div>
    </>
  );
}
