import { useState } from 'react';
import Button from './Button.jsx';

const CATEGORIES = ['Robotics', 'Firmware', 'AI/ML', 'PCB Design', 'Web Development', 'Embedded Systems', 'CAD/Mechanical', 'Data/Cloud'];

const FEATURES = [
  { icon: '◻', title: 'Project Pages', desc: 'Detailed pages with status, GitHub links, and team members.' },
  { icon: '◻', title: 'Build Logs', desc: 'Post milestone updates as you build. Show your process.' },
  { icon: '◻', title: 'Team Recruitment', desc: 'Post open roles, review requests, and build your team.' },
  { icon: '◻', title: 'Messaging', desc: 'Direct message other builders and collaborators.' },
];

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
            <h1 className="public-tagline">Build<br />Board</h1>
            <p className="public-sub">Engineering collaboration for student teams and makers.</p>
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
              <p className="guest-note">No registration required. Includes seed data.</p>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-logo">BuildBoard</div>
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
            Create project pages, post build logs, recruit teammates, and message collaborators — all in one place.
          </p>
          <div className="hero-actions">
            <Button onClick={() => onModeChange('signup')}>Get started free</Button>
            <Button variant="soft" onClick={onGuest} disabled={busy}>View demo</Button>
          </div>
          {error ? <p className="form-error" style={{ marginTop: '8px' }}>{error}</p> : null}
        </div>
      </section>

      <div className="landing-divider" />

      <section className="landing-features">
        <div className="landing-section-inner">
          <p className="landing-section-label">Features</p>
          <h2 className="landing-section-title">Everything your team needs</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">⬡</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="landing-divider" />

      <section className="landing-categories">
        <div className="landing-section-inner">
          <p className="landing-section-label">Explore</p>
          <h2 className="landing-section-title">Find teammates by skill</h2>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <div className="category-chip" key={cat}>{cat}</div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        BuildBoard · Engineering Project Collaboration Platform
      </footer>
    </main>
  );
}
