# Instigator

Instigator is a full-stack social posting app. Users can sign up, sign in, continue as Guest, publish posts, like posts, browse profiles, and view individual profile timelines.

The app is intentionally simple: posts and likes are supported, while comments, images, following, and real-time updates are left out for now.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express
- **Authentication:** Passport local strategy, express-session, bcryptjs
- **Database:** PostgreSQL with the `pg` package
- **Tooling:** dotenv, nodemon, concurrently, lucide-react

## Main Features

- Public sign-in/sign-up screen with Guest access.
- Home timeline with posts from all accounts.
- Guest account can post, like posts, and view profiles.
- Profiles directory includes Guest and registered users.
- Profile pages show only that user's posts.
- My Profile shows the current user's posts.
- Like/unlike support on each post.
- Responsive layout with desktop sidebar navigation and mobile bottom navigation.

## Project Structure

```txt
client/
  index.html
  src/
    api/client.js
    components/
    styles/main.css
    App.jsx
    main.jsx
scripts/
  check-dev-ports.js
server.js
vite.config.mjs
package.json
.env.example
QUICKSTART.md
PROJECT_OVERVIEW.md
IMPLEMENTATION_GUIDE.md
```

## How The App Runs

Instigator has three different services involved during development:

```txt
React/Vite frontend  http://localhost:5173
Express backend/API  http://localhost:3000 or your PORT value
PostgreSQL database  localhost:5432 or your database port
```

`npm run dev` starts both the Express backend and Vite frontend. Vite forwards `/api` requests to Express, so the browser can use one frontend URL while still talking to the backend.

## Environment Files

The repo includes `.env.example`, not your real `.env`.

- `.env.example` is committed to GitHub as a safe template.
- `.env` is your private local config and is ignored by Git.

Create your `.env` from the template:

```powershell
Copy-Item .env.example .env
```

Then update values like `DATABASE_URL` and `SESSION_SECRET`.

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for the full setup steps.

Short version:

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Then open:

```txt
http://localhost:5173
```

## Scripts

```bash
npm run dev         # Run Express and Vite together
npm run check:ports # Check if local dev ports are busy
npm run build       # Build React into dist/
npm start           # Start Express and serve the built app
npm test            # Build frontend and syntax-check server.js
```

## Documentation

- [QUICKSTART.md](QUICKSTART.md): install, configure, run, and troubleshoot.
- [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md): project concepts, app flow, and API summary.
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md): code organization and implementation details.
