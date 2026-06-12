export const ROUTES = {
  landing: '/',
  signin: '/signin',
  signup: '/signup',
  home: '/home',
  projects: '/projects',
  newProject: '/projects/new',
  project: (id) => `/projects/${Number(id)}`,
  editProject: (id) => `/projects/${Number(id)}/edit`,
  profiles: '/profiles',
  profile: (userId) => `/profiles/${Number(userId)}`,
  me: '/me',
  messages: '/messages',
};

export function parsePath(pathname) {
  const path = cleanPath(pathname);

  if (path === ROUTES.landing) return { view: 'feed', path: ROUTES.home, publicMode: 'landing' };
  if (path === ROUTES.signin) return { view: 'feed', path: ROUTES.home, publicMode: 'signin' };
  if (path === ROUTES.signup) return { view: 'feed', path: ROUTES.home, publicMode: 'signup' };
  if (path === ROUTES.home) return { view: 'feed', path: ROUTES.home };
  if (path === ROUTES.projects) return { view: 'projects', path: ROUTES.projects };
  if (path === ROUTES.newProject) return { view: 'newProject', path: ROUTES.newProject };
  if (path === ROUTES.profiles) return { view: 'profiles', path: ROUTES.profiles };
  if (path === ROUTES.me) return { view: 'me', path: ROUTES.me };
  if (path === ROUTES.messages) return { view: 'messages', path: ROUTES.messages };

  const editMatch = path.match(/^\/projects\/(\d+)\/edit$/);
  if (editMatch) {
    const projectId = Number(editMatch[1]);
    if (projectId > 0) return { view: 'editProject', projectId, path: ROUTES.editProject(projectId) };
  }

  const projectMatch = path.match(/^\/projects\/(\d+)$/);
  if (projectMatch) {
    const projectId = Number(projectMatch[1]);
    if (projectId > 0) return { view: 'project', projectId, path: ROUTES.project(projectId) };
  }

  const profileMatch = path.match(/^\/profiles\/(\d+)$/);
  if (profileMatch) {
    const userId = Number(profileMatch[1]);
    if (userId > 0) return { view: 'profile', userId, path: ROUTES.profile(userId) };
  }

  return { view: 'feed', path: ROUTES.home };
}

export function normalizeRoute(route) {
  if (route.view === 'projects') return { view: 'projects', path: ROUTES.projects };
  if (route.view === 'newProject') return { view: 'newProject', path: ROUTES.newProject };
  if (route.view === 'profiles') return { view: 'profiles', path: ROUTES.profiles };
  if (route.view === 'me') return { view: 'me', path: ROUTES.me };
  if (route.view === 'messages') return { view: 'messages', path: ROUTES.messages };

  if (route.view === 'project' && Number(route.projectId) > 0) {
    const projectId = Number(route.projectId);
    return { view: 'project', projectId, path: ROUTES.project(projectId) };
  }

  if (route.view === 'editProject' && Number(route.projectId) > 0) {
    const projectId = Number(route.projectId);
    return { view: 'editProject', projectId, path: ROUTES.editProject(projectId) };
  }

  if (route.view === 'profile' && Number(route.userId) > 0) {
    const userId = Number(route.userId);
    return { view: 'profile', userId, path: ROUTES.profile(userId) };
  }

  return { view: 'feed', path: ROUTES.home };
}

export function getAuthModeFromRoute(route) {
  return route.publicMode || 'landing';
}

export function getPathForAuthMode(mode) {
  if (mode === 'signin') return ROUTES.signin;
  if (mode === 'signup') return ROUTES.signup;
  return ROUTES.landing;
}

export function writePath(path, replace = false) {
  if (window.location.pathname === path) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
}

function cleanPath(pathname) {
  return pathname.replace(/\/+$/, '') || ROUTES.landing;
}
