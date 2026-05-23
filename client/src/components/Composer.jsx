import { Send } from 'lucide-react';
import { useState } from 'react';
import Avatar from './Avatar.jsx';
import Button from './Button.jsx';

const maxLength = 280;

export default function Composer({ currentUser, onSubmit, disabled }) {
  const [content, setContent] = useState('');
  const remaining = maxLength - content.length;

  async function handleSubmit(e) {
    e.preventDefault();
    const text = content.trim();
    if (!text || disabled) return;
    await onSubmit(text);
    setContent('');
  }

  return (
    <section className="composer">
      <Avatar name={currentUser.username} />
      <form className="composer-form" onSubmit={handleSubmit}>
        <textarea
          value={content}
          maxLength={maxLength}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          rows="3"
        />
        <div className="composer-actions">
          <span className={remaining < 30 ? 'count count-low' : 'count'}>{remaining}</span>
          <Button icon={Send} type="submit" disabled={!content.trim() || disabled}>
            Post
          </Button>
        </div>
      </form>
    </section>
  );
}
