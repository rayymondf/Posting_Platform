require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pg = require('pg');
const cors = require('cors');

const app = express();
const clientDistPath = path.join(__dirname, 'dist');
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL || (isProduction ? null : 'postgresql://localhost:5432/buildboard');
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? null : 'buildboard-dev-secret-change-in-production');
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

if (!databaseUrl) throw new Error('DATABASE_URL is required when NODE_ENV=production');
if (!sessionSecret) throw new Error('SESSION_SECRET is required when NODE_ENV=production');

// ============= Database =============
const pool = new pg.Pool({ connectionString: databaseUrl });
const sessionStore = new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true });

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255),
      password VARCHAR(255),
      display_name VARCHAR(100),
      bio TEXT,
      avatar_url TEXT,
      skills TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(120) NOT NULL,
      slug VARCHAR(140) UNIQUE NOT NULL,
      short_description VARCHAR(300) NOT NULL,
      full_description TEXT,
      category VARCHAR(60) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'idea',
      visibility VARCHAR(20) NOT NULL DEFAULT 'public',
      github_url TEXT,
      demo_url TEXT,
      cover_image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS project_tags (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      tag VARCHAR(60) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(100),
      permissions VARCHAR(20) NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS project_roles (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      skill_area VARCHAR(100),
      is_open BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS join_requests (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER REFERENCES project_roles(id) ON DELETE SET NULL,
      message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(project_id, requester_id)
    );

    CREATE TABLE IF NOT EXISTS project_updates (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(200),
      body TEXT NOT NULL,
      milestone_tag VARCHAR(60),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      update_id INTEGER NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS likes (
      id SERIAL PRIMARY KEY,
      update_id INTEGER NOT NULL REFERENCES project_updates(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(update_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user1_id, user2_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON project_tags(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
    CREATE INDEX IF NOT EXISTS idx_project_updates_author_id ON project_updates(author_id);
    CREATE INDEX IF NOT EXISTS idx_join_requests_project_id ON join_requests(project_id);
    CREATE INDEX IF NOT EXISTS idx_likes_update_id ON likes(update_id);
    CREATE INDEX IF NOT EXISTS idx_comments_update_id ON comments(update_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
  `);
  console.log('Database initialized');
}

// ============= Middleware =============
if (isProduction) app.set('trust proxy', 1);

app.use(cors({
  origin: isProduction ? clientUrl : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(clientDistPath));

app.use(session({
  store: sessionStore,
  name: 'buildboard.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ============= Passport =============
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return done(null, false, { message: 'User not found' });
    const user = result.rows[0];
    if (!user.password) return done(null, false, { message: 'Use the guest option to continue as Guest' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return done(null, false, { message: 'Incorrect password' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const r = await pool.query(
      'SELECT id, username, email, display_name, bio, avatar_url, skills, created_at FROM users WHERE id = $1',
      [id]
    );
    done(null, r.rows[0] || null);
  } catch (err) { done(err); }
});

// ============= Helpers =============
const GUEST_USERNAME = 'Guest';
let guestUserId = null;

async function ensureGuestUser() {
  const r = await pool.query('SELECT id FROM users WHERE username = $1', [GUEST_USERNAME]);
  if (r.rows.length > 0) { guestUserId = r.rows[0].id; return; }
  const ins = await pool.query(
    'INSERT INTO users (username, display_name, bio) VALUES ($1, $2, $3) RETURNING id',
    [GUEST_USERNAME, 'Guest Explorer', 'Exploring BuildBoard as a demo user.']
  );
  guestUserId = ins.rows[0].id;
}

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Must be logged in' });
  next();
}

// Check if user is owner or admin of a project
async function getProjectPermission(projectId, userId) {
  const r = await pool.query(
    'SELECT permissions FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return r.rows[0]?.permissions || null;
}

function slugify(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

async function uniqueSlug(base) {
  let slug = base;
  let i = 1;
  while (true) {
    const r = await pool.query('SELECT id FROM projects WHERE slug = $1', [slug]);
    if (r.rows.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
}

const VALID_CATEGORIES = ['Robotics', 'Firmware', 'Embedded Systems', 'Web Development', 'AI/ML', 'PCB Design', 'CAD/Mechanical', 'Data/Cloud', 'Electrical Design', 'Other'];
const VALID_STATUSES = ['idea', 'in_progress', 'recruiting', 'completed'];

// ============= Auth Routes =============
app.post('/api/auth/register', async (req, res) => {
  const username = req.body.username?.trim();
  const { password, email, display_name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username.length > 50) return res.status(400).json({ error: 'Username must be 50 characters or fewer' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Username already taken' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (username, email, password, display_name) VALUES ($1, $2, $3, $4) RETURNING id, username, display_name, created_at',
      [username, email || null, hash, display_name || username]
    );
    req.login(r.rows[0], (err) => {
      if (err) return res.status(500).json({ error: 'Login failed after registration' });
      res.json({ user: r.rows[0] });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Login failed' });
    req.login(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      res.json({ user: { id: user.id, username: user.username, display_name: user.display_name, created_at: user.created_at } });
    });
  })(req, res, next);
});

app.post('/api/auth/guest-login', async (req, res) => {
  try {
    if (!guestUserId) await ensureGuestUser();
    const r = await pool.query(
      'SELECT id, username, display_name, bio, created_at FROM users WHERE id = $1',
      [guestUserId]
    );
    if (r.rows.length === 0) return res.status(500).json({ error: 'Guest account not ready' });
    req.login(r.rows[0], (err) => {
      if (err) return res.status(500).json({ error: 'Guest login failed' });
      res.json({ user: r.rows[0] });
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) return res.json({ user: req.user });
  res.status(401).json({ error: 'Not authenticated' });
});

app.patch('/api/auth/profile', requireAuth, async (req, res) => {
  const { display_name, bio, skills } = req.body;
  try {
    const r = await pool.query(
      'UPDATE users SET display_name = COALESCE($1, display_name), bio = COALESCE($2, bio), skills = COALESCE($3, skills) WHERE id = $4 RETURNING id, username, display_name, bio, skills, created_at',
      [display_name || null, bio || null, skills || null, req.user.id]
    );
    res.json({ user: r.rows[0] });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// ============= Projects Routes =============
app.get('/api/projects', async (req, res) => {
  const { search, category, status, tag, sort } = req.query;
  try {
    const conditions = ["p.visibility = 'public'"];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(p.title ILIKE $${values.length} OR p.short_description ILIKE $${values.length})`);
    }
    if (category) {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`p.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let tagJoin = '';
    let tagCondition = '';
    if (tag) {
      tagJoin = 'JOIN project_tags pt_filter ON pt_filter.project_id = p.id';
      values.push(tag);
      tagCondition = `AND pt_filter.tag = $${values.length}`;
    }

    const orderBy = sort === 'recent'
      ? 'p.created_at DESC'
      : `(COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT c.id) * 3 + COUNT(DISTINCT jr.id) * 4 - EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 * 0.05) DESC`;

    const query = `
      SELECT p.id, p.title, p.slug, p.short_description, p.category, p.status,
             p.github_url, p.demo_url, p.cover_image_url, p.created_at,
             u.id as owner_id, u.username as owner_username, u.display_name as owner_display_name,
             (SELECT COUNT(*)::int FROM project_members WHERE project_id = p.id) as members_count,
             (SELECT COUNT(*)::int FROM project_roles WHERE project_id = p.id AND is_open = TRUE) as open_roles_count,
             (SELECT COUNT(*)::int FROM project_updates WHERE project_id = p.id) as updates_count,
             COALESCE(
               (SELECT json_agg(tag ORDER BY tag) FROM project_tags WHERE project_id = p.id),
               '[]'::json
             ) as tags,
             COUNT(DISTINCT l.id)::int as likes_total,
             COUNT(DISTINCT c.id)::int as comments_total
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ${tagJoin}
      LEFT JOIN project_updates pu ON pu.project_id = p.id
      LEFT JOIN likes l ON l.update_id = pu.id
      LEFT JOIN comments c ON c.update_id = pu.id
      LEFT JOIN join_requests jr ON jr.project_id = p.id AND jr.status = 'pending'
      ${where} ${tagCondition}
      GROUP BY p.id, u.id
      ORDER BY ${orderBy}
      LIMIT 60
    `;

    const r = await pool.query(query, values);
    res.json(r.rows);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  const userId = req.user?.id || null;
  try {
    const r = await pool.query(`
      SELECT p.*,
             u.id as owner_id, u.username as owner_username, u.display_name as owner_display_name,
             (SELECT COUNT(*)::int FROM project_updates WHERE project_id = p.id) as updates_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = $1 AND (p.visibility = 'public' OR p.owner_id = $2 OR EXISTS(
        SELECT 1 FROM project_members WHERE project_id = p.id AND user_id = $2
      ))
    `, [req.params.id, userId || 0]);

    if (r.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = r.rows[0];

    const [tags, members, roles, joinRequest] = await Promise.all([
      pool.query('SELECT tag FROM project_tags WHERE project_id = $1 ORDER BY tag', [project.id]),
      pool.query(`
        SELECT pm.role, pm.permissions, pm.joined_at, u.id, u.username, u.display_name
        FROM project_members pm JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1 ORDER BY pm.joined_at ASC
      `, [project.id]),
      pool.query('SELECT * FROM project_roles WHERE project_id = $1 ORDER BY created_at ASC', [project.id]),
      userId ? pool.query(
        'SELECT id, status FROM join_requests WHERE project_id = $1 AND requester_id = $2',
        [project.id, userId]
      ) : { rows: [] }
    ]);

    project.tags = tags.rows.map(t => t.tag);
    project.members = members.rows;
    project.roles = roles.rows;
    project.user_join_request = joinRequest.rows[0] || null;

    const permission = userId ? await getProjectPermission(project.id, userId) : null;
    project.user_permission = permission;
    project.is_member = permission !== null;

    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.post('/api/projects', requireAuth, async (req, res) => {
  const { title, short_description, full_description, category, status, visibility, github_url, demo_url, tags, roles } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  if (!short_description?.trim()) return res.status(400).json({ error: 'Short description required' });
  if (!category || !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Valid category required' });
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const slug = await uniqueSlug(slugify(title.trim()));
    const r = await client.query(
      `INSERT INTO projects (owner_id, title, slug, short_description, full_description, category, status, visibility, github_url, demo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, title.trim(), slug, short_description.trim(), full_description || null,
       category, status || 'idea', visibility || 'public', github_url || null, demo_url || null]
    );
    const project = r.rows[0];

    await client.query(
      'INSERT INTO project_members (project_id, user_id, role, permissions) VALUES ($1, $2, $3, $4)',
      [project.id, req.user.id, 'Owner', 'owner']
    );

    if (Array.isArray(tags) && tags.length) {
      for (const tag of tags.slice(0, 15)) {
        if (typeof tag === 'string' && tag.trim()) {
          await client.query('INSERT INTO project_tags (project_id, tag) VALUES ($1, $2)', [project.id, tag.trim()]);
        }
      }
    }

    if (Array.isArray(roles) && roles.length) {
      for (const role of roles.slice(0, 10)) {
        if (role.title?.trim()) {
          await client.query(
            'INSERT INTO project_roles (project_id, title, description, skill_area) VALUES ($1, $2, $3, $4)',
            [project.id, role.title.trim(), role.description || null, role.skill_area || null]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...project, slug });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    client.release();
  }
});

app.patch('/api/projects/:id', requireAuth, async (req, res) => {
  const perm = await getProjectPermission(req.params.id, req.user.id);
  if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });

  const { title, short_description, full_description, category, status, visibility, github_url, demo_url, tags } = req.body;
  if (category && !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (status && !VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      `UPDATE projects SET
        title = COALESCE($1, title),
        short_description = COALESCE($2, short_description),
        full_description = COALESCE($3, full_description),
        category = COALESCE($4, category),
        status = COALESCE($5, status),
        visibility = COALESCE($6, visibility),
        github_url = COALESCE($7, github_url),
        demo_url = COALESCE($8, demo_url),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [title?.trim() || null, short_description?.trim() || null, full_description || null,
       category || null, status || null, visibility || null, github_url || null, demo_url || null,
       req.params.id]
    );
    if (r.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Project not found' }); }

    if (Array.isArray(tags)) {
      await client.query('DELETE FROM project_tags WHERE project_id = $1', [req.params.id]);
      for (const tag of tags.slice(0, 15)) {
        if (typeof tag === 'string' && tag.trim()) {
          await client.query('INSERT INTO project_tags (project_id, tag) VALUES ($1, $2)', [req.params.id, tag.trim()]);
        }
      }
    }

    await client.query('COMMIT');
    res.json(r.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Failed to update project' });
  } finally {
    client.release();
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [req.params.id]);
  if (r.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
  if (r.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.json({ message: 'Project deleted' });
});

// ============= Project Roles Routes =============
app.post('/api/projects/:id/roles', requireAuth, async (req, res) => {
  const perm = await getProjectPermission(req.params.id, req.user.id);
  if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });
  const { title, description, skill_area } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Role title required' });
  try {
    const r = await pool.query(
      'INSERT INTO project_roles (project_id, title, description, skill_area) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, title.trim(), description || null, skill_area || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create role' });
  }
});

app.patch('/api/roles/:id', requireAuth, async (req, res) => {
  const role = await pool.query('SELECT project_id FROM project_roles WHERE id = $1', [req.params.id]);
  if (role.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
  const perm = await getProjectPermission(role.rows[0].project_id, req.user.id);
  if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });
  const { title, description, skill_area, is_open } = req.body;
  const r = await pool.query(
    'UPDATE project_roles SET title = COALESCE($1, title), description = COALESCE($2, description), skill_area = COALESCE($3, skill_area), is_open = COALESCE($4, is_open) WHERE id = $5 RETURNING *',
    [title?.trim() || null, description || null, skill_area || null, is_open ?? null, req.params.id]
  );
  res.json(r.rows[0]);
});

app.delete('/api/roles/:id', requireAuth, async (req, res) => {
  const role = await pool.query('SELECT project_id FROM project_roles WHERE id = $1', [req.params.id]);
  if (role.rows.length === 0) return res.status(404).json({ error: 'Role not found' });
  const perm = await getProjectPermission(role.rows[0].project_id, req.user.id);
  if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });
  await pool.query('DELETE FROM project_roles WHERE id = $1', [req.params.id]);
  res.json({ message: 'Role deleted' });
});

// ============= Join Requests Routes =============
app.post('/api/projects/:id/join-requests', requireAuth, async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.id;

  const project = await pool.query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
  if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
  if (project.rows[0].owner_id === userId) return res.status(400).json({ error: 'Cannot request to join own project' });

  const isMember = await pool.query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
  if (isMember.rows.length > 0) return res.status(400).json({ error: 'Already a member' });

  const { role_id, message } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO join_requests (project_id, requester_id, role_id, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, userId, role_id || null, message || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Request already pending' });
    res.status(500).json({ error: 'Failed to submit join request' });
  }
});

app.get('/api/projects/:id/join-requests', requireAuth, async (req, res) => {
  const perm = await getProjectPermission(req.params.id, req.user.id);
  if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });
  const r = await pool.query(`
    SELECT jr.*, u.username, u.display_name, pr.title as role_title
    FROM join_requests jr
    JOIN users u ON jr.requester_id = u.id
    LEFT JOIN project_roles pr ON jr.role_id = pr.id
    WHERE jr.project_id = $1
    ORDER BY jr.created_at DESC
  `, [req.params.id]);
  res.json(r.rows);
});

app.patch('/api/join-requests/:id', requireAuth, async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be accepted or rejected' });

  const jr = await pool.query('SELECT * FROM join_requests WHERE id = $1', [req.params.id]);
  if (jr.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
  const request = jr.rows[0];

  const perm = await getProjectPermission(request.project_id, req.user.id);
  if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE join_requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, req.params.id]
    );
    if (status === 'accepted') {
      const role = request.role_id
        ? (await client.query('SELECT title FROM project_roles WHERE id = $1', [request.role_id])).rows[0]?.title
        : null;
      await client.query(
        'INSERT INTO project_members (project_id, user_id, role, permissions) VALUES ($1, $2, $3, $4) ON CONFLICT (project_id, user_id) DO NOTHING',
        [request.project_id, request.requester_id, role || 'Member', 'member']
      );
      if (request.role_id) {
        await client.query('UPDATE project_roles SET is_open = FALSE WHERE id = $1', [request.role_id]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: `Request ${status}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Join request update error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  } finally {
    client.release();
  }
});

// ============= Project Updates (Build Logs) =============
app.get('/api/projects/:id/updates', async (req, res) => {
  const userId = req.user?.id || 0;
  try {
    const r = await pool.query(`
      SELECT pu.*, u.username, u.display_name,
             (SELECT COUNT(*)::int FROM likes WHERE update_id = pu.id) as likes_count,
             (SELECT COUNT(*)::int FROM comments WHERE update_id = pu.id) as comments_count,
             (SELECT EXISTS(SELECT 1 FROM likes WHERE update_id = pu.id AND user_id = $2)) as user_liked
      FROM project_updates pu
      JOIN users u ON pu.author_id = u.id
      WHERE pu.project_id = $1
      ORDER BY pu.created_at DESC
    `, [req.params.id, userId]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

app.post('/api/projects/:id/updates', requireAuth, async (req, res) => {
  const perm = await getProjectPermission(req.params.id, req.user.id);
  if (!perm) return res.status(403).json({ error: 'Must be a project member to post updates' });
  const { title, body, milestone_tag } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Update body required' });
  try {
    const r = await pool.query(
      'INSERT INTO project_updates (project_id, author_id, title, body, milestone_tag) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, req.user.id, title?.trim() || null, body.trim(), milestone_tag || null]
    );
    const update = r.rows[0];
    update.username = req.user.username;
    update.display_name = req.user.display_name;
    update.likes_count = 0;
    update.comments_count = 0;
    update.user_liked = false;
    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create update' });
  }
});

app.delete('/api/updates/:id', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT author_id, project_id FROM project_updates WHERE id = $1', [req.params.id]);
  if (r.rows.length === 0) return res.status(404).json({ error: 'Update not found' });
  const { author_id, project_id } = r.rows[0];
  if (author_id !== req.user.id) {
    const perm = await getProjectPermission(project_id, req.user.id);
    if (!perm || perm === 'member') return res.status(403).json({ error: 'Not authorized' });
  }
  await pool.query('DELETE FROM project_updates WHERE id = $1', [req.params.id]);
  res.json({ message: 'Update deleted' });
});

// ============= Comments Routes =============
app.get('/api/updates/:id/comments', async (req, res) => {
  const r = await pool.query(`
    SELECT c.*, u.username, u.display_name
    FROM comments c JOIN users u ON c.author_id = u.id
    WHERE c.update_id = $1 ORDER BY c.created_at ASC
  `, [req.params.id]);
  res.json(r.rows);
});

app.post('/api/updates/:id/comments', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Comment body required' });
  if (body.length > 500) return res.status(400).json({ error: 'Comment too long' });
  const updateCheck = await pool.query('SELECT id FROM project_updates WHERE id = $1', [req.params.id]);
  if (updateCheck.rows.length === 0) return res.status(404).json({ error: 'Update not found' });
  try {
    const r = await pool.query(
      'INSERT INTO comments (update_id, author_id, body) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, req.user.id, body.trim()]
    );
    const comment = r.rows[0];
    comment.username = req.user.username;
    comment.display_name = req.user.display_name;
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT author_id FROM comments WHERE id = $1', [req.params.id]);
  if (r.rows.length === 0) return res.status(404).json({ error: 'Comment not found' });
  if (r.rows[0].author_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
  res.json({ message: 'Comment deleted' });
});

// ============= Likes Routes =============
app.post('/api/updates/:id/like', requireAuth, async (req, res) => {
  const updateId = req.params.id;
  const userId = req.user.id;
  const check = await pool.query('SELECT id FROM project_updates WHERE id = $1', [updateId]);
  if (check.rows.length === 0) return res.status(404).json({ error: 'Update not found' });
  try {
    const existing = await pool.query('SELECT id FROM likes WHERE update_id = $1 AND user_id = $2', [updateId, userId]);
    let user_liked;
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE update_id = $1 AND user_id = $2', [updateId, userId]);
      user_liked = false;
    } else {
      await pool.query('INSERT INTO likes (update_id, user_id) VALUES ($1, $2)', [updateId, userId]);
      user_liked = true;
    }
    const count = await pool.query('SELECT COUNT(*)::int as count FROM likes WHERE update_id = $1', [updateId]);
    res.json({ likes_count: count.rows[0].count, user_liked });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// ============= Feed Route =============
app.get('/api/feed', async (req, res) => {
  const userId = req.user?.id || 0;
  const sort = req.query.sort || 'ranked';
  try {
    const orderBy = sort === 'recent'
      ? 'pu.created_at DESC'
      : '(COUNT(DISTINCT l.id) * 2 + COUNT(DISTINCT c.id) * 3 - EXTRACT(EPOCH FROM (NOW() - pu.created_at)) / 3600 * 0.05) DESC';

    const r = await pool.query(`
      SELECT pu.id, pu.title, pu.body, pu.milestone_tag, pu.created_at,
             pu.project_id, p.title as project_title, p.slug as project_slug, p.category,
             u.id as author_id, u.username, u.display_name,
             COUNT(DISTINCT l.id)::int as likes_count,
             COUNT(DISTINCT c.id)::int as comments_count,
             EXISTS(SELECT 1 FROM likes WHERE update_id = pu.id AND user_id = $1) as user_liked
      FROM project_updates pu
      JOIN projects p ON pu.project_id = p.id
      JOIN users u ON pu.author_id = u.id
      LEFT JOIN likes l ON l.update_id = pu.id
      LEFT JOIN comments c ON c.update_id = pu.id
      WHERE p.visibility = 'public'
      GROUP BY pu.id, p.id, u.id
      ORDER BY ${orderBy}
      LIMIT 40
    `, [userId]);
    res.json(r.rows);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// ============= Search Route =============
app.get('/api/search', async (req, res) => {
  const { query, category, tag, status } = req.query;
  if (!query && !category && !tag && !status) return res.json([]);
  // Delegate to projects endpoint
  req.query.search = query;
  const conditions = ["p.visibility = 'public'"];
  const values = [];
  if (query) { values.push(`%${query}%`); conditions.push(`(p.title ILIKE $${values.length} OR p.short_description ILIKE $${values.length})`); }
  if (category) { values.push(category); conditions.push(`p.category = $${values.length}`); }
  if (status) { values.push(status); conditions.push(`p.status = $${values.length}`); }
  let tagJoin = '';
  if (tag) { tagJoin = 'JOIN project_tags pt_f ON pt_f.project_id = p.id'; values.push(tag); conditions.push(`pt_f.tag = $${values.length}`); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  try {
    const r = await pool.query(`
      SELECT p.id, p.title, p.slug, p.short_description, p.category, p.status, p.created_at,
             u.username as owner_username, u.display_name as owner_display_name,
             COALESCE((SELECT json_agg(tag) FROM project_tags WHERE project_id = p.id), '[]'::json) as tags
      FROM projects p JOIN users u ON p.owner_id = u.id ${tagJoin} ${where}
      GROUP BY p.id, u.id ORDER BY p.created_at DESC LIMIT 30
    `, values);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============= Users Routes =============
app.get('/api/users', async (req, res) => {
  const search = req.query.search?.trim();
  try {
    const values = [];
    const where = search ? (values.push(`%${search}%`), `WHERE u.username ILIKE $1 OR u.display_name ILIKE $1`) : '';
    const r = await pool.query(`
      SELECT u.id, u.username, u.display_name, u.bio, u.skills, u.created_at,
             (SELECT COUNT(*)::int FROM projects WHERE owner_id = u.id) as projects_count
      FROM users u ${where}
      ORDER BY CASE WHEN u.username = $${values.length + 1} THEN 0 ELSE 1 END, u.created_at DESC
      LIMIT 50
    `, [...values, GUEST_USERNAME]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const userR = await pool.query(
      'SELECT id, username, display_name, bio, skills, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (userR.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = userR.rows[0];

    const [ownedProjects, joinedProjects, recentUpdates] = await Promise.all([
      pool.query(`
        SELECT p.id, p.title, p.slug, p.short_description, p.category, p.status, p.created_at,
               COALESCE((SELECT json_agg(tag) FROM project_tags WHERE project_id = p.id), '[]'::json) as tags
        FROM projects p WHERE p.owner_id = $1 AND p.visibility = 'public'
        ORDER BY p.created_at DESC LIMIT 10
      `, [user.id]),
      pool.query(`
        SELECT p.id, p.title, p.slug, p.short_description, p.category, p.status, pm.role
        FROM project_members pm JOIN projects p ON pm.project_id = p.id
        WHERE pm.user_id = $1 AND p.owner_id != $1 AND p.visibility = 'public'
        ORDER BY pm.joined_at DESC LIMIT 10
      `, [user.id]),
      pool.query(`
        SELECT pu.id, pu.title, pu.body, pu.milestone_tag, pu.created_at,
               p.title as project_title, p.slug as project_slug
        FROM project_updates pu JOIN projects p ON pu.project_id = p.id
        WHERE pu.author_id = $1 AND p.visibility = 'public'
        ORDER BY pu.created_at DESC LIMIT 5
      `, [user.id])
    ]);

    user.owned_projects = ownedProjects.rows;
    user.joined_projects = joinedProjects.rows;
    user.recent_updates = recentUpdates.rows;

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ============= Messaging Routes (preserved from original) =============
app.get('/api/conversations', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const r = await pool.query(`
      SELECT c.id,
             CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_user_id,
             CASE WHEN c.user1_id = $1 THEN u2.username ELSE u1.username END AS other_username,
             CASE WHEN c.user1_id = $1 THEN u2.display_name ELSE u1.display_name END AS other_display_name,
             (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST
    `, [userId]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.post('/api/conversations', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const recipientId = Number(req.body.recipientId);
  if (!recipientId || recipientId === userId) return res.status(400).json({ error: 'Invalid recipient' });
  const recipientCheck = await pool.query('SELECT id FROM users WHERE id = $1', [recipientId]);
  if (recipientCheck.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  const [u1, u2] = userId < recipientId ? [userId, recipientId] : [recipientId, userId];
  try {
    const r = await pool.query(
      'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) ON CONFLICT (user1_id, user2_id) DO UPDATE SET id = conversations.id RETURNING id',
      [u1, u2]
    );
    res.json({ id: r.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const access = await pool.query(
    'SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [req.params.id, userId]
  );
  if (access.rows.length === 0) return res.status(403).json({ error: 'Forbidden' });
  const r = await pool.query(
    'SELECT id, sender_id, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json(r.rows);
});

app.post('/api/conversations/:id/messages', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const content = req.body.content?.trim();
  if (!content) return res.status(400).json({ error: 'Message content required' });
  if (content.length > 1000) return res.status(400).json({ error: 'Message too long' });
  const access = await pool.query(
    'SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [req.params.id, userId]
  );
  if (access.rows.length === 0) return res.status(403).json({ error: 'Forbidden' });
  const r = await pool.query(
    'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id, sender_id, content, created_at',
    [req.params.id, userId, content]
  );
  res.status(201).json(r.rows[0]);
});

app.delete('/api/messages/:id', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT sender_id FROM messages WHERE id = $1', [req.params.id]);
  if (r.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
  if (r.rows[0].sender_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
  await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
  res.json({ message: 'Message deleted' });
});

// ============= Catch-all =============
app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found' }));

app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(404).send('React app not built. Run npm run dev for development or npm run build before npm start.');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error' });
});

// ============= Startup =============
const PORT = process.env.PORT || 3000;

async function start() {
  await initializeDatabase();
  await ensureGuestUser();
  app.listen(PORT, '0.0.0.0', () => console.log(`BuildBoard server running on http://localhost:${PORT}`));
}

start().catch(err => { console.error('Failed to start:', err); process.exit(1); });

module.exports = app;
