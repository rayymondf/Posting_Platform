import Composer from './Composer.jsx';
import EmptyState from './EmptyState.jsx';
import PostCard from './PostCard.jsx';

export default function Feed({ currentUser, posts, onPost, onLike, onOpenProfile, busy }) {
  return (
    <>
      <Composer currentUser={currentUser} onSubmit={onPost} disabled={busy} />
      <div className="timeline-list">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={onLike}
              onOpenProfile={onOpenProfile}
            />
          ))
        ) : (
          <EmptyState title="No posts yet" text="Start the timeline with the first post." />
        )}
      </div>
    </>
  );
}
