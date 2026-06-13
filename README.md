# BuildBoard

**Engineering Project Collaboration Platform**

BuildBoard is a full-stack platform for student engineers, makers, robotics teams, and software/hardware builders to share technical projects, post build logs, recruit teammates, search for projects by skill, and message collaborators.

**Live demo:** https://social-media-project-1-d15l.onrender.com/

---

## Why I Built This

Student engineering teams often struggle to share project progress, recruit technical teammates, and organize project updates. Existing platforms are either too generic (social media) or too narrow (version control hosts). BuildBoard combines project pages, build logs, skill-based search, team recruitment, and direct messaging into a single cohesive product aimed at student engineers.

---

## Features

- **Project pages** — title, description, category, status, GitHub/demo links, skill tags
- **Build log updates** — milestone-tagged progress posts per project
- **Team recruitment** — open roles with skill areas, join requests, accept/reject workflow
- **Object-level authorization** — owners/admins manage projects; members post updates; public users browse
- **Ranked activity feed** — scoring formula weights likes, comments, recency
- **Search and filtering** — by keyword, category, status, or skill tag
- **Comments and likes** — on individual build log updates
- **Direct messaging** — DM threads between users
- **Engineer profiles** — bio, skills, owned projects, joined teams, recent build logs
- **Guest demo account** — explore without registering; seed data included
- **PostgreSQL-backed session auth** — Passport.js, bcrypt, connect-pg-simple
- **Responsive layout** — sidebar nav on desktop, bottom nav on mobile (5-tab)
- **SPA routing** — Browser History API, no React Router dependency

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Auth | Passport.js (local strategy), express-session, bcryptjs |
| Database | PostgreSQL (`pg`, `connect-pg-simple`) |
| Hosting | Render (server + static), Neon (PostgreSQL) |

---

## Architecture

```
Browser (React SPA)
  └─ fetch() with credentials: 'same-origin'
       └─ Express API (/api/*)
            └─ Passport.js session auth
            └─ PostgreSQL (pg.Pool)
                └─ projects, members, roles, join_requests,
                   project_updates, comments, likes,
                   conversations, messages, users
```

**Auth flow:** Session-cookie based. `POST /api/auth/login` authenticates via Passport LocalStrategy, stores session in PostgreSQL via `connect-pg-simple`. `GET /api/auth/me` bootstraps the client session on page load.

**Project/member permission model:**
- `owner` — full control (edit, delete, manage roles, accept requests)
- `admin` — manage roles, accept requests, post updates
- `member` — post build log updates only
- Unauthenticated users — read public projects and feed only

**Feed ranking formula:**
```
score = likes * 2 + comments * 3 − age_in_hours * 0.05
```
Implemented as a SQL expression directly in the `GET /api/feed` query.

**Search:** ILIKE-based keyword search on title and description, composable with category/status/tag filters. Structured for easy upgrade to PostgreSQL full-text search.

---

## Database Design

| Table | Purpose |
|---|---|
| `users` | Auth, profile, skills |
| `projects` | Project pages with slug, category, status |
| `project_tags` | Many-to-many skill tags per project |
| `project_members` | Team membership with permissions |
| `project_roles` | Open positions per project |
| `join_requests` | Pending/accepted/rejected membership requests |
| `project_updates` | Build log entries per project |
| `comments` | Comments on build log updates |
| `likes` | Unique like per user per update |
| `conversations` | DM threads between two users |
| `messages` | Messages within a conversation |
| `user_sessions` | PostgreSQL-backed session storage |

Indexes on `owner_id`, `project_id`, `user_id`, `category`, `status`, `created_at`.

---

## Security & Authorization

- Route-level `requireAuth` middleware on all write endpoints
- Object-level authorization checks (e.g., only project owner can delete project)
- Parameterized SQL queries throughout — no string interpolation
- Duplicate-like prevention via `UNIQUE(update_id, user_id)` constraint
- Cannot request to join own project; cannot double-submit join requests
- Session cookie: `httpOnly`, `sameSite: lax`, `secure` in production
- CORS configured for frontend origin

---

## Project Structure

```
server.js               Express app — schema init, all API routes, auth
vite.config.mjs         Vite config — dev proxy, build output
scripts/
  seed.js               Demo data — 4 users, 4 projects, updates, roles
  check-dev-ports.js    Pre-dev port availability check
client/
  index.html
  src/
    main.jsx            React entry point
    App.jsx             Top-level state, routing, auth handlers
    api/client.js       All fetch() calls to the API
    routes/paths.js     URL parsing, history management
    utils/format.js     Date formatting helpers
    styles/main.css     Full design system
    components/
      AppShell.jsx      Sidebar nav + mobile nav
      PublicPage.jsx    Landing page + auth forms
      ProjectsPage.jsx  Project directory with search/filter
      ProjectDetail.jsx Project view — tabs: build log, about, join requests
      ProjectForm.jsx   Create/edit project with tags and roles
      BuildLogComposer  Post project updates with milestone tags
      BuildLogCard.jsx  Update card with comments and likes
      JoinRequestsView  Accept/reject join requests (owner/admin)
      ProfilePage.jsx   Engineer profile — projects, teams, build logs
      ProfileDirectory  Engineer directory with search
      MessagesView.jsx  DM conversations
      Avatar.jsx        Initials avatar
      Button.jsx        Shared button component
      EmptyState.jsx    Empty state placeholder
```

