# Project Overview

## What It Is

Instigator is a full-stack social posting application built with React, Express, and PostgreSQL. It demonstrates end-to-end JavaScript development: client-side state management, REST API design, session-based authentication, and relational database modeling.

---

## Architecture

```
Browser (React + Vite)
  └── fetch /api/*  ──►  Express (server.js)
                              └── pg  ──►  PostgreSQL
```

- The React SPA is served by Vite in development and from `dist/` in production.
- All API calls go through `/api`. Vite proxies them to Express during development so the browser only needs one origin.
- Express handles authentication, validation, and all database queries.
- PostgreSQL stores all persistent data. Sessions are stored in the database via `connect-pg-simple`, not in memory.

---

## Authentication

- **Strategy:** Passport.js local strategy (username + password).
- **Sessions:** `express-session` with a PostgreSQL session store (`user_sessions` table, created automatically).
- **Passwords:** hashed with bcryptjs (cost factor 10). Minimum 6 characters enforced server-side.
- **Guest account:** a real database user with no password. Any visitor can log in as Guest and post or like content.
- **Production hardening:** `secure` cookies, `trust proxy`, and required env vars enforced at startup.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts, including the shared Guest account |
| `posts` | Post content with author foreign key |
| `likes` | One row per user/post pair — `UNIQUE(post_id, user_id)` |
| `comments` | Comment content with author and post foreign keys |
| `conversations` | One DM thread per user pair — `UNIQUE(user1_id, user2_id)` |
| `messages` | Individual messages linked to a conversation |
| `user_sessions` | Express session storage (managed by connect-pg-simple) |

All tables are created automatically on server startup via `CREATE TABLE IF NOT EXISTS`.

---

## Data Flow

1. On load, React calls `GET /api/auth/me` to restore session state.
2. If authenticated, React fetches posts and users in parallel.
3. User actions (create post, like, open profile, send message) call the relevant API endpoint.
4. The server validates input, queries PostgreSQL, and returns JSON.
5. React updates component state and re-renders — no page reloads.

---

## SPA Routing

Routes are managed with the Browser History API (`pushState` / `replaceState`) — no React Router dependency. `paths.js` handles all URL parsing and normalization. Express serves `index.html` for any non-API route so deep links and browser back/forward work correctly.

---

## API Reference

### Auth
```
POST   /api/auth/register        Register a new account
POST   /api/auth/login           Sign in
POST   /api/auth/guest-login     Sign in as Guest
POST   /api/auth/logout          Sign out
GET    /api/auth/me              Return the current session user
```

### Posts
```
GET    /api/posts                All posts, reverse-chronological
POST   /api/posts                Create a post (auth required)
GET    /api/posts/:id            Single post
DELETE /api/posts/:id            Delete own post (auth required)
POST   /api/posts/:id/like       Toggle like on a post (auth required)
GET    /api/posts/:id/comments   Comments on a post
POST   /api/posts/:id/comments   Add a comment (auth required)
```

### Users
```
GET    /api/users                User directory (supports ?search=)
GET    /api/users/:id            User profile with their posts
```

### Messages
```
GET    /api/conversations                        List conversations for current user
POST   /api/conversations                        Get or create a DM thread
GET    /api/conversations/:id/messages           Messages in a thread
POST   /api/conversations/:id/messages           Send a message
DELETE /api/messages/:id                         Delete own message
```

---

## Browser Routes

```
/               Landing page
/signin         Sign-in form
/signup         Registration form
/home           Home timeline
/profiles       Profiles directory
/profiles/:id   Individual profile
/me             Current user's profile
/messages       Direct messages
```

---

## Development Ports

```
VITE_PORT   React frontend    default 5173
PORT        Express API       default 3000
            PostgreSQL        set in DATABASE_URL (usually 5432)
```
