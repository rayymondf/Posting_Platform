import { useState } from 'react';
import Button from './Button.jsx';

const CATEGORIES = ['Robotics', 'Firmware', 'AI/ML', 'PCB Design', 'Web Development', 'Embedded Systems', 'CAD/Mechanical', 'Data/Cloud'];

export default function PublicPage({ mode, onModeChange, onSubmit, onGuest, error, busy }) {
  const isSignup = mode === 'signup';
  const showForm = mode === 'signin' || mode === 'signup';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({ username: username.trim(), password, mode });
  }

  if (showForm) {
    return (
      <main className="public-page">
        <div className="public-left">
          <div className="public-left-inner">
            <div className="public-logo">⚡</div>
            <h1 className="public-tagline">BuildBoard</h1>
            <p className="public-sub">Engineering Project Collaboration Platform</p>
          </div>
        </div>
        <div className="public-right">
          <section className="public-panel">
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-heading">
                <h2>{isSignup ? 'Create account' : 'Welcome back'}</h2>
                <button type="button" onClick={() => onModeChange('landing')}>← Back</button>
              </div>
              <label>
                <span>Username</span>
                <input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength="50" placeholder="e.g. alex_builds" required />
              </label>
              <label>
                <span>Password</span>
                <input autoComplete={isSignup ? 'new-password' : 'current-password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <Button type="submit" disabled={busy}>{isSignup ? 'Create account' : 'Sign in'}</Button>
              <button className="switch-auth" type="button" onClick={() => onModeChange(isSignup ? 'signin' : 'signup')}>
                {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
              <div className="public-divider"><span>or</span></div>
              <Button variant="soft" onClick={onGuest} disabled={busy}>Try demo account</Button>
              <p className="guest-note">Demo account has seed data. No registration required.</p>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-logo">⚡ BuildBoard</div>
        <div className="landing-header-actions">
          <button className="btn-ghost" onClick={() => onModeChange('signin')}>Sign in</button>
          <Button onClick={() => onModeChange('signup')}>Get started</Button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">For student engineers &amp; makers</div>
          <h1 className="hero-title">Share your build.<br />Find your team.</h1>
          <p className="hero-sub">
            BuildBoard is the collaboration platform for student engineers — create project pages,
            post build logs, recruit technical teammates, and message collaborators.
          </p>
          <div className="hero-actions">
            <Button onClick={() => onModeChange('signup')}>Explore Projects</Button>
            <Button variant="soft" onClick={onGuest} disabled={busy}>Try Demo Account</Button>
          </div>
          {error ? <p className="form-error" style={{ marginTop: '12px' }}>{error}</p> : null}
        </div>
      </section>

      <section className="landing-categories">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Find teammates by skill</h2>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <div className="category-chip" key={cat}>{cat}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Everything your team needs</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Project Pages</h3>
              <p>Create detailed pages for your engineering builds — description, status, GitHub link, and team members.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔧</div>
              <h3>Build Logs</h3>
              <p>Post milestone updates as you build. Show employers your process, not just the final result.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧑‍🤝‍🧑</div>
              <h3>Team Recruitment</h3>
              <p>Post open roles, review join requests, and build a team with the right skills.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Messaging</h3>
              <p>Direct message other builders. Coordinate, collaborate, and give feedback.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>BuildBoard · Engineering Project Collaboration Platform</p>
      </footer>
    </main>
  );
}
