/**
 * BuildBoard seed script — creates demo users, projects, build logs, and roles.
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pg = require('pg');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/buildboard'
});

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 120);
}

const users = [
  { username: 'alex_builds', display_name: 'Alex Chen', bio: 'Robotics & firmware engineer. Building cool stuff with STM32 and ROS.', skills: ['C++', 'ROS', 'STM32', 'Python'] },
  { username: 'priya_ml', display_name: 'Priya Nair', bio: 'ML engineer and data enthusiast. OpenCV + Python all day.', skills: ['Python', 'OpenCV', 'PyTorch', 'Docker'] },
  { username: 'marcus_pcb', display_name: 'Marcus Webb', bio: 'PCB designer and embedded systems developer. KiCad & Arduino.', skills: ['KiCad', 'PCB', 'Arduino', 'C++'] },
  { username: 'sofia_web', display_name: 'Sofia Reyes', bio: 'Full-stack developer with a love for clean UIs and distributed systems.', skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'] },
];

const projects = [
  {
    ownerIndex: 0,
    title: 'Autonomous Rover Platform',
    short_description: 'ROS2-based autonomous ground vehicle with LIDAR navigation and object avoidance.',
    full_description: `This rover platform uses ROS2 for navigation, SLAM for mapping, and a custom STM32-based motor controller. The goal is a fully autonomous indoor navigation system suitable for warehouse logistics research.

Key subsystems:
- STM32-based FOC motor control
- Raspberry Pi 4 running ROS2 Humble
- LIDAR-based 2D SLAM with nav2
- Custom PCB for sensor integration`,
    category: 'Robotics',
    status: 'in_progress',
    github_url: 'https://github.com/demo/autonomous-rover',
    tags: ['ROS', 'STM32', 'C++', 'Python', 'PCB'],
    roles: [
      { title: 'Firmware Developer', description: 'Implement motor control and sensor drivers in C++', skill_area: 'Firmware' },
      { title: 'ROS Developer', description: 'Develop navigation stack and SLAM integration', skill_area: 'Robotics' },
    ],
    updates: [
      { title: 'Motor controller PCB v1.0 complete', body: 'Finished the first revision of the custom STM32 motor controller PCB. Used KiCad for layout, 4-layer board with separate power and signal planes. Ordered from JLCPCB — should arrive in 10 days.', milestone_tag: 'PCB' },
      { title: 'ROS2 navigation stack integrated', body: 'Got nav2 running with the RPLidar A1. SLAM cartographer building maps reliably at ~2m/s. Still tuning the costmap inflation radius for tight corridors.', milestone_tag: 'Firmware' },
      { title: 'Prototype complete, testing begins', body: 'First full assembly is done! Initial tests show the rover can navigate a 5x5m space autonomously with ~95% success. Obstacle avoidance is triggering a bit too aggressively — tuning costmap parameters next.', milestone_tag: 'Prototype' },
    ]
  },
  {
    ownerIndex: 1,
    title: 'Real-Time Gesture Recognition',
    short_description: 'OpenCV + PyTorch model that classifies 20 hand gestures in real time using a standard webcam.',
    full_description: `A real-time gesture recognition pipeline built with OpenCV for hand detection and a custom CNN trained on a 20-class dataset. The model runs at 30fps on a MacBook M1 with no dedicated GPU.

Architecture:
- MediaPipe for hand landmark extraction
- Lightweight CNN (MobileNetV2) for classification
- Calibration mode for per-user accuracy improvement
- Flask API for embedding in other projects`,
    category: 'AI/ML',
    status: 'recruiting',
    github_url: 'https://github.com/demo/gesture-recognition',
    demo_url: 'https://demo-gesture.example.com',
    tags: ['Python', 'OpenCV', 'PyTorch', 'Docker'],
    roles: [
      { title: 'ML Engineer', description: 'Help improve model accuracy and add new gesture classes', skill_area: 'AI/ML' },
      { title: 'Frontend Developer', description: 'Build a React demo UI for the Flask API', skill_area: 'Web Development' },
    ],
    updates: [
      { title: 'Dataset collection phase 1 complete', body: 'Collected 5,000 samples per gesture class (20 classes = 100k images). Used a variety of lighting conditions and hand sizes. Preprocessing pipeline built with albumentations for augmentation.', milestone_tag: 'Prototype' },
      { title: 'Model achieves 94% accuracy on test set', body: 'After switching from ResNet18 to MobileNetV2 and adding hand landmark features as auxiliary inputs, we hit 94% accuracy. Inference time is 12ms per frame on CPU. Ready to integrate into the real-time pipeline.', milestone_tag: 'Testing' },
    ]
  },
  {
    ownerIndex: 2,
    title: 'Open-Source EEG Headset',
    short_description: 'Low-cost 8-channel EEG acquisition board based on ADS1299 with Bluetooth streaming.',
    full_description: `A completely open-source 8-channel EEG headset using the TI ADS1299 analog front-end. Data streams over BLE to a Python client for real-time processing.

Hardware:
- ADS1299 AFE with 24-bit ADC
- nRF52840 for BLE connectivity
- Custom electrode + headset CAD
- KiCad schematics and layout (all files open source)`,
    category: 'PCB Design',
    status: 'recruiting',
    github_url: 'https://github.com/demo/open-eeg',
    tags: ['KiCad', 'PCB', 'C++', 'Python', 'Arduino'],
    roles: [
      { title: 'PCB Designer', description: 'Help design the electrode interface PCB revision 2', skill_area: 'PCB Design' },
      { title: 'Signal Processing Engineer', description: 'Build real-time artifact rejection and bandpass filtering pipeline', skill_area: 'Firmware' },
    ],
    updates: [
      { title: 'ADS1299 bring-up successful', body: 'Got the ADS1299 talking over SPI on the first board revision. All 8 channels are reading coherent signals with noise floor around 1µV RMS. Next step is BLE integration with the nRF52840.', milestone_tag: 'Prototype' },
      { title: 'BLE streaming working at 250 SPS', body: 'nRF52840 is now streaming all 8 channels at 250 samples per second over BLE with custom GATT profile. Packet loss is under 0.1% in a clean RF environment.', milestone_tag: 'Firmware' },
    ]
  },
  {
    ownerIndex: 3,
    title: 'BuildBoard',
    short_description: 'This very platform — a full-stack collaboration tool for student engineers to share projects and recruit teammates.',
    full_description: `BuildBoard is a full-stack engineering project collaboration platform. Student engineers can create project pages, post build logs, recruit teammates through open roles, and message collaborators.

Stack:
- React 19 + Vite (frontend SPA)
- Express + Passport.js (backend auth + API)
- PostgreSQL + connect-pg-simple sessions
- Deployed on Render + Neon`,
    category: 'Web Development',
    status: 'in_progress',
    github_url: 'https://github.com/demo/buildboard',
    demo_url: 'https://buildboard.example.com',
    tags: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    roles: [
      { title: 'Frontend Developer', description: 'Help build out project analytics and activity dashboards', skill_area: 'Web Development' },
    ],
    updates: [
      { title: 'Schema design and backend API complete', body: 'Finished the full PostgreSQL schema covering projects, members, roles, join requests, build log updates, comments, likes, and DM conversations. All REST API endpoints implemented with object-level authorization.', milestone_tag: 'Prototype' },
      { title: 'Frontend SPA fully wired', body: 'All pages connected to the API: project directory, project detail, create/edit project, build log composer, join request flow, and profile pages. Ranked feed working with recency decay scoring.', milestone_tag: 'Deployment' },
    ]
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding BuildBoard...');

    // Ensure Guest user
    await client.query(`
      INSERT INTO users (username, display_name, bio)
      VALUES ('Guest', 'Guest Explorer', 'Exploring BuildBoard as a demo user.')
      ON CONFLICT (username) DO NOTHING
    `);

    // Create demo users
    const hash = await bcrypt.hash('password123', 10);
    const createdUsers = [];
    for (const u of users) {
      const r = await client.query(`
        INSERT INTO users (username, password, display_name, bio, skills)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name, bio = EXCLUDED.bio, skills = EXCLUDED.skills
        RETURNING id, username
      `, [u.username, hash, u.display_name, u.bio, u.skills]);
      createdUsers.push(r.rows[0]);
      console.log(`  User: ${r.rows[0].username} (id ${r.rows[0].id})`);
    }

    // Create projects
    for (const p of projects) {
      const owner = createdUsers[p.ownerIndex];
      const slug = slugify(p.title) + '-' + Date.now().toString(36);

      // Upsert project (delete old with same title for idempotency)
      await client.query('DELETE FROM projects WHERE title = $1 AND owner_id = $2', [p.title, owner.id]);

      const pr = await client.query(`
        INSERT INTO projects (owner_id, title, slug, short_description, full_description, category, status, github_url, demo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [owner.id, p.title, slug, p.short_description, p.full_description, p.category, p.status, p.github_url || null, p.demo_url || null]);
      const projectId = pr.rows[0].id;

      // Owner as member
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role, permissions) VALUES ($1, $2, 'Owner', 'owner')
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [projectId, owner.id]);

      // Tags
      for (const tag of (p.tags || [])) {
        await client.query('INSERT INTO project_tags (project_id, tag) VALUES ($1, $2)', [projectId, tag]);
      }

      // Roles
      for (const role of (p.roles || [])) {
        await client.query(`
          INSERT INTO project_roles (project_id, title, description, skill_area)
          VALUES ($1, $2, $3, $4)
        `, [projectId, role.title, role.description, role.skill_area]);
      }

      // Updates
      for (const update of (p.updates || [])) {
        await client.query(`
          INSERT INTO project_updates (project_id, author_id, title, body, milestone_tag)
          VALUES ($1, $2, $3, $4, $5)
        `, [projectId, owner.id, update.title, update.body, update.milestone_tag]);
      }

      console.log(`  Project: ${p.title} (id ${projectId})`);
    }

    console.log('\nSeed complete! Demo credentials: any seeded username / password123');
    console.log('Seeded users:', users.map(u => u.username).join(', '));
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
