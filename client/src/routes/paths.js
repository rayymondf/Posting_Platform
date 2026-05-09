export const ROUTES = {
  landing: '/',
  signin: '/signin',
  signup: '/signup',
  home: '/home',
  profiles: '/profiles',
  me: '/me',
  profile: (userId) => `/profiles/${Number(userId)}`
};

export function parsePath(pathname) {
  const path = cleanPath(pathname);

  if (path === ROUTES.landing) {
    return { view: 'feed', path: ROUTES.home, publicMode: 'landing' };
  }

  if (path === ROUTES.signin) {
    return { view: 'feed', path: ROUTES.home, publicMode: 'signin' };
  }

  if (path === ROUTES.signup) {
    return { view: 'feed', path: ROUTES.home, publicMode: 'signup' };
  }

  if (path === ROUTES.home) return { view: 'feed', path: ROUTES.home };
  if (path === ROUTES.profiles) return { view: 'profiles', path: ROUTES.profiles };
  if (path === ROUTES.me) return { view: 'me', path: ROUTES.me };

  const profileMatch = path.match(/^\/profiles\/(\d+)$/);
  if (profileMatch) {
    const userId = Number(profileMatch[1]);
    if (isValidUserId(userId)) {
      return { view: 'profile', userId, path: ROUTES.profile(userId) };
    }
  }

  const legacyUserMatch = path.match(/^\/users\/(\d+)$/);
  if (legacyUserMatch) {
    const userId = Number(legacyUserMatch[1]);
    if (isValidUserId(userId)) {
      return { view: 'profile', userId, path: ROUTES.profile(userId) };
    }
  }

  return { view: 'feed', path: ROUTES.home };
}

export function normalizeRoute(route) {
  if (route.view === 'profiles') return { view: 'profiles', path: ROUTES.profiles };
  if (route.view === 'me') return { view: 'me', path: ROUTES.me };

  if (route.view === 'profile' && isValidUserId(Number(route.userId))) {
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

  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({}, '', path);
}

function cleanPath(pathname) {
  return pathname.replace(/\/+$/, '') || ROUTES.landing;
}

function isValidUserId(userId) {
  return Number.isInteger(userId) && userId > 0;
}
