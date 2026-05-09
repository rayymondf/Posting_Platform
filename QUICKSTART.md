# Quickstart

Use this guide to install, configure, run, and manually test Instigator.

## Prerequisites

Install these first:

- Node.js
- npm
- PostgreSQL

## 1. Install Dependencies

From the project folder:

```powershell
cd D:\coding\modern_message
npm install
```

## 2. Create `.env`

Copy the safe template into your private local config file:

```powershell
Copy-Item .env.example .env
```

Mac/Linux equivalent:

```bash
cp .env.example .env
```

## 3. Configure `.env`

Example values:

```env
DATABASE_URL=postgresql://localhost:5432/messaging_app
SESSION_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
PORT=3000
VITE_PORT=5173
```

What each value means:

- `DATABASE_URL`: PostgreSQL connection string. The port here is the database port, usually `5432`.
- `SESSION_SECRET`: private string used to sign login session cookies.
- `NODE_ENV=development`: tells Express this is local development, not production.
- `PORT`: Express backend/API port.
- `VITE_PORT`: React/Vite frontend port.

These ports are separate:

```txt
DATABASE_URL port  PostgreSQL database
PORT               Express backend/API
VITE_PORT          React frontend
```

## Why Both `.env` And `.env.example`?

- `.env` contains your real local values and should never be committed.
- `.env.example` is a safe template that should be committed so other users know what variables they need.

Keep both files.

## 4. Create The Database

If your `DATABASE_URL` uses `messaging_app`, create that database:

```powershell
createdb messaging_app
```

If you use pgAdmin, create a database named `messaging_app`.

The app creates its tables automatically when the server starts.

## 5. Run The App

```powershell
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Why `npm run dev` Instead Of `node app.js`?

This project has two parts:

- `server.js` starts the Express API.
- `client/` contains the React app, which Vite runs in development.

`npm run dev` starts both at the same time. `node app.js` is for smaller projects with one JavaScript entry file named `app.js`; Instigator uses `server.js` plus a Vite React frontend.

## Useful Commands

```bash
npm run dev         # Run Express and Vite together
npm run check:ports # Check if local dev ports are busy
npm run build       # Build React app into dist/
npm start           # Serve the built app with Express
npm test            # Build and syntax-check server.js
```

## Stop The App

In the terminal running `npm run dev`, press:

```txt
Ctrl + C
```

If a port stays busy:

```powershell
netstat -ano | findstr :<PORT>
taskkill /PID <PID_NUMBER> /F
```

## Manual Test Checklist

- Sign up with a new username.
- Log out and sign back in.
- Continue as Guest.
- Create a post from Home.
- Like and unlike posts.
- Open Profiles and view Guest plus registered users.
- Open My Profile and confirm only your posts appear.
- Resize the browser to mobile width and confirm the bottom navigation works.

## Files To Read First

- `client/src/App.jsx`: app state, view switching, and API actions.
- `client/src/api/client.js`: browser-to-server requests.
- `client/src/components/`: reusable React UI pieces.
- `client/src/styles/main.css`: layout and component styling.
- `server.js`: Express app, auth, database setup, and API routes.

## Common Fixes

Port already in use:

```powershell
npm run check:ports
netstat -ano | findstr :<PORT>
taskkill /PID <PID_NUMBER> /F
```

Database missing:

```powershell
createdb messaging_app
```

Browser opens but API calls fail:

- Use the Vite URL in development, usually `http://localhost:5173`.
- Make sure the Express API is running on your `.env` `PORT`.
