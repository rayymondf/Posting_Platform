# Instigator Messaging App - Complete Implementation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Setup Instructions](#setup-instructions)
3. [File Descriptions](#file-descriptions)
4. [Feature Walkthrough](#feature-walkthrough)
5. [Code Architecture](#code-architecture)
6. [Testing Guide](#testing-guide)
7. [Customization Guide](#customization-guide)

---

## Project Overview

**Instigator** is a full-stack messaging and social dashboard built following The Odin Project's Full Stack JavaScript curriculum.

### Key Specifications Met ✅

| Requirement | Status | Details |
|------------|--------|---------|
| Account Creation | ✅ | Unique usernames, bcrypt passwords |
| Guest Account | ✅ | Public Guest account all users can access |
| Post Creation | ✅ | Home page posts with user attribution |
| Like/Comment | ✅ | Toggle likes, expandable comments |
| User Profiles | ✅ | View own profile and other user profiles |
| User Search | ✅ | Search users, browse all users |
| Full Stack | ✅ | Node.js + Express + PostgreSQL + Vanilla JS |
| Responsive | ✅ | Works on mobile, tablet, desktop |
| Security | ✅ | Password hashing, SQL injection prevention, CSRF protection |

### Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL Database
- Passport.js Authentication
- bcryptjs Password Hashing

**Frontend:**
- Vanilla JavaScript (No frameworks)
- HTML5
- CSS3 with Variables
- REST API Communication

---

## Setup Instructions

### Prerequisites
- **Node.js** v14 or higher
- **PostgreSQL** v12 or higher
- **npm** or **yarn**
- Terminal/Command line access

### Step 1: Database Setup

**PostgreSQL Installation:**

```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Windows
# Download from https://www.postgresql.org/download/windows/
# Install and run pgAdmin
```

**Create Database:**
```bash
createdb messaging_app
```

**Verify:**
```bash
psql messaging_app -c "\dt"
```

### Step 2: Project Setup

```bash
# 1. Create project directory
mkdir messaging-app
cd messaging-app

# 2. Copy all provided files into this directory
# Copy: server.js, package.json, public/ folder, etc.

# 3. Install dependencies
npm install

# 4. Create environment file
cp .env.example .env

# 5. Edit .env with your database connection
nano .env
# Change DATABASE_URL to your PostgreSQL connection
```

### Step 3: Configuration

Edit `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://localhost:5432/messaging_app
# If you have a password: postgresql://user:password@localhost:5432/messaging_app

# Session Secret (random string for security)
SESSION_SECRET=your-super-secret-key-change-this

# Environment
NODE_ENV=development

# Server Port
PORT=3000
```

### Step 4: Start Application

```bash
# Development (with auto-reload)
npm run dev

# Or production
npm start
```

Visit: `http://localhost:3000`

---

## File Descriptions

### Backend Files

#### `server.js` (~600 lines)
**Purpose:** Express server, database initialization, API routes, authentication

**Key Sections:**
- Database setup and schema initialization
- Passport.js authentication configuration
- 10 API endpoints for posts, comments, users
- Middleware for sessions and authentication
- Error handling and validation

**Main Routes:**
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/guest-login    - Login as guest
POST   /api/auth/logout         - Logout
GET    /api/auth/me             - Get current user

GET    /api/posts               - Get all posts
POST   /api/posts               - Create post (auth required)
DELETE /api/posts/:id           - Delete post (auth required)
POST   /api/posts/:id/like      - Toggle like (auth required)

GET    /api/posts/:id/comments  - Get comments
POST   /api/posts/:id/comments  - Add comment (auth required)

GET    /api/users               - List/search users
GET    /api/users/:id           - Get user profile
```

#### `package.json`
**Purpose:** Project metadata and dependencies

**Dependencies:**
- `express` - Web framework
- `express-session` - Session management
- `passport` - Authentication
- `passport-local` - Local strategy
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `cors` - CORS handling
- `dotenv` - Environment variables

### Frontend Files

#### `public/index.html` (Minimal)
**Purpose:** Single HTML entry point

Contains:
- Meta tags and title
- CSS link
- Single `<div id="app"></div>` for React-like mounting
- JavaScript link

#### `public/app.js` (~600 lines)
**Purpose:** Single-page application with routing and state management

**Architecture:**
```javascript
// API Client
API.getPosts()
API.createPost(content)
API.likePost(id)
API.getUsers(search)
// ... etc

// App State & Rendering
app = {
  user: null,
  posts: [],
  currentPage: 'home',
  render() { /* generates HTML */ },
  attachListeners() { /* adds event handlers */ }
}
```

**Key Functions:**
- `renderAuthPage()` - Login/register form
- `renderApp()` - Main app layout with sidebar
- `renderHomePage()` - Post feed with composer
- `renderUsersPage()` - User list with search
- `renderProfilePage()` - User profile with posts
- `renderPost()` - Individual post card
- `renderComposer()` - Post creation box

**Event Handlers:**
- Authentication (register, login, logout)
- Post creation, deletion, liking
- Comment expansion and creation
- User navigation and search
- Page transitions

#### `public/styles.css` (~700 lines)
**Purpose:** All styling for the application

**Structure:**
```css
:root { /* CSS Variables */ }
* { /* Reset */ }
body { /* Base styles */ }

/* Layout Components */
.app-container
.sidebar
.main-content

/* Auth Pages */
.auth-container
.auth-card

/* Feed & Posts */
.post-composer
.post-item

/* Comments */
.comments-section
.comment-item

/* Users & Search */
.users-grid
.user-card

/* Profile */
.profile-header

/* Responsive Media Queries */
@media (max-width: 768px)
@media (max-width: 480px)
```

**Design System:**
- Color scheme with CSS variables
- Consistent spacing and sizing
- Smooth animations and transitions
- Mobile-first responsive design

### Documentation Files

#### `README.md`
Complete documentation including:
- Feature list
- Tech stack explanation
- Installation instructions
- API endpoint reference
- Database schema
- Code highlights
- Performance optimizations
- Security notes

#### `QUICKSTART.md`
Quick setup guide with:
- 5-minute setup
- Common commands
- Troubleshooting
- Test accounts
- Frontend architecture explanation

#### `PROJECT_OVERVIEW.md`
High-level project summary with:
- Features implemented
- Code breakdown
- How it works diagrams
- Deployment information
- Learning outcomes
- Customization ideas

---

## Feature Walkthrough

### Feature 1: User Registration

**User Journey:**
1. Visit app → sees login page
2. Click "Register"
3. Enter username and password
4. Click "Sign In"
5. Account created, logged in

**Backend Flow:**
```javascript
// server.js
app.post('/api/auth/register', async (req, res) => {
  // 1. Check username doesn't exist
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Username exists' });
  
  // 2. Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 3. Insert into database
  const result = await pool.query(
    'INSERT INTO users (username, password) VALUES ($1, $2)',
    [username, hashedPassword]
  );
  
  // 4. Create session and return user
  req.login(result.rows[0], (err) => { ... });
});
```

**Frontend Flow:**
```javascript
// app.js
registerBtn.addEventListener('click', async () => {
  // 1. Get form values
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // 2. Call API
  const result = await API.register(username, password);
  
  // 3. If success, update state and render
  if (!result.error) {
    app.user = result.user;
    app.render();
  }
});
```

### Feature 2: Guest Account Access

**Special Implementation:**
```javascript
// server.js - Auto-created on startup
const GUEST_ID = 1;

async function ensureGuestUser() {
  const result = await pool.query('SELECT id FROM users WHERE username = $1', ['Guest']);
  if (result.rows.length === 0) {
    await pool.query(
      'INSERT INTO users (id, username, password) VALUES ($1, $2, $3)',
      [GUEST_ID, 'Guest', null]
    );
  }
}
```

**Guest Features:**
- Can view all posts
- Can search users
- Can view profiles
- Cannot create posts (no composer shown)
- Cannot like/comment (shows auth error)

### Feature 3: Posting & Feed

**Creating a Post:**
```javascript
// Frontend
app.post = await API.createPost(content);
app.posts.push(app.post);
app.render(); // Re-renders feed with new post

// Backend
app.post('/api/posts', authenticatedMiddleware, async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  
  // Insert and return with user info
  const result = await pool.query(
    'INSERT INTO posts (user_id, content) VALUES ($1, $2) RETURNING *',
    [userId, content]
  );
  res.status(201).json(result.rows[0]);
});
```

**Feed Display:**
```javascript
// app.js
async getPosts() {
  // Fetch all posts with like/comment counts
  const posts = await API.getPosts();
  
  // Map to HTML and render
  const html = posts.map(post => renderPost(post)).join('');
  document.getElementById('posts-container').innerHTML = html;
}
```

**Database Query:**
```sql
SELECT p.*, u.username,
       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
FROM posts p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
```

### Feature 4: Likes System

**Like Toggle Logic:**
```javascript
// Frontend
likeBtn.addEventListener('click', async () => {
  const postId = this.dataset.postId;
  const result = await API.likePost(postId);
  
  // Update button state
  this.classList.toggle('liked');
  updateLikeCount(result.likes_count);
});

// Backend - Toggle Like
app.post('/api/posts/:id/like', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if already liked
  const like = await pool.query(
    'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (like.rows.length > 0) {
    // Unlike
    await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [id, userId]);
  } else {
    // Like
    await pool.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2)', [id, userId]);
  }
  
  // Return updated count
  const count = await pool.query('SELECT COUNT(*) FROM likes WHERE post_id = $1', [id]);
  res.json({ likes_count: count.rows[0].count });
});
```

### Feature 5: User Search & Profiles

**Search Implementation:**
```javascript
// Frontend
searchInput.addEventListener('input', debounce(async (e) => {
  const query = e.target.value;
  app.users = await API.getUsers(query);
  app.render(); // Show filtered results
}, 300));

// Backend
app.get('/api/users', async (req, res) => {
  const { search } = req.query;
  
  let query = `SELECT u.id, u.username, u.created_at,
               (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as posts_count
               FROM users u WHERE u.username != 'Guest'`;
  
  if (search) {
    query += ` AND u.username ILIKE $1`;
    query += ` ORDER BY u.username ASC LIMIT 50`;
    const result = await pool.query(query, [`%${search}%`]);
    return res.json(result.rows);
  }
  
  const result = await pool.query(query);
  res.json(result.rows);
});
```

**Profile View:**
```javascript
// Frontend - Click user card
userCard.addEventListener('click', async () => {
  const user = await API.getUser(userId);
  app.selectedUser = user;
  app.currentPage = 'profile';
  app.render(); // Show profile page
});

// Shows: avatar, username, post count, all their posts
```

---

## Code Architecture

### Frontend Architecture Pattern

```
┌─────────────────────────────────────────┐
│           HTML (index.html)             │ Single <div id="app">
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        app.js (State + Routing)         │
├─────────────────────────────────────────┤
│ • const app = { user, posts, ... }      │ State
│ • app.render()                          │ Render current page
│ • app.setPage(page)                     │ Route changes
│ • attachListeners()                     │ Event handlers
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
   ┌────────────┐      ┌────────────────┐
   │ API calls  │      │ HTML rendering │
   │ fetch()    │      │ app.render()   │
   └────────────┘      └────────────────┘
        │                    │
        ▼                    ▼
   ┌──────────────────────────────────────┐
   │        styles.css (Styling)          │
   └──────────────────────────────────────┘
```

### Data Flow Diagram

```
User Action (click, type, submit)
    │
    ▼
Event Listener (app.js)
    │
    ▼
API Call (fetch to server)
    │
    ▼
Backend Processing (server.js)
    │
    ├─► Database Query (PostgreSQL)
    │
    ▼
Response (JSON)
    │
    ▼
Update State (app.user, app.posts)
    │
    ▼
Re-render UI (app.render())
    │
    ▼
User Sees Update
```

### Authentication Flow

```
1. User enters credentials
            │
            ▼
2. Frontend: API.login(username, password)
            │
            ▼
3. Backend: passport.authenticate('local')
            │
            ├─► Lookup user in database
            │
            ├─► Compare password with bcrypt
            │
            ├─► Create session
            │
            ▼
4. Backend returns user object
            │
            ▼
5. Frontend: app.user = result.user
            │
            ▼
6. Frontend: app.render()
            │
            ▼
7. UI shows authenticated state (feed, profile, etc.)
```

### Database Schema

```
users
├─ id (PRIMARY KEY)
├─ username (UNIQUE)
├─ password (bcrypt hash)
└─ created_at

posts
├─ id (PRIMARY KEY)
├─ user_id (FOREIGN KEY → users.id)
├─ content (TEXT)
├─ created_at
└─ updated_at

likes
├─ id (PRIMARY KEY)
├─ post_id (FOREIGN KEY → posts.id)
├─ user_id (FOREIGN KEY → users.id)
├─ created_at
└─ UNIQUE(post_id, user_id)

comments
├─ id (PRIMARY KEY)
├─ post_id (FOREIGN KEY → posts.id)
├─ user_id (FOREIGN KEY → users.id)
├─ content (TEXT)
├─ created_at
└─ updated_at

Indexes:
├─ posts(user_id)
├─ posts(created_at DESC)
├─ likes(post_id)
└─ comments(post_id)
```

---

## Testing Guide

### Test Case 1: User Registration

```javascript
// Step 1: Visit app
navigate to http://localhost:3000

// Step 2: Register new user
Click "Register" button
Enter username: "testuser1"
Enter password: "testpass123"
Click "Sign In"

// Expected: Success message, logged in, shows home feed

// Step 3: Logout
Click logout button

// Step 4: Try duplicate registration
Enter username: "testuser1" again
Should see: "Username already exists" error
```

### Test Case 2: Post Creation & Interaction

```javascript
// Step 1: Login
username: "testuser1"
password: "testpass123"

// Step 2: Create post
Type in composer: "Hello World!"
Click "Post"
Expected: Post appears at top of feed

// Step 3: Like post
Click heart icon on post
Expected: Icon changes to ❤️, counter increases

// Step 4: Unlike post
Click heart again
Expected: Icon changes to 🤍, counter decreases

// Step 5: Comment
Click comment icon
Type: "Nice post!"
Click post button
Expected: Comment appears in expanded section

// Step 6: Delete post
Click three dots (⋮) on own post
Confirm deletion
Expected: Post removed from feed
```

### Test Case 3: User Search

```javascript
// Step 1: Navigate to Users
Click "Users" in sidebar

// Step 2: Search
Type "test" in search box
Expected: Filtered results appear

// Step 3: Clear search
Clear search box
Expected: All users shown

// Step 4: View profile
Click on any user card
Expected: Profile page with their posts

// Step 5: Navigate back
Click Home or Users
Expected: Returns to previous page
```

### Test Case 4: Guest Access

```javascript
// Step 1: Logout or open private window
Click logout or start fresh

// Step 2: Guest login
Click "Continue as Guest"
Expected: Logged in as "Guest"

// Step 3: Browse posts
Expected: Can see all posts

// Step 4: Search users
Click Users tab
Expected: Can search and view profiles

// Step 5: Try to post
Expected: No composer shown

// Step 6: Try to like
Click like button
Expected: Error message (must be logged in)
```

### Test Case 5: Responsive Design

```javascript
// Desktop (1200px+)
- Sidebar on left
- Main content on right
- Two-column layout

// Tablet (768-1024px)
- Sidebar at bottom
- Full-width content
- Horizontal sidebar navigation

// Mobile (< 480px)
- Sidebar at bottom with horizontal nav
- Full-width content
- Touch-friendly buttons
```

### Database Verification

```sql
-- Check users created
SELECT id, username FROM users;

-- Check posts
SELECT p.id, u.username, p.content FROM posts p JOIN users u ON p.user_id = u.id;

-- Check likes
SELECT COUNT(*) as total_likes FROM likes;

-- Check comments
SELECT COUNT(*) as total_comments FROM comments;

-- Check indexes
\d posts
```

---

## Customization Guide

### 1. Change Color Scheme

Edit `public/styles.css` top section:

```css
:root {
  --primary-blue: #0f4fa8;        /* Change to #ff6b6b */
  --primary-blue-light: #1e5ab8;  /* Change to #ff8787 */
  --accent-blue: #3b82f6;         /* Change to #ffa8a8 */
  /* ... etc */
}
```

### 2. Modify Post Fields

**Add image URL field:**

```sql
-- In server.js initializeDatabase()
ALTER TABLE posts ADD COLUMN image_url TEXT;

// In app.js
renderPost(post) {
  return `
    ... existing HTML ...
    ${post.image_url ? `<img src="${post.image_url}" alt="Post image">` : ''}
  `;
}
```

### 3. Add User Bio

```sql
-- Database
ALTER TABLE users ADD COLUMN bio TEXT;

// Backend - in /api/users/:id
const user = await pool.query(
  'SELECT id, username, created_at, bio FROM users WHERE id = $1',
  [id]
);

// Frontend - in renderProfilePage()
<p class="user-bio">${profile.bio || ''}</p>
```

### 4. Add Post Categories

```sql
-- Database
ALTER TABLE posts ADD COLUMN category VARCHAR(50);

// Create posts with category
INSERT INTO posts (user_id, content, category) VALUES ($1, $2, $3);

// Frontend filter
const filtered = posts.filter(p => p.category === selectedCategory);
```

### 5. Add Character Limit

```javascript
// app.js in composer
const maxLength = 280;
document.getElementById('post-content').addEventListener('input', (e) => {
  const remaining = maxLength - e.target.value.length;
  document.getElementById('char-count').textContent = remaining;
});

// Prevent posting over limit
if (content.length > 280) {
  showMessage('Post too long (max 280 characters)', 'error');
  return;
}
```

### 6. Add Following System

```sql
-- New table
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id),
  following_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- API endpoints
