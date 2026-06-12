import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/client.js';
import { formatDate } from '../utils/format.js';
import Avatar from './Avatar.jsx';

export default function BuildLogCard({ update, currentUser, projectOwnerId, userPermission, onLike, onDelete, onOpenProfile }) {
  const [comments, setComments] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  const canDelete = currentUser && (
    update.author_id === currentUser.id
    || userPermission === 'owner'
    || userPermission === 'admin'
  );

  async function toggleComments() {
    if (!showComments && comments === null) {
      const data = await api.getComments(update.id);
      setComments(data);
    }
    setShowComments((v) => !v);
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setCommentBusy(true);
    try {
      const comment = await api.createComment(update.id, commentInput.trim());
      setComments((prev) => [...(prev || []), comment]);
      setCommentInput('');
    } catch { /* ignore */ } finally {
      setCommentBusy(false);
    }
  }

  async function handleDeleteComment(commentId) {
    await api.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <article className="build-log-card">
      <div className="build-log-header">
        <button className="member-row" onClick={() => onOpenProfile(update.author_id)} type="button">
          <Avatar name={update.display_name || update.username} size="sm" />
          <span>
            <strong>{update.display_name || update.username}</strong>
            <small>{formatDate(update.created_at)}</small>
          </span>
        </button>
        <div className="build-log-header-right">
          {update.milestone_tag && <span className="milestone-tag">{update.milestone_tag}</span>}
          {canDelete && (
            <button className="delete-button" onClick={() => onDelete(update.id)} type="button" aria-label="Delete update">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {update.title && <h4 className="build-log-title">{update.title}</h4>}
      <p className="build-log-body">{update.body}</p>

      <div className="build-log-actions">
        <button
          className={`like-button${update.user_liked ? ' liked' : ''}`}
          onClick={() => onLike(update.id)}
          type="button"
          aria-label={update.user_liked ? 'Unlike' : 'Like'}
          disabled={!currentUser}
        >
          <Heart size={16} fill={update.user_liked ? 'currentColor' : 'none'} />
          <span>{Number(update.likes_count) || 0}</span>
        </button>

        <button className="comment-toggle" onClick={toggleComments} type="button">
          <MessageCircle size={16} />
          <span>{Number(update.comments_count) || 0}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {comments && comments.map((c) => (
            <div key={c.id} className="comment-row">
              <Avatar name={c.display_name || c.username} size="sm" />
              <div className="comment-body">
                <strong>{c.display_name || c.username}</strong>
                <span> {c.body}</span>
                <small>{formatDate(c.created_at)}</small>
              </div>
              {currentUser && c.author_id === currentUser.id && (
                <button className="delete-button" onClick={() => handleDeleteComment(c.id)} type="button" aria-label="Delete comment">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          {currentUser && (
            <form className="comment-form" onSubmit={handleComment}>
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
              />
              <button type="submit" disabled={commentBusy || !commentInput.trim()}>Post</button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}
