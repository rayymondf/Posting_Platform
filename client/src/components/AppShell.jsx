import { Home, LogOut, UserRound, Users } from 'lucide-react';
import Avatar from './Avatar.jsx';
import Button from './Button.jsx';

const navItems = [
  { id: 'feed', label: 'Home', icon: Home },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'me', label: 'My Profile', icon: UserRound }
];

export default function AppShell({
  activeView,
  currentUser,
  title,
  children,
  onLogout,
  onNavigate
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="sidebar-brand" type="button" onClick={() => onNavigate('feed')}>
          Instigator
        </button>
        <nav aria-label="Primary">
          {navItems.map((item) => (
            <button
              className={activeView === item.id ? 'nav-item active' : 'nav-item'}
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <item.icon size={21} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="account-pill" type="button" onClick={() => onNavigate('me')}>
            <Avatar name={currentUser.username} size="sm" />
            <span>
              <strong>{currentUser.username}</strong>
              <small>@{currentUser.username.toLowerCase()}</small>
            </span>
          </button>
          <Button icon={LogOut} variant="soft" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </aside>

      <main className="timeline">
        {activeView !== 'profile' ? (
          <header className="timeline-header">
            <h1>{title}</h1>
          </header>
        ) : null}
        {children}
      </main>

      <aside className="right-panel">
        <section>
          <h2>Account</h2>
          <button className="profile-mini" type="button" onClick={() => onNavigate('me')}>
            <Avatar name={currentUser.username} />
            <span>
              <strong>{currentUser.username}</strong>
              <small>@{currentUser.username.toLowerCase()}</small>
            </span>
          </button>
        </section>
      </aside>

      <nav className="mobile-nav" aria-label="Mobile">
        {navItems.map((item) => (
          <button
            className={activeView === item.id ? 'active' : ''}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
          >
            <item.icon size={22} aria-hidden="true" />
          </button>
        ))}
      </nav>
    </div>
  );
}
