# Implementation Guide

## Repository Layout

```
server.js                   Express app — single file, ~500 lines
vite.config.mjs             Vite config
client/
  index.html
  src/
    main.jsx                React entry — mounts App inside ErrorBoundary
    App.jsx                 All top-level state, data loading, and action handlers
    api/client.js           Thin fetch wrapper — all API calls in one place
    routes/paths.js         URL parsing, route normalization, history writes
    components/
      AppShell.jsx          Authenticated shell — sidebar, mobile nav, layout
      PublicPage.jsx        Landing, sign-in, sign-up, guest entry
      Feed.jsx              Home timeline
      Composer.jsx          Post creation form
      PostCard.jsx          Single post with like button
      ProfileDirectory.jsx  Searchable user list
      ProfilePage.jsx       Profile header + user's posts
      MessagesView.jsx      DM thread list and message thread
      Avatar.jsx            Initials-based avatar
      Button.jsx            Styled button with optional icon
      EmptyState.jsx        Empty list placeholder
      ErrorBoundary.jsx     React error boundary
    utils/
      format.js             formatDate, initials, pluralize
    styles/main.css         All styles — layout, components, responsive
scripts/
  check-dev-ports.js        Checks PORT and VITE_PORT before dev starts
```

---

## Frontend

### State Management

All application state lives in `App.jsx` using React hooks. There is no external state library.

| State | Type | Purpose |
|---|---|---|
| `currentUser` | object \| null | Authenticated user from session |
| `posts` | array | All posts for the home timeline |
| `users` | array | User directory |
| `selectedProfile` | object \| null | Currently viewed profile |
| `activeView` | string | Which view is rendered |
| `loading` | boolean | Initial session check in progress |
| `busy` | boolean | Any async action in progress |
| `error` | string | Last error message |

### Hooks Used

- `useState` — all state above
- `useEffect` — session restore on mount; popstate listener for browser back/forward
- `useCallback` — stable references for `loadPosts`, `loadUsers`, `openRoute`
- `useMemo` — derives `myPosts` from the full posts array without re-filtering on every render

### Routing

No React Router. `paths.js` exports:

- `parsePath(pathname)` — maps a URL to a `{ view, userId?, path, publicMode? }` object
- `normalizeRoute(route)` — validates and normalizes a route object
- `writePath(path, replace)` — calls `pushState` or `replaceState`

`App.jsx` listens to `popstate` to handle browser back/forward. Express serves `index.html` for all non-API routes so direct URL access works.

### API Client

`api/client.js` exports a single `api` object. Every method calls a shared `request()` function that:

- Attaches `credentials: 'same-origin'` to every request
- Parses JSON responses
- Throws with the server's `error` message on non-2xx responses
- Returns `null` on 401 when `allowUnauthorized` is set (used by `api.me()` on load)

---

## Backend

### server.js Structure

1. **Config** — dotenv, constants, production guards
2. **Database** — `pg.Pool`, `PgSession` store, `initializeDatabase()` creates all tables
3. **Middleware** — CORS, JSON body parser, static files, session, Passport
4. **Passport** — local strategy, `serializeUser`, `deserializeUser`
5. **Guest setup** — `ensureGuestUser()` upserts the shared Guest account on startup
6. **Routes** — auth, posts, likes, comments, users, conversations, messages
7. **SPA fallback** — `GET *` serves `dist/index.html`
8. **Error handler** — catches unhandled errors, returns JSON
9. **Startup** — `initializeDatabase()` → `ensureGuestUser()` → `app.listen()`

### Authentication Flow

```
POST /api/auth/register
  validate input → check username uniqueness → bcrypt.hash → INSERT user → req.login()

POST /api/auth/login
  passport.authenticate('local') → bcrypt.compare → req.login() → return user

POST /api/auth/guest-login
  look up Guest user by ID → req.login() → return user

POST /api/auth/logout
  req.logout() → destroy session
```

### Authorization Pattern

Protected routes use an inline middleware before the async handler:

```js
app.post('/api/posts', (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Must be logged in' });
  next();
}, async (req, res) => { ... });
```

Ownership checks (delete post, delete message) query the resource first and compare `user_id` / `sender_id` to `req.user.id`.

### Like Toggle

`POST /api/posts/:id/like` checks for an existing like row:
- If found → `DELETE` (unlike)
- If not found → `INSERT` (like)

Returns the new `likes_count` and `user_liked` boolean. The `UNIQUE(post_id, user_id)` constraint on the `likes` table prevents race-condition duplicates.

### Conversation Deduplication

`POST /api/conversations` always stores the lower user ID as `user1_id`:

```js
const [user1_id, user2_id] = userId < recipientId ? [userId, recipientId] : [recipientId, userId];
```

Combined with `UNIQUE(user1_id, user2_id)` and `ON CONFLICT ... DO UPDATE SET id = conversations.id`, this guarantees one thread per pair regardless of who initiates.

---

## API Data Shapes

**Post**
```json
{
  "id": 1,
  "user_id": 3,
  "username": "alice",
  "content": "Hello world",
  "created_at": "2026-05-23T17:00:00.000Z",
  "likes_count": 4,
  "comments_count": 1,
  "user_liked": false
}
```

**User / Profile**
```json
{
  "id": 3,
  "username": "alice",
  "created_at": "2026-05-01T10:00:00.000Z",
  "posts_count": 12,
  "posts": [ ... ]
}
```

**Message**
```json
{
  "id": 7,
  "sender_id": 3,
  "content": "Hey!",
  "created_at": "2026-05-23T17:10:00.000Z"
}
```

**Conversation**
```json
{
  "id": 2,
  "other_user_id": 5,
  "other_username": "bob",
  "last_message": "See you then"
}
```

---

## Adding a Feature

1. Add the DB table or column in `initializeDatabase()` in `server.js`.
2. Add the Express route in `server.js`.
3. Add the API function in `client/src/api/client.js`.
4. Add state and action handlers in `App.jsx`.
5. Add or update components in `client/src/components/`.
6. Run `npm test` to verify build and syntax.
7. Manually test the browser flow.

---

## Scripts

```bash
npm run dev          # Start Express (nodemon) + Vite concurrently
npm run server:dev   # Express only
npm run client:dev   # Vite only
npm run check:ports  # Verify PORT and VITE_PORT are free
npm run build        # Production build into dist/
npm start            # Serve dist/ with Express
npm test             # Build + node --check server.js
```
