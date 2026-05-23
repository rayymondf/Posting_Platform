import { Heart, Trash2 } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { formatDate } from '../utils/format.js';

export default function PostCard({ post, currentUser, onLike, onDelete, onOpenProfile }) {
  const canDelete = currentUser && post.user_id === currentUser.id;

  return (
    <article className="post-card">
      <Avatar name={post.username} />
      <div className="post-body">
        <div className="post-meta">
          <button className="name-button" type="button" onClick={() => onOpenProfile(post.user_id)}>
            {post.username}
          </button>
          <span>·</span>
          <span>{formatDate(post.created_at)}</span>
          {canDelete ? (
            <button className="delete-button" type="button" onClick={() => onDelete(post.id)} aria-label="Delete post">
              <Trash2 size={14} />
            </button>
          ) : null}
        </div>
        <p>{post.content}</p>
        <div className="post-actions">
          <button
            className={`like-button${post.user_liked ? ' liked' : ''}`}
            type="button"
            onClick={() => onLike(post.id)}
            aria-label={post.user_liked ? 'Unlike' : 'Like'}
          >
            <Heart size={17} fill={post.user_liked ? 'currentColor' : 'none'} />
            <span>{Number(post.likes_count) || 0}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
