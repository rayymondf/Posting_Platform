import { Heart } from 'lucide-react';
import Avatar from './Avatar.jsx';
import { formatDate } from '../utils/format.js';

export default function PostCard({ post, onLike, onOpenProfile }) {
  return (
    <article className="post-card">
      <Avatar name={post.username} />
      <div className="post-body">
        <div className="post-meta">
          <button
            className="name-button"
            type="button"
            onClick={() => onOpenProfile(post.user_id)}
          >
            {post.username}
          </button>
          <span>@{post.username.toLowerCase()}</span>
          <span>{formatDate(post.created_at)}</span>
        </div>
        <p>{post.content}</p>
        <button
          className={post.user_liked ? 'like-button liked' : 'like-button'}
          type="button"
          onClick={() => onLike(post.id)}
          aria-label={post.user_liked ? 'Unlike post' : 'Like post'}
        >
          <Heart size={18} fill={post.user_liked ? 'currentColor' : 'none'} />
          <span>{Number(post.likes_count) || 0}</span>
        </button>
      </div>
    </article>
  );
}