---

## Quick Start

**Prerequisites:** Node.js 18+, npm, PostgreSQL

```bash
git clone <repo>
cd Social_Media_Project
npm install
cp .env.example .env   # Windows: Copy-Item .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://localhost:5432/buildboard
SESSION_SECRET=replace_with_a_long_random_string
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
VITE_PORT=5173
```

Create the database and seed demo data:

```bash
createdb buildboard
npm run seed
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`. The server creates all tables automatically on first run.

**Demo credentials (after seeding):**

| Username | Password | Focus |
|---|---|---|
| `alex_builds` | `password123` | Robotics / Firmware |
| `priya_ml` | `password123` | AI/ML |
| `marcus_pcb` | `password123` | PCB Design |
| `sofia_web` | `password123` | Web Development |
| Guest | (button) | Read-only demo |

---

## Scripts

```bash
npm run dev          # Start Express + Vite concurrently
npm run build        # Build React into dist/
npm start            # Serve the built app
npm run seed         # Seed demo users and projects
npm test             # Build + syntax-check server.js
npm run check:ports  # Check if dev ports are available
```

---

## Browser Routes

```
/                    Landing page / auth
/home                Ranked activity feed
/projects            Project directory
/projects/new        Create project
/projects/:id        Project detail
/projects/:id/edit   Edit project
/profiles            Engineer directory
/profiles/:id        Engineer profile
/me                  My profile
/messages            Direct messages
```

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/guest-login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/profile

GET    /api/projects              ?search, category, status, tag, sort
GET    /api/projects/:id
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id

POST   /api/projects/:id/roles
PATCH  /api/roles/:id
DELETE /api/roles/:id

POST   /api/projects/:id/join-requests
GET    /api/projects/:id/join-requests   (owner/admin only)
PATCH  /api/join-requests/:id

GET    /api/projects/:id/updates
POST   /api/projects/:id/updates
DELETE /api/updates/:id

GET    /api/updates/:id/comments
POST   /api/updates/:id/comments
DELETE /api/comments/:id

POST   /api/updates/:id/like

GET    /api/feed                  ?sort=ranked|recent
GET    /api/search                ?query, category, tag, status

GET    /api/users
GET    /api/users/:id

GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
DELETE /api/messages/:id
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies |
| `CLIENT_URL` | No | Frontend origin for CORS (production) |
| `NODE_ENV` | No | Set to `production` on Render |
| `PORT` | No | Express port (default `3000`) |
| `VITE_PORT` | No | Vite dev server port (default `5173`) |

---

## Deployment (Render + Neon)

### 1. Neon Database
1. Go to [neon.tech](https://neon.tech) and create a free project
2. Copy the connection string from the Neon dashboard (it looks like `postgresql://user:password@host/dbname?sslmode=require`)

### 2. Render Web Service
1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set the following:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node version:** 18 or higher (set under Environment → Node Version)

### 3. Environment Variables on Render
In your Render service dashboard go to **Environment** and add these:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your full Neon connection string, e.g. `postgresql://neondb_owner:yourpassword@ep-xxxx.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | Any long random string, e.g. `my-super-secret-string-change-this-123` |
| `CLIENT_URL` | Your Render app URL, e.g. `https://your-app-name.onrender.com` |
| `NODE_ENV` | `production` |

> **Note:** Do NOT set `PORT` or `VITE_PORT` on Render — Render assigns the port automatically via its own `PORT` environment variable.

### 4. Deploy
4. Click **Deploy** — Render will run `npm install && npm run build` then `npm start`
5. Tables are created automatically on first startup
6. Optionally seed demo data by running `npm run seed` locally with the Neon `DATABASE_URL` in your `.env`

---

## Limitations / Known TODOs

- No real-time features (Socket.IO) — DMs require page refresh to see new messages
- No image upload — cover images and avatars use URLs only
- No email verification or password reset flow
- Full-text search uses ILIKE; could be upgraded to PostgreSQL `tsvector` for better relevance
- No automated test suite yet (build verification only via `npm test`)
- Private project visibility is enforced on the API but the frontend always shows public projects

---

## Portfolio Description

> BuildBoard is a full-stack collaboration platform for student engineers to share technical projects, post build logs, recruit teammates, and message collaborators. Built with React 19, Express, PostgreSQL, Passport.js, bcrypt, and session-based authentication, then extended beyond standard CRUD with project pages, team roles, join requests with accept/reject workflow, skill-based search and filtering, ranked project feed scoring, object-level authorization, and deployment-ready configuration.

---


