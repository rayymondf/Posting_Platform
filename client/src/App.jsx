import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api/client.js';
import AppShell from './components/AppShell.jsx';
import EmptyState from './components/EmptyState.jsx';
import Feed from './components/Feed.jsx';
import ProfileDirectory from './components/ProfileDirectory.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import PublicPage from './components/PublicPage.jsx';
import {
  getAuthModeFromRoute,
  getPathForAuthMode,
  normalizeRoute,
  parsePath,
  ROUTES,
  writePath
} from './routes/paths.js';

const initialView = 'feed';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('landing');
  const [activeView, setActiveView] = useState(initialView);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileSearch, setProfileSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async () => {
    const nextPosts = await api.getPosts();
    setPosts(nextPosts);
    return nextPosts;
  }, []);

  const loadUsers = useCallback(async (search = '') => {
    const nextUsers = await api.getUsers(search);
    setUsers(nextUsers);
    return nextUsers;
  }, []);

  const loadAppData = useCallback(async () => {
    await Promise.all([loadPosts(), loadUsers(profileSearch)]);
  }, [loadPosts, loadUsers, profileSearch]);

  const openRoute = useCallback(async (route, options = {}) => {
    const { replace = false, updateUrl = true } = options;
    const nextRoute = normalizeRoute(route);

    setError('');

    if (updateUrl) {
      writePath(nextRoute.path, replace);
    }

    if (nextRoute.view !== 'profile') {
      setSelectedProfile(null);
      setActiveView(nextRoute.view);
      return;
    }

    setBusy(true);
    try {
      const profile = await api.getUser(nextRoute.userId);
      setSelectedProfile(profile);
      setActiveView('profile');
    } catch (err) {
      setSelectedProfile(null);
      setActiveView('profiles');
      setError(err.message);
      if (updateUrl || nextRoute.view === 'profile') {
        writePath(ROUTES.profiles, true);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const route = parsePath(window.location.pathname);
        const session = await api.me();
        if (session?.user) {
          setCurrentUser(session.user);
          await Promise.all([loadPosts(), loadUsers()]);
          await openRoute(route, { replace: true });
        } else {
          setAuthMode(getAuthModeFromRoute(route));
          if (!route.publicMode) {
            writePath('/', true);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, [loadPosts, loadUsers, openRoute]);

  useEffect(() => {
    function handlePopState() {
      const route = parsePath(window.location.pathname);

      if (!currentUser) {
        setError('');
        setAuthMode(getAuthModeFromRoute(route));
        return;
      }

      openRoute(route, { updateUrl: false });
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, openRoute]);

  const myPosts = useMemo(() => {
    if (!currentUser) return [];
    return posts.filter((post) => post.user_id === currentUser.id);
  }, [currentUser, posts]);

  async function handleAuth({ username, password, mode }) {
    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const response = mode === 'signup'
        ? await api.register(username, password)
        : await api.login(username, password);
      setCurrentUser(response.user);
      await loadAppData();
      await openRoute({ view: initialView }, { replace: true });
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
      await loadAppData();
      await openRoute({ view: initialView }, { replace: true });
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
      setActiveView(initialView);
      setAuthMode('landing');
      writePath('/', true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePost(content) {
    setBusy(true);
    setError('');
    try {
      const post = await api.createPost(content);
      setPosts((currentPosts) => [post, ...currentPosts]);
      setUsers((currentUsers) => currentUsers.map((user) => (
        user.id === post.user_id
          ? { ...user, posts_count: Number(user.posts_count || 0) + 1 }
          : user
      )));
      setSelectedProfile((profile) => {
        if (profile?.id !== post.user_id) return profile;
        return {
          ...profile,
          posts_count: Number(profile.posts_count || 0) + 1,
          posts: [post, ...(profile.posts || [])]
        };
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLike(postId) {
    setError('');
    try {
      const response = await api.toggleLike(postId);
      patchPost(postId, {
        likes_count: response.likes_count,
        user_liked: response.user_liked
      });
    } catch (err) {
      setError(err.message);
    }
  }

  function patchPost(postId, updates) {
    const update = (post) => (post.id === postId ? { ...post, ...updates } : post);
    setPosts((currentPosts) => currentPosts.map(update));
    setSelectedProfile((profile) => {
      if (!profile?.posts) return profile;
      return { ...profile, posts: profile.posts.map(update) };
    });
  }

  async function handleSearchProfiles(search) {
    setProfileSearch(search);
    setError('');
    try {
      await loadUsers(search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleOpenProfile(userId) {
    await openRoute({ view: 'profile', userId });
  }

  async function handleNavigate(view) {
    setError('');
    await openRoute({ view });
  }

  function handleAuthModeChange(mode) {
    setError('');
    setAuthMode(mode);
    writePath(getPathForAuthMode(mode), false);
  }

  if (loading) {
    return (
      <main className="boot-screen">
        <div className="brand-mark">I</div>
        <p>Loading Instigator</p>
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
  const myProfile = {
    ...currentUser,
    posts_count: myPosts.length
  };

  return (
    <AppShell
      activeView={activeView}
      currentUser={currentUser}
      title={title}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
    >
      {error ? <p className="app-error">{error}</p> : null}
      {activeView === 'feed' ? (
        <Feed
          currentUser={currentUser}
          posts={posts}
          onPost={handleCreatePost}
          onLike={handleLike}
          onOpenProfile={handleOpenProfile}
          busy={busy}
        />
      ) : null}

      {activeView === 'profiles' ? (
        <ProfileDirectory
          users={users}
          search={profileSearch}
          onSearch={handleSearchProfiles}
          onOpenProfile={handleOpenProfile}
        />
      ) : null}

      {activeView === 'me' ? (
        <ProfilePage
          profile={myProfile}
          posts={myPosts}
          isCurrentUser
          onLike={handleLike}
          onOpenProfile={handleOpenProfile}
        />
      ) : null}

      {activeView === 'profile' && selectedProfile ? (
        <ProfilePage
          profile={selectedProfile}
          posts={selectedProfile.posts || []}
          isCurrentUser={selectedProfile.id === currentUser.id}
          onLike={handleLike}
          onOpenProfile={handleOpenProfile}
        />
      ) : null}

      {activeView === 'profile' && !selectedProfile ? (
        <EmptyState title="Profile unavailable" text="Choose a profile from the directory." />
      ) : null}
    </AppShell>
  );
}

function getTitle(activeView, selectedProfile) {
  if (activeView === 'profiles') return 'Profiles';
  if (activeView === 'me') return 'My Profile';
  if (activeView === 'profile') return selectedProfile?.username || 'Profile';
  return 'Home';
}
