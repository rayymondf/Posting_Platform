# Implementation Guide

## Frontend

The frontend is a Vite React app in `client/`.

Important files:

- `client/src/main.jsx`: mounts React into the HTML page.
- `client/src/App.jsx`: owns top-level state and app actions.
- `client/src/api/client.js`: centralizes all `fetch` requests.
- `client/src/routes/paths.js`: centralizes browser route parsing and URL updates.
- `client/src/components/`: reusable UI pieces.
- `client/src/styles/main.css`: layout, spacing, colors, responsive behavior.

## React Concepts Used

- `useState`: stores current user, active view, posts, users, selected profile, loading, busy, and error state.
- `useEffect`: checks the current session when the app first loads.
- `useCallback`: keeps data-loading functions stable.
- `useMemo`: derives the current user's posts from the full post list.
- Browser History API: keeps `/home`, `/profiles`, `/profiles/:id`, `/me`, `/signin`, and `/signup` in sync with app state.
- Props: parent components pass data and event handlers into child components.
- Conditional rendering: the app shows public auth screens, Home, Profiles, My Profile, or another profile depending on state.

## Component Roles

- `PublicPage`: landing, sign-in, sign-up, and guest entry.
- `AppShell`: shared authenticated layout with sidebar, timeline area, account panel, and mobile nav.
- `Feed`: home timeline.
- `Composer`: post creation form.
- `PostCard`: displays one post and like button.
- `ProfileDirectory`: searchable users list.
- `ProfilePage`: profile header and profile-specific posts.
- `MessagesView`: direct-message UI (frontend complete; backend messaging routes not yet implemented — API calls return 404).
- `Avatar`, `Button`, `EmptyState`: small reusable UI components.

## Backend

The backend is `server.js`.

It handles:

- Loading `.env` with dotenv.
- Connecting to PostgreSQL with `pg`.
- Creating missing database tables on startup.
- Ensuring the Guest account exists.
- Storing login sessions in PostgreSQL with `connect-pg-simple`.
- Serving API routes.
- Serving the built React app from `dist/` after `npm run build`.

## Authentication

Authentication uses Passport local strategy plus `express-session`.

- Register hashes passwords with bcryptjs.
- Login checks username and password.
- Guest login logs into the reusable Guest user.
- Session cookies keep the user logged in between requests.
- Session records are stored in the `user_sessions` table, which is created automatically.
- `SESSION_SECRET` signs the session cookie and should be private.

## API Data Contracts

Posts returned to React include:

```txt
id
user_id
username
content
created_at
likes_count
comments_count
user_liked
```

Users returned to React include:

```txt
id
username
created_at
posts_count
```

Profile responses include the user fields plus `posts`.

## Development Scripts

```bash
npm run dev         # Starts backend and frontend
npm run server:dev  # Starts only Express with nodemon
npm run client:dev  # Starts only Vite
npm run check:ports # Checks PORT and VITE_PORT availability
npm run build       # Builds React into dist/
npm start           # Starts Express and serves dist/
npm test            # Builds frontend and syntax-checks server.js
```

## Adding A Feature

1. Add or update the Express route in `server.js`.
2. Add the matching API function in `client/src/api/client.js`.
3. Add or update React state/actions in `App.jsx`.
4. Add or update components in `client/src/components/`.
5. Style the UI in `client/src/styles/main.css`.
6. Run `npm test`.
7. Manually test the browser flow.

## Verification

Run:

```bash
npm test
```

Then manually test:

- Sign up.
- Sign in.
- Guest login.
- Create post.
- Like/unlike post.
- Browse profiles.
- Open another profile.
- Open My Profile.
- Resize to mobile width.
