# Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: PostgreSQL Setup

**macOS (with Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb messaging_app
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer
- Create database via pgAdmin or command line

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres createdb messaging_app
```

### Step 3: Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://localhost/messaging_app
SESSION_SECRET=your-random-secret-key
NODE_ENV=development
PORT=3000
```

### Step 4: Start Server
```bash
npm run dev
```

### Step 5: Visit Application
Open browser to `http://localhost:3000`

## Test Accounts

**Register a New Account:**
1. Click "Register"
2. Enter username: `testuser`
3. Enter password: `testpass123`
4. Click "Sign In"

**Or Use Guest Mode:**
- Click "Continue as Guest"
- Full functionality to browse and view

## Verifying Database

Check if database is properly setup:

```bash
psql messaging_app

# View tables
\dt

# Check posts
SELECT * FROM posts;

# Check users
SELECT id, username FROM users;
```

## Common Commands

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# View PostgreSQL logs
tail -f /usr/local/var/log/postgres.log

# Stop PostgreSQL
brew services stop postgresql@15

# Reset database (⚠️ deletes all data)
dropdb messaging_app
createdb messaging_app
npm run dev
```

## Troubleshooting

**Error: "connect ECONNREFUSED 127.0.0.1:5432"**
- PostgreSQL not running
- Run: `brew services start postgresql@15` (macOS)
- Run: `sudo service postgresql start` (Linux)

**Error: "database messaging_app does not exist"**
- Create database: `createdb messaging_app`

**Error: "listen EADDRINUSE :::3000"**
- Port 3000 is in use
- Either change PORT in .env or kill process:
```bash
lsof -ti:3000 | xargs kill -9
```

**Browser shows blank page**
- Check browser console (F12) for JavaScript errors
- Check server logs for API errors
- Hard refresh browser: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

## Project Structure Overview

```
messaging-app/
├── server.js              # Express server, routes, auth
├── public/
│   ├── index.html        # Single page
│   ├── app.js            # All frontend logic
│   └── styles.css        # All styling
├── package.json          # Dependencies
├── .env                  # Your config (not in git)
└── README.md             # Full documentation
```

## What This App Does

### For Visitors
- ✅ View all public posts
- ✅ Search and browse users
- ✅ View user profiles
- ✅ Guest mode access

### For Registered Users
- ✅ Create posts
- ✅ Like/unlike posts
- ✅ Comment on posts
- ✅ Delete own posts
- ✅ View profile with own posts
- ✅ Browse other profiles

## Frontend Architecture

Single-page application using vanilla JavaScript:

```javascript
// One app object manages everything
app = {
  user,              // Current logged in user
  currentPage,       // Which page showing
  posts,            // All posts data
  render()          // Renders HTML based on state
}

// API calls fetch/update data
API.getPosts()
API.createPost(content)
API.likePost(id)
```

No frameworks - everything is vanilla JavaScript, HTML, and CSS!

## Database Auto-Setup

When you start the server with `npm run dev`:
1. ✅ Tables are created automatically
2. ✅ Indexes are added for performance
3. ✅ Guest user is created

No manual SQL needed!

## Next Steps

1. **Register** a test account
2. **Create** a few posts
3. **Like** and **comment** on posts
4. **Search** and **visit** user profiles
5. **Logout** and use guest mode
6. **Try** the different features

## Frontend vs Backend Communication

**Frontend (app.js):**
- Renders UI based on state
- Sends API requests
- Updates state with responses
- Re-renders when data changes

**Backend (server.js):**
- Handles authentication
- Manages database
- Validates inputs
- Sends JSON responses

Communication is all REST API - they're completely separate!

## Code Examples

**Creating a Post:**
```javascript
// Frontend
const content = "Hello world!";
const result = await API.createPost(content);
app.posts.push(result);
app.render();

// Backend
app.post('/api/posts', async (req, res) => {
  const { content } = req.body;
  const result = await pool.query(
    'INSERT INTO posts (user_id, content) VALUES ($1, $2)',
    [userId, content]
  );
  res.json(result.rows[0]);
});
```

**Liking a Post:**
```javascript
// Frontend
await API.likePost(postId);
await app.loadPosts(); // Refresh
app.render();

// Backend - toggle like
app.post('/api/posts/:id/like', async (req, res) => {
  const likeExists = await pool.query(
    'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
    [id, userId]
  );
  
  if (likeExists.rows.length > 0) {
    await pool.query('DELETE FROM likes WHERE...');
  } else {
    await pool.query('INSERT INTO likes VALUES...');
  }
});
```

## Performance Tips

- Posts load all at once (good for small datasets)
- Database indexes on created_at for fast sorting
- Comments loaded on-demand when expanded
- Session stored in memory (fine for development)

For production with millions of users:
- Add pagination to posts
- Cache with Redis
- Use WebSockets for real-time
- Use CDN for static files

## Security Notes

✅ **What's Protected:**
- Passwords hashed with bcrypt
- SQL injection prevented
- XSS prevented with HTML escaping
- Session-based authentication

⚠️ **What You Should Add for Production:**
- HTTPS/SSL certificate
- Rate limiting
- Input validation
- CORS restrictions
- Redis session store
- Environment-specific secrets

## Customization Ideas

- Change colors in `styles.css` (CSS variables at top)
- Add more post fields (image URL, tags, etc.)
- Add following system
- Add direct messages
- Add real-time updates with Socket.io
- Add email notifications
- Add user search filters

## Resources

- **Odin Project**: https://www.theodinproject.com/
- **Express.js**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/
- **Passport.js**: https://www.passportjs.org/
- **MDN Web Docs**: https://developer.mozilla.org/

---

**You're all set! Happy coding! 🔥**
