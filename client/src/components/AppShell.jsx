import { Home, LogOut, MessageCircle, UserRound, Users } from 'lucide-react';
import Avatar from './Avatar.jsx';

const navItems = [
  { id: 'feed', label: 'Home', icon: Home },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'me', label: 'My Profile', icon: UserRound }
];

export default function AppShell({ activeView, currentUser, title, children, onLogout, onNavigate }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <nav aria-label="Primary">
          {navItems.map((item) => {
            const isActive = activeView === item.id || (activeView === 'profile' && item.id === 'profiles');
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`nav-item${isActive ? ' active' : ''}`}
                type="button"
                onClick={() => onNavigate(item.id)}
              >
                <item.icon size={22} aria-hidden="true" />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="account-pill" type="button" onClick={() => onNavigate('me')}>
            <Avatar name={currentUser.username} size="sm" />
            <span className="account-pill-info">
              <strong>{currentUser.username}</strong>
              <small>@{currentUser.username.toLowerCase()}</small>
            </span>
          </button>
          <button className="logout-btn" type="button" onClick={onLogout} aria-label="Logout">
            <LogOut size={20} />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="timeline">
        {activeView !== 'profile' && activeView !== 'me' && activeView !== 'messages' ? (
          <header className="timeline-header">
            <h1>{title}</h1>
          </header>
        ) : null}
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Mobile">
        {navItems.map((item) => {
          const isActive = activeView === item.id || (activeView === 'profile' && item.id === 'profiles');
          return (
            <button
              key={item.id}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={isActive ? 'active' : ''}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={22} aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