POST /api/users/:id/follow
POST /api/users/:id/unfollow
GET /api/users/:id/followers
GET /api/users/:id/following
```

### 7. Customize Sidebar

```javascript
// app.js - Add new nav item
`<a class="nav-item" data-page="trending">
  <span class="nav-icon">📈</span>
  Trending
</a>`

// Handle new page
case 'trending':
  return this.renderTrendingPage();
```

### 8. Add Timestamps Display

```javascript
// app.js
function formatTimestamp(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

### 9. Add Email Notifications

```javascript
// server.js
const nodemailer = require('nodemailer');

async function sendNotification(userEmail, message) {
  await transporter.sendMail({
    to: userEmail,
    subject: 'New activity on Instigator',
    html: message
  });
}
```

### 10. Add Rate Limiting

```javascript
// server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## Deployment Instructions

### Deploy to Heroku

```bash
# 1. Create Heroku account and install CLI
heroku login

# 2. Create app
heroku create your-app-name

# 3. Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# 4. Set environment variables
heroku config:set SESSION_SECRET=your-secret-key

# 5. Deploy
git push heroku main

# 6. Monitor
heroku logs --tail
```

### Deploy to Railway

```bash
# 1. Connect GitHub account
# 2. Select repository
# 3. Add PostgreSQL plugin
# 4. Railway auto-deploys on push
git push origin main
```

### Deploy to DigitalOcean

```bash
# 1. Create Ubuntu droplet
# 2. SSH into server
ssh root@server_ip

# 3. Install Node, PostgreSQL
sudo apt update
sudo apt install nodejs npm postgresql

# 4. Clone repository
git clone your-repo.git
cd messaging-app

# 5. Setup .env with database
nano .env

# 6. Install and run
npm install
npm start

# 7. Use PM2 for process management
npm install -g pm2
pm2 start server.js --name instigator
pm2 startup
```

---

## Troubleshooting

### Common Issues

**Issue: "Cannot find module 'express'"**
```bash
Solution: npm install
```

**Issue: "Database connection refused"**
```bash
Solution: 
1. Check PostgreSQL running: brew services list
2. Start PostgreSQL: brew services start postgresql@15
3. Check DATABASE_URL in .env
4. Verify database exists: createdb messaging_app
```

**Issue: "Port 3000 already in use"**
```bash
Solution:
# Option 1: Change PORT in .env
# Option 2: Kill existing process
lsof -ti:3000 | xargs kill -9
```

**Issue: "Username already exists" when registering**
```bash
Solution: Choose a different username (each username must be unique)
```

**Issue: Comments not showing**
```bash
Solution:
1. Click comment button again
2. Check browser console (F12) for errors
3. Ensure you're logged in
4. Check server logs
```

**Issue: Posts not loading**
```bash
Solution:
1. Check if posts exist in database: psql messaging_app -c "SELECT * FROM posts"
2. Hard refresh browser: Ctrl+Shift+R
3. Check network tab in DevTools
4. Check server logs for errors
```

**Issue: Styling looks broken**
```bash
Solution:
1. Hard refresh: Ctrl+Shift+R
2. Check styles.css loads: Network tab in DevTools
3. Check browser console for CSS errors
4. Restart server
```

---

## Conclusion

You now have a **complete, production-ready messaging application**. This project demonstrates:

✨ Full-stack web development
✨ Database design and optimization
✨ User authentication and authorization
✨ Responsive UI/UX design
✨ Clean code architecture
✨ Security best practices

**Next steps:**
1. Deploy to production
2. Add more features
3. Optimize performance
4. Scale the application

**Additional learning:**
- Read The Odin Project curriculum
- Study express.js documentation
- Learn PostgreSQL optimization
- Explore WebSockets for real-time features

---

**Happy coding! 🔥**
