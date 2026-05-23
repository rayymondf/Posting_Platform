# Quickstart

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL (running locally)

---

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Create your `.env`**

```bash
cp .env.example .env          # Mac/Linux
Copy-Item .env.example .env   # Windows PowerShell
```

**3. Configure `.env`**

```env
DATABASE_URL=postgresql://localhost:5432/instigator
SESSION_SECRET=replace_with_a_long_random_string
NODE_ENV=development
PORT=3000
VITE_PORT=5173
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — the port here is the DB port, not `PORT` |
| `SESSION_SECRET` | Signs session cookies — keep this private |
| `NODE_ENV` | Set to `production` on Render, `development` locally |
| `PORT` | Express API port |
| `VITE_PORT` | Vite dev server port |

**4. Create the database**

```bash
createdb instigator
```

The app creates all tables automatically on first run.

**5. Start the app**

```bash
npm run dev
```

Open `http://localhost:5173`.

---

## Scripts

```bash
npm run dev          # Start Express + Vite together
npm run build        # Build React into dist/
npm start            # Serve the built app with Express
npm test             # Build + syntax-check server.js
npm run check:ports  # Check if dev ports are already in use
```

---

## Troubleshooting

**Port already in use**

```bash
npm run check:ports
```

Windows — find and kill the process:
```powershell
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F
```

**Database not found**

```bash
createdb instigator
```

**API calls fail in the browser**

- Use the Vite URL (`http://localhost:5173`) in development, not the Express port directly.
- Confirm Express is running — check the terminal for `Server running on http://localhost:3000`.

---

## Manual Test Checklist

- [ ] Sign up with a new username (password must be at least 6 characters)
- [ ] Log out and sign back in
- [ ] Continue as Guest
- [ ] Create a post from Home
- [ ] Like and unlike a post
- [ ] Open Profiles — search for a user
- [ ] Click a profile — confirm URL changes to `/profiles/:id`
- [ ] Press browser Back — confirm it returns to the previous view
- [ ] Open My Profile — confirm only your posts appear
- [ ] Open Messages — start a DM thread with another user
- [ ] Resize to mobile width — confirm bottom navigation appears
