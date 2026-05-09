// ========================================
// API Client Functions
// ========================================
const API = {
  // Auth
  async register(username, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async guestLogin() {
    const res = await fetch('/api/auth/guest-login', { method: 'POST' });
    return res.json();
  },

  async logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me');
    if (res.status === 401) return null;
    return res.json();
  },

  // Posts
  async getPosts() {
    const res = await fetch('/api/posts');
    return res.json();
  },

  async createPost(content) {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return res.json();
  },

  async deletePost(id) {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async likePost(id) {
    const res = await fetch(`/api/posts/${id}/like`, { method: 'POST' });
    return res.json();
  },

  // Comments
  async getComments(postId) {
    const res = await fetch(`/api/posts/${postId}/comments`);
    return res.json();
  },

  async createComment(postId, content) {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return res.json();
  },

  // Users
  async getUsers(search = '') {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`/api/users${params}`);
    return res.json();
  },

  async getUser(id) {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  }
};

// ========================================
// State Management
// ========================================
const app = {
  user: null,
  currentPage: 'home',
  posts: [],
  users: [],
  selectedUser: null,
  expandedComments: {},

  async init() {
    const auth = await API.getMe();
    this.user = auth?.user || null;
    this.render();

    if (this.user) {
      await this.loadPosts();
    }
  },

  async loadPosts() {
    this.posts = await API.getPosts();
    this.render();
  },

  async loadUsers(search = '') {
    this.users = await API.getUsers(search);
    this.render();
  },

  setPage(page) {
    this.currentPage = page;
    if (page === 'users') {
      this.loadUsers();
    } else if (page === 'home') {
      this.loadPosts();
    }
  },

  // ========================================
  // Render Method
  // ========================================
  render() {
    const root = document.getElementById('app');

    if (!this.user) {
      root.innerHTML = this.renderAuthPage();
      this.attachAuthListeners();
      return;
    }

    root.innerHTML = this.renderApp();
    this.attachAppListeners();
  },

  // ========================================
  // Auth Pages
  // ========================================
  renderAuthPage() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <div class="auth-icon">🔥</div>
            <h1 class="auth-title">Welcome Back</h1>
            <p class="auth-subtitle">Sign in to Instigator</p>
          </div>

          <div id="auth-message"></div>

          <form id="auth-form">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" placeholder="Enter your username" required>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>

            <div class="auth-actions">
              <button type="submit" class="btn btn-primary" id="login-btn">Sign In</button>
              <button type="button" class="btn btn-secondary" id="register-btn">Register</button>
            </div>
          </form>

          <div class="auth-divider">Or continue with</div>

          <button type="button" class="btn btn-secondary" id="guest-btn" style="width: 100%;">
            Continue as Guest
          </button>
        </div>
      </div>
    `;
  },

  // ========================================
  // Main App Layout
  // ========================================
  renderApp() {
    return `
      <div class="app-container">
        <sidebar class="sidebar">
          <div class="sidebar-content">
            <div class="sidebar-logo">
              <div class="sidebar-logo-icon">🔥</div>
              <div class="sidebar-logo-text">Instigator</div>
            </div>

            <nav class="sidebar-nav">
              <a class="nav-item ${this.currentPage === 'home' ? 'active' : ''}" data-page="home">
                <span class="nav-icon">🏠</span>
                Home
              </a>
              <a class="nav-item ${this.currentPage === 'users' ? 'active' : ''}" data-page="users">
                <span class="nav-icon">👥</span>
                Users
              </a>
              ${this.user.username !== 'Guest' ? `
                <a class="nav-item ${this.currentPage === 'profile' ? 'active' : ''}" data-page="profile">
                  <span class="nav-icon">👤</span>
                  Profile
                </a>
              ` : ''}
            </nav>

            <div class="user-section">
              <div class="user-profile" data-page="profile">
                <div class="user-avatar">${this.user.username.charAt(0).toUpperCase()}</div>
                <div class="user-info">
                  <div class="user-name">${this.user.username}</div>
                  <div class="user-status">${this.user.username === 'Guest' ? 'Guest User' : 'Active'}</div>
                </div>
              </div>
              <button class="logout-btn" id="logout-btn">Logout</button>
            </div>
          </div>
        </sidebar>

        <main class="main-content">
          ${this.renderCurrentPage()}
        </main>
      </div>
    `;
  },

  renderCurrentPage() {
    switch (this.currentPage) {
      case 'home':
        return this.renderHomePage();
      case 'users':
        return this.renderUsersPage();
      case 'profile':
        return this.renderProfilePage();
      default:
        return this.renderHomePage();
    }
  },

  // ========================================
  // Home Page
  // ========================================
  renderHomePage() {
    return `
      <div class="feed-header">
        <h1 class="page-title">Home</h1>
        <p class="page-subtitle">What's happening?</p>
      </div>

      ${this.user.username !== 'Guest' ? this.renderComposer() : ''}

      <div id="posts-container">
        ${this.posts.map(post => this.renderPost(post)).join('')}
      </div>

      ${this.posts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <h2 class="empty-state-title">No posts yet</h2>
          <p class="empty-state-text">Be the first to share something!</p>
        </div>
      ` : ''}
    `;
  },

  renderComposer() {
    return `
      <div class="post-composer">
        <div class="composer-header">
          <div class="composer-avatar">${this.user.username.charAt(0).toUpperCase()}</div>
          <div class="composer-meta">
            <div class="composer-name">${this.user.username}</div>
          </div>
        </div>
        <textarea class="composer-textarea" id="post-content" placeholder="What's on your mind?"></textarea>
        <div class="composer-footer">
          <button class="btn btn-secondary" id="post-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="post-submit-btn">Post</button>
        </div>
      </div>
    `;
  },

  renderPost(post) {
    const timestamp = new Date(post.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="post-item" data-post-id="${post.id}">
        <div class="post-header">
          <div class="post-author-info">
            <div class="post-avatar">${post.username.charAt(0).toUpperCase()}</div>
            <div class="post-author">
              <div class="post-username" data-user-id="${post.user_id}">${post.username}</div>
              <div class="post-timestamp">${timestamp}</div>
            </div>
          </div>
          ${this.user.id === post.user_id ? `
            <div class="post-menu">
              <button class="post-menu-btn" data-post-id="${post.id}">⋮</button>
            </div>
          ` : ''}
        </div>

        <div class="post-content">${this.escapeHtml(post.content)}</div>

        <div class="post-actions">
          <button class="action-btn like-btn ${post.user_liked ? 'liked' : ''}" data-post-id="${post.id}">
            <span>${post.user_liked ? '❤️' : '🤍'}</span>
            <span class="action-count">${post.likes_count}</span>
          </button>
          <button class="action-btn comment-btn" data-post-id="${post.id}">
            <span>💬</span>
            <span class="action-count">${post.comments_count}</span>
          </button>
        </div>

        ${this.expandedComments[post.id] ? this.renderCommentsSection(post.id) : ''}
      </div>
    `;
  },

  renderCommentsSection(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return '';

    return `
      <div class="comments-section">
        <div class="comments-header">Comments (${post.comments_count})</div>
        <div id="comments-${postId}">
          <div class="empty-state">
            <p class="empty-state-text" style="font-size: 12px;">No comments yet</p>
          </div>
        </div>
        ${this.user.username !== 'Guest' ? `
          <div class="comment-composer">
            <input type="text" class="comment-input" placeholder="Add a comment..." data-post-id="${postId}">
            <button class="btn btn-sm btn-primary" data-post-id="${postId}">Post</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ========================================
  // Users Page
  // ========================================
  renderUsersPage() {
    return `
      <div class="feed-header">
        <h1 class="page-title">Users</h1>
        <p class="page-subtitle">Find and follow other users</p>
      </div>

      <div class="search-box">
        <input type="text" id="user-search" class="search-input" placeholder="Search users...">
      </div>

      <div class="users-grid">
        ${this.users.map(user => this.renderUserCard(user)).join('')}
      </div>

      ${this.users.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h2 class="empty-state-title">No users found</h2>
          <p class="empty-state-text">Try adjusting your search</p>
        </div>
      ` : ''}
    `;
  },

  renderUserCard(user) {
    return `
      <div class="user-card" data-user-id="${user.id}">
        <div class="user-card-header">
          <div class="user-card-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <div class="user-card-info">
            <div class="user-card-name">${user.username}</div>
            <div class="user-card-stats">${user.posts_count} posts</div>
          </div>
        </div>
      </div>
    `;
  },

  // ========================================
  // Profile Page
  // ========================================
  renderProfilePage() {
    const profile = this.selectedUser || this.user;
    const userPosts = this.selectedUser 
      ? (this.selectedUser.posts || [])
      : this.posts.filter(p => p.user_id === this.user.id);

    return `
      <div class="profile-header">
        <div class="profile-avatar">${profile.username.charAt(0).toUpperCase()}</div>
        <h1 class="profile-name">${profile.username}</h1>
        
        <div class="profile-stats">
          <div class="stat">
            <div class="stat-number">${userPosts.length}</div>
            <div class="stat-label">Posts</div>
          </div>
          <div class="stat">
            <div class="stat-number">${new Date(profile.created_at).getFullYear()}</div>
            <div class="stat-label">Joined</div>
          </div>
        </div>
      </div>

      <h2 class="page-title" style="margin-bottom: 24px;">Posts</h2>

      <div id="profile-posts">
        ${userPosts.map(post => this.renderPost(post)).join('')}
      </div>

      ${userPosts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h2 class="empty-state-title">No posts yet</h2>
          <p class="empty-state-text">This user hasn't posted anything</p>
        </div>
      ` : ''}
    `;
  },

  // ========================================
  // Utilities
  // ========================================
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },

  showMessage(message, type = 'success') {
    const container = document.getElementById('auth-message');
    if (container) {
      const className = type === 'success' ? 'success-message' : 'error-message';
      container.innerHTML = `<div class="${className}">${message}</div>`;
    }
  },

  // ========================================
  // Event Listeners
  // ========================================
  attachAuthListeners() {
    const form = document.getElementById('auth-form');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const guestBtn = document.getElementById('guest-btn');

    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      const result = await API.login(username, password);
      if (result.error) {
        this.showMessage(result.error, 'error');
      } else {
        this.user = result.user;
        await this.init();
      }
    });

    registerBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      if (!username || !password) {
        this.showMessage('Please fill in all fields', 'error');
        return;
      }

      const result = await API.register(username, password);
      if (result.error) {
        this.showMessage(result.error, 'error');
      } else {
        this.user = result.user;
        await this.init();
      }
    });

    guestBtn.addEventListener('click', async () => {
      const result = await API.guestLogin();
      this.user = result.user;
      await this.init();
    });
  },

  attachAppListeners() {
    // Navigation
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this.setPage(el.dataset.page);
      });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await API.logout();
        this.user = null;
        this.render();
      });
    }

    // Post creation
    const submitBtn = document.getElementById('post-submit-btn');
    const cancelBtn = document.getElementById('post-cancel-btn');
    const content = document.getElementById('post-content');

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const text = content.value.trim();
        if (!text) return;

        const result = await API.createPost(text);
        if (!result.error) {
          await this.loadPosts();
          content.value = '';
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (content) content.value = '';
      });
    }

    // Like posts
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        await API.likePost(postId);
        await this.loadPosts();
      });
    });

    // Toggle comments
    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.expandedComments[postId] = !this.expandedComments[postId];
        this.render();
        this.attachAppListeners();
      });
    });

    // Delete posts
    document.querySelectorAll('.post-menu-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const postId = btn.dataset.postId;
        if (confirm('Delete this post?')) {
          await API.deletePost(postId);
          await this.loadPosts();
        }
      });
    });

    // User search
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.loadUsers(e.target.value);
        }, 300);
      });
    }

    // User cards navigation
    document.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', async () => {
        const userId = card.dataset.userId;
        const user = await API.getUser(userId);
        this.selectedUser = user;
        this.currentPage = 'profile';
        this.render();
        this.attachAppListeners();
      });
    });

    // Username links
    document.querySelectorAll('.post-username').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const userId = link.dataset.userId;
        const user = await API.getUser(userId);
        this.selectedUser = user;
        this.currentPage = 'profile';
        this.render();
        this.attachAppListeners();
      });
    });
  }
};

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
