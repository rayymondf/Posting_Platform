const jsonHeaders = { 'Content-Type': 'application/json' };

export const api = {
  me: () => request('/api/auth/me', { allowUnauthorized: true }),
  register: (username, password) => post('/api/auth/register', { username, password }),
  login: (username, password) => post('/api/auth/login', { username, password }),
  guestLogin: () => post('/api/auth/guest-login'),
  logout: () => post('/api/auth/logout'),
  getPosts: () => request('/api/posts'),
  createPost: (content) => post('/api/posts', { content }),
  deletePost: (postId) => del(`/api/posts/${postId}`),
  toggleLike: (postId) => post(`/api/posts/${postId}/like`),
  getUsers: (search = '') => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/api/users${query}`);
  },
  getUser: (userId) => request(`/api/users/${userId}`),
  getConversations: () => request('/api/conversations'),
  getOrCreateConversation: (recipientId) => post('/api/conversations', { recipientId }),
  getMessages: (conversationId) => request(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, content) => post(`/api/conversations/${conversationId}/messages`, { content }),
  deleteMessage: (messageId) => del(`/api/messages/${messageId}`)
};

async function post(url, body) {
  return request(url, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body)
  });
}

async function del(url) {
  return request(url, { method: 'DELETE' });
}

async function request(url, options = {}) {
  const { allowUnauthorized, ...fetchOptions } = options;
  let response;

  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...fetchOptions
    });
  } catch {
    throw new Error('Unable to reach the server. Make sure the app backend is running.');
  }

  if (allowUnauthorized && response.status === 401) {
    return null;
  }

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data?.error || response.statusText || 'Request failed');
  }

  return data;
}

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
