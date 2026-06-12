const jsonHeaders = { 'Content-Type': 'application/json' };

export const api = {
  // Auth
  me: () => request('/api/auth/me', { allowUnauthorized: true }),
  register: (username, password) => post('/api/auth/register', { username, password }),
  login: (username, password) => post('/api/auth/login', { username, password }),
  guestLogin: () => post('/api/auth/guest-login'),
  logout: () => post('/api/auth/logout'),
  updateProfile: (data) => patch('/api/auth/profile', data),

  // Projects
  getProjects: (params = {}) => request('/api/projects' + buildQuery(params)),
  getProject: (id) => request(`/api/projects/${id}`),
  createProject: (data) => post('/api/projects', data),
  updateProject: (id, data) => patch(`/api/projects/${id}`, data),
  deleteProject: (id) => del(`/api/projects/${id}`),

  // Project roles
  createRole: (projectId, data) => post(`/api/projects/${projectId}/roles`, data),
  updateRole: (roleId, data) => patch(`/api/roles/${roleId}`, data),
  deleteRole: (roleId) => del(`/api/roles/${roleId}`),

  // Join requests
  submitJoinRequest: (projectId, data) => post(`/api/projects/${projectId}/join-requests`, data),
  getJoinRequests: (projectId) => request(`/api/projects/${projectId}/join-requests`),
  respondToJoinRequest: (requestId, status) => patch(`/api/join-requests/${requestId}`, { status }),

  // Build log updates
  getUpdates: (projectId) => request(`/api/projects/${projectId}/updates`),
  createUpdate: (projectId, data) => post(`/api/projects/${projectId}/updates`, data),
  deleteUpdate: (updateId) => del(`/api/updates/${updateId}`),

  // Comments
  getComments: (updateId) => request(`/api/updates/${updateId}/comments`),
  createComment: (updateId, body) => post(`/api/updates/${updateId}/comments`, { body }),
  deleteComment: (commentId) => del(`/api/comments/${commentId}`),

  // Likes
  toggleLike: (updateId) => post(`/api/updates/${updateId}/like`),

  // Feed
  getFeed: (sort = 'ranked') => request(`/api/feed?sort=${sort}`),

  // Search
  search: (params = {}) => request('/api/search' + buildQuery(params)),

  // Users
  getUsers: (search = '') => request(`/api/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getUser: (userId) => request(`/api/users/${userId}`),

  // Messaging (DMs)
  getConversations: () => request('/api/conversations'),
  getOrCreateConversation: (recipientId) => post('/api/conversations', { recipientId }),
  getMessages: (conversationId) => request(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, content) => post(`/api/conversations/${conversationId}/messages`, { content }),
  deleteMessage: (messageId) => del(`/api/messages/${messageId}`),
};

function buildQuery(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

async function post(url, body) {
  return request(url, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(body) });
}

async function patch(url, body) {
  return request(url, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(body) });
}

async function del(url) {
  return request(url, { method: 'DELETE' });
}

async function request(url, options = {}) {
  const { allowUnauthorized, ...fetchOptions } = options;
  let response;
  try {
    response = await fetch(url, { credentials: 'same-origin', ...fetchOptions });
  } catch {
    throw new Error('Unable to reach the server. Make sure the app backend is running.');
  }
  if (allowUnauthorized && response.status === 401) return null;
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data?.error || response.statusText || 'Request failed');
  return data;
}

async function parseJson(response) {
  try { return await response.json(); } catch { return null; }
}
