import { FolderOpen, Home, LogOut, MessageCircle, UserRound, Users } from 'lucide-react';
import Avatar from './Avatar.jsx';

const navItems = [
  { id: 'feed', label: 'Home', icon: Home },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'profiles', label: 'Engineers', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'me', label: 'My Profile', icon: UserRound },
];

export default function AppShell({ activeView, currentUser, title, children, onLogout, onNavigate }) {
  const isProjectView = activeView === 'project' || activeView === 'editProject' || activeView === 'newProject';
  const isProfileView = activeView === 'profile' || activeView === 'me';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => onNavigate('feed')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onNavigate('feed')}>
          <span className="brand-icon">⚡</span>
          <span className="brand-name nav-label">BuildBoard</span>
        </div>
        <nav aria-label="Primary">
          {navItems.map((item) => {
            const isActive = activeView === item.id
              || (item.id === 'projects' && isProjectView)
              || (item.id === 'profiles' && activeView === 'profile');
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
            <Avatar name={currentUser.display_name || currentUser.username} size="sm" />
            <span className="account-pill-info">
              <strong>{currentUser.display_name || currentUser.username}</strong>
              <small>@{currentUser.username}</small>
            </span>
          </button>
          <button className="logout-btn" type="button" onClick={onLogout} aria-label="Logout">
            <LogOut size={20} />
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="timeline">
        {!isProjectView && !isProfileView && activeView !== 'messages' ? (
          <header className="timeline-header">
            <h1>{title}</h1>
          </header>
        ) : null}
        {children}
      </main>

      <nav className="mobile-nav" aria-label="Mobile">
        {navItems.map((item) => {
          const isActive = activeView === item.id
            || (item.id === 'projects' && isProjectView)
            || (item.id === 'profiles' && activeView === 'profile');
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
