import { Heart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api/client.js';
import Avatar from './components/Avatar.jsx';
import AppShell from './components/AppShell.jsx';
import EmptyState from './components/EmptyState.jsx';
import MessagesView from './components/MessagesView.jsx';
import ProfileDirectory from './components/ProfileDirectory.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import ProjectForm from './components/ProjectForm.jsx';
import ProjectsPage from './components/ProjectsPage.jsx';
import PublicPage from './components/PublicPage.jsx';
import { formatDate } from './utils/format.js';
import {
  getAuthModeFromRoute,
  getPathForAuthMode,
  normalizeRoute,
  parsePath,
  ROUTES,
  writePath
} from './routes/paths.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('landing');
  const [activeView, setActiveView] = useState('feed');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [feedUpdates, setFeedUpdates] = useState([]);
  const [feedSort, setFeedSort] = useState('ranked');
  const [feedLoading, setFeedLoading] = useState(false);

  const loadUsers = useCallback(async (search = '') => {
    const data = await api.getUsers(search);
    setUsers(data);
  }, []);

  const loadFeed = useCallback(async (sort = 'ranked') => {
    setFeedLoading(true);
    try {
      const data = await api.getFeed(sort);
      setFeedUpdates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const openRoute = useCallback(async (route, options = {}) => {
    const { replace = false, updateUrl = true } = options;
    const next = normalizeRoute(route);
    setError('');
    if (updateUrl) writePath(next.path, replace);

    if (next.view === 'profile') {
      setBusy(true);
      try {
        const profile = await api.getUser(next.userId);
        setSelectedProfile(profile);
        setActiveView('profile');
      } catch (err) {
        setError(err.message);
        setActiveView('profiles');
        if (updateUrl) writePath(ROUTES.profiles, true);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (next.view === 'project' || next.view === 'editProject') {
      setActiveProjectId(next.projectId);
    } else {
      setActiveProjectId(null);
    }
    setSelectedProfile(null);
    setActiveView(next.view);
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const route = parsePath(window.location.pathname);
        const session = await api.me();
        if (session?.user) {
          setCurrentUser(session.user);
          await Promise.all([loadUsers(), loadFeed()]);
          await openRoute(route, { replace: true });
        } else {
          setAuthMode(getAuthModeFromRoute(route));
          if (!route.publicMode) writePath('/', true);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    boot();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handlePopState() {
      const route = parsePath(window.location.pathname);
      if (!currentUser) { setError(''); setAuthMode(getAuthModeFromRoute(route)); return; }
      openRoute(route, { updateUrl: false });
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, openRoute]);

  async function handleAuth({ username, password, mode }) {
    if (!username || !password) { setError('Username and password are required.'); return; }
    setBusy(true);
    setError('');
    try {
      const response = mode === 'signup'
        ? await api.register(username, password)
        : await api.login(username, password);
      setCurrentUser(response.user);
      await Promise.all([loadUsers(), loadFeed()]);
      await openRoute({ view: 'feed' }, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGuestLogin() {
    setBusy(true);
    setError('');
    try {
      const response = await api.guestLogin();
      setCurrentUser(response.user);
      await Promise.all([loadUsers(), loadFeed()]);
      await openRoute({ view: 'projects' }, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    setError('');
    try {
      await api.logout();
      setCurrentUser(null);
      setSelectedProfile(null);
      setActiveView('feed');
      setAuthMode('landing');
      writePath('/', true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleNavigate(view) {
    setError('');
    if (view === 'feed' && activeView === 'feed') { loadFeed(feedSort); return; }
    openRoute({ view });
  }

  function handleAuthModeChange(mode) {
    setError('');
    setAuthMode(mode);
    writePath(getPathForAuthMode(mode), false);
  }

  function handleOpenProject(projectId) {
    setError('');
    openRoute({ view: 'project', projectId });
  }

  function handleNewProject() {
    setError('');
    openRoute({ view: 'newProject' });
  }

  function handleEditProject(projectId) {
    setError('');
    openRoute({ view: 'editProject', projectId });
  }

  async function handleOpenProfile(userId) {
    await openRoute({ view: 'profile', userId });
  }

  async function handleSearchProfiles(search) {
    setProfileSearch(search);
    setError('');
    try { await loadUsers(search); } catch (err) { setError(err.message); }
  }

  function handleProjectFormSuccess(projectId) {
    openRoute({ view: 'project', projectId });
  }

  async function handleFeedLike(updateId) {
    try {
      const res = await api.toggleLike(updateId);
      setFeedUpdates((prev) => prev.map((u) => u.id === updateId ? { ...u, likes_count: res.likes_count, user_liked: res.user_liked } : u));
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadMyProfile() {
    return api.getUser(currentUser.id);
  }

  if (loading) {
    return (
      <main className="boot-screen">
        <div className="boot-brand">⚡ BuildBoard</div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <PublicPage
        mode={authMode}
        onModeChange={handleAuthModeChange}
        onSubmit={handleAuth}
        onGuest={handleGuestLogin}
        error={error}
        busy={busy}
      />
    );
  }

  const title = getTitle(activeView, selectedProfile);

  return (
    <AppShell
      activeView={activeView}
      currentUser={currentUser}
      title={title}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    >
      {error ? <p className="app-error">{error}</p> : null}

      {activeView === 'feed' && (
        <FeedView
          updates={feedUpdates}
          sort={feedSort}
          loading={feedLoading}
          currentUser={currentUser}
          onSortChange={(s) => { setFeedSort(s); loadFeed(s); }}
          onLike={handleFeedLike}
          onOpenProject={handleOpenProject}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {activeView === 'projects' && (
        <ProjectsPage
          currentUser={currentUser}
          onOpenProject={handleOpenProject}
          onNewProject={handleNewProject}
        />
      )}

      {activeView === 'project' && activeProjectId && (
        <ProjectDetail
          key={activeProjectId}
          projectId={activeProjectId}
          currentUser={currentUser}
          onBack={() => openRoute({ view: 'projects' })}
          onEdit={handleEditProject}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {activeView === 'newProject' && (
        <ProjectForm
          onSuccess={handleProjectFormSuccess}
          onCancel={() => openRoute({ view: 'projects' })}
        />
      )}

      {activeView === 'editProject' && activeProjectId && (
        <ProjectForm
          key={activeProjectId}
          projectId={activeProjectId}
          onSuccess={handleProjectFormSuccess}
          onCancel={() => openRoute({ view: 'project', projectId: activeProjectId })}
        />
      )}

      {activeView === 'profiles' && (
        <ProfileDirectory
          users={users}
          search={profileSearch}
          onSearch={handleSearchProfiles}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {activeView === 'me' && (
        <MyProfileView
          currentUser={currentUser}
          onOpenProject={handleOpenProject}
          onLoad={loadMyProfile}
        />
      )}

      {activeView === 'profile' && selectedProfile && (
        <ProfilePage
          profile={selectedProfile}
          currentUser={currentUser}
          isCurrentUser={selectedProfile.id === currentUser.id}
          onOpenProject={handleOpenProject}
        />
      )}

      {activeView === 'profile' && !selectedProfile && !busy && (
        <EmptyState title="Profile unavailable" text="Choose a profile from the directory." />
      )}

      {activeView === 'messages' && (
        <MessagesView
          currentUser={currentUser}
          users={users}
          onOpenProfile={handleOpenProfile}
        />
      )}
    </AppShell>
  );
}

function FeedView({ updates, sort, loading, currentUser, onSortChange, onLike, onOpenProject, onOpenProfile }) {
  return (
    <div className="feed-view">
      <div className="feed-header">
        <div>
          <h2>{sort === 'ranked' ? '⚡ Active Engineering Projects' : '🕐 Most Recent'}</h2>
          <p className="feed-subtitle">Build logs from the community</p>
        </div>
        <div className="feed-sort">
          <button className={sort === 'ranked' ? 'active' : ''} type="button" onClick={() => onSortChange('ranked')}>Most Active</button>
          <button className={sort === 'recent' ? 'active' : ''} type="button" onClick={() => onSortChange('recent')}>Recent</button>
        </div>
      </div>
      {loading ? (
        <div className="loading-state">Loading feed…</div>
      ) : updates.length ? (
        <div className="feed-list">
          {updates.map((u) => (
            <FeedCard key={u.id} update={u} currentUser={currentUser} onLike={onLike} onOpenProject={onOpenProject} onOpenProfile={onOpenProfile} />
          ))}
        </div>
      ) : (
        <EmptyState title="No build logs yet" text="Create a project and post the first build log." />
      )}
    </div>
  );
}

function FeedCard({ update, currentUser, onLike, onOpenProject, onOpenProfile }) {
  return (
    <article className="feed-card">
      <div className="feed-card-project">
        <button className="link-inline" onClick={() => onOpenProject(update.project_id)} type="button">
          {update.project_title}
        </button>
        <span className="category-tag small">{update.category}</span>
      </div>
      <div className="feed-card-author">
        <button type="button" onClick={() => onOpenProfile(update.author_id)} className="member-row">
          <Avatar name={update.display_name || update.username} size="sm" />
          <span>{update.display_name || update.username}</span>
        </button>
        {update.milestone_tag && <span className="milestone-tag">{update.milestone_tag}</span>}
        <span className="muted-text">{formatDate(update.created_at)}</span>
      </div>
      {update.title && <h4 className="feed-card-title">{update.title}</h4>}
      <p className="feed-card-body">{update.body.slice(0, 240)}{update.body.length > 240 ? '…' : ''}</p>
      <div className="build-log-actions">
        <button
          className={`like-button${update.user_liked ? ' liked' : ''}`}
          onClick={() => onLike(update.id)}
          type="button"
          disabled={!currentUser}
          aria-label={update.user_liked ? 'Unlike' : 'Like'}
        >
          <Heart size={16} fill={update.user_liked ? 'currentColor' : 'none'} />
          <span>{Number(update.likes_count) || 0}</span>
        </button>
        <button className="btn-ghost small" onClick={() => onOpenProject(update.project_id)} type="button">
          View Project →
        </button>
      </div>
    </article>
  );
}

function MyProfileView({ currentUser, onOpenProject, onLoad }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    onLoad()
      .then(setProfile)
      .catch((err) => setError(err?.message || 'Failed to load profile'));
  }, [currentUser.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="app-error">{error}</p>;
  if (!profile) return <div className="loading-state">Loading profile…</div>;
  return <ProfilePage profile={profile} currentUser={currentUser} isCurrentUser onOpenProject={onOpenProject} />;
}

function getTitle(view, selectedProfile) {
  if (view === 'projects') return 'Projects';
  if (view === 'newProject') return 'New Project';
  if (view === 'editProject') return 'Edit Project';
  if (view === 'profiles') return 'Engineers';
  if (view === 'me') return 'My Profile';
  if (view === 'messages') return 'Messages';
  if (view === 'profile') return selectedProfile?.display_name || selectedProfile?.username || 'Profile';
  return 'Home';
}
