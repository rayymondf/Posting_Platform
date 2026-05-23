import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client.js';
import Avatar from './Avatar.jsx';
import { formatDate } from '../utils/format.js';

export default function MessagesView({ currentUser, users, onOpenProfile }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewDm, setShowNewDm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getConversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    api.getMessages(activeConvId).then(setMessages).catch(() => {});
  }, [activeConvId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function openConversation(convId) {
    setActiveConvId(convId);
    setShowNewDm(false);
  }

  async function startDm(userId) {
    const conv = await api.getOrCreateConversation(userId).catch(() => null);
    if (!conv) return;
    const convs = await api.getConversations().catch(() => conversations);
    setConversations(convs);
    setShowNewDm(false);
    setUserSearch('');
    openConversation(conv.id);
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || sending || !activeConvId) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(activeConvId, content);
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
      // refresh conversation list to update last_message
      api.getConversations().then(setConversations).catch(() => {});
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(msgId) {
    await api.deleteMessage(msgId).catch(() => {});
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="messages-view">
      {/* Conversation list */}
      <div className={`conv-list ${activeConvId ? 'conv-list-hidden' : ''}`}>
        <div className="conv-list-header">
          <h2>Messages</h2>
          <button
            className="new-dm-btn"
            type="button"
            onClick={() => { setShowNewDm((v) => !v); setActiveConvId(null); }}
          >
            +
          </button>
        </div>

        {showNewDm ? (
          <div className="new-dm-panel">
            <input
              className="new-dm-search"
              placeholder="Search users…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              autoFocus
            />
            <div className="new-dm-list">
              {filteredUsers.slice(0, 20).map((u) => (
                <button
                  key={u.id}
                  className="conv-row"
                  type="button"
                  onClick={() => startDm(u.id)}
                >
                  <Avatar name={u.username} size="sm" />
                  <span className="conv-name">{u.username}</span>
                </button>
              ))}
              {filteredUsers.length === 0 ? (
                <p className="conv-empty">No users found</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {conversations.length === 0 && !showNewDm ? (
          <p className="conv-empty">No conversations yet. Start one with +</p>
        ) : null}

        {conversations.map((conv) => (
          <button
            key={conv.id}
            className={`conv-row ${conv.id === activeConvId ? 'conv-row-active' : ''}`}
            type="button"
            onClick={() => openConversation(conv.id)}
          >
            <Avatar name={conv.other_username} size="sm" />
            <span className="conv-info">
              <strong className="conv-name">{conv.other_username}</strong>
              {conv.last_message ? (
                <small className="conv-preview">{conv.last_message}</small>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {/* Message thread */}
      <div className={`message-thread ${activeConvId ? 'message-thread-active' : ''}`}>
        {activeConvId && activeConv ? (
          <>
            <div className="thread-header">
              <button
                className="thread-back"
                type="button"
                onClick={() => setActiveConvId(null)}
                aria-label="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                className="thread-user"
                type="button"
                onClick={() => onOpenProfile(activeConv.other_user_id)}
              >
                <Avatar name={activeConv.other_username} size="sm" />
                <strong>{activeConv.other_username}</strong>
              </button>
            </div>

            <div className="thread-messages">
              {messages.map((msg) => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} className={`msg-bubble-wrap ${isMine ? 'msg-mine' : 'msg-theirs'}`}>
                    <div className="msg-bubble">
                      <p>{msg.content}</p>
                      <span className="msg-time">{formatDate(msg.created_at)}</span>
                    </div>
                    {isMine ? (
                      <button
                        className="msg-delete"
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        aria-label="Delete message"
                      >
                        <Trash2 size={13} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form className="thread-composer" onSubmit={handleSend}>
              <input
                className="thread-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Write a message…"
                maxLength={1000}
              />
              <button
                className="thread-send"
                type="submit"
                disabled={!newMessage.trim() || sending}
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="thread-empty">
            <p>Select a conversation or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
